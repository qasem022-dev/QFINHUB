#!/usr/bin/env python3
"""
QFINHUB Max-Throughput Indexing Engine
Submits ~80 URLs/day to Google Indexing API (max quota).
Covers: priority calculators, blog posts, tools, scenarios, geo, compare pages.

Run: python3 scripts/seo-indexing-engine.py
"""

import json, urllib.request, urllib.error, os, sys, re, time
from datetime import datetime, timedelta
from pathlib import Path

TOKEN_FILE = os.path.expanduser("~/.hermes/google-indexing-token.json")
LOG_FILE = os.path.expanduser("~/.hermes/logs/indexing-engine-log.json")
PROJECT_DIR = "/home/admin1/qfinhub"

# ─── Priority URLs (always submit) ───
PRIORITY_URLS = [
    # Home + main sections
    "https://www.qfinhub.com/",
    "https://www.qfinhub.com/calculators",
    "https://www.qfinhub.com/blog",
    "https://www.qfinhub.com/about",
    "https://www.qfinhub.com/widgets",
    # Top 25 calculators by search volume
    "https://www.qfinhub.com/calculators/mortgage-calculator",
    "https://www.qfinhub.com/calculators/compound-interest",
    "https://www.qfinhub.com/calculators/retirement-planning",
    "https://www.qfinhub.com/calculators/tax-calculator",
    "https://www.qfinhub.com/calculators/401k-calculator",
    "https://www.qfinhub.com/calculators/debt-snowball",
    "https://www.qfinhub.com/calculators/budget-planner",
    "https://www.qfinhub.com/calculators/auto-loan",
    "https://www.qfinhub.com/calculators/credit-card-payoff",
    "https://www.qfinhub.com/calculators/loan-calculator",
    "https://www.qfinhub.com/calculators/amortization-schedule",
    "https://www.qfinhub.com/calculators/refinance-calculator",
    "https://www.qfinhub.com/calculators/rent-vs-buy",
    "https://www.qfinhub.com/calculators/investment-return",
    "https://www.qfinhub.com/calculators/investment-calculator",
    "https://www.qfinhub.com/calculators/retirement-savings",
    "https://www.qfinhub.com/calculators/annuity-calculator",
    "https://www.qfinhub.com/calculators/roi-calculator",
    "https://www.qfinhub.com/calculators/net-worth",
    "https://www.qfinhub.com/calculators/mortgage-affordability",
    "https://www.qfinhub.com/calculators/debt-to-income",
    "https://www.qfinhub.com/calculators/car-loan",
    "https://www.qfinhub.com/calculators/savings-goal",
    "https://www.qfinhub.com/calculators/financial-independence",
    "https://www.qfinhub.com/calculators/fire-calculator",
    "https://www.qfinhub.com/calculators/emergency-fund",
    "https://www.qfinhub.com/calculators/inflation-calculator",
    "https://www.qfinhub.com/calculators/salary-calculator",
    "https://www.qfinhub.com/calculators/paycheck-tax",
    "https://www.qfinhub.com/calculators/self-employed-tax",
    "https://www.qfinhub.com/calculators/capital-gains-tax",
]

# ─── Token management ───

def get_token():
    try:
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        return data.get("access_token")
    except:
        return None

def refresh_token():
    try:
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        refresh = data.get("refresh_token")
        if not refresh:
            return None

        oauth_file = os.path.expanduser("~/.hermes/google-oauth.json")
        with open(oauth_file) as f:
            oauth = json.load(f)

        client_id = oauth["installed"]["client_id"]
        client_secret = oauth["installed"]["client_secret"]

        params = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        }).encode()

        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=params,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            new_data = json.loads(resp.read())

        data["access_token"] = new_data["access_token"]
        data["expires_in"] = new_data.get("expires_in", 3600)
        with open(TOKEN_FILE, "w") as f:
            json.dump(data, f)
        return new_data["access_token"]
    except Exception as e:
        return None

