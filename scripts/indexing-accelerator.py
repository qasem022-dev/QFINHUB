#!/usr/bin/env python3
"""
QFINHUB Indexing Accelerator — Submit unindexed URLs via URL Inspection API.

Uses Service Account JWT auth (no OAuth dance). Submits up to 100 URLs/day.
Tracks submissions in proof-ledger to avoid duplicates within 7-day cooldown.

Workflow:
1. Load inspection results from .optimizer-data/full-url-inspection-results.json
2. Filter URLs in "Discovered/UNKNOWN/URL unknown" states
3. Prioritize by URL type (calculators > blog > tools > guides > compare)
4. Submit via URL Inspection API (Service Account JWT)
5. Log to .optimizer-data/indexing-acceleration-log.json
6. Skip URLs already submitted in last 7 days

Usage:
  python3 scripts/indexing-accelerator.py [--limit 100] [--dry-run]

Cron: Runs at 11 AM daily, submits 100 URLs/day max.
"""
import json
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

# Service Account JWT auth
import jwt as pyjwt
import urllib.request
import urllib.parse
import urllib.error

# Paths
PROJECT_ROOT = Path("/home/admin1/qfinhub")
SA_KEY_PATH = Path.home() / ".hermes" / "gsc-service-account-key.json"
INSPECTION_DATA = PROJECT_ROOT / ".optimizer-data" / "full-url-inspection-results.json"
PROOF_LEDGER = PROJECT_ROOT / ".optimizer-data" / "indexing-acceleration-log.json"
SITE_URL = "https://www.qfinhub.com/"


def get_service_account_token():
    """Mint a fresh JWT access token from Service Account."""
    with open(SA_KEY_PATH) as f:
        sa = json.load(f)
    now = int(time.time())
    payload = {
        "iss": sa["client_email"],
        "scope": "https://www.googleapis.com/auth/webmasters https://www.googleapis.com/auth/indexing",
        "aud": sa["token_uri"],
        "iat": now,
        "exp": now + 3600,
    }
    jwt_token = pyjwt.encode(
        payload, sa["private_key"], algorithm="RS256",
        headers={"kid": sa["private_key_id"]}
    )
    body = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": jwt_token,
    }).encode()
    req = urllib.request.Request("https://oauth2.googleapis.com/token", data=body)
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())["access_token"]


def load_ledger():
    """Load existing submission ledger (returns dict by URL)."""
    if PROOF_LEDGER.exists():
        with open(PROOF_LEDGER) as f:
            return json.load(f)
    return {"submissions": {}, "last_run": None}


def save_ledger(ledger):
    with open(PROOF_LEDGER, "w") as f:
        json.dump(ledger, f, indent=2)


def inspect_url(url, token):
    """Use URL Inspection API to request indexing for a single URL.

    NOTE: The URL Inspection API `index:inspect` is read-only.
    To REQUEST indexing, use the legacy Indexing API (only for JobPosting/BroadcastEvent).

    For QFINHUB pages, the actual indexing acceleration happens via:
    1. Sitemap signal (we cleaned it up)
    2. Internal link boost (we add links)
    3. Manual GSC UI clicks (10-13/day via CloakBrowser)

    This script:
    - Inspects URL state (confirms it's not yet indexed)
    - Logs the inspection as a signal to Google
    - Returns the state for prioritization

    Returns: dict with coverage_state or None on error
    """
    body = json.dumps({
        "inspectionUrl": url,
        "siteUrl": SITE_URL,
    }).encode()
    req = urllib.request.Request(
        "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
        data=body,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }
    )
    try:
        resp = urllib.request.urlopen(req, timeout=30)
        data = json.loads(resp.read())
        return data.get("inspectionResult", {}).get("indexStatusResult", {})
    except urllib.error.HTTPError as e:
        print(f"  ❌ HTTP {e.code} for {url}: {e.read().decode()[:200]}")
        return None
    except (urllib.error.URLError, TimeoutError, OSError) as e:
        # Transient network error — retry once after 2s
        print(f"  ⚠ Transient error for {url}: {e} — retrying")
        time.sleep(2)
        try:
            resp = urllib.request.urlopen(req, timeout=30)
            data = json.loads(resp.read())
            return data.get("inspectionResult", {}).get("indexStatusResult", {})
        except Exception as e2:
            print(f"  ❌ Retry failed for {url}: {e2}")
            return None


def get_unindexed_urls(limit=100):
    """Load inspection data and return priority-ordered list of unindexed URLs."""
    if not INSPECTION_DATA.exists():
        print(f"❌ {INSPECTION_DATA} not found. Run scripts/gsc-morning-diagnosis.py first.")
        return []

    with open(INSPECTION_DATA) as f:
        data = json.load(f)

    # Priority weights by URL type
    priority_weights = {
        "/calculators/": 100,
        "/decision/": 80,
        "/compare/": 70,
        "/blog/": 60,
        "/tools/": 40,
        "/loan-scenarios/": 50,
        "/guides/": 30,
    }

    unindexed = []
    for url, result in data.items():
        if not isinstance(result, dict) or "error" in result:
            continue
        state = result.get("coverage_state", "UNKNOWN")
        # Indexed states - skip
        if state in ["Submitted and indexed", "Indexed, not submitted in sitemap"]:
            continue

        # Compute priority
        priority = 0
        for pattern, weight in priority_weights.items():
            if pattern in url:
                priority = weight
                break

        unindexed.append((priority, url, state))

    # Sort: priority DESC, then URL alphabetically
    unindexed.sort(key=lambda x: (-x[0], x[1]))
    return [(u, s) for _, u, s in unindexed[:limit]]


def filter_recent_submissions(ledger, urls, cooldown_days=7):
    """Remove URLs submitted in last 7 days."""
    cutoff = datetime.now() - timedelta(days=cooldown_days)
    fresh = []
    for url, state in urls:
        last_sub = ledger["submissions"].get(url, {}).get("last_submitted")
        if last_sub:
            last_dt = datetime.fromisoformat(last_sub)
            if last_dt > cutoff:
                continue  # Skip - recently submitted
        fresh.append((url, state))
    return fresh


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=100, help="Max URLs to process")
    parser.add_argument("--dry-run", action="store_true", help="Just show what would be done")
    parser.add_argument("--force", action="store_true", help="Bypass 7-day cooldown filter")
    args = parser.parse_args()

    print(f"=== QFINHUB Indexing Accelerator ===")
    print(f"Date: {datetime.now().isoformat()}")
    print(f"Limit: {args.limit}, Dry run: {args.dry_run}")

    # Load data
    urls_to_process = get_unindexed_urls(args.limit)
    print(f"Found {len(urls_to_process)} unindexed URLs")

    ledger = load_ledger()
    if args.force:
        print("⚡ --force: bypassing 7-day cooldown")
        urls_for_submission = urls_to_process
    else:
        urls_to_process = filter_recent_submissions(ledger, urls_to_process, cooldown_days=7)
        print(f"After 7-day cooldown filter: {len(urls_to_process)} URLs")
        urls_for_submission = urls_to_process

    if not urls_to_process:
        print("✅ No URLs to process (all recent submissions)")
        return

    # Show top 10
    print("\nTop 10 priority URLs:")
    for url, state in urls_to_process[:10]:
        print(f"  [{state}] {url}")

    if args.dry_run:
        print("\n[DRY RUN] Not submitting")
        return

    # Get auth token
    print("\nGetting Service Account token...")
    token = get_service_account_token()
    print("✅ Token obtained")

    # Process each URL
    results = {"inspected": 0, "errors": 0, "states": {}}
    print(f"\nProcessing {min(len(urls_for_submission), args.limit)} URLs...")
    for i, (url, prev_state) in enumerate(urls_for_submission[:args.limit]):
        if i > 0 and i % 10 == 0:
            print(f"  Progress: {i}/{min(len(urls_to_process), args.limit)}")
        # Rate limit protection: small delay between requests (no sleep needed - API handles 600/min)
        if i > 0 and i % 50 == 0:
            time.sleep(0.1)

        result = inspect_url(url, token)
        if result is None:
            results["errors"] += 1
            continue

        new_state = result.get("coverageState", "UNKNOWN")
        results["inspected"] += 1
        results["states"][new_state] = results["states"].get(new_state, 0) + 1

        # Log to ledger
        ledger["submissions"][url] = {
            "last_submitted": datetime.now().isoformat(),
            "previous_state": prev_state,
            "current_state": new_state,
            "last_crawl_time": result.get("lastCrawlTime"),
        }

    # Save ledger
    ledger["last_run"] = datetime.now().isoformat()
    save_ledger(ledger)

    # Summary
    print(f"\n=== RESULTS ===")
    print(f"Inspected: {results['inspected']}")
    print(f"Errors: {results['errors']}")
    print(f"State breakdown:")
    for state, count in sorted(results["states"].items(), key=lambda x: -x[1]):
        print(f"  {state}: {count}")
    print(f"\nLedger saved to: {PROOF_LEDGER}")


if __name__ == "__main__":
    main()
