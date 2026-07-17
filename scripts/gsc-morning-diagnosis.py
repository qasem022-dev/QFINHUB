#!/usr/bin/env python3
"""
QFINHUB GSC Morning Diagnosis — URL Inspection API runner.

🔴 Scaled Jul 16, 2026 (Lever #1 of indexing acceleration plan):
   Inspects 1900 URLs/day via Service Account JWT — was 25/day.
   At 0.4s spacing, full run ≈ 12.7 min wall clock.

Source-of-truth queue: .optimizer-data/indexing-fix-queue.json
Master file (DICT keyed by URL — pitfall #22): .optimizer-data/full-url-inspection-results.json

Run via cron (Step 2 of fe9e674e8bb3 prompt), or manually:
    cd /home/admin1/qfinhub && python3 scripts/gsc-morning-diagnosis.py

Pass --date YYYY-MM-DD to inspect a specific day's queue (default: today).
Pass --sample-size N to override the 1900 default (e.g. 25 for safe budget testing).
"""

import json, sys, time, urllib.request, urllib.error, importlib.util, argparse
from collections import Counter
import concurrent.futures as cf

# === CONFIG (default; can be overridden via CLI) ===
DATE = time.strftime('%Y-%m-%d')
SAMPLE_SIZE = 1900    # Lever #1 — was 25; fits inside cron 600s budget at 0.4s spacing
PROJECT_DIR = "/home/admin1/qfinhub"
WORKERS = 8           # ThreadPoolExecutor concurrency. Jul 17: 16 workers caused 350 HTTP 429 errors at the tail (18.4% of 1900 sample). 8 = ~2.4 URLs/sec, fits inside Google's per-minute quota with margin.


def get_parser():
    p = argparse.ArgumentParser()
    p.add_argument('--date', default=DATE, help='Date label for results file (YYYY-MM-DD)')
    p.add_argument('--sample-size', type=int, default=SAMPLE_SIZE,
                   help='Max URLs to inspect (default: 1900). Lower for dry-runs.')
    p.add_argument('--workers', type=int, default=WORKERS,
                   help='ThreadPoolExecutor concurrency (default: 8). 0=single-threaded.')
    p.add_argument('--dry-run', action='store_true',
                   help='Show what would be inspected without calling the API')
    return p


# === Load SA auth (project-relative path; NOT ~/.hermes/...) ===
spec = importlib.util.spec_from_file_location(
    'gsc_sa', f'{PROJECT_DIR}/scripts/gsc-service-account-auth.py')
if spec is None or spec.loader is None:
    raise RuntimeError("Failed to load gsc-service-account-auth.py — check PROJECT_DIR")
sa = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sa)
token = sa.get_access_token()
print(f"Token obtained: {token[:30]}...")


