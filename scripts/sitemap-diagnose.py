#!/usr/bin/env python3
"""
QFINHUB sitemap diagnostic.

Fetches every URL in the live sitemap and records the things Google uses to
decide whether a page is worth indexing:
  - HTTP status (and redirect target)
  - meta robots / X-Robots-Tag (noindex)
  - canonical (self-referencing? correct host/protocol?)
  - title, meta description, h1 presence
  - word count of visible text (thin-content signal)
  - whether the page is duplicated (identical title or description)

Outputs:
  .optimizer-data/sitemap-diagnose-<DATE>.json     per-URL findings
  .optimizer-data/sitemap-diagnose-<DATE>-summary.json

Usage:
    python3 scripts/sitemap-diagnose.py
    python3 scripts/sitemap-diagnose.py --limit 50
"""

import argparse
import datetime
import json
import re
import sys
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / ".optimizer-data"
TODAY = datetime.date.today().isoformat()
OUT = DATA / f"sitemap-diagnose-{TODAY}.json"
SUMMARY = DATA / f"sitemap-diagnose-{TODAY}-summary.json"

UA = "Mozilla/5.0 (compatible; qfinhub-diagnose/1.0; +https://www.qfinhub.com)"
THIN_THRESHOLD = 300  # words

TAG_RE = re.compile(r"<(script|style|noscript)[^>]*>.*?</\1>", re.S | re.I)
META_ROBOTS = re.compile(
    r'<meta[^>]+name=["\']robots["\'][^>]*content=["\']([^"\']*)["\']', re.I
)
META_ROBOTS_ALT = re.compile(
    r'<meta[^>]+content=["\']([^"\']*)["\'][^>]*name=["\']robots["\']', re.I
)
CANONICAL = re.compile(
    r'<link[^>]+rel=["\']canonical["\'][^>]*href=["\']([^"\']+)["\']', re.I
)
TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.S | re.I)
DESC = re.compile(
    r'<meta[^>]+name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', re.I
)
H1 = re.compile(r"<h1[^>]*>(.*?)</h1>", re.S | re.I)


def strip_tags(html: str) -> str:
    return re.sub(r"<[^>]+>", " ", TAG_RE.sub(" ", html))


