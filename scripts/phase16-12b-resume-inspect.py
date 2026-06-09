#!/usr/bin/env python3
"""Phase 16.12B Task B2: Resume URL Inspection from URL 102 onward
Continues from full-url-inspection-progress.json. Skips already-inspected URLs.
"""
import urllib.request, urllib.parse, json, os, time

RESULTS = ".optimizer-data/full-url-inspection-results.json"
PROGRESS = ".optimizer-data/full-url-inspection-progress.json"
ERRORS = ".optimizer-data/full-url-inspection-errors.json"
TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
SITE = "https://www.qfinhub.com"

# Load existing results
results = {}
if os.path.exists(RESULTS):
    with open(RESULTS) as f:
        results = json.load(f)
    print(f"Loaded {len(results)} existing results")

# Load progress
start_idx = 0
if os.path.exists(PROGRESS):
    with open(PROGRESS) as f:
        prog = json.load(f)
    start_idx = prog.get("last_index", -1) + 1
    print(f"Resuming from index {start_idx}")

# Load errors
errors = []
if os.path.exists(ERRORS):
    with open(ERRORS) as f:
        errors = json.load(f)

# Refresh token
with open(TOKEN_PATH) as f:
    tok = json.load(f)
body = urllib.parse.urlencode({
    "client_id": tok["client_id"],
    "client_secret": tok["client_secret"],
    "refresh_token": tok["refresh_token"],
    "grant_type": "refresh_token"
}).encode()
req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
resp = urllib.request.urlopen(req)
access = json.loads(resp.read())["access_token"]
tok["access_token"] = access
with open(TOKEN_PATH, "w") as f:
    json.dump(tok, f)
print("Token refreshed OK")

# Load inventory
with open(".optimizer-data/full-sitemap-url-inventory.json") as f:
    inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]
total = len(urls)
print(f"Total URLs: {total}, resuming from {start_idx}")

completed = len(results)
new_errors = 0

# Inspect remaining URLs
for i in range(start_idx, total):
    url = urls[i]
    
    # Skip if already inspected
    if url in results:
        continue
    
    body = json.dumps({"inspectionUrl": url, "siteUrl": SITE}).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body,
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req, timeout=10)
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
        completed += 1
    except urllib.error.HTTPError as e:
        err = e.read().decode()[:200] if e.fp else ""
        if e.code in (401, 403):
            try:
                # Refresh and retry
                b2 = urllib.parse.urlencode({
                    "client_id": tok["client_id"], "client_secret": tok["client_secret"],
                    "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"
                }).encode()
                r2 = urllib.request.Request("https://oauth2.googleapis.com/token", data=b2)
                access = json.loads(urllib.request.urlopen(r2).read())["access_token"]
                tok["access_token"] = access
                with open(TOKEN_PATH, "w") as f: json.dump(tok, f)
                # Retry
                r3 = urllib.request.Request(
                    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                    data=body,
                    headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
                )
                data3 = json.loads(urllib.request.urlopen(r3, timeout=10).read())
                insp3 = data3.get("inspectionResult", {}).get("indexStatusResult", {})
                results[url] = {
                    "coverage_state": insp3.get("coverageState", "?"),
                    "verdict": insp3.get("verdict", "?"),
                    "indexing_state": insp3.get("indexingState", "?"),
                    "robots_txt_state": insp3.get("robotsTxtState", "?"),
                    "page_fetch_state": insp3.get("pageFetchState", "?"),
                    "last_crawl_time": (insp3.get("lastCrawlTime", "") or "")[:19],
                    "crawled_as": insp3.get("crawledAs", "?"),
                    "google_canonical": insp3.get("googleCanonical", ""),
                    "user_canonical": insp3.get("userCanonical", ""),
                }
                completed += 1
                continue
            except Exception as e2:
                errors.append({"url": url, "error": f"REFRESH_RETRY_FAILED: {str(e2)[:100]}"})
                new_errors += 1
        else:
            errors.append({"url": url, "error": f"HTTP {e.code}: {err[:150]}"})
            new_errors += 1
    except Exception as e:
        errors.append({"url": url, "error": str(e)[:150]})
        new_errors += 1
    
    # Save every 25
    if (i + 1) % 25 == 0:
        with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
        with open(PROGRESS, "w") as f: json.dump({"completed": len(results), "total": total, "errors": len(errors), "last_index": i}, f)
        with open(ERRORS, "w") as f: json.dump(errors, f, indent=2)
        pct = (i+1)/total*100
        print(f"  {i+1}/{total} ({pct:.0f}%) | {len(results)} ok | {len(errors)} err")
    
    time.sleep(0.5)

# Final save
with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
with open(PROGRESS, "w") as f: json.dump({"completed": len(results), "total": total, "errors": len(errors), "status": "COMPLETE"}, f)
with open(ERRORS, "w") as f: json.dump(errors, f, indent=2)
print(f"\nDONE: {len(results)}/{total} inspected, {new_errors} new errors (total: {len(errors)})")
