#!/usr/bin/env python3
"""Inspect all qfinhub URLs via GSC URL Inspection API and bucket by coverage_state.

Uses service account (no browser, no login). Fills the gap between the existing
664-URL inspection file and the 1167 GSC total.

Output: .optimizer-data/full-inspection-v5.json (one entry per URL) and
        .optimizer-data/gsc-buckets-v5.json (counts per reason).
"""
import os, json, sys, time, requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SITE = "https://www.qfinhub.com/"
KEY = "/home/admin1/.hermes/gsc-service-account-key.json"
OUT_DIR = "/home/admin1/qfinhub/.optimizer-data"
SITEMAP_URLS = "/tmp/sitemap-urls.txt"
MASTER_FILE = f"{OUT_DIR}/full-url-inspection-results.json"  # existing 664 URLs
EXTRA_URLS_FILE = f"{OUT_DIR}/candidate-urls-to-inspect.txt"
RESULT_FILE = f"{OUT_DIR}/full-inspection-v5.json"
BUCKET_FILE = f"{OUT_DIR}/gsc-buckets-v5.json"

# Build candidate list
existing = {}
if os.path.exists(MASTER_FILE):
    with open(MASTER_FILE) as f:
        existing = json.load(f)
    print(f"Loaded {len(existing)} existing inspection results")

# Read sitemap
sitemap_urls = []
if os.path.exists(SITEMAP_URLS):
    with open(SITEMAP_URLS) as f:
        sitemap_urls = [u.strip() for u in f if u.strip()]
print(f"Sitemap URLs: {len(sitemap_urls)}")

# Add 82 missing URLs from earlier diagnosis (48 blog + 30 guides + 2 tools + 1 home + 1 ai-specialist)
# These are legitimate pages that should be indexed but aren't in sitemap
EXTRA_PATHS = []
# We'll fetch a fresh list of candidate paths below

candidates = []
for u in sitemap_urls:
    if u not in existing:
        candidates.append(u)
# Add the OTHER bucket URLs from earlier split (those "URL is unknown to Google" + the 20 guides)
other_urls_file = f"{OUT_DIR}/gsc-bucket-other.json"
if os.path.exists(other_urls_file):
    with open(other_urls_file) as f:
        d = json.load(f)
    for u in d.get("urls", []):
        if u not in existing and u not in candidates:
            candidates.append(u)

unknown_urls_file = f"{OUT_DIR}/gsc-bucket-url-is-unknown-to-google.json"
if os.path.exists(unknown_urls_file):
    with open(unknown_urls_file) as f:
        d = json.load(f)
    for u in d.get("urls", []):
        if u not in existing and u not in candidates:
            candidates.append(u)

print(f"Candidates to inspect (not in existing): {len(candidates)}")

# Combine: start from existing + new inspections
results = dict(existing)

# Auth
creds = service_account.Credentials.from_service_account_file(
    KEY, scopes=['https://www.googleapis.com/auth/webmasters.readonly']
)
creds.refresh(Request())

INSPECT_URL = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
session = requests.Session()
session.headers.update({"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"})

# Refresh token every 50 inspections to be safe
REFRESH_EVERY = 100
inspected = 0
new_added = 0
failed = []

def refresh_token():
    creds.refresh(Request())
    session.headers.update({"Authorization": f"Bearer {creds.token}"})

def inspect(url):
    body = {"inspectionUrl": url, "siteUrl": SITE}
    for attempt in range(3):
        try:
            r = session.post(INSPECT_URL, json=body, timeout=20)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(2 + attempt * 2)
                continue
            if r.status_code != 200:
                return None, f"HTTP {r.status_code}: {r.text[:200]}"
            data = r.json()
            status = data.get("inspectionResult", {}).get("indexStatusResult", {})
            return status, None
        except Exception as e:
            time.sleep(2)
            continue
    return None, "max retries"

t0 = time.time()
for i, url in enumerate(candidates):
    if inspected > 0 and inspected % REFRESH_EVERY == 0:
        refresh_token()
    status, err = inspect(url)
    inspected += 1
    if err or status is None:
        failed.append({"url": url, "error": err or "no status"})
        continue
    cs = status.get("coverageState", "OTHER")
    verdict = status.get("verdict", "")
    last_crawl = status.get("lastCrawlTime", "")
    results[url] = {
        "coverage_state": cs,
        "verdict": verdict,
        "last_crawl": last_crawl,
        "indexing_state": status.get("indexingState", ""),
        "robots_txt_state": status.get("robotsTxtState", ""),
        "page_fetch_state": status.get("pageFetchState", ""),
        "google_canonical": status.get("googleCanonical", ""),
        "user_canonical": status.get("userCanonical", ""),
        "crawled_as": status.get("crawledAs", ""),
    }
    new_added += 1
    if inspected % 20 == 0:
        print(f"  [{inspected}/{len(candidates)}] +{new_added} added, {len(failed)} failed, {time.time()-t0:.0f}s", flush=True)

# Save combined
with open(RESULT_FILE, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nTotal URLs in combined inspection: {len(results)}")
print(f"New added: {new_added}, Failed: {len(failed)}")

# Bucket
from collections import Counter
buckets = Counter()
for url, info in results.items():
    cs = info.get("coverage_state", "OTHER")
    buckets[cs] += 1

# Normalize bucket names to user's exact 6 reasons
USER_REASONS = [
    "Discovered - currently not indexed",
    "Excluded by 'noindex' tag",
    "Crawled - currently not indexed",
    "Page with redirect",
    "Alternate page with proper canonical tag",
    "Not found (404)",
    "Submitted and indexed",
]
print("\n=== BUCKET COUNTS ===")
total = 0
for r in USER_REASONS:
    n = buckets.get(r, 0)
    total += n
    print(f"  {r}: {n}")
print(f"  URL is unknown to Google: {buckets.get('URL is unknown to Google', 0)}")
print(f"  OTHER (crawled-not-indexed variants etc): {sum(v for k,v in buckets.items() if k not in USER_REASONS)}")
print(f"  TOTAL: {total}")

# Build per-bucket URL lists
out_buckets = {}
for r in USER_REASONS + ["URL is unknown to Google", "OTHER"]:
    out_buckets[r] = []
for url, info in results.items():
    cs = info.get("coverage_state", "OTHER")
    if cs in out_buckets:
        out_buckets[cs].append(url)
    else:
        out_buckets.setdefault("OTHER", []).append(url)

# Write per-bucket files
for reason, urls in out_buckets.items():
    safe = reason.replace("'", "").replace(" ", "-").replace(",", "").replace("(", "").replace(")", "").lower()
    path = f"{OUT_DIR}/gsc-bucket-v5-{safe}.json"
    with open(path, "w") as f:
        json.dump({"reason": reason, "count": len(urls), "urls": urls}, f, indent=2)

with open(BUCKET_FILE, "w") as f:
    json.dump({r: len(out_buckets.get(r, [])) for r in USER_REASONS + ["URL is unknown to Google", "OTHER"]}, f, indent=2)

# Write failed list
with open(f"{OUT_DIR}/inspect-failed-v5.json", "w") as f:
    json.dump(failed, f, indent=2)

print(f"\nWrote {BUCKET_FILE}, per-bucket files, {RESULT_FILE}")