def fetch_sitemap_urls() -> list[str]:
    req = urllib.request.Request(
        "https://www.qfinhub.com/sitemap.xml", headers={"User-Agent": UA}
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        xml = r.read().decode("utf-8", errors="replace")
    urls = re.findall(r"<loc>\s*(.*?)\s*</loc>", xml)
    return [u for u in dict.fromkeys(urls) if u.startswith("http")]


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # noqa: D401
        return None


opener = urllib.request.build_opener(NoRedirect)


def inspect(url: str) -> dict:
    rec: dict = {"url": url, "success": False}
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            resp = opener.open(req, timeout=30)
            status = resp.status
            body = resp.read().decode("utf-8", errors="replace")
            headers = dict(resp.headers)
        except urllib.error.HTTPError as e:
            status = e.code
            headers = dict(e.headers or {})
            body = ""
            if 300 <= status < 400:
                rec["redirectTo"] = headers.get("Location", "")

        rec["status"] = status
        rec["xRobotsTag"] = headers.get("X-Robots-Tag", "")

        if body:
            m = META_ROBOTS.search(body) or META_ROBOTS_ALT.search(body)
            meta_robots = (m.group(1).lower() if m else "")
            rec["metaRobots"] = meta_robots
            rec["noindex"] = "noindex" in meta_robots or "noindex" in rec["xRobotsTag"].lower()

            m = CANONICAL.search(body)
            canonical = m.group(1).strip() if m else ""
            rec["canonical"] = canonical
            rec["canonicalSelf"] = canonical.rstrip("/") == url.rstrip("/")
            rec["canonicalMismatch"] = bool(canonical) and not rec["canonicalSelf"]

            m = TITLE.search(body)
            rec["title"] = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""

            m = DESC.search(body)
            rec["description"] = re.sub(r"\s+", " ", m.group(1)).strip() if m else ""

            m = H1.search(body)
            rec["h1"] = re.sub(r"\s+", " ", strip_tags(m.group(1))).strip() if m else ""

            text = strip_tags(body)
            rec["words"] = len(re.findall(r"[A-Za-z0-9']+", text))
            rec["thin"] = rec["words"] < THIN_THRESHOLD
            rec["hasJsonLd"] = "application/ld+json" in body

        rec["success"] = True
    except Exception as e:
        rec["error"] = f"{type(e).__name__}: {str(e)[:120]}"
    return rec


def section_of(url: str) -> str:
    p = url.replace("https://www.qfinhub.com", "").strip("/")
    return p.split("/")[0] if p else "(home)"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    urls = fetch_sitemap_urls()
    if args.limit:
        urls = urls[: args.limit]
    print(f"Diagnosing {len(urls)} sitemap URLs with {args.workers} workers...", flush=True)

    results: dict[str, dict] = {}
    done = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = {pool.submit(inspect, u): u for u in urls}
        for fut in as_completed(futures):
            u = futures[fut]
            results[u] = fut.result()
            done += 1
            if done % 50 == 0:
                print(f"  {done}/{len(urls)}", flush=True)

    OUT.write_text(json.dumps(results, indent=2))

    # ── aggregate ──
    status_counts = Counter(r.get("status", "error") for r in results.values())
    problems: dict[str, list[str]] = defaultdict(list)
    titles: dict[str, list[str]] = defaultdict(list)
    descs: dict[str, list[str]] = defaultdict(list)

    for u, r in results.items():
        if not r.get("success"):
            problems["fetch_failed"].append(u)
            continue
        st = r.get("status")
        if st != 200:
            problems[f"http_{st}"].append(u)
        if r.get("noindex"):
            problems["noindex"].append(u)
        if r.get("canonicalMismatch"):
            problems["canonical_mismatch"].append(u)
        if not r.get("canonical"):
            problems["no_canonical"].append(u)
        if r.get("xRobotsTag"):
            problems["x_robots_tag_set"].append(u)
        if r.get("thin"):
            problems["thin_content"].append(u)
        if not r.get("h1"):
            problems["missing_h1"].append(u)
        if not r.get("title"):
            problems["missing_title"].append(u)
        if not r.get("description"):
            problems["missing_description"].append(u)
        if not r.get("hasJsonLd"):
            problems["no_jsonld"].append(u)
        if r.get("title"):
            titles[r["title"]].append(u)
        if r.get("description"):
            descs[r["description"]].append(u)

    dup_titles = {t: us for t, us in titles.items() if len(us) > 1}
    dup_descs = {d: us for d, us in descs.items() if len(us) > 1}

    # per-section quality
    by_section = {}
    for u, r in results.items():
        s = section_of(u)
        d = by_section.setdefault(
            s, {"count": 0, "thin": 0, "noindex": 0, "not200": 0, "noJsonLd": 0, "avgWords": 0}
        )
        d["count"] += 1
        d["thin"] += 1 if r.get("thin") else 0
        d["noindex"] += 1 if r.get("noindex") else 0
        d["not200"] += 1 if r.get("status") != 200 else 0
        d["noJsonLd"] += 1 if not r.get("hasJsonLd") else 0
        d["avgWords"] += r.get("words", 0)
    for s, d in by_section.items():
        d["avgWords"] = round(d["avgWords"] / d["count"]) if d["count"] else 0

    summary = {
        "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
        "totalUrls": len(results),
        "statusCounts": dict(status_counts),
        "problemCounts": {k: len(v) for k, v in sorted(problems.items(), key=lambda x: -len(x[1]))},
        "problems": {k: v for k, v in problems.items()},
        "duplicateTitles": {t: us for t, us in list(dup_titles.items())[:50]},
        "duplicateTitleCount": len(dup_titles),
        "duplicateDescriptions": {d: us for d, us in list(dup_descs.items())[:50]},
        "duplicateDescriptionCount": len(dup_descs),
        "bySection": by_section,
    }
    SUMMARY.write_text(json.dumps(summary, indent=2))

    print("\n=== STATUS ===", flush=True)
    for k, v in status_counts.most_common():
        print(f"  {str(k):14} {v}", flush=True)
    print("\n=== PROBLEMS ===", flush=True)
    for k, v in sorted(summary["problemCounts"].items(), key=lambda x: -x[1]):
        print(f"  {k:24} {v}", flush=True)
    print(f"\n  duplicate titles       {summary['duplicateTitleCount']}", flush=True)
    print(f"  duplicate descriptions {summary['duplicateDescriptionCount']}", flush=True)
    print("\n=== BY SECTION ===", flush=True)
    for s, d in sorted(by_section.items(), key=lambda x: -x[1]["count"]):
        print(
            f"  {s:18} n={d['count']:>4} thin={d['thin']:>4} noindex={d['noindex']:>3} "
            f"non200={d['not200']:>3} avgWords={d['avgWords']:>5}",
            flush=True,
        )
    print(f"\nSaved: {OUT}\nSaved: {SUMMARY}", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
