#!/usr/bin/env python3
"""Build/update the rolling indexing baseline and the daily summary.

- .optimizer-data/indexing-audit-<DATE>-summary.json  (per-run bucket counts)
- .optimizer-data/indexing-baseline.json              (all history, never dropped)

Baseline per-URL record keeps firstSeen, lastInspected, current bucket and a
compressed bucket history so DEINDEXED / RECOVERED can be diffed on later runs.
"""

import argparse
import datetime
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / ".optimizer-data"
BASELINE = DATA / "indexing-baseline.json"
SITE = "https://www.qfinhub.com/"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    args = ap.parse_args()

    today = DATA / f"indexing-audit-{args.date}.json"
    results = json.loads(today.read_text())
    results = {u: r for u, r in results.items() if r.get("success")}
    now = datetime.datetime.now().isoformat(timespec="seconds")

    base = {"schema": 1, "site": SITE, "createdAt": now, "urls": {}}
    if BASELINE.exists():
        base = json.loads(BASELINE.read_text())
        base.setdefault("urls", {})

    movement = {"DEINDEXED": [], "RECOVERED": [], "NEW": []}
    for url, r in results.items():
        b = base["urls"].get(url)
        if b is None:
            base["urls"][url] = {
                "bucket": r["bucket"],
                "coverageState": r.get("coverageState", ""),
                "verdict": r.get("verdict", ""),
                "lastCrawlTime": r.get("lastCrawlTime", ""),
                "googleCanonical": r.get("googleCanonical", ""),
                "userCanonical": r.get("userCanonical", ""),
                "firstSeen": args.date,
                "lastInspected": args.date,
                "history": {args.date: r["bucket"]},
            }
            movement["NEW"].append(url)
            continue

        prev = b.get("bucket")
        if prev == "indexed" and r["bucket"] != "indexed":
            movement["DEINDEXED"].append((url, prev, r["bucket"]))
        elif prev != "indexed" and r["bucket"] == "indexed":
            movement["RECOVERED"].append((url, prev, r["bucket"]))
        b.update(
            bucket=r["bucket"],
            coverageState=r.get("coverageState", ""),
            verdict=r.get("verdict", ""),
            lastCrawlTime=r.get("lastCrawlTime", ""),
            googleCanonical=r.get("googleCanonical", ""),
            userCanonical=r.get("userCanonical", ""),
            lastInspected=args.date,
        )
        b.setdefault("history", {})[args.date] = r["bucket"]

    base["updatedAt"] = now
    base["urlCount"] = len(base["urls"])
    BASELINE.write_text(json.dumps(base, indent=2))

    buckets = Counter(r["bucket"] for r in results.values())
    summary = {
        "generatedAt": now,
        "date": args.date,
        "site": SITE,
        "inspectedToday": len(results),
        "totalTrackedInBaseline": base["urlCount"],
        "bucketCounts": dict(buckets.most_common()),
        "buckets": {u: r["bucket"] for u, r in results.items()},
        "movement": {k: v for k, v in movement.items()},
        "baselineIndexed": sum(1 for v in base["urls"].values() if v.get("bucket") == "indexed"),
    }
    (DATA / f"indexing-audit-{args.date}-summary.json").write_text(json.dumps(summary, indent=2))

    print(f"inspected today: {len(results)} | tracked: {base['urlCount']}")
    for k, v in buckets.most_common():
        print(f"  {k:24} {v}")
    print("movement:", {k: len(v) for k, v in movement.items()})


if __name__ == "__main__":
    main()