def main():
    args = get_parser().parse_args()
    date = args.date
    sample_size = args.sample_size

    # === Load queue and prior inspection results ===
    queue = json.load(open(f'{PROJECT_DIR}/.optimizer-data/indexing-fix-queue.json'))
    unknown = queue.get('unknown_pages', [])
    uninspected = queue.get('uninspected_pages', [])
    discovered = queue.get('discovered_pages', [])

    # OPTIONAL: include URLs that hit HTTP 429 on a previous day and didn't recover.
    # These files live at .optimizer-data/queue-retry-429-*.json. Concatenate them
    # into the sample so quota-reset retries are folded into the daily run.
    retry_urls = []
    import glob
    for f in glob.glob(f'{PROJECT_DIR}/.optimizer-data/queue-retry-429-*.json'):
        try:
            rq = json.load(open(f))
            retry_urls.extend(rq.get('urls_to_retry', []))
        except Exception:
            pass
    if retry_urls:
        print(f"Including {len(retry_urls)} retry URLs from previous-day 429 backlog")
    sample_pool = retry_urls + uninspected + unknown + discovered

    # Stratified sample.
    # - retry_urls (HTTP 429 backlog) get priority — they're real diagnostic gaps
    # - remaining budget split across uninspected/unknown/discovered proportionally
    per_bucket = 0
    if retry_urls:
        # Dedup + preserve all retry URLs (max 1000 — Google's per-day ceiling)
        sample = list(dict.fromkeys(retry_urls))[:1000]
        remaining = sample_size - len(sample)
        if remaining > 0:
            remainder = remaining % 3
            per_bucket = remaining // 3
            for bucket_name, bucket in (
                ('uninspected', uninspected),
                ('unknown', unknown),
                ('discovered', discovered),
            ):
                if not bucket:
                    continue
                alloc = per_bucket + (
                    1 if (bucket_name == 'uninspected' and remainder > 0) or
                          (bucket_name == 'unknown' and remainder > 1) else 0
                )
                full_cycles, leftover = divmod(alloc, len(bucket))
                cycle_pool = bucket * full_cycles + bucket[:leftover]
                sample.extend(cycle_pool)
    else:
        remainder = sample_size % 3
        per_bucket = sample_size // 3
        sample = []
        for bucket_name, bucket in (
            ('uninspected', uninspected),
            ('unknown', unknown),
            ('discovered', discovered),
        ):
            alloc = per_bucket + (
                1 if (bucket_name == 'uninspected' and remainder > 0) or
                      (bucket_name == 'unknown' and remainder > 1) else 0
            )
            if not bucket:
                continue
            full_cycles, leftover = divmod(alloc, len(bucket))
            cycle_pool = bucket * full_cycles + bucket[:leftover]
            sample.extend(cycle_pool)
    print(f"Sample size: {len(sample)} (target={sample_size}, per_bucket={per_bucket}, "
          f"uninspected={len(uninspected)} unknown={len(unknown)} discovered={len(discovered)} retry={len(retry_urls)})")
    if len(sample) < sample_size:
        print(f"  ⚠️  Sample short by {sample_size - len(sample)} — pool exhausted (this is OK, "
              "inspected what we could)")

    if args.dry_run:
        print("\n=== DRY-RUN — would inspect ===")
        for u in sample[:25]:
            print(f"  {u}")
        if len(sample) > 25:
            print(f"  ... and {len(sample) - 25} more")
        return

    try:
        prior = json.load(open(f'{PROJECT_DIR}/.optimizer-data/full-url-inspection-results.json'))
    except FileNotFoundError:
        prior = {}

    site_url = "https://www.qfinhub.com/"   # trailing slash REQUIRED (pitfall #25)

    def inspect_one(url, max_retries=2):
        """Inspect one URL with exponential backoff on 429; return result or error dict."""
        body = json.dumps({"inspectionUrl": url, "siteUrl": site_url}).encode()
        backoff = 1.5  # seconds, doubled on each retry
        for attempt in range(max_retries + 1):
            req = urllib.request.Request(
                "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
                data=body,
                headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    data = json.loads(resp.read())
                result = data.get("inspectionResult", {}).get("indexStatusResult", {})
                cov_state = result.get("coverageState", "") or ""
                verdict = result.get("verdict", "") or ""
                last_crawl = result.get("lastCrawlTime", "")
                return {
                    "url": url, "coverage_state": cov_state, "verdict": verdict,
                    "last_crawl": last_crawl, "category": _classify(cov_state), "prior_state": "",
                    "retries": attempt
                }
            except urllib.error.HTTPError as e:
                # Only 429 (rate-limited) and 5xx (transient server) get retried.
                if e.code == 429 or 500 <= e.code < 600:
                    if attempt < max_retries:
                        time.sleep(backoff)
                        backoff *= 2
                        continue
                return {"url": url, "error": f"HTTP {e.code}", "category": "ERROR", "retries": attempt}
            except Exception as e:
                return {"url": url, "error": str(e), "category": "ERROR", "retries": attempt}

    def _classify(cov_state):
        s = cov_state.lower()
        if s.startswith("submitted and indexed"): return "INDEXED"
        if s.startswith("discovered"): return "DISCOVERED"
        if s.startswith("url is unknown"): return "UNKNOWN"
        if s.startswith("crawled"): return "CRAWLED_REJECTED"
        if s.startswith("alternate page"): return "ALTERNATE_CANONICAL"
        if s.startswith("not found"): return "404"
        if s.startswith("excluded by noindex"): return "NOINDEX"
        return "OTHER"

    # === Inspect each URL ===
    results = []
    newly_indexed = []
    unknown_to_discovered = []
    regressions = []

    start_time = time.time()
    workers = max(args.workers, 1)
    if workers == 1:
        # Sequential (original behavior, kept for debugging)
        for i, url in enumerate(sample):
            r = inspect_one(url)
            results.append(r)
            if (i + 1) % 50 == 0 or (i + 1) == len(sample):
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed if elapsed > 0 else 0
                eta_min = (len(sample) - i - 1) / rate / 60 if rate > 0 else 0
                print(f"  [{i+1}/{len(sample)}] {r.get('category','?'):18s} | "
                      f"rate {rate:.1f}/s | ETA {eta_min:.1f}m")
    else:
        # Threaded — 8 workers (Jul 17 fix). Jul 16 at 16 workers caused 350 HTTP 429
        # errors at the tail (18.4% of 1900 sample). 8 = ~2.4 URLs/sec, zero 429s in test.
        completed = 0
        with cf.ThreadPoolExecutor(max_workers=workers) as ex:
            futures = {ex.submit(inspect_one, url): url for url in sample}
            for fut in cf.as_completed(futures):
                r = fut.result()
                results.append(r)
                completed += 1
                if completed % 50 == 0 or completed == len(sample):
                    elapsed = time.time() - start_time
                    rate = completed / elapsed if elapsed > 0 else 0
                    eta_min = (len(sample) - completed) / rate / 60 if rate > 0 else 0
                    print(f"  [{completed}/{len(sample)}] "
                          f"rate {rate:.1f}/s | ETA {eta_min:.1f}m | "
                          f"last: {r.get('category','?')}")

    # === Summary ===
    cats = Counter(r.get("category", "?") for r in results)

    # Transition detection (against prior master file) — done in main thread after collection
    for r in results:
        url = r.get("url")
        if not url or "error" in r:
            continue
        prior_state = ""
        if url in prior:
            prior_state = (prior[url].get("coverage_state") or "").lower()
        r["prior_state"] = prior_state
        cat = r.get("category")
        if cat == "INDEXED" and not prior_state.startswith("submitted and indexed"):
            newly_indexed.append(url)
        elif cat == "DISCOVERED" and prior_state.startswith("url is unknown"):
            unknown_to_discovered.append(url)
        elif cat in ("DISCOVERED", "CRAWLED_REJECTED") and prior_state.startswith("submitted and indexed"):
            regressions.append(url)
    elapsed_total = time.time() - start_time
    print("\n=== Morning Diagnosis Summary ===")
    print(f"Date: {date}")
    print(f"Inspected: {len(results)} in {elapsed_total:.0f}s ({len(results)/elapsed_total:.1f}/s)")
    for cat, n in cats.most_common():
        print(f"  {cat}: {n}")
    print(f"Newly indexed: {len(newly_indexed)}")
    print(f"Unknown → Discovered: {len(unknown_to_discovered)}")
    print(f"Regressions: {len(regressions)}")

    # === Persist today's results ===
    out_path = f'{PROJECT_DIR}/.optimizer-data/morning-inspect-results-{date}.json'
    with open(out_path, 'w') as f:
        json.dump({
            "generated": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
            "date": date,
            "sample_size": len(results),
            "wall_clock_seconds": round(elapsed_total),
            "results": results,
            "newly_indexed": newly_indexed,
            "unknown_to_discovered": unknown_to_discovered,
            "regressions": regressions,
            "category_counts": dict(cats)
        }, f, indent=2)
    print(f"Saved: {out_path}")

    # === Merge into master dict-keyed-by-URL file (pitfall #22) ===
    master_path = f'{PROJECT_DIR}/.optimizer-data/full-url-inspection-results.json'
    master = json.load(open(master_path))
    updated = 0
    for r in results:
        url = r.get('url')
        if not url or 'error' in r:
            continue
        master[url] = {
            'coverage_state': r.get('coverage_state', ''),
            'verdict': r.get('verdict', ''),
            'last_crawl': r.get('last_crawl', ''),
            'category': r.get('category', ''),
            'last_updated': date
        }
        updated += 1
    json.dump(master, open(master_path, 'w'), indent=2)
    print(f"Updated {updated} entries in {master_path}")

    # === Rebuild fix queue from current state ===
    queue_out = {
        'generated': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        'total': queue.get('total', 0),
        'indexed_pages': [],
        'discovered_pages': [],
        'unknown_pages': [],
        'uninspected_pages': [],
        'indexed_pass_count': 0,
        'discovered_not_indexed_count': 0,
        'unknown_to_google_count': 0,
        'uninspected_count': 0,
        'inspected_count': 0,
        'freshness': 'FRESH'
    }

    import re
    # Read the live sitemap (not the build artifact — .next/server/app/sitemap.xml.body
    # can be days stale). Fall back to the build artifact if live is unavailable.
    try:
        with urllib.request.urlopen("https://www.qfinhub.com/sitemap.xml", timeout=15) as sresp:
            sitemap_body = sresp.read().decode('utf-8', errors='ignore')
    except Exception:
        sitemap_body = open(f'{PROJECT_DIR}/.next/server/app/sitemap.xml.body').read()
    sitemap = set(re.findall(r'<loc>([^<]+)</loc>', sitemap_body))

    for url in sitemap:
        r = master.get(url, {})
        state = (r.get('coverage_state') or '').lower()
        if not r or not state:
            queue_out['uninspected_pages'].append(url)
        elif state.startswith('submitted and indexed'):
            queue_out['indexed_pages'].append(url)
        elif state.startswith('discovered'):
            queue_out['discovered_pages'].append(url)
        elif state.startswith('url is unknown'):
            queue_out['unknown_pages'].append(url)
        elif state.startswith('crawled'):
            queue_out['discovered_pages'].append(url)
        else:
            queue_out['uninspected_pages'].append(url)

    queue_out['indexed_pass_count'] = len(queue_out['indexed_pages'])
    queue_out['discovered_not_indexed_count'] = len(queue_out['discovered_pages'])
    queue_out['unknown_to_google_count'] = len(queue_out['unknown_pages'])
    queue_out['uninspected_count'] = len(queue_out['uninspected_pages'])
    queue_out['inspected_count'] = queue_out['total'] - queue_out['uninspected_count']

    json.dump(queue_out, open(f'{PROJECT_DIR}/.optimizer-data/indexing-fix-queue.json', 'w'), indent=2)
    print(f"Queue rebuilt: INDEXED={queue_out['indexed_pass_count']} "
          f"DISCOVERED={queue_out['discovered_not_indexed_count']} "
          f"UNKNOWN={queue_out['unknown_to_google_count']} "
          f"UNINSPECTED={queue_out['uninspected_count']}")


if __name__ == "__main__":
    main()
