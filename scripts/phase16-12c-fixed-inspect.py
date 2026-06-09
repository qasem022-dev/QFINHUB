#!/usr/bin/env python3
"""Phase 16.12C: Fixed URL Inspection Runner
Fixes: Proactive token refresh every 50 URLs. Longer timeouts. Retry on timeout.
"""
import urllib.request, urllib.parse, json, os, time

RESULTS = ".optimizer-data/full-url-inspection-results.json"
PROGRESS = ".optimizer-data/full-url-inspection-progress.json"
ERRORS = ".optimizer-data/full-url-inspection-errors.json"
TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
SITE = "https://www.qfinhub.com"

def refresh():
    with open(TOKEN_PATH) as f:
        tok = json.load(f)
    body = urllib.parse.urlencode({
        "client_id": tok["client_id"], "client_secret": tok["client_secret"],
        "refresh_token": tok["refresh_token"], "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    resp = urllib.request.urlopen(req, timeout=15)
    new = json.loads(resp.read())
    tok["access_token"] = new["access_token"]
    with open(TOKEN_PATH, "w") as f:
        json.dump(tok, f)
    return new["access_token"]

access = refresh()
print("Token refreshed")

# Load existing
results = {}
if os.path.exists(RESULTS):
    with open(RESULTS) as f:
        results = json.load(f)
    print(f"Loaded {len(results)} results")

errors = []
if os.path.exists(ERRORS):
    with open(ERRORS) as f:
        errors = json.load(f)

# Load inventory
with open(".optimizer-data/full-sitemap-url-inventory.json") as f:
    inv = json.load(f)
urls = [u["url"] for u in inv["urls"]]
total = len(urls)

# Count already done
done = sum(1 for u in urls if u in results)
print(f"Resuming: {done}/{total} done, {total - done} remaining")

# Process remaining
count = 0
for i, url in enumerate(urls):
    if url in results:
        continue
    
    # Refresh token proactively every 50
    if count > 0 and count % 50 == 0:
        try:
            access = refresh()
            print(f"\n  Token refreshed at {count} processed")
        except Exception as e:
            print(f"\n  Token refresh FAILED at {count}: {e}")
    
    body = json.dumps({"inspectionUrl": url, "siteUrl": SITE}).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body,
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    
    for attempt in range(3):
        try:
            resp = urllib.request.urlopen(req, timeout=20)
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
            done += 1
            count += 1
            break
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(10)
                continue
            if e.code in (401, 403):
                try:
                    access = refresh()
                    continue
                except:
                    pass
            if attempt == 2:
                errors.append({"url": url, "error": f"HTTP {e.code} after 3 retries"})
        except Exception as e:
            if attempt == 2:
                errors.append({"url": url, "error": str(e)[:150]})
            time.sleep(2)
    
    # Save every 25
    if count % 25 == 0 and count > 0:
        with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
        with open(PROGRESS, "w") as f: json.dump({"completed": done, "total": total, "errors": len(errors), "last_processed": i}, f)
        with open(ERRORS, "w") as f: json.dump(errors, f, indent=2)
        print(f"  [{done}/{total}] {done*100//total}% | errors: {len(errors)}")
    
    time.sleep(0.3)

# Final save
with open(RESULTS, "w") as f: json.dump(results, f, indent=2)
with open(PROGRESS, "w") as f: json.dump({"completed": done, "total": total, "errors": len(errors), "status": "COMPLETE"}, f)
with open(ERRORS, "w") as f: json.dump(errors, f, indent=2)
print(f"\n✅ COMPLETE: {done}/{total} inspected, {len(errors)} errors")
