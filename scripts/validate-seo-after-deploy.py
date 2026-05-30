#!/usr/bin/env python3
"""
validate-seo-after-deploy.py — Post-deployment SEO validation.

Checks:
  - Sitemaps: valid XML, correct composition, no banned URLs
  - Robots.txt: only valid sitemaps declared, no scenario sitemap
  - Key pages: correct robots meta, canonical, in sitemap
  - Risky automations: confirm all paused

Output: .optimizer-data/post-deploy-seo-report.json

Usage:
  python3 scripts/validate-seo-after-deploy.py
  python3 scripts/validate-seo-after-deploy.py --json   # JSON output only
"""

import os
import sys
import json
import time
import argparse
import xml.etree.ElementTree as ET
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError
from datetime import datetime

BASE_URL = "https://www.qfinhub.com"
REPORT_PATH = os.path.join(os.path.dirname(__file__), "..", ".optimizer-data", "post-deploy-seo-report.json")

# ── Sitemap namespaces ──────────────────────────────────────
NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}

# ── Helpers ──────────────────────────────────────────────────

def fetch(url, timeout=15):
    """Fetch URL, return (status, body, headers_dict)."""
    try:
        req = Request(url, headers={"User-Agent": "QFINHUB-SEOBot/2.0"})
        resp = urlopen(req, timeout=timeout)
        body = resp.read().decode("utf-8", errors="replace")
        headers = dict(resp.headers)
        return resp.status, body, headers
    except HTTPError as e:
        return e.code, e.read().decode("utf-8", errors="replace"), dict(e.headers)
    except Exception as e:
        return 0, str(e), {}

def fetch_head(url, timeout=15):
    """Fetch only headers."""
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "QFINHUB-SEOBot/2.0"})
        resp = urlopen(req, timeout=timeout)
        return resp.status, dict(resp.headers)
    except Exception as e:
        return 0, {}

def validate_xml(body, name="sitemap"):
    """Validate XML body. Returns (ok, url_count, errors)."""
    try:
        root = ET.fromstring(body)
        urls = root.findall(".//sm:url", NS) or root.findall("url")
        return True, len(urls), []
    except ET.ParseError as e:
        return False, 0, [f"{name}: XML parse error — {str(e)[:200]}"]

# ── Sitemap validation ──────────────────────────────────────

def validate_main_sitemap():
    """Validate /sitemap.xml."""
    errors = []
    url = f"{BASE_URL}/sitemap.xml"
    status, body, headers = fetch(url)

    if status != 200:
        errors.append(f"sitemap.xml: HTTP {status}")
        return {"ok": False, "urls": 0, "errors": errors}

    ok, url_count, xml_errors = validate_xml(body, "sitemap.xml")
    errors.extend(xml_errors)

    # Check for banned URL patterns (use same logic as sitemap.ts isFormulaVariant)
    # Formula variants: hasPct AND (hasYr OR hasMo), or multi-parameter numeric
    # EXCEPT: 2 GSC-impression slugs intentionally kept in sitemap
    import re
    TOOL_GSC_EXCEPTIONS = {"afford-100k-40k-6-5pct", "afford-130k-40k-7pct"}
    sitemap_formula_count = 0
    for loc_match in re.finditer(r'<loc>[^<]+/([^<]+)</loc>', body):
        slug = loc_match.group(1)
        if slug in TOOL_GSC_EXCEPTIONS:
            continue  # Intentionally kept — has GSC impressions
        parts = slug.split("-")
        has_pct = any(p.endswith("pct") for p in parts)
        has_yr = any(p.endswith("yr") for p in parts)
        has_mo = any(p.endswith("mo") for p in parts)
        num_count = sum(1 for p in parts if any(c.isdigit() for c in p) and len(p) <= 6)
        if (has_pct and (has_yr or has_mo)) or (bool(re.match(r'^[a-z]+-\d', slug)) and num_count >= 3):
            sitemap_formula_count += 1
    if sitemap_formula_count > 0:
        errors.append(f"sitemap.xml: Contains {sitemap_formula_count} formula variant URLs — should be excluded")

    # Check required URL patterns
    required = {
        "/decision/": "Missing decision pages",
        "/widgets/mortgage-affordability-embed": "Missing widget landing page",
    }
    for pattern, desc in required.items():
        if pattern not in body:
            errors.append(f"sitemap.xml: {desc}")

    # Count decision pages
    import re
    decision_count = len(re.findall(r"/decision/", body))
    if decision_count < 15:
        errors.append(f"sitemap.xml: Only {decision_count}/15 decision pages found")

    return {
        "ok": ok and len(errors) == 0,
        "urls": url_count,
        "decision_pages": decision_count,
        "errors": errors,
    }

