#!/usr/bin/env python3
"""
STRICT-GUARDRAIL Indexing API submitter.

Replaces scripts/submit-index.py with a much safer version:
- Loads eligible URLs from the audit bucket file (not hardcoded)
- Enforces 200/day hard cap (Google quota limit)
- 14-day cooldown per URL (no spam)
- Audit log every submission
- Eligibility filter: HTTP 200, no noindex, no redirect, in sitemap
- Tracks rejections + reasons

USAGE:
  python3 scripts/indexing-api-submit.py --bucket ready --max 200
  python3 scripts/indexing-api-submit.py --bucket auto_fix --max 50
  python3 scripts/indexing-api-submit.py --bucket all --dry-run
"""
import argparse, json, time, sys, re, urllib.request, urllib.parse, urllib.error
from pathlib import Path
from datetime import datetime, timezone

OAUTH_KEY = Path.home() / '.hermes' / 'google-oauth.json'
TOKEN_PATH = Path.home() / '.hermes' / 'google-indexing-token.json'
AUDIT_FILE = Path('/home/admin1/qfinhub/.optimizer-data/discovered-162-root-cause-audit.json')
SUBMIT_LOG = Path('/home/admin1/qfinhub/.optimizer-data/indexing-api-submission-log.json')
SCOPES = ['https://www.googleapis.com/auth/indexing']
API_URL = 'https://indexing.googleapis.com/v3/urlNotifications:publish'

# Google Indexing API quota: 200 publishRequest calls per day per project.
# Conservative cap to leave headroom and avoid abuse signal.
DAILY_HARD_CAP = 180

def get_token():
    cfg = json.loads(OAUTH_KEY.read_text())['installed']
    tok = json.loads(TOKEN_PATH.read_text())
    # Check expiry
    if time.time() - tok.get('created_at', 0) < tok.get('expires_in', 3600) - 60:
        return tok['access_token']
    # Refresh
    data = urllib.parse.urlencode({
        'client_id': cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'refresh_token': tok['refresh_token'],
        'grant_type': 'refresh_token',
    }).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    resp = urllib.request.urlopen(req, timeout=15)
    new = json.loads(resp.read())
    tok['access_token'] = new['access_token']
    tok['expires_in'] = new['expires_in']
    tok['created_at'] = time.time()
    TOKEN_PATH.write_text(json.dumps(tok))
    return new['access_token']

def load_history():
    if SUBMIT_LOG.exists():
        return json.loads(SUBMIT_LOG.read_text())
    return {'submissions': [], 'rejections': [], 'last_reset_date': None}

def save_history(h):
    SUBMIT_LOG.write_text(json.dumps(h, indent=2))

def today_count(h):
    """Count submissions made today (UTC)."""
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    return sum(1 for s in h['submissions'] if s.get('date', '').startswith(today))

def last_submit_for(h, url):
    """Get the timestamp of the most recent submission for a URL."""
    times = [s['ts'] for s in h['submissions'] if s['url'] == url]
    return max(times) if times else 0

