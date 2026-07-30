#!/usr/bin/env python3
"""
Daily Indexing API cron — runs every morning, picks up newly-discovered URLs,
submits the eligible ones (up to 180/day).

Intended to be invoked by a daily cron job.
"""
import json, time, subprocess, urllib.request, urllib.parse, urllib.error, sys
from pathlib import Path
from datetime import datetime, timezone

AUDIT_FILE = Path('/home/admin1/qfinhub/.optimizer-data/discovered-162-root-cause-audit.json')
SUBMIT_LOG = Path('/home/admin1/qfinhub/.optimizer-data/indexing-api-submission-log.json')
RESULT_FILE = Path('/home/admin1/qfinhub/.optimizer-data/daily-indexing-api-result.json')

DAILY_BUDGET = 180

def main():
    if not SUBMIT_LOG.exists():
        print('No submit log. Run indexing-api-submit.py --bucket ready first.')
        return
    history = json.loads(SUBMIT_LOG.read_text())
    today_count = sum(1 for s in history['submissions']
                      if s.get('date', '').startswith(datetime.now(timezone.utc).strftime('%Y-%m-%d')))
    remaining_today = max(0, DAILY_BUDGET - today_count)
    print(f'Today: {today_count}/{DAILY_BUDGET}, remaining: {remaining_today}')

    if remaining_today == 0:
        print('Daily cap reached.')
        RESULT_FILE.write_text(json.dumps({'date': datetime.now(timezone.utc).isoformat(),
                                            'submitted': 0, 'remaining_quota': 0,
                                            'note': 'Daily cap reached.'}, indent=2))
        return

    # Delegate to the main script with --max = remaining
    cmd = ['python3', '/home/admin1/qfinhub/scripts/indexing-api-submit.py',
           '--bucket', 'ready', '--max', str(remaining_today)]
    print('Running: ' + ' '.join(cmd))
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
    print('STDOUT (last 30):')
    print('\n'.join(result.stdout.splitlines()[-30:]))
    if result.returncode != 0:
        print('STDERR:')
        print(result.stderr[:500])

    # Tally for reporting
    new_history = json.loads(SUBMIT_LOG.read_text())
    new_today = sum(1 for s in new_history['submissions']
                    if s.get('date', '').startswith(datetime.now(timezone.utc).strftime('%Y-%m-%d')))
    new_rejections = [r for r in new_history['rejections']
                      if r.get('date', '').startswith(datetime.now(timezone.utc).strftime('%Y-%m-%d'))]

    RESULT_FILE.write_text(json.dumps({
        'date': datetime.now(timezone.utc).isoformat(),
        'submitted_today': new_today,
        'remaining_quota': max(0, DAILY_BUDGET - new_today),
        'rejections_today': len(new_rejections),
        'rejection_sample': new_rejections[:3] if new_rejections else [],
    }, indent=2))
    print(f'\nFinal: {new_today}/{DAILY_BUDGET} today, {len(new_rejections)} rejections')

if __name__ == '__main__':
    main()