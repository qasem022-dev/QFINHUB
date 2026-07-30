#!/usr/bin/env python3
"""
QFINHUB GSC Retry — Re-inspect URLs that hit HTTP 429 in the previous morning run.

Reads /tmp/retry-429-urls.txt, inspects each URL via Service Account JWT at
single-thread concurrency with 0.6s spacing (safe inside Google's per-minute quota).

Output:
    .optimizer-data/retry-429-results-{date}.json
    Updates .optimizer-data/full-url-inspection-results.json with recovered rows.

Usage:
    python3 scripts/gsc-retry-429.py
"""

import json, sys, time, urllib.request, urllib.error, importlib.util
from collections import Counter

PROJECT_DIR = "/home/admin1/qfinhub"
URL_LIST = "/tmp/retry-429-urls.txt"

# === Load SA auth ===
spec = importlib.util.spec_from_file_location(
    'gsc_sa', f'{PROJECT_DIR}/scripts/gsc-service-account-auth.py')
if spec is None or spec.loader is None:
    raise RuntimeError("Failed to load gsc-service-account-auth.py — check PROJECT_DIR")
sa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sa)
token = sa.get_access_token()

SITE_URL = "https://www.qfinhub.com/"
API_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"


def classify(cov_state):
    s = (cov_state or "").lower()
    if s.startswith("submitted and indexed"): return "INDEXED"
    if s.startswith("discovered"): return "DISCOVERED"
    if s.startswith("url is unknown"): return "UNKNOWN"
    if s.startswith("crawled"): return "CRAWLED_REJECTED"
    if s.startswith("alternate page"): return "ALTERNATE_CANONICAL"
    if s.startswith("not found"): return "404"
    if s.startswith("excluded by noindex"): return "NOINDEX"
    return "OTHER"


def inspect(url, max_retries=2):
    body = json.dumps({"inspectionUrl": url, "siteUrl": SITE_URL}).encode()
    backoff = 2.0
    for attempt in range(max_retries + 1):
        req = urllib.request.Request(
            API_URL, data=body,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            method="POST")
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.loads(r.read())
            res = data.get("inspectionResult", {}).get("indexStatusResult", {})
            return {
                "url": url,
                "coverage_state": res.get("coverageState", "") or "",
                "verdict": res.get("verdict", "") or "",
                "last_crawl": res.get("lastCrawlTime", "") or "",
                "category": classify(res.get("coverageState", "")),
                "retries": attempt,
            }
        except urllib.error.HTTPError as e:
            if e.code == 429 and attempt < max_retries:
                time.sleep(backoff)
                backoff *= 2
                continue
            return {"url": url, "error": f"HTTP {e.code}", "category": "ERROR", "retries": attempt}
        except Exception as e:
            return {"url": url, "error": str(e), "category": "ERROR", "retries": attempt}


def main():
    urls = [u.strip() for u in open(URL_LIST) if u.strip()]
    print(f"Retrying {len(urls)} URLs (workers=1, 0.6s spacing)")

    results = []
    start = time.time()
    for i, url in enumerate(urls):
        r = inspect(url)
        results.append(r)
        if (i + 1) % 25 == 0 or (i + 1) == len(urls):
            elapsed = time.time() - start
            rate = (i + 1) / elapsed if elapsed > 0 else 0
            print(f"  [{i+1}/{len(urls)}] {r.get('category','?'):18s} | "
                  f"rate {rate:.2f}/s | elapsed {elapsed:.0f}s")
        time.sleep(0.6)

    cats = Counter(r.get("category", "?") for r in results)
    print(f"\n=== Retry Summary ===")
    print(f"Inspected: {len(results)} in {time.time()-start:.0f}s")
    for cat, n in cats.most_common():
        print(f"  {cat}: {n}")

    # Persist
    date = time.strftime('%Y-%m-%d')
    out = f"{PROJECT_DIR}/.optimizer-data/retry-429-results-{date}.json"
    with open(out, 'w') as f:
        json.dump({
            "generated": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            "date": date,
            "input_count": len(urls),
            "results": results,
            "category_counts": dict(cats),
        }, f, indent=2)
    print(f"Saved: {out}")

    # Merge successful results into the master dict-keyed-by-URL file
    master_path = f"{PROJECT_DIR}/.optimizer-data/full-url-inspection-results.json"
    master = json.load(open(master_path))
    merged = 0
    for r in results:
        if r.get("category") == "ERROR":
            continue
        master[r["url"]] = {
            "coverage_state": r.get("coverage_state", ""),
            "verdict": r.get("verdict", ""),
            "last_crawl": r.get("last_crawl", ""),
            "category": r.get("category", ""),
            "last_updated": date,
        }
        merged += 1
    json.dump(master, open(master_path, 'w'), indent=2)
    print(f"Updated {merged} entries in {master_path}")


if __name__ == "__main__":
    main()