def submit_url(url, token):
    data = json.dumps({"url": url, "type": "URL_UPDATED"}).encode()
    req = urllib.request.Request(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return True, None
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            error = json.loads(body).get("error", {})
            msg = error.get("message", str(e))
        except:
            msg = str(e)
        return False, msg

# ─── URL collectors ───

def get_blog_urls(count=15):
    posts_file = os.path.join(PROJECT_DIR, "src/lib/blog/posts.ts")
    if not os.path.exists(posts_file):
        return []
    with open(posts_file) as f:
        slugs = re.findall(r'slug:\s*"([^"]+)"', f.read())
    return [f"https://www.qfinhub.com/blog/{s}" for s in slugs[-count:]]

def get_tool_urls(count=25):
    variants_file = os.path.join(PROJECT_DIR, "src/lib/programmatic-seo/variant-templates.ts")
    if not os.path.exists(variants_file):
        return []
    with open(variants_file) as f:
        slugs = re.findall(r'slug:\s*"([^"]+)"', f.read())
    return [f"https://www.qfinhub.com/tools/{s}" for s in slugs[:count]]

def get_scenario_urls(count=20):
    # Get from the most recent batch file
    import glob
    batches = sorted(glob.glob(os.path.join(PROJECT_DIR, "public/data/scenarios/batch-*.json")))
    if not batches:
        return []
    urls = []
    for batch in reversed(batches):
        with open(batch) as f:
            data = json.load(f)
        scenarios = data if isinstance(data, list) else data.get('scenarios', data.get('pages', []))
        for s in scenarios:
            sid = s.get('id', s.get('slug', ''))
            if sid:
                urls.append(f"https://www.qfinhub.com/scenario/{sid}")
        if len(urls) >= count:
            break
    return urls[:count]

def get_geo_urls(count=10):
    # Geo pages for major cities
    major_cities = [
        "new-york-ny", "los-angeles-ca", "chicago-il", "houston-tx",
        "phoenix-az", "philadelphia-pa", "san-antonio-tx", "san-diego-ca",
        "dallas-tx", "san-jose-ca", "austin-tx", "miami-fl",
        "atlanta-ga", "boston-ma", "seattle-wa", "denver-co",
    ]
    urls = []
    for city in major_cities:
        urls.append(f"https://www.qfinhub.com/calculators/mortgage-calculator/{city}")
        urls.append(f"https://www.qfinhub.com/calculators/retirement-planning/{city}")
    return urls[:count]

def get_new_pages_from_ctr_report():
    """Get URLs from today's CTR optimization report."""
    report_path = os.path.join(PROJECT_DIR, ".ctr-optimizer", f"ctr-report-{datetime.utcnow().strftime('%Y-%m-%d')}.json")
    if os.path.exists(report_path):
        with open(report_path) as f:
            report = json.load(f)
        urls = [s['page'] for s in report.get('top_targets', [])]
        for s in report.get('scenarios', []):
            urls.append(f"https://www.qfinhub.com/tools/{s['slug']}")
        return urls
    return []

def log_result(success, failed, errors, total_urls):
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "submitted": success,
        "failed": failed,
        "total_urls": total_urls,
        "errors": errors[:3],
    }
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except:
        pass

def main():
    print("=" * 55)
    print("🔍 QFINHUB Max-Throughput Indexing Engine")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)

    token = get_token()
    if not token:
        print("⚠️  No token. Refreshing...")
        token = refresh_token()
    if not token:
        print("❌ No valid token. Run: python3 scripts/submit-index.py --auth")
        return

    # Build URL list — target 80 total
    urls = list(PRIORITY_URLS)  # 35
    urls.extend([u for u in get_blog_urls(15) if u not in urls])  # +15
    urls.extend([u for u in get_tool_urls(25) if u not in urls][:20])  # +20
    urls.extend([u for u in get_scenario_urls(20) if u not in urls][:12])  # +12
    urls.extend([u for u in get_geo_urls(10) if u not in urls][:6])  # +6
    urls.extend([u for u in get_new_pages_from_ctr_report() if u not in urls][:5])  # +5

    # Deduplicate and trim
    urls = list(dict.fromkeys(urls))  # Preserve order, remove dupes
    urls = urls[:85]  # Cap at 85 to avoid 429

    print(f"\n📤 Submitting {len(urls)} URLs...")
    print("-" * 55)

    success = 0
    failed = 0
    errors = []
    rate_limited = False

    for i, url in enumerate(urls):
        if rate_limited:
            break

        ok, error = submit_url(url, token)
        if ok:
            success += 1
            short = url.rsplit("/", 1)[-1] or "home"
            print(f"  ✅ [{i+1}/{len(urls)}] {short[:45]}")
        else:
            if "429" in str(error) or "RESOURCE_EXHAUSTED" in str(error):
                rate_limited = True
                print(f"  ⛔ Rate limited after {i} submissions — stopping")
                break
            elif "401" in str(error) or "Unauthorized" in str(error):
                token = refresh_token()
                if token:
                    ok, error = submit_url(url, token)
                    if ok:
                        success += 1
                        continue
            failed += 1
            errors.append(str(error)[:100])
            short = url.rsplit("/", 1)[-1] or "home"
            print(f"  ❌ [{i+1}/{len(urls)}] {short[:45]}")

        # Small delay between requests
        time.sleep(0.25)

    print(f"\n{'='*55}")
    print(f"✅ {success} submitted | ❌ {failed} failed | 📊 {len(urls)} total")
    if rate_limited:
        print(f"⛔ Hit rate limit — resume tomorrow for remaining URLs")

    log_result(success, failed, errors, len(urls))


if __name__ == "__main__":
    main()
