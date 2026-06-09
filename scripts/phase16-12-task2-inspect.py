#!/usr/bin/env python3
"""Phase 16.12 Task 2: Mass URL Inspection via GSC API (649 URLs)
Resumable — saves progress every 25 URLs. Rate-limited at 1s between calls.
"""
import urllib.request, urllib.parse, json, os, time, sys

INVENTORY_PATH = ".optimizer-data/full-sitemap-url-inventory.json"
RESULTS_PATH = ".optimizer-data/full-url-inspection-results.json"
PROGRESS_PATH = ".optimizer-data/full-url-inspection-progress.json"
ERRORS_PATH = ".optimizer-data/full-url-inspection-errors.json"
TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
SITE_URL = "https://www.qfinhub.com"

# Load token
with open(TOKEN_PATH) as f:
    tok = json.load(f)
access = tok["access_token"]

# Proactively refresh token before starting
print("Refreshing token before starting inspection...")
try:
    body = urllib.parse.urlencode({
        "client_id": tok["client_id"],
        "client_secret": tok["client_secret"],
        "refresh_token": tok["refresh_token"],
        "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    resp = urllib.request.urlopen(req)
    new_tok = json.loads(resp.read())
    tok["access_token"] = new_tok["access_token"]
    access = new_tok["access_token"]
    with open(TOKEN_PATH, "w") as f:
        json.dump(tok, f)
    print(f"Token refreshed. Starting inspection of {total} URLs...")
except Exception as e:
    print(f"Token refresh failed: {e}. Continuing with existing token...")

# Load inventory
with open(INVENTORY_PATH) as f:
    inv = json.load(f)
urls = inv["urls"]
total = len(urls)

# Load progress
completed_urls = set()
errors_list = []
if os.path.exists(PROGRESS_PATH):
    with open(PROGRESS_PATH) as f:
        progress = json.load(f)
    completed_urls = set(progress.get("completed_urls", []))
    errors_list = progress.get("errors", [])
    print(f"Resuming from {len(completed_urls)}/{total} completed")

# Load existing results
results = {}
if os.path.exists(RESULTS_PATH):
    with open(RESULTS_PATH) as f:
        results = json.load(f)
    print(f"Loaded {len(results)} existing inspection results")

def refresh_token():
    global access
    body = urllib.parse.urlencode({
        "client_id": tok["client_id"],
        "client_secret": tok["client_secret"],
        "refresh_token": tok["refresh_token"],
        "grant_type": "refresh_token"
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    resp = urllib.request.urlopen(req)
    new_tok = json.loads(resp.read())
    tok["access_token"] = new_tok["access_token"]
    access = new_tok["access_token"]
    with open(TOKEN_PATH, "w") as f:
        json.dump(tok, f)
    print("  Token refreshed")

def inspect_url(url):
    body = json.dumps({
        "inspectionUrl": url,
        "siteUrl": SITE_URL
    }).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body,
        headers={"Authorization": f"Bearer {access}", "Content-Type": "application/json"}
    )
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    insp = data.get("inspectionResult", {}).get("indexStatusResult", {})
    mobile = data.get("inspectionResult", {}).get("mobileUsabilityResult", {})
    rich = data.get("inspectionResult", {}).get("richResultsResult", {})
    
    return {
        "url": url,
        "coverage_state": insp.get("coverageState", "UNKNOWN"),
        "verdict": insp.get("verdict", "UNKNOWN"),
        "indexing_state": insp.get("indexingState", "UNKNOWN"),
        "robots_txt_state": insp.get("robotsTxtState", "UNKNOWN"),
        "page_fetch_state": insp.get("pageFetchState", "UNKNOWN"),
        "last_crawl_time": (insp.get("lastCrawlTime", "") or "")[:19],
        "crawled_as": insp.get("crawledAs", "UNKNOWN"),
        "google_selected_canonical": insp.get("googleCanonical", ""),
        "user_declared_canonical": insp.get("userCanonical", ""),
        "referring_urls": insp.get("referringUrls", []),
        "sitemap": insp.get("sitemap", []),
        "mobile_usability_verdict": mobile.get("verdict", "UNKNOWN") if mobile else "N/A",
        "rich_results_detected": [r.get("richResultType", "?") for r in rich.get("detectedItems", [])] if rich else [],
        "inspection_time": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    }

count = 0
skipped = len(completed_urls)
errors_count = len(errors_list)
batch_start = time.time()

for i, entry in enumerate(urls):
    url = entry["url"]
    
    # Skip completed
    if url in completed_urls:
        count += 1
        continue
    
    # Progress indicator
    if count % 10 == 0 and count > skipped:
        elapsed = time.time() - batch_start
        rate = (count - skipped) / elapsed if elapsed > 0 else 0
        eta = (total - skipped - (count - skipped)) / rate if rate > 0 else 0
        print(f"  [{count}/{total}] {rate:.1f} URL/s | ETA: {eta/60:.0f}m | errors: {errors_count}  ", end="\r")
    
    try:
        result = inspect_url(url)
        results[url] = result
        completed_urls.add(url)
        count += 1
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:200] if e.fp else ""
        if e.code in (401, 403):
            print(f"\n  Auth error ({e.code}) at {count}/{total}. Refreshing token...")
            try:
                refresh_token()
                result = inspect_url(url)
                results[url] = result
                completed_urls.add(url)
                count += 1
                continue
            except Exception as e2:
                errors_list.append({"url": url, "error": f"REFRESH_FAILED: {str(e2)}"})
                errors_count += 1
        elif e.code == 429:
            print(f"\n  Rate limited at {count}/{total}. Waiting 60s...")
            time.sleep(60)
            try:
                result = inspect_url(url)
                results[url] = result
                completed_urls.add(url)
                count += 1
            except Exception as e2:
                errors_list.append({"url": url, "error": f"POST_429: {str(e2)}"})
                errors_count += 1
        else:
            error_msg = f"HTTP {e.code}: {err_body}"
            errors_list.append({"url": url, "error": error_msg})
            errors_count += 1
    except Exception as e:
        errors_list.append({"url": url, "error": str(e)[:200]})
        errors_count += 1
    
    # Save progress every 25 URLs
    if count % 25 == 0:
        # Save intermediate results
        with open(RESULTS_PATH, "w") as f:
            json.dump(results, f, indent=2)
        with open(PROGRESS_PATH, "w") as f:
            json.dump({
                "completed_count": len(completed_urls),
                "total": total,
                "errors": errors_list,
                "completed_urls": list(completed_urls)
            }, f, indent=2)
        with open(ERRORS_PATH, "w") as f:
            json.dump(errors_list, f, indent=2)
        print(f"\n  💾 Saved at {count}/{total} ({len(completed_urls)} completed, {errors_count} errors)")
    
    # Rate limit
    time.sleep(0.8)

# Final save
with open(RESULTS_PATH, "w") as f:
    json.dump(results, f, indent=2)
with open(PROGRESS_PATH, "w") as f:
    json.dump({
        "completed_count": len(completed_urls),
        "total": total,
        "errors": errors_list,
        "completed_urls": list(completed_urls),
        "status": "COMPLETE"
    }, f, indent=2)
with open(ERRORS_PATH, "w") as f:
    json.dump(errors_list, f, indent=2)

print(f"\n\n✅ Task 2 COMPLETE: {len(completed_urls)}/{total} inspected, {errors_count} errors")
print(f"Results: {RESULTS_PATH}")
print(f"Progress: {PROGRESS_PATH}")
print(f"Errors: {ERRORS_PATH}")
