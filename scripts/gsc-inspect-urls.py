#!/usr/bin/env python3
"""
URL Inspection + Classification Utility
Uses Google OAuth token to inspect individual URLs via GSC API.
"""
import json, os, time, urllib.request, urllib.error, urllib.parse

TOKEN_PATH = os.path.expanduser('~/.hermes/google-indexing-token.json')
SITE_URL = 'https://www.qfinhub.com/'
API_ENDPOINT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect'

def get_token():
    with open(TOKEN_PATH) as f:
        token_data = json.load(f)
    # Refresh if needed
    if token_data.get('created_at', 0) + token_data.get('expires_in', 3600) - 300 < time.time():
        refresh_data = urllib.parse.urlencode({
            'client_id': token_data['client_id'],
            'client_secret': token_data['client_secret'],
            'refresh_token': token_data['refresh_token'],
            'grant_type': 'refresh_token'
        }).encode()
        req = urllib.request.Request('https://oauth2.googleapis.com/token', data=refresh_data)
        with urllib.request.urlopen(req) as resp:
            new_token = json.loads(resp.read())
        token_data['access_token'] = new_token['access_token']
        token_data['created_at'] = int(time.time())
        if 'expires_in' in new_token:
            token_data['expires_in'] = new_token['expires_in']
        with open(TOKEN_PATH, 'w') as f:
            json.dump(token_data, f)
    return token_data['access_token']

def inspect_url(url, access_token=None):
    """Inspect a single URL via GSC URL Inspection API."""
    if access_token is None:
        access_token = get_token()
    
    data = json.dumps({
        'inspectionUrl': url,
        'siteUrl': SITE_URL
    }).encode()
    
    req = urllib.request.Request(API_ENDPOINT, data=data, headers={
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    })
    
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            result = json.loads(resp.read())
        
        inspection = result.get('inspectionResult', {})
        index_status = inspection.get('indexStatusResult', {})
        mobile = inspection.get('mobileUsabilityResult', {})
        rich = inspection.get('richResultsResult', {})
        
        return {
            'url': url,
            'coverage_state': index_status.get('coverageState', 'UNKNOWN'),
            'verdict': index_status.get('verdict', 'UNKNOWN'),
            'last_crawl_time': index_status.get('lastCrawlTime'),
            'crawled_as': index_status.get('crawledAs', 'UNKNOWN'),
            'google_canonical': index_status.get('googleCanonical', ''),
            'user_canonical': index_status.get('userCanonical', ''),
            'robots_txt': index_status.get('robotsTxtState', 'UNKNOWN'),
            'indexing_state': index_status.get('indexingState', 'UNKNOWN'),
            'page_fetch': index_status.get('pageFetchState', 'UNKNOWN'),
            'mobile_usability': mobile.get('verdict', 'N/A') if mobile else 'N/A',
            'rich_results': list(rich.get('detectedItems', [])) if rich else [],
            'raw': result
        }
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()[:500] if e.fp else ''
        return {
            'url': url,
            'error': f'HTTP {e.code}',
            'error_detail': err_body
        }
    except Exception as e:
        return {
            'url': url,
            'error': str(e)
        }

def batch_inspect(urls, delay=1.0, access_token=None):
    """Inspect multiple URLs with rate limiting."""
    if access_token is None:
        access_token = get_token()
    
    results = []
    for i, url in enumerate(urls):
        print(f"  [{i+1}/{len(urls)}] Inspecting: {url}")
        result = inspect_url(url, access_token)
        results.append(result)
        time.sleep(delay)
    return results

if __name__ == '__main__':
    # Test on a few URLs
    test_urls = [
        'https://www.qfinhub.com/',
        'https://www.qfinhub.com/calculators/mortgage-calculator',
        'https://www.qfinhub.com/decision/should-i-refinance-my-mortgage',
        'https://www.qfinhub.com/widgets/mortgage-affordability-embed',
    ]
    token = get_token()
    results = batch_inspect(test_urls, delay=0.5, access_token=token)
    for r in results:
        print(f"  {r.get('url', '?')}: coverage={r.get('coverage_state', '?')}, "
              f"verdict={r.get('verdict', '?')}, crawled={r.get('crawled_as', '?')}")
