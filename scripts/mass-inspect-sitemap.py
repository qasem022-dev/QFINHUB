#!/usr/bin/env python3
"""Mass URL inspection via GSC API — standalone script."""
import json, os, sys, time, urllib.request, urllib.error, urllib.parse

TOKEN_PATH = os.path.expanduser('~/.hermes/google-indexing-token.json')
SITE_URL = 'https://www.qfinhub.com/'
API = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'
OUTPUT = '/home/admin1/qfinhub/.optimizer-data/gsc-shared-exports/sitemap-url-inspections.json'
INVENTORY = '/home/admin1/qfinhub/.optimizer-data/gsc-shared-exports/local-inventory.json'

def refresh_token():
    with open(TOKEN_PATH) as f:
        td = json.load(f)
    data = urllib.parse.urlencode({
        'client_id': td['client_id'],
        'client_secret': td['client_secret'],
        'refresh_token': td['refresh_token'],
        'grant_type': 'refresh_token'
    }).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    with urllib.request.urlopen(req) as resp:
        nt = json.loads(resp.read())
    td['access_token'] = nt['access_token']
    td['created_at'] = int(time.time())
    if 'expires_in' in nt:
        td['expires_in'] = nt['expires_in']
    with open(TOKEN_PATH, 'w') as f:
        json.dump(td, f)
    return nt['access_token']

def inspect_url(url, token):
    data = json.dumps({'inspectionUrl': url, 'siteUrl': SITE_URL}).encode()
    req = urllib.request.Request(API, data=data, headers={
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    })
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        ins = result.get('inspectionResult', {}).get('indexStatusResult', {})
        return {
            'coverage': ins.get('coverageState', '?'),
            'verdict': ins.get('verdict', '?'),
            'last_crawl': ins.get('lastCrawlTime'),
            'crawled_as': ins.get('crawledAs', '?'),
            'robots': ins.get('robotsTxtState', '?'),
            'page_fetch': ins.get('pageFetchState', '?'),
            'indexing': ins.get('indexingState', '?'),
        }
    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}: {e.read().decode()[:200]}'}
    except Exception as e:
        return {'error': str(e)[:200]}

def main():
    print("Refreshing token...", flush=True)
    token = refresh_token()
    print("Token refreshed.", flush=True)
    
    with open(INVENTORY) as f:
        inv = json.load(f)
    urls = inv['all_urls']
    print(f"Inspecting {len(urls)} URLs...", flush=True)
    
    results = {}
    success = 0
    errors = 0
    
    for i, url in enumerate(urls):
        result = inspect_url(url, token)
        results[url] = result
        if 'error' in result:
            errors += 1
        else:
            success += 1
        
        if (i + 1) % 25 == 0 or i < 3:
            pct = (i + 1) / len(urls) * 100
            print(f"  [{i+1}/{len(urls)}] {pct:.0f}% — {success} ok, {errors} err", flush=True)
        time.sleep(0.25)
    
    output = {
        'total': len(urls),
        'success': success,
        'errors': errors,
        'generated': time.strftime('%Y-%m-%d %H:%M:%S'),
        'results': results
    }
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w') as f:
        json.dump(output, f)
    print(f"\nDone! {success} success, {errors} errors → {OUTPUT}", flush=True)

if __name__ == '__main__':
    main()