def validate_news_sitemap():
    """Validate /news-sitemap.xml."""
    url = f"{BASE_URL}/news-sitemap.xml"
    status, body, headers = fetch(url)

    if status != 200:
        return {"ok": False, "urls": 0, "errors": [f"news-sitemap.xml: HTTP {status}"]}

    ok, url_count, errors = validate_xml(body, "news-sitemap.xml")

    # Must NOT have Google News namespace
    if "news:" in body and 'xmlns:news="http://www.google.com/schemas/sitemap-news' in body:
        errors.append("news-sitemap.xml: Still has Google News namespace (should be normal sitemap)")

    # Must have loc tags
    if "<loc>" not in body:
        errors.append("news-sitemap.xml: No <loc> tags found")

    return {"ok": ok and len(errors) == 0, "urls": url_count, "errors": errors}

def validate_scenario_sitemap():
    """Validate /scenario/sitemap.xml — should be empty."""
    url = f"{BASE_URL}/scenario/sitemap.xml"
    status, body, headers = fetch(url)

    ok = status == 200
    ok_xml, url_count, errors = validate_xml(body, "scenario/sitemap.xml")

    if url_count > 0:
        errors.append(f"scenario/sitemap.xml: Has {url_count} URLs — should be 0")

    return {"ok": ok and url_count == 0, "urls": url_count, "errors": errors}

# ── Robots.txt validation ───────────────────────────────────

def validate_robots():
    """Validate /robots.txt."""
    errors = []
    url = f"{BASE_URL}/robots.txt"
    status, body, headers = fetch(url)

    if status != 200:
        errors.append(f"robots.txt: HTTP {status}")
        return {"ok": False, "errors": errors}

    # Must allow all
    if "Disallow: /" in body and "Allow:" not in body:
        errors.append("robots.txt: Has Disallow: / without Allow override")

    # Must declare main sitemap
    if f"{BASE_URL}/sitemap.xml" not in body:
        errors.append("robots.txt: Missing main sitemap declaration")

    # Must declare news sitemap
    if f"{BASE_URL}/news-sitemap.xml" not in body:
        errors.append("robots.txt: Missing news sitemap declaration")

    # Must NOT declare scenario sitemap
    if "scenario/sitemap.xml" in body:
        errors.append("robots.txt: Still declares scenario sitemap — remove it")

    return {"ok": len(errors) == 0, "errors": errors, "declared_sitemaps": body.count("Sitemap:")}

# ── Page-level validation ──────────────────────────────────

PAGES_TO_CHECK = [
    # (name, url_path, expected_robots, expected_in_sitemap)
    ("Widget Landing", "/widgets/mortgage-affordability-embed", "index, follow", True),
    ("Embed Route", "/embed/mortgage-affordability", "noindex, follow", False),
    ("Decision — 400k Home", "/decision/can-i-afford-a-400k-home", "index, follow", True),
    ("Decision — Retire at 45", "/decision/retire-at-45-with-1-million", "index, follow", True),
    ("Decision — Emergency Fund", "/decision/how-much-emergency-fund-do-i-need", "index, follow", True),
    ("Decision — 500k at 55", "/decision/can-i-retire-with-500k-at-55", "index, follow", True),
    ("Decision — Tax Bracket", "/decision/what-tax-bracket-am-i-in", "index, follow", True),
    ("Calc — Mortgage", "/calculators/mortgage-calculator", "index, follow", True),
    ("Calc — Affordability", "/calculators/mortgage-affordability", "index, follow", True),
    ("Calc — Compound Interest", "/calculators/compound-interest", "index, follow", True),
    ("Calc — 401k", "/calculators/401k-calculator", "index, follow", True),
]

def validate_pages(sitemap_body=""):
    """Validate key pages: robots meta, canonical, in sitemap."""
    results = []
    for name, path, expected_robots, expected_in_sitemap in PAGES_TO_CHECK:
        url = f"{BASE_URL}{path}"
        status, body, headers = fetch(url)
        errors = []

        # Check HTTP status
        if status != 200:
            errors.append(f"HTTP {status}")
            results.append({"name": name, "url": url, "ok": False, "errors": errors})
            continue

        # Check robots meta
        robots_match = None
        import re
        m = re.search(r'<meta\s+name="robots"\s+content="([^"]+)"', body)
        if m:
            robots_match = m.group(1)
            if expected_robots not in robots_match:
                errors.append(f"robots: expected '{expected_robots}', got '{robots_match}'")
        else:
            # Check x-robots-tag header
            x_robots = headers.get("x-robots-tag", "")
            if expected_robots not in x_robots:
                errors.append(f"robots: no meta tag, x-robots-tag='{x_robots}', expected '{expected_robots}'")

        # Check canonical (for important pages)
        m = re.search(r'<link\s+rel="canonical"\s+href="([^"]+)"', body)
        if m and "qfinhub.com" not in m.group(1):
            errors.append(f"canonical: points to external URL: {m.group(1)}")

        # Check in sitemap (if expected)
        if expected_in_sitemap and sitemap_body:
            if path not in sitemap_body:
                errors.append("Missing from sitemap")

        # Check NOT in sitemap (embed route)
        if not expected_in_sitemap and sitemap_body:
            if path in sitemap_body:
                errors.append("Should NOT be in sitemap but was found")

        results.append({
            "name": name,
            "url": url,
            "ok": len(errors) == 0,
            "errors": errors,
            "robots": robots_match,
        })

    return results

