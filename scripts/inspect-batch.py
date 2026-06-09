#!/usr/bin/env python3
"""Minimal batch URL inspector — one chunk at a time. Must run refresh-gsc-token.py first."""
import urllib.request, json, os, time, sys

TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
INVENTORY = ".optimizer-data/full-sitemap-url-inventory.json"
RESULTS = ".optimizer-data/full-url-inspection-results.json"
SITE = "https://www.qfinhub.com"

# Get start index
start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
count = int(sys.argv[2]) if len(sys.argv) > 2 else 30

# Load token
with open(TOKEN_PATH) as f: tok = json.load(f)
access = tok["access_token"]

# Load inventory
with open(INVENTORY) as f: inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]

# Load existing results
results = {}
if os.path.exists(RESULTS):
    with open(RESULTS) as f: results = json.load(f)

# Process batch
end = min(start + count, len(urls))
print(f"Batch: indices {start}-{end-1} ({end-start} URLs)")
ok = 0
err = 0
t0 = time.time()

for i in range(start, end):
    url = urls[i]
    if url in results:
        continue
    
    body = json.dumps({"inspectionUrl": url, "siteUrl": SITE}).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body, headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        data = json.loads(resp.read())
        insp = data.get("inspectionResult", {}).get("indexStatusResult", {})
        results[url] = {
            "coverage_state": insp.get("coverageState", "?"),
            "verdict": insp.get("verdict", "?"),
            "indexing_state": insp.get("indexingState", "?"),
            "robots_txt_state": insp.get("robotsTxtState", "?"),
            "page_fetch_state": insp.get("pageFetchState", "?"),
            "last_crawl_time": (insp.get("lastCrawlTime", "") or "")[:19],
            "crawled_as": insp.get("crawledAs", "?"),
            "google_canonical": insp.get("googleCanonical", ""),
            "user_canonical": insp.get("userCanonical", ""),
        }
        ok += 1
    except Exception as e:
        err += 1
        print(f"  ERR {url[-50:]}: {str(e)[:80]}")
    
    # Progress
    if (i + 1) % 10 == 0:
        elapsed = time.time() - t0
        rate = (i - start + 1) / elapsed if elapsed > 0 else 0
        print(f"  {i+1}/{end} ({elapsed:.0f}s, {rate:.1f}/s) | ok={ok} err={err}")
    
    time.sleep(0.1)

# Save
with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
elapsed = time.time() - t0
print(f"\nBatch done: {ok} ok, {err} err in {elapsed:.0f}s ({elapsed/(end-start):.1f}s/url)")
print(f"Total results: {len(results)}/{len(urls)}")
