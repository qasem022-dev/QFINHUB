#!/usr/bin/env python3
"""
gsc-submit-validation.py — Task 2E
Submit re-validation requests for the 179 fixed pages (now returning 410) via CloakBrowser.

After deploying the proxy.ts 410 fix:
1. Wait for Vercel to deploy (handled by caller)
2. Verify each URL returns 410
3. Open GSC URL Inspection
4. For each URL: enter URL → click "Test Live URL" → click "Request Indexing"
5. Track in submission log (skip if URL already submitted in last 7 days)

Constraints:
- Max 13/day (GSC hard limit)
- 7-day cooldown per URL
- Use CloakBrowser profile at ~/.hermes/cloak-profiles/google-gsc-v3

Usage:
  LD_LIBRARY_PATH=$HOME/.local/lib ~/.hermes/hermes-agent/venv/bin/python3 scripts/gsc-submit-validation.py --limit 13
"""
import json, sys, time, subprocess, argparse
from pathlib import Path

sys.path.insert(0, '/home/admin1/.hermes/hermes-agent/venv/lib/python3.12/site-packages')
from cloakbrowser import launch_persistent_context

GONE_URLS_FILE = Path(__file__).parent / 'gone-urls.json'
PROFILE = '/home/admin1/.hermes/cloak-profiles/google-gsc-v3'
GSC_URL = 'https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F'
SUBMISSION_LOG = Path('/home/admin1/qfinhub/.optimizer-data/gsc-submission-log.json')
MAX_PER_DAY = 13
COOLDOWN_DAYS = 7


def load_gone_paths():
    with open(GONE_URLS_FILE) as f:
        return json.load(f)['paths']


def already_submitted_recently(url, log):
    """Check 7-day cooldown."""
    from datetime import datetime, timedelta
    cutoff = datetime.now() - timedelta(days=COOLDOWN_DAYS)
    for sub in log.get('submissions', []):
        if sub.get('url') == url and sub.get('result') == 'CLICKED_BUTTON':
            try:
                sub_date = datetime.fromisoformat(sub['date'].replace('Z', ''))
                if sub_date > cutoff:
                    return True
            except Exception:
                pass
    return False


def todays_count(log):
    today = time.strftime('%Y-%m-%d')
    count = 0
    for sub in log.get('submissions', []):
        if sub.get('date', '').startswith(today) and sub.get('result') == 'CLICKED_BUTTON':
            count += 1
    return count


def verify_410(url):
    """Verify the URL now returns 410 Gone."""
    try:
        result = subprocess.run(
            ['curl', '-sI', '--max-time', '10', url],
            capture_output=True, text=True, timeout=15
        )
        first_line = result.stdout.split('\n')[0] if result.stdout else ''
        return ' 410 ' in first_line or ' 410\n' in first_line
    except Exception:
        return False


def submit_url_via_gsc(page, url):
    """Use CloakBrowser to submit a single URL via GSC URL Inspection.
    Returns 'CLICKED_BUTTON' on success, error string on failure.
    """
    try:
        # Navigate to URL Inspection
        inspect_url = f'https://search.google.com/search-console/inspect?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&url={url}'
        page.goto(inspect_url, timeout=30000)
        time.sleep(4)

        # Click "Test Live URL" — wait for response
        try:
            test_btn = page.locator('button:has-text("Test Live URL")').first
            test_btn.click(timeout=10000)
        except Exception:
            pass  # May already be loaded

        time.sleep(6)  # Wait for inspection result

        # Click "Request Indexing" button
        try:
            req_btn = page.locator('button:has-text("Request Indexing")').first
            req_btn.click(timeout=10000)
            time.sleep(3)
            return 'CLICKED_BUTTON'
        except Exception as e:
            return f'NO_BUTTON: {e}'
    except Exception as e:
        return f'ERROR: {e}'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--limit', type=int, default=MAX_PER_DAY, help='Max URLs to submit')
    parser.add_argument('--dry-run', action='store_true', help='Just preview what would be submitted')
    args = parser.parse_args()

    paths = load_gone_paths()
    print(f'Loaded {len(paths)} gone paths')

    # Filter to https URLs for verification + submission
    urls = [f'https://www.qfinhub.com{p}' for p in paths]
    print(f'URLs to submit: {len(urls)}')

    # Load log
    log = {}
    if SUBMISSION_LOG.exists():
        with open(SUBMISSION_LOG) as f:
            log = json.load(f)
    log.setdefault('submissions', [])

    # Filter: not submitted in last 7 days
    urls_to_submit = [u for u in urls if not already_submitted_recently(u, log)]
    print(f'After 7-day cooldown filter: {len(urls_to_submit)} URLs')

    # Filter: today's quota
    today_count = todays_count(log)
    remaining_quota = MAX_PER_DAY - today_count
    print(f'Today: {today_count}/{MAX_PER_DAY} — quota remaining: {remaining_quota}')

    if remaining_quota <= 0:
        print('QUOTA_EXHAUSTED — skip submission')
        return

    to_process = urls_to_submit[:min(args.limit, remaining_quota)]
    print(f'Will submit: {len(to_process)} URLs')

    if args.dry_run:
        print('\n--- DRY RUN ---')
        for u in to_process[:5]:
            print(f'  Would submit: {u}')
        print(f'  ... and {len(to_process) - 5} more')
        return

    # Verify each returns 410 before submitting
    print('\nVerifying 410 status...')
    verified = []
    for url in to_process:
        if verify_410(url):
            verified.append(url)
        else:
            print(f'  SKIP (not 410): {url}')
    print(f'Verified as 410: {len(verified)}/{len(to_process)}')

    if not verified:
        print('No verified URLs to submit — Vercel may not have deployed yet. Wait 6 min.')
        return

    # Launch CloakBrowser and submit
    print('\nLaunching CloakBrowser...')
    ctx = launch_persistent_context(user_data_dir=PROFILE, headless=True)
    page = ctx.new_page()

    success_count = 0
    fail_count = 0
    try:
        for i, url in enumerate(verified):
            print(f'\n[{i+1}/{len(verified)}] Submitting: {url}')
            result = submit_url_via_gsc(page, url)

            log_entry = {
                'url': url,
                'category': 'gone-410-revalidation',
                'result': result,
                'date': time.strftime('%Y-%m-%dT%H:%M:%SZ'),
            }
            log['submissions'].append(log_entry)
            # Update daily count
            today = time.strftime('%Y-%m-%d')
            log.setdefault('daily_counts', {})
            if result == 'CLICKED_BUTTON':
                log['daily_counts'][today] = log['daily_counts'].get(today, 0) + 1
                success_count += 1
            else:
                fail_count += 1
            # Save log after each
            with open(SUBMISSION_LOG, 'w') as f:
                json.dump(log, f, indent=2)
    finally:
        ctx.close()

    print(f'\n=== DONE ===')
    print(f'Success: {success_count}, Failed: {fail_count}')


if __name__ == '__main__':
    main()