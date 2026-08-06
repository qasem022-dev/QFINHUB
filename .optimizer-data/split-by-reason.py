#!/usr/bin/env python3
"""Split full-url-inspection-results.json by GSC reason bucket."""
import json, os, sys
from collections import Counter, defaultdict

SRC = "/home/admin1/qfinhub/.optimizer-data/full-url-inspection-results.json"
OUT_DIR = "/home/admin1/qfinhub/.optimizer-data"

with open(SRC) as f:
    data = json.load(f)

# Normalize bucket names (user-confirmed exact strings)
BUCKETS = {
    "Discovered - currently not indexed": [],
    "Excluded by 'noindex' tag": [],
    "Crawled - currently not indexed": [],
    "Page with redirect": [],
    "Duplicate without user-selected canonical": [],
    "Duplicate, Google chose different canonical than user": [],
    "Alternate page with proper canonical tag": [],
    "Not found (404)": [],
    "Submitted and indexed": [],
    "URL is unknown to Google": [],
    "OTHER": [],
}

for url, info in data.items():
    cs = info.get("coverage_state", "OTHER") or "OTHER"
    if cs in BUCKETS:
        BUCKETS[cs].append(url)
    else:
        BUCKETS["OTHER"].append(url)

# Summary
print(f"Total URLs in inspection file: {len(data)}")
for k, v in BUCKETS.items():
    print(f"  {k}: {len(v)}")

# Write one file per bucket
written = []
for bucket, urls in BUCKETS.items():
    if not urls:
        continue
    safe = bucket.replace("'", "").replace(" ", "-").replace(",", "").replace("(", "").replace(")", "").lower()
    path = os.path.join(OUT_DIR, f"gsc-bucket-{safe}.json")
    with open(path, "w") as f:
        json.dump({"reason": bucket, "count": len(urls), "urls": urls}, f, indent=2)
    written.append((bucket, len(urls), path))

# Combined report
report = {
    "total_inspected": len(data),
    "buckets": [{"reason": b, "count": len(u)} for b, u in BUCKETS.items()],
    "files_written": [{"reason": b, "count": c, "path": p} for b, c, p in written],
}
with open(os.path.join(OUT_DIR, "gsc-buckets-summary.json"), "w") as f:
    json.dump(report, f, indent=2)
print("\nWrote:", os.path.join(OUT_DIR, "gsc-buckets-summary.json"))