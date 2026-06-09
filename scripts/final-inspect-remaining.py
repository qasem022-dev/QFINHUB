#!/usr/bin/env python3
"""Re-inspect all URLs with verdict=None (first-run 403 failures)."""
import json, time, urllib.request, os, sys

token_data = json.load(open(os.path.expanduser('~/.hermes/google-indexing-token.json')))
token = token_data['access_token']

r = json.load(open('.optimizer-data/full-url-inspection-results.json'))

uninspected = [u for u,d in r.items() if d.get('verdict') is None]
total = len(uninspected)
print(f'RE-INSPECTING {total} uninspected URLs')
sys.stdout.flush()

batch_size = 25
completed = 0
errors = 0
rate_limits = 0

for i in range(0, total, batch_size):
    batch = uninspected[i:i+batch_size]
    print(f'--- Batch {i//batch_size + 1}: {len(batch)} URLs ({completed}/{total}) ---')
    sys.stdout.flush()
    
    for url in batch:
        try:
            payload = json.dumps({
                'inspectionUrl': url,
                'siteUrl': 'https://www.qfinhub.com/',
                'languageCode': 'en-US'
            }).encode()
            req = urllib.request.Request(
                'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
                data=payload,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
            )
            resp = urllib.request.urlopen(req, timeout=15)
            data = json.loads(resp.read())
            ires = data.get('inspectionResult', {}).get('indexStatusResult', {})
            
            r[url] = {
                'verdict': ires.get('verdict', 'NONE'),
                'coverageState': ires.get('coverageState', ''),
                'indexingState': ires.get('indexingState', ''),
                'lastCrawlTime': ires.get('lastCrawlTime', ''),
                'googleCanonical': ires.get('googleCanonical', ''),
                'userCanonical': ires.get('userCanonical', ''),
                'robotsTxtState': ires.get('robotsTxtState', ''),
                'pageFetchState': ires.get('pageFetchState', ''),
                'crawledAs': ires.get('crawledAs', ''),
                'success': True
            }
            completed += 1
            if completed % 10 == 0:
                v = ires.get('verdict', '?')[:12]
                print(f'  [{v}] {completed}/{total}')
                sys.stdout.flush()
        except Exception as e:
            err = str(e)
            completed += 1
            if '429' in err:
                rate_limits += 1
                print(f'  RATE LIMITED (#{rate_limits}), sleeping 90s...')
                sys.stdout.flush()
                time.sleep(90)
                # Retry this URL
                try:
                    payload = json.dumps({
                        'inspectionUrl': url,
                        'siteUrl': 'https://www.qfinhub.com/',
                        'languageCode': 'en-US'
                    }).encode()
                    req = urllib.request.Request(
                        'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
                        data=payload,
                        headers={
                            'Authorization': f'Bearer {token}',
                            'Content-Type': 'application/json'
                        }
                    )
                    resp = urllib.request.urlopen(req, timeout=15)
                    data = json.loads(resp.read())
                    ires = data.get('inspectionResult', {}).get('indexStatusResult', {})
                    r[url] = {
                        'verdict': ires.get('verdict', 'NONE'),
                        'coverageState': ires.get('coverageState', ''),
                        'indexingState': ires.get('indexingState', ''),
                        'lastCrawlTime': ires.get('lastCrawlTime', ''),
                        'googleCanonical': ires.get('googleCanonical', ''),
                        'success': True
                    }
                    print(f'  [RETRY OK] {completed}/{total}')
                except Exception as e2:
                    r[url] = {'verdict': 'ERROR', 'error': str(e2)[:200], 'success': False}
                    errors += 1
            else:
                r[url] = {'verdict': 'ERROR', 'error': err[:200], 'success': False}
                errors += 1
            sys.stdout.flush()
        
        time.sleep(3.2)
    
    # Save after each batch
    json.dump(r, open('.optimizer-data/full-url-inspection-results.json', 'w'), indent=2)
    print(f'  Saved. {completed}/{total} done ({errors} errors)')
    sys.stdout.flush()

json.dump(r, open('.optimizer-data/full-url-inspection-results.json', 'w'), indent=2)
print(f'FINAL: {completed}/{total} inspected, {errors} errors, {rate_limits} rate limits')
