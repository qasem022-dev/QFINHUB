#!/usr/bin/env python3
"""Inspect dynamic URLs (scenario, tools, widgets, locale variants) and bucket by reason."""
import os, json, time, requests
from google.oauth2 import service_account
from google.auth.transport.requests import Request

SITE = "https://www.qfinhub.com/"
KEY = "/home/admin1/.hermes/gsc-service-account-key.json"
OUT_DIR = "/home/admin1/qfinhub/.optimizer-data"
MASTER = f"{OUT_DIR}/full-url-inspection-results.json"
COMBINED = f"{OUT_DIR}/full-inspection-v5.json"
CANDIDATES_FILE = "/tmp/dynamic-urls.txt"
EXTRA_FILE = "/tmp/extra-candidates.txt"
RESULT = f"{OUT_DIR}/full-inspection-v6.json"
BUCKET = f"{OUT_DIR}/gsc-buckets-v6.json"

# Load existing
combined = {}
if os.path.exists(COMBINED):
    with open(COMBINED) as f:
        combined = json.load(f)
    print(f"Loaded {len(combined)} from v5")

# Auth
creds = service_account.Credentials.from_service_account_file(
    KEY, scopes=['https://www.googleapis.com/auth/webmasters.readonly'])
creds.refresh(Request())

INSPECT = "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect"
sess = requests.Session()
sess.headers.update({"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"})

def inspect(url):
    body = {"inspectionUrl": url, "siteUrl": SITE}
    for attempt in range(3):
        try:
            r = sess.post(INSPECT, json=body, timeout=20)
            if r.status_code == 429 or r.status_code >= 500:
                time.sleep(2 + attempt * 2)
                continue
            if r.status_code != 200:
                return None, f"HTTP {r.status_code}"
            data = r.json()
            return data.get("inspectionResult", {}).get("indexStatusResult", {}), None
        except Exception as e:
            time.sleep(2)
    return None, "max retries"

# Load candidates
cands = set()
for fname in [CANDIDATES_FILE, EXTRA_FILE]:
    if os.path.exists(fname):
        with open(fname) as f:
            for u in f:
                u = u.strip()
                if u: cands.add(u)
# Add the v5 OTHER bucket (guides)
other_file = f"{OUT_DIR}/gsc-bucket-v5-other.json"
if os.path.exists(other_file):
    with open(other_file) as f:
        for u in json.load(f).get("urls", []):
            cands.add(u)

cands = cands - set(combined.keys())
print(f"Candidates to inspect: {len(cands)}")

added = 0
failed = []
t0 = time.time()
for i, url in enumerate(sorted(cands)):
    if i > 0 and i % 100 == 0:
        creds.refresh(Request())
        sess.headers.update({"Authorization": f"Bearer {creds.token}"})
    status, err = inspect(url)
    if err or status is None:
        failed.append({"url": url, "error": err})
        continue
    cs = status.get("coverageState", "OTHER")
    combined[url] = {
        "coverage_state": cs,
        "verdict": status.get("verdict", ""),
        "last_crawl": status.get("lastCrawlTime", ""),
        "indexing_state": status.get("indexingState", ""),
        "robots_txt_state": status.get("robotsTxtState", ""),
        "page_fetch_state": status.get("pageFetchState", ""),
        "google_canonical": status.get("googleCanonical", ""),
        "user_canonical": status.get("userCanonical", ""),
        "crawled_as": status.get("crawledAs", ""),
    }
    added += 1
    if i % 20 == 0:
        print(f"  [{i+1}/{len(cands)}] +{added} added, {len(failed)} failed, {time.time()-t0:.0f}s", flush=True)

print(f"\nAdded: {added}, Failed: {len(failed)}, Total: {len(combined)}")

with open(RESULT, "w") as f:
    json.dump(combined, f, indent=2)

# Bucket
from collections import Counter
USER_REASONS = [
    "Discovered - currently not indexed",
    "Excluded by 'noindex' tag",
    "Crawled - currently not indexed",
    "Page with redirect",
    "Alternate page with proper canonical tag",
    "Not found (404)",
    "Submitted and indexed",
]
buckets = Counter()
per_bucket_urls = {r: [] for r in USER_REASONS + ["URL is unknown to Google", "OTHER"]}
for u, info in combined.items():
    cs = info.get("coverage_state", "OTHER")
    buckets[cs] += 1
    if cs in per_bucket_urls:
        per_bucket_urls[cs].append(u)
    else:
        per_bucket_urls["OTHER"].append(u)

print("\n=== BUCKET COUNTS (v6) ===")
total = 0
for r in USER_REASONS:
    n = buckets.get(r, 0); total += n
    print(f"  {r}: {n}")
print(f"  URL is unknown to Google: {buckets.get('URL is unknown to Google', 0)}")
print(f"  OTHER: {sum(v for k,v in buckets.items() if k not in USER_REASONS + ['URL is unknown to Google'])}")
print(f"  TOTAL inspected: {total + buckets.get('URL is unknown to Google', 0)}")

with open(BUCKET, "w") as f:
    json.dump({"buckets": {r: len(per_bucket_urls.get(r,[])) for r in USER_REASONS + ['URL is unknown to Google','OTHER']},
               "total": len(combined)}, f, indent=2)

# Write per-bucket files
for reason, urls in per_bucket_urls.items():
    safe = reason.replace("'","").replace(" ","-").replace(",","").replace("(","").replace(")","").lower()
    with open(f"{OUT_DIR}/gsc-bucket-v6-{safe}.json", "w") as f:
        json.dump({"reason": reason, "count": len(urls), "urls": urls}, f, indent=2)

with open(f"{OUT_DIR}/inspect-failed-v6.json", "w") as f:
    json.dump(failed, f, indent=2)
print(f"\nDone. Results: {RESULT}")