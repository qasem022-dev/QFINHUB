#!/usr/bin/env python3
"""Phase 16.12D: Complete URL Inspection with proper rate limiting.
4s delay between calls. Refreshes token via standalone script before start.
Run: python3 scripts/phase16-12d-final-inspect.py
"""
import subprocess, json, os, time, urllib.request, urllib.parse

TOKEN = os.path.expanduser("~/.hermes/google-indexing-token.json")
RESULTS = ".optimizer-data/full-url-inspection-results.json"
INVENTORY = ".optimizer-data/full-sitemap-url-inventory.json"
CHUNK_LOG = ".optimizer-data/full-url-inspection-chunk-log.json"
SITE = "https://www.qfinhub.com"
DELAY = 4  # seconds between API calls

# Step 1: Refresh via proven script
print("Refreshing token via refresh-gsc-token.py...")
r = subprocess.run(["python3", "scripts/refresh-gsc-token.py"], capture_output=True, text=True, cwd="/home/admin1/qfinhub", timeout=30)
print(r.stdout.strip())
if r.returncode != 0:
    print(f"REFRESH FAILED: {r.stderr}")
    exit(1)

# Step 2: Read token
with open(TOKEN) as f: tok = json.load(f)
access = tok["access_token"]
print(f"Token scopes: {tok.get('scope','?')[:80]}")

# Step 3: Load state
with open(INVENTORY) as f: inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]
results = {}
if os.path.exists(RESULTS):
    with open(RESULTS) as f: results = json.load(f)
done = len(results)
remaining = len(urls) - done
print(f"Starting: {done}/{len(urls)} done, {remaining} remaining")

# Chunks
CHUNK = 12  # 12 URLs × (7s API + 4s delay) = 132s per chunk
chunks_log = {"chunks": [], "total_inspected": done}

for chunk_start in range(done, len(urls), CHUNK):
    chunk_end = min(chunk_start + CHUNK, len(urls))
    ok = 0
    t0 = time.time()
    
    for i in range(chunk_start, chunk_end):
        url = urls[i]
        if url in results: continue
        b = json.dumps({"inspectionUrl": url, "siteUrl": SITE}).encode()
        req = urllib.request.Request(
            "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
            data=b, headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
        )
        try:
            d = json.loads(urllib.request.urlopen(req, timeout=20).read())
            results[url] = {
                "coverage_state": d.get("inspectionResult",{}).get("indexStatusResult",{}).get("coverageState","?"),
                "verdict": d.get("inspectionResult",{}).get("indexStatusResult",{}).get("verdict","?"),
                "last_crawl_time": (d.get("inspectionResult",{}).get("indexStatusResult",{}).get("lastCrawlTime","") or "")[:19],
            }
            ok += 1
        except Exception as e:
            pass
        time.sleep(DELAY)
    
    # Save
    with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
    elapsed = time.time() - t0
    pct = len(results) / len(urls) * 100
    print(f"  Chunk {chunk_start}-{chunk_end-1}: {ok}/{CHUNK} OK in {elapsed:.0f}s | Total: {len(results)}/{len(urls)} ({pct:.0f}%)")
    
    chunks_log["chunks"].append({"start": chunk_start, "ok": ok, "time": elapsed})
    chunks_log["total_inspected"] = len(results)
    with open(CHUNK_LOG, "w") as f: json.dump(chunks_log, f)
    
    # Refresh token every 5 chunks
    if (chunk_start // CHUNK) % 5 == 4:
        print("  Refreshing token...")
        subprocess.run(["python3", "scripts/refresh-gsc-token.py"], capture_output=True, cwd="/home/admin1/qfinhub", timeout=30)
        with open(TOKEN) as f: access = json.load(f)["access_token"]
    
    if len(results) >= len(urls): break

with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
with open(CHUNK_LOG, "w") as f: json.dump(chunks_log, f, indent=2)
print(f"\n✅ DONE: {len(results)}/{len(urls)} inspected")