# ── Risky automation check ──────────────────────────────────

PAUSED_CRONS = [
    "7edc3f28a918",  # Scenario Generator
    "291b8aa4f5d0",  # Scenario Upgrades
    "14d3d631f9ba",  # SEO Indexing Engine
    "7ba22a836377",  # Sitemap Ping
    "e3d7d3fcb7c9",  # Blog Agent
    "defdde75ea1f",  # Pinterest Pin Generator
]

def check_risky_automations():
    """Check that all risky automations are paused."""
    # We can't check cron status from a script — Hermes checks this
    # For now, log that manual verification is needed
    return {
        "verified_by": "manual",
        "paused_cron_ids": PAUSED_CRONS,
        "note": "Verify with 'cronjob list' command or check Hermes dashboard",
        "warning": "If any are active, PAUSE immediately"
    }

# ── Main ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Post-deploy SEO validation")
    parser.add_argument("--json", action="store_true", help="JSON output only, no progress output")
    args = parser.parse_args()

    report = {
        "report": "Post-Deploy SEO Verification",
        "generated": datetime.now().isoformat(),
        "timestamp": time.time(),
        "base_url": BASE_URL,
        "results": {},
    }

    if not args.json:
        print("🔍 Validating SEO after deployment...")
        print(f"   Base URL: {BASE_URL}\n")

    # Validate main sitemap
    if not args.json:
        print("📋 Main sitemap...")
    report["results"]["sitemap"] = validate_main_sitemap()

    # Validate news sitemap
    if not args.json:
        print("📰 News sitemap...")
    report["results"]["news_sitemap"] = validate_news_sitemap()

    # Validate scenario sitemap
    if not args.json:
        print("🗑️  Scenario sitemap...")
    report["results"]["scenario_sitemap"] = validate_scenario_sitemap()

    # Validate robots.txt
    if not args.json:
        print("🤖 Robots.txt...")
    report["results"]["robots"] = validate_robots()

    # Fetch main sitemap body for page validation
    sitemap_body = ""
    try:
        _, sitemap_body, _ = fetch(f"{BASE_URL}/sitemap.xml")
    except Exception:
        pass

    # Validate key pages
    if not args.json:
        print("📄 Key pages...")
    report["results"]["pages"] = validate_pages(sitemap_body)

    # Check risky automations
    report["results"]["risky_automations"] = check_risky_automations()

    # Summary
    all_ok = all(
        section.get("ok", False)
        for section in report["results"].values()
        if isinstance(section, dict) and "ok" in section
    )
    page_ok = all(p["ok"] for p in report["results"]["pages"])
    overall_ok = all_ok and page_ok

    report["summary"] = {
        "overall_ok": overall_ok,
        "sitemap_ok": report["results"]["sitemap"]["ok"],
        "news_sitemap_ok": report["results"]["news_sitemap"]["ok"],
        "scenario_sitemap_ok": report["results"]["scenario_sitemap"]["ok"],
        "robots_ok": report["results"]["robots"]["ok"],
        "pages_ok": page_ok,
        "total_errors": sum(
            len(section.get("errors", []))
            for section in report["results"].values()
            if isinstance(section, dict)
        ),
    }

    # Write report
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)
    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)

    if args.json:
        print(json.dumps(report, indent=2))
    else:
        s = report["summary"]
        print(f"\n📊 Report: {REPORT_PATH}")
        print(f"   Overall: {'✅ PASS' if overall_ok else '❌ FAIL'}")
        print(f"   Sitemap: {'✅' if s['sitemap_ok'] else '❌'} ({report['results']['sitemap']['urls']} URLs)")
        print(f"   News: {'✅' if s['news_sitemap_ok'] else '❌'} ({report['results']['news_sitemap']['urls']} URLs)")
        print(f"   Scenario: {'✅' if s['scenario_sitemap_ok'] else '❌'} ({report['results']['scenario_sitemap']['urls']} URLs)")
        print(f"   Robots.txt: {'✅' if s['robots_ok'] else '❌'}")
        print(f"   Pages: {'✅' if page_ok else '❌'} ({sum(1 for p in report['results']['pages'] if p['ok'])}/{len(report['results']['pages'])} passed)")
        print(f"   Total errors: {s['total_errors']}")

    return 0 if overall_ok else 1

if __name__ == "__main__":
    sys.exit(main())
