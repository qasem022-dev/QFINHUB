#!/usr/bin/env python3
"""
QFINHUB live indexing audit.

Inspects every URL in the live sitemap via the GSC URL Inspection API and
buckets results by coverageState. Writes incrementally so progress survives
interruption.

Outputs:
  .optimizer-data/indexing-audit-<DATE>.json   full per-URL results
  .optimizer-data/indexing-audit-<DATE>-summary.json   bucket counts
  /tmp/qfinhub-inspect-progress.txt            live progress

Auth: reuses scripts/gsc-service-account-auth.py (service account, else OAuth).

Usage:
    python3 scripts/indexing-audit.py            # full run
    python3 scripts/indexing-audit.py --resume   # skip URLs already done today
"""

import argparse
import datetime
import importlib.util
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import urllib.error
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / ".optimizer-data"
SITE = "https://www.qfinhub.com/"
PROGRESS = Path("/tmp/qfinhub-inspect-progress.txt")
TODAY = datetime.date.today().isoformat()
OUT = DATA / f"indexing-audit-{TODAY}.json"
SUMMARY = DATA / f"indexing-audit-{TODAY}-summary.json"

SLEEP = 1.0


def load_auth():
    spec = importlib.util.spec_from_file_location(
        "gscauth", ROOT / "scripts" / "gsc-service-account-auth.py"
    )
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def fetch_sitemap_urls():
    req = urllib.request.Request(
        "https://www.qfinhub.com/sitemap.xml",
        headers={"User-Agent": "Mozilla/5.0 (compatible; qfinhub-audit/1.0)"},
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        xml = r.read().decode("utf-8", errors="replace")
    urls = re.findall(r"<loc>\s*(.*?)\s*</loc>", xml)
    return [u for u in dict.fromkeys(urls) if u.startswith("http")]


def normalise(cs: str) -> str:
    """Normalize curly quotes so substring matching is reliable."""
    return (cs or "").replace("\u2018", "'").replace("\u2019", "'")


def bucket(cs: str) -> str:
    c = normalise(cs).lower()
    if "submitted and indexed" in c:
        return "indexed"
    if "crawled - currently not indexed" in c:
        return "crawled_not_indexed"
    if "discovered - currently not indexed" in c:
        return "discovered_not_indexed"
    if "unknown to google" in c:
        return "unknown_to_google"
    if "noindex" in c:
        return "noindex"
    if "duplicate" in c and "canonical" in c:
        return "duplicate_canonical"
    if "alternate page with proper canonical" in c:
        return "alternate_canonical"
    if "not found" in c or "404" in c:
        return "not_found"
    if "redirect" in c:
        return "redirect"
    if "soft 404" in c:
        return "soft_404"
    return "other"


def write_progress(done, total, indexed, current=""):
    try:
        PROGRESS.write_text(
            f"{done}/{total} inspected | indexed={indexed} | {current[:80]}\n"
        )
    except OSError:
        pass


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--resume", action="store_true")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument(
        "--workers",
        type=int,
        default=3,
        help="Concurrent inspections (default 3; keeps within API quota)",
    )
    args = ap.parse_args()

    # Single-instance lock. Two concurrent runs race on the output JSON and
    # triple the URL Inspection API call rate, which triggers 429s (observed:
    # 11 errors out of 80 URLs when the daily cron overlapped a manual run).
    lock_path = Path("/tmp/qfinhub-indexing-audit.lock")
    lock_file = open(lock_path, "w")
    try:
        import fcntl

        fcntl.flock(lock_file.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
    except (ImportError, OSError):
        print("Another indexing-audit run is already in progress. Exiting.", flush=True)
        lock_file.close()
        return 0

    auth = load_auth()

    print("Fetching sitemap...", flush=True)
    urls = fetch_sitemap_urls()
    print(f"Sitemap: {len(urls)} URLs", flush=True)

    results = {}
    if args.resume and OUT.exists():
        results = json.loads(OUT.read_text())
        print(f"Resuming with {len(results)} existing results", flush=True)

    # --limit must apply AFTER filtering out already-inspected URLs; slicing the
    # sitemap first makes a resumed run re-slice the same head and inspect nothing.
    todo = [
        u
        for u in urls
        if u not in results or results.get(u, {}).get("bucket") == "error"
    ]
    if args.limit:
        todo = todo[: args.limit]
    print(f"To inspect: {len(todo)}", flush=True)

    indexed = sum(1 for r in results.values() if r.get("bucket") == "indexed")
    t0 = time.time()

    # Concurrent inspection. Sequential runs are ~7.5s/URL, so a 400-URL backlog
    # takes ~50 minutes and gets killed by session cleanup partway through. Three
    # workers stays well inside the URL Inspection API quota while cutting wall
    # time by roughly 2.5x, and --resume makes any interruption survivable.
    import threading
    from concurrent.futures import ThreadPoolExecutor, as_completed

    state_lock = threading.Lock()
    counter = {"done": 0, "indexed": indexed}

    def inspect_one(target_url: str) -> tuple[str, dict]:
        token = auth.get_access_token()
        payload = json.dumps(
            {"inspectionUrl": target_url, "siteUrl": SITE, "languageCode": "en-US"}
        ).encode()
        req = urllib.request.Request(
            "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
            data=payload,
            headers={
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=75) as r:
                d = json.loads(r.read())
            ir = d.get("inspectionResult", {}).get("indexStatusResult", {})
            cs = ir.get("coverageState", "")
            return target_url, {
                "verdict": ir.get("verdict", ""),
                "coverageState": cs,
                "bucket": bucket(cs),
                "indexingState": ir.get("indexingState", ""),
                "robotsTxtState": ir.get("robotsTxtState", ""),
                "pageFetchState": ir.get("pageFetchState", ""),
                "lastCrawlTime": ir.get("lastCrawlTime", ""),
                "googleCanonical": ir.get("googleCanonical", ""),
                "userCanonical": ir.get("userCanonical", ""),
                "inspectedAt": datetime.datetime.now().isoformat(timespec="seconds"),
                "success": True,
            }
        except urllib.error.HTTPError as e:
            return target_url, {
                "success": False,
                "error": f"HTTP {e.code}: {e.read().decode(errors='replace')[:150]}",
                "bucket": "error",
            }
        except Exception as e:
            return target_url, {
                "success": False,
                "error": f"{type(e).__name__}: {e}",
                "bucket": "error",
            }

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = {pool.submit(inspect_one, u): u for u in todo}
        for fut in as_completed(futures):
            url, rec = fut.result()
            with state_lock:
                results[url] = rec
                counter["done"] += 1
                if rec.get("bucket") == "indexed":
                    counter["indexed"] += 1

                write_progress(len(results), len(urls), counter["indexed"], url)

                if counter["done"] % 25 == 0 or counter["done"] == len(todo):
                    SUMMARY.parent.mkdir(parents=True, exist_ok=True)
                    OUT.write_text(json.dumps(results, indent=2))
                    elapsed = time.time() - t0
                    rate = elapsed / counter["done"] if counter["done"] else 0
                    remaining = (len(todo) - counter["done"]) * rate
                    print(
                        f"  {len(results)}/{len(urls)} | indexed={counter['indexed']} | "
                        f"{rate:.1f}s/url | ~{remaining/60:.0f}min left",
                        flush=True,
                    )

    OUT.write_text(json.dumps(results, indent=2))

    buckets = {}
    for u, r in results.items():
        buckets.setdefault(r.get("bucket", "other"), []).append(u)

    summary = {
        "generatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
        "site": SITE,
        "totalUrls": len(results),
        "bucketCounts": {k: len(v) for k, v in sorted(buckets.items(), key=lambda x: -len(x[1]))},
        "buckets": {k: v for k, v in buckets.items()},
        "elapsedMinutes": round((time.time() - t0) / 60, 1),
    }
    SUMMARY.write_text(json.dumps(summary, indent=2))

    print("\n=== SUMMARY ===", flush=True)
    for k, v in summary["bucketCounts"].items():
        print(f"  {k:26} {v}", flush=True)
    print(f"\nSaved: {OUT}", flush=True)
    print(f"Saved: {SUMMARY}", flush=True)

    errors = summary["bucketCounts"].get("error", 0)
    if errors > len(results) * 0.1:
        print(f"WARNING: {errors} errors — check auth/rate limits", flush=True)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
