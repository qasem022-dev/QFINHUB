#!/usr/bin/env python3
"""Phase 16.12D: Chunked Resumable URL Inspection Runner
Features: chunks of 75, refresh every 40, save every 10, 1 retry, resume.
"""
import urllib.request, urllib.parse, json, os, time, sys

RESULTS = ".optimizer-data/full-url-inspection-results.json"
PROGRESS = ".optimizer-data/full-url-inspection-progress.json"
ERRORS = ".optimizer-data/full-url-inspection-errors.json"
CHUNK_LOG = ".optimizer-data/full-url-inspection-chunk-log.json"
TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
SITE = "https://www.qfinhub.com"
CHUNK_SIZE = 75
REFRESH_EVERY = 40

def load_json(path, default=None):
    if default is None: default = {}
    if os.path.exists(path):
        with open(path) as f:
            return json.load(f)
    return default

def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2)

def refresh_token():
    tok = load_json(TOKEN_PATH)
    body = urllib.parse.urlencode({
        "client_id": tok["client_id"], "client_secret": tok["client_secret"],
        "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    resp = urllib.request.urlopen(req, timeout=15)
    new = json.loads(resp.read())
    tok["access_token"] = new["access_token"]
    # Google may rotate the refresh_token — save it if provided
    if "refresh_token" in new:
        tok["refresh_token"] = new["refresh_token"]
    save_json(TOKEN_PATH, tok)
    print(f"  Token refreshed: access={new['access_token'][:15]}... expires_in={new.get('expires_in','?')}s")
    return new["access_token"]

def inspect_one(url, access):
    body = json.dumps({"inspectionUrl": url, "siteUrl": SITE}).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body, headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, timeout=20)
    data = json.loads(resp.read())
    insp = data.get("inspectionResult", {}).get("indexStatusResult", {})
    return {
        "coverage_state": insp.get("coverageState", "?"),
        "verdict": insp.get("verdict", "?"),
        "indexing_state": insp.get("indexingState", "?"),
        "robots_txt_state": insp.get("robotsTxtState", "?"),
        "page_fetch_state": insp.get("pageFetchState", "?"),
        "last_crawl_time": (insp.get("lastCrawlTime", "") or "")[:19],
        "crawled_as": insp.get("crawledAs", "?"),
        "google_canonical": insp.get("googleCanonical", ""),
        "user_canonical": insp.get("userCanonical", ""),
        "referring_urls": insp.get("referringUrls", []),
        "sitemap": insp.get("sitemap", []),
    }

# === MAIN ===
access = refresh_token()
print(f"Token refreshed. Chunk size={CHUNK_SIZE}, refresh every={REFRESH_EVERY}")

# Load existing
results = load_json(RESULTS, {})
errors = load_json(ERRORS, [])
chunks = load_json(CHUNK_LOG, {"chunks": [], "total_inspected": 0})

# Load inventory
with open(".optimizer-data/full-sitemap-url-inventory.json") as f:
    inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]
total = len(urls)

# Find resume point
done = set(results.keys())
remaining = [(i, u) for i, u in enumerate(urls) if u not in done]
print(f"Resuming: {len(done)} done, {len(remaining)} remaining")

if not remaining:
    print("All URLs already inspected!")
    sys.exit(0)

# Chunked processing
chunk_num = len(chunks["chunks"]) + 1
for chunk_start in range(0, len(remaining), CHUNK_SIZE):
    chunk = remaining[chunk_start:chunk_start + CHUNK_SIZE]
    chunk_start_time = time.time()
    chunk_ok = 0
    chunk_err = 0
    
    print(f"\n{'='*50}")
    print(f"CHUNK {chunk_num}: {len(chunk)} URLs ({chunk_start+len(done)+1}-{chunk_start+len(done)+len(chunk)} of {total})")
    print(f"{'='*50}")
    
    for j, (idx, url) in enumerate(chunk):
        url_num = idx + 1
        
        # Refresh token proactively
        calls_since_refresh = j + (chunk_start % REFRESH_EVERY)
        if calls_since_refresh > 0 and calls_since_refresh % REFRESH_EVERY == 0:
            try:
                access = refresh_token()
                print(f"  Token refreshed at URL {url_num}")
            except Exception as e:
                print(f"  ⚠ Token refresh failed at URL {url_num}: {e}")
        
        # Inspect with 1 retry
        success = False
        for attempt in range(2):
            try:
                result = inspect_one(url, access)
                results[url] = result
                chunk_ok += 1
                success = True
                break
            except urllib.error.HTTPError as e:
                if e.code == 429:
                    time.sleep(10)
                    continue
                if e.code in (401, 403) and attempt == 0:
                    try:
                        access = refresh_token()
                        continue
                    except:
                        pass
                if attempt == 1:
                    err = e.read().decode()[:150] if e.fp else f"HTTP {e.code}"
                    errors.append({"url": url, "url_num": url_num, "error": err})
                    chunk_err += 1
            except Exception as e:
                if attempt == 1:
                    errors.append({"url": url, "url_num": url_num, "error": str(e)[:150]})
                    chunk_err += 1
                time.sleep(2)
        
        # Progress every 10
        if (j + 1) % 10 == 0:
            pct = (url_num) / total * 100
            elapsed = time.time() - chunk_start_time
            rate = (j + 1) / elapsed if elapsed > 0 else 0
            eta = (len(remaining) - chunk_start - j - 1) / rate if rate > 0 else 0
            print(f"  [{url_num}/{total}] {pct:.0f}% | rate: {rate:.1f}/s | ETA: {eta/60:.0f}m | ok: {chunk_ok} err: {chunk_err}")
        
        time.sleep(0.1)
    
    # Save after each chunk
    save_json(RESULTS, results)
    save_json(PROGRESS, {"completed": len(results), "total": total, "errors": len(errors), "last_url_index": idx})
    save_json(ERRORS, errors)
    
    chunk_data = {
        "chunk": chunk_num,
        "urls": len(chunk),
        "ok": chunk_ok,
        "errors": chunk_err,
        "time_seconds": round(time.time() - chunk_start_time, 1),
        "cumulative": len(results)
    }
    chunks["chunks"].append(chunk_data)
    chunks["total_inspected"] = len(results)
    save_json(CHUNK_LOG, chunks)
    
    print(f"\n  CHUNK {chunk_num} DONE: {chunk_ok} ok, {chunk_err} err, {chunk_data['time_seconds']}s")
    print(f"  Cumulative: {len(results)}/{total} ({len(results)*100//total}%)")
    
    chunk_num += 1

# Final
save_json(RESULTS, results)
save_json(PROGRESS, {"completed": len(results), "total": total, "errors": len(errors), "status": "COMPLETE"})
save_json(ERRORS, errors)
print(f"\n{'='*50}")
print(f"✅ FULL INSPECTION COMPLETE: {len(results)}/{total} inspected, {len(errors)} errors")
