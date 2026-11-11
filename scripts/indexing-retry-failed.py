#!/usr/bin/env python3
"""Retry only the URLs that failed (timeout/HTTP error) in today's audit file.

Failed inspections were never actually submitted to the API, so retrying them
does not violate the 7-day re-inspection cache.

Usage: python3 scripts/indexing-retry-failed.py [--date YYYY-MM-DD]
"""

import argparse
import datetime
import importlib.util
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / ".optimizer-data"
SITE = "https://www.qfinhub.com/"


def load_mod():
    spec = importlib.util.spec_from_file_location("audit", ROOT / "scripts" / "indexing-audit.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=datetime.date.today().isoformat())
    ap.add_argument("--max", type=int, default=40)
    args = ap.parse_args()

    audit = load_mod()
    auth = audit.load_auth()
    path = DATA / f"indexing-audit-{args.date}.json"
    results = json.loads(path.read_text())
    failed = [u for u, r in results.items() if not r.get("success")][: args.max]
    print(f"{len(failed)} failed URLs to retry", flush=True)

    fixed = 0
    for i, url in enumerate(failed, 1):
        token = auth.get_access_token()
        payload = json.dumps({"inspectionUrl": url, "siteUrl": SITE, "languageCode": "en-US"}).encode()
        req = urllib.request.Request(
            "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
            data=payload,
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
        try:
            with urllib.request.urlopen(req, timeout=75) as r:
                d = json.loads(r.read())
            ir = d.get("inspectionResult", {}).get("indexStatusResult", {})
            cs = ir.get("coverageState", "")
            results[url] = {
                "verdict": ir.get("verdict", ""),
                "coverageState": cs,
                "bucket": audit.bucket(cs),
                "indexingState": ir.get("indexingState", ""),
                "robotsTxtState": ir.get("robotsTxtState", ""),
                "pageFetchState": ir.get("pageFetchState", ""),
                "lastCrawlTime": ir.get("lastCrawlTime", ""),
                "googleCanonical": ir.get("googleCanonical", ""),
                "userCanonical": ir.get("userCanonical", ""),
                "inspectedAt": datetime.datetime.now().isoformat(timespec="seconds"),
                "success": True,
            }
            fixed += 1
            print(f"  [{i}/{len(failed)}] {results[url]['bucket']:24} {url}", flush=True)
        except urllib.error.HTTPError as e:
            print(f"  [{i}/{len(failed)}] HTTP {e.code} {url}", flush=True)
        except Exception as e:
            print(f"  [{i}/{len(failed)}] {type(e).__name__} {url}", flush=True)
        path.write_text(json.dumps(results, indent=2))
        time.sleep(1.0)

    print(f"recovered {fixed}/{len(failed)} failed inspections", flush=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
