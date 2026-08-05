#!/usr/bin/env python3
"""Submit the 331 'Discovered - currently not indexed' URLs to Indexing API.

Uses live GSC inspection (v7) data and the existing submission log for dedup.
Respects Google's 200/day quota with a conservative 150/run cap.
Excludes /scenario/ and /tools/ hash URLs (they're intended noindex).
"""
import json, time, urllib.request, urllib.parse, urllib.error, sys
from pathlib import Path
from datetime import datetime, timezone

OAUTH = Path.home() / '.hermes' / 'google-oauth.json'
TOKEN = Path.home() / '.hermes' / 'google-indexing-token.json'
LOG = Path('/home/admin1/qfinhub/.optimizer-data/gsc-submission-log.json')
BUCKET = Path('/home/admin1/qfinhub/.optimizer-data/gsc-bucket-v7-discovered---currently-not-indexed.json')
API = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
DAILY_CAP = 150  # conservative

# Exclude patterns — formula/hash URLs that are designed noindex
EXCLUDE = [
    r'^https://www\.qfinhub\.com/scenario/',
    r'^https://www\.qfinhub\.com/tools/',
]

def get_token():
    cfg = json.loads(OAUTH.read_text())['installed']
    tok = json.loads(TOKEN.read_text())
    if time.time() - tok.get('created_at', 0) < tok.get('expires_in', 3600) - 60:
        return tok['access_token']
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
    TOKEN.write_text(json.dumps(tok))
    return new['access_token']

def submit(url, token, retry=2):
    body = json.dumps({'url': url, 'type': 'URL_UPDATED'}).encode()
    req = urllib.request.Request(API, data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
    })
    for attempt in range(retry + 1):
        try:
            resp = urllib.request.urlopen(req, timeout=15)
            return True, json.loads(resp.read())
        except urllib.error.HTTPError as e:
            body_txt = e.read().decode()[:500]
            if e.code == 429 and attempt < retry:
                time.sleep(5); continue
            return False, f'HTTP {e.code}: {body_txt}'
        except Exception as e:
            if attempt < retry:
                time.sleep(2); continue
            return False, f'{type(e).__name__}: {e}'
    return False, 'max retries'

def main():
    import re
    bucket = json.loads(BUCKET.read_text())
    urls = bucket['urls']
    print(f"Bucket: {bucket['reason']}")
    print(f"Total URLs in bucket: {len(urls)}")

    # Apply excludes
    eligible = []
    skipped_excluded = 0
    for u in urls:
        if any(re.match(p, u) for p in EXCLUDE):
            skipped_excluded += 1; continue
        eligible.append(u)
    print(f"After exclude-list: {len(eligible)} ({skipped_excluded} excluded as designed-noindex)")

    # Dedup against existing log
    history = json.loads(LOG.read_text()) if LOG.exists() else {'submissions':[]}
    submitted = set(s.get('url') for s in history.get('submissions', []))
    print(f"Already submitted before: {len(submitted)}")

    # Cooldown 14 days
    cooldown_secs = 14 * 86400
    cooldown_skip = 0
    final = []
    for u in eligible:
        # Find last submission time
        last_ts = max((s.get('ts', 0) for s in history.get('submissions', []) if s.get('url') == u), default=0)
        if last_ts > 0 and (time.time() - last_ts) < cooldown_secs:
            cooldown_skip += 1; continue
        final.append(u)
    print(f"After cooldown filter: {len(final)} ({cooldown_skip} skipped)")

    # Daily cap
    today = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    today_count = sum(1 for s in history.get('submissions', []) if s.get('date','').startswith(today))
    remaining = max(0, DAILY_CAP - today_count)
    print(f"Today already: {today_count}, remaining quota: {remaining}")
    to_submit = final[:remaining]
    print(f"To submit this run: {len(to_submit)}")

    if not to_submit:
        print("\nNothing to submit.")
        return

    # Dry-run preview
    print(f"\n--- PREVIEW (first 10) ---")
    for u in to_submit[:10]:
        print(f"  {u}")
    if len(to_submit) > 10:
        print(f"  ... and {len(to_submit)-10} more")

    # Confirm
    if '--yes' not in sys.argv:
        resp = input("\nProceed with submission? [y/N] ").strip().lower()
        if resp != 'y':
            print("Aborted."); return

    print("\nRefreshing token...")
    token = get_token()
    print("Token OK")

    success = 0
    fail = 0
    for i, url in enumerate(to_submit, 1):
        print(f"[{i}/{len(to_submit)}] {url[:90]}", end=' ')
        ok, result = submit(url, token)
        ts = time.time()
        if ok:
            success += 1
            history['submissions'].append({
                'url': url, 'source': 'live-discovered-v7', 'ts': ts,
                'date': datetime.now(timezone.utc).isoformat(),
                'result': result,
            })
            print("✅")
        else:
            fail += 1
            history.setdefault('rejections', []).append({
                'url': url, 'source': 'live-discovered-v7', 'ts': ts,
                'date': datetime.now(timezone.utc).isoformat(),
                'reason': result,
            })
            print(f"❌ {str(result)[:150]}")
        if i % 10 == 0:
            LOG.write_text(json.dumps(history, indent=2))
        if i < len(to_submit):
            time.sleep(0.15)
    LOG.write_text(json.dumps(history, indent=2))
    print(f"\n=== SUMMARY ===")
    print(f"Submitted: {success}")
    print(f"Failed:    {fail}")
    print(f"Total today: {today_count + success}")

if __name__ == '__main__':
    main()