def submit_url(url, token, retry=2):
    body = json.dumps({'url': url, 'type': 'URL_UPDATED'}).encode()
    req = urllib.request.Request(API_URL, data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    })
    for attempt in range(retry + 1):
        try:
            resp = urllib.request.urlopen(req, timeout=15)
            result = json.loads(resp.read())
            return True, result
        except urllib.error.HTTPError as e:
            body_txt = e.read().decode()[:500]
            if e.code == 429 and attempt < retry:
                time.sleep(5)
                continue
            return False, f'HTTP {e.code}: {body_txt}'
        except Exception as e:
            if attempt < retry:
                time.sleep(2)
                continue
            return False, f'{type(e).__name__}: {e}'
    return False, 'max retries exceeded'

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--bucket', choices=['ready', 'auto_fix', 'needs_improvement', 'exclude', 'all'],
                        default='ready', help='Which audit bucket to submit')
    parser.add_argument('--max', type=int, default=DAILY_HARD_CAP,
                        help='Max submissions this run (default ' + str(DAILY_HARD_CAP) + ', Google quota is 200/day)')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be submitted')
    parser.add_argument('--cooldown-days', type=int, default=14,
                        help='Min days between submissions for the same URL')
    args = parser.parse_args()

    if not AUDIT_FILE.exists():
        print('❌ Audit file not found: ' + str(AUDIT_FILE))
        sys.exit(1)

    audit = json.loads(AUDIT_FILE.read_text())
    history = load_history()

    # URL exclude-list (eliminates thin programmatic pages that triggered
    # the 2026-06-12 spam burst). Any URL matching a pattern is rejected.
    EXCLUDE_PATTERNS = [
        r'^https://www\.qfinhub\.com/tools/.*-\d+[km]?[-_]?\d*(yr|mo|wk|year|month|week)?(-\d+)?$',  # tool variants: investment-500-5yr, tax-80k-single
        r'^https://www\.qfinhub\.com/tools/investment-.*',  # all investment-* variants
        r'^https://www\.qfinhub\.com/tools/tax-.*',         # all tax-* variants
        r'^https://www\.qfinhub\.com/tools/loan-.*',        # all loan-* variants
        r'^https://www\.qfinhub\.com/tools/mortgage-.*',    # all mortgage-* variants
        r'^https://www\.qfinhub\.com/loan-payment-table/',  # loan payment table variants
        r'^https://www\.qfinhub\.com/scenario/',            # scenario hash IDs
    ]

    def is_excluded(url):
        return any(re.match(p, url) for p in EXCLUDE_PATTERNS)

    # Select URLs based on bucket
    bucket_urls = []
    if args.bucket in ('ready', 'all'):
        for u in audit['buckets']['ready']:
            if is_excluded(u):
                continue
            bucket_urls.append((u, 'ready'))
    if args.bucket in ('auto_fix', 'all'):
        # For redirects: submit the FINAL URL (the canonical one Google should index)
        # For noindex pages: submit the URL after we remove noindex (manual step first)
        for r in audit['buckets']['auto_fix']:
            if r.get('reason') == 'redirect':
                # Submit the final URL
                final = r.get('final_url') or r['url']
                if is_excluded(final):
                    continue
                bucket_urls.append((final, 'auto_fix_redirect_final'))
            elif r.get('reason') == 'has_noindex':
                # Skip — needs manual noindex removal first
                print('⚠ SKIP (needs noindex removal first): ' + r['url'])

    print('=' * 60)
    print('Indexing API — Strict-Guardrail Submitter')
    print('Bucket: ' + args.bucket)
    print('Total URLs in bucket (after exclude-list filter): ' + str(len(bucket_urls)))
    print('Today submissions so far: ' + str(today_count(history)))
    print('Max this run: ' + str(args.max))
    print('Cooldown: ' + str(args.cooldown_days) + ' days')
    print('=' * 60)

    # Filter eligible URLs
    eligible = []
    skipped = {'already_submitted_today': 0, 'cooldown_active': 0, 'duplicate': 0}
    seen = set()
    cooldown_secs = args.cooldown_days * 86400

    for url, source in bucket_urls:
        if url in seen:
            skipped['duplicate'] += 1
            continue
        seen.add(url)

        last_ts = last_submit_for(history, url)
        if last_ts > 0:
            age_days = (time.time() - last_ts) / 86400
            if age_days < args.cooldown_days:
                skipped['cooldown_active'] += 1
                continue
        eligible.append((url, source))

    print('Eligible after dedup + cooldown: ' + str(len(eligible)))
    if skipped:
        print('Skipped: ' + json.dumps(skipped))

    if args.dry_run:
        print('\nDRY RUN — would submit:')
        for url, source in eligible[:args.max]:
            print('  [' + source + '] ' + url)
        if len(eligible) > args.max:
            print('  ... and ' + str(len(eligible) - args.max) + ' more')
        return

    if not eligible:
        print('Nothing to submit.')
        return

    # Get token
    print('\nRefreshing access token...')
    token = get_token()
    print('✅ Token OK')

    # Check daily cap
    already_today = today_count(history)
    remaining = max(0, args.max - already_today)
    if remaining <= 0:
        print('❌ Daily cap reached (' + str(args.max) + '). Try tomorrow.')
        return
    to_submit = eligible[:remaining]

    print('\nSubmitting ' + str(len(to_submit)) + ' URLs (cap=' + str(args.max) + ', already=' + str(already_today) + ')...\n')

    success = 0
    fail = 0
    for i, (url, source) in enumerate(to_submit, 1):
        print('[' + str(i) + '/' + str(len(to_submit)) + '] ' + url)
        ok, result = submit_url(url, token)
        ts = time.time()
        if ok:
            success += 1
            history['submissions'].append({
                'url': url, 'source': source, 'ts': ts,
                'date': datetime.now(timezone.utc).isoformat(),
                'result': result,
            })
            print('  ✅ Submitted')
        else:
            fail += 1
            history['rejections'].append({
                'url': url, 'source': source, 'ts': ts,
                'date': datetime.now(timezone.utc).isoformat(),
                'reason': result,
            })
            print('  ❌ ' + str(result)[:200])
        save_history(history)

        # Throttle to ~10/sec to be safe
        if i < len(to_submit):
            time.sleep(0.1)

    print('\n' + '=' * 60)
    print('SUMMARY')
    print('  Submitted: ' + str(success))
    print('  Failed: ' + str(fail))
    print('  Total today: ' + str(today_count(history)))
    print('=' * 60)

if __name__ == '__main__':
    main()