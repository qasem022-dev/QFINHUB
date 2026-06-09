#!/usr/bin/env python3
"""Phase 16.12D: Chunk-based URL Inspection Runner
Run with: python3 scripts/inspect-chunk.py START_INDEX CHUNK_SIZE
Example: python3 scripts/inspect-chunk.py 238 40
"""
import json, os, time, urllib.request, urllib.parse, sys

TOKEN = os.path.expanduser("~/.hermes/google-indexing-token.json")
RESULTS = ".optimizer-data/full-url-inspection-results.json"
INVENTORY = ".optimizer-data/full-sitemap-url-inventory.json"
SITE = "https://www.qfinhub.com"

start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
size = int(sys.argv[2]) if len(sys.argv) > 2 else 40

# Refresh token
with open(TOKEN) as f: tok = json.load(f)
body = urllib.parse.urlencode({"client_id": tok["client_id"], "client_secret": tok["client_secret"], "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"}).encode()
access = json.loads(urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=body), timeout=15).read())["access_token"]
tok["access_token"] = access
with open(TOKEN, "w") as f: json.dump(tok, f)
print(f"Token OK: {access[:15]}...")

# Load
with open(INVENTORY) as f: inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]
results = {}
if os.path.exists(RESULTS):
    with open(RESULTS) as f: results = json.load(f)

end = min(start + size, len(urls))
ok = 0
t0 = time.time()
for i in range(start, end):
    url = urls[i]
    if url in results: continue
    b = json.dumps({"inspectionUrl": url, "siteUrl": SITE}).encode()
    r = urllib.request.Request("https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=b, headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"})
    try:
        d = json.loads(urllib.request.urlopen(r, timeout=20).read())
        results[url] = {"coverage_state": d.get("inspectionResult",{}).get("indexStatusResult",{}).get("coverageState","?")}
        ok += 1
    except Exception as e:
        pass
    time.sleep(0.05)

with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
elapsed = time.time() - t0
pct = end / len(urls) * 100
print(f"Chunk {start}-{end-1}: {ok}/{size} OK in {elapsed:.0f}s | Total: {len(results)}/{len(urls)} ({pct:.0f}%)")
