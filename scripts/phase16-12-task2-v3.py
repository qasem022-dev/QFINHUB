#!/usr/bin/env python3
"""Phase 16.12 Task 2 v3: Mass URL Inspection — simplified, direct execution"""
import urllib.request, urllib.parse, json, os, time, sys

RESULTS = ".optimizer-data/full-url-inspection-results.json"
PROGRESS = ".optimizer-data/full-url-inspection-progress.json"
ERRORS = ".optimizer-data/full-url-inspection-errors.json"
TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")

# Step 1: Refresh token
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
new_tok = json.loads(resp.read())
access = new_tok["access_token"]
tok["access_token"] = access
with open(TOKEN_PATH, "w") as f:
    json.dump(tok, f)
print("Token refreshed OK")

# Step 2: Load inventory
with open(".optimizer-data/full-sitemap-url-inventory.json") as f:
    inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]
total = len(urls)
print(f"Loaded {total} URLs")

# Step 3: Inspect all
results = {}
errors = []
completed = 0

for i, url in enumerate(urls):
    body = json.dumps({"inspectionUrl": url, "siteUrl": "https://www.qfinhub.com/"}).encode()
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
            # Refresh token and retry
            try:
                body2 = urllib.parse.urlencode({
                    "client_id": tok["client_id"], "client_secret": tok["client_secret"],
                    "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"
                }).encode()
                req2 = urllib.request.Request("https://oauth2.googleapis.com/token", data=body2)
                resp2 = urllib.request.urlopen(req2)
                access = json.loads(resp2.read())["access_token"]
                tok["access_token"] = access
                with open(TOKEN_PATH, "w") as f:
                    json.dump(tok, f)
                # Retry inspection
                req3 = urllib.request.Request(
                    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                    data=body,
                    headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
                )
                resp3 = urllib.request.urlopen(req3, timeout=10)
                data3 = json.loads(resp3.read())
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
        else:
            errors.append({"url": url, "error": f"HTTP {e.code}: {err[:150]}"})
    except Exception as e:
        errors.append({"url": url, "error": str(e)[:150]})
    
    # Progress
    if i % 25 == 0:
        pct = (i+1)/total*100
        print(f"  {i+1}/{total} ({pct:.0f}%) | {completed} ok | {len(errors)} err")
        # Save checkpoint
        with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
        with open(PROGRESS, "w") as f: json.dump({"completed": completed, "total": total, "errors": len(errors), "last_index": i}, f)
        with open(ERRORS, "w") as f: json.dump(errors, f, indent=2)
    
    time.sleep(0.5)

# Final save
with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
with open(PROGRESS, "w") as f: json.dump({"completed": completed, "total": total, "errors": len(errors), "status": "COMPLETE"}, f)
with open(ERRORS, "w") as f: json.dump(errors, f, indent=2)
print(f"\nDONE: {completed}/{total} inspected, {len(errors)} errors")
