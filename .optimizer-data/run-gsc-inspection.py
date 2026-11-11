import os, sys
# Reduce noisy library output and potential threading issues
os.environ['PYTHONUNBUFFERED'] = '1'

from google.oauth2 import service_account
from googleapiclient.discovery import build
from concurrent.futures import ThreadPoolExecutor, as_completed
import json, time, re, urllib.request
from pathlib import Path

# Write log directly to file (not via tee) to avoid pipe buffering issues
LOG = open('/home/admin1/qfinhub/.optimizer-data/gsc-inspection-run.log', 'w')
def log(msg):
    LOG.write(msg + '\n')
    LOG.flush()
    sys.stdout.write(msg + '\n')
    sys.stdout.flush()

creds = service_account.Credentials.from_service_account_file(
    '/home/admin1/.hermes/gsc-service-account-key.json',
    scopes=['https://www.googleapis.com/auth/webmasters'])
service = build('searchconsole', 'v1', credentials=creds, cache_discovery=False)

# Read both sitemaps
log('Fetching sitemaps...')
sitemap_xml = urllib.request.urlopen('https://www.qfinhub.com/sitemap.xml', timeout=30).read().decode()
sitemap_urls = re.findall(r'<loc>([^<]+)</loc>', sitemap_xml)
log(f'  sitemap.xml: {len(sitemap_urls)} URLs')

try:
    news_sitemap = urllib.request.urlopen('https://www.qfinhub.com/news-sitemap.xml', timeout=30).read().decode()
    news_urls = re.findall(r'<loc>([^<]+)</loc>', news_sitemap)
    log(f'  news-sitemap.xml: {len(news_urls)} URLs')
    sitemap_urls += news_urls
except Exception as e:
    log(f'  news-sitemap.xml: SKIPPED ({e})')

log(f'Total URLs to inspect: {len(sitemap_urls)}')

def inspect_one(url):
    try:
        req = {'siteUrl': 'https://www.qfinhub.com/', 'inspectionUrl': url}
        resp = service.urlInspection().index().inspect(body=req).execute()
        result = resp.get('inspectionResult', {})
        idx = result.get('indexStatusResult', {})
        return {
            'url': url,
            'coverage': idx.get('coverageState', ''),
            'verdict': idx.get('verdict', ''),
            'indexing': idx.get('indexingState', ''),
            'googleCanonical': idx.get('googleCanonical', ''),
            'userCanonical': idx.get('userCanonical', ''),
        }
    except Exception as e:
        return {'url': url, 'coverage': 'ERROR', 'error': str(e)[:200]}
    finally:
        time.sleep(0.15)  # Gentle rate-limit to avoid SSL pool issues

# Inspect SEQUENTIALLY (Google API client not thread-safe under SSL — causes malloc corruption)
all_results = []
batch_size = 50
total = len(sitemap_urls)
start_time = time.time()

for i in range(0, total, batch_size):
    batch = sitemap_urls[i:i+batch_size]
    for url in batch:
        all_results.append(inspect_one(url))
    done = min(i+batch_size, total)
    elapsed = time.time() - start_time
    rate = done / elapsed if elapsed > 0 else 0
    eta = (total - done) / rate if rate > 0 else 0
    log(f'Done {done}/{total} ({100*done/total:.1f}%) - {elapsed:.0f}s elapsed, ~{eta:.0f}s remaining')
    # Save progress
    Path('/home/admin1/qfinhub/.optimizer-data/full-url-inspection-batch.json').write_text(json.dumps(all_results, indent=2))
    time.sleep(1)

log(f'\nAll {total} URLs inspected in {time.time()-start_time:.0f}s')

# Categorize
buckets = {
    'alternative_canonical': [],
    'page_with_redirect': [],
    'crawled_not_indexed': [],
    'discovered_not_indexed': [],
    'noindex': [],
    'submitted_indexed': [],
    'soft_404': [],
    'unknown': [],
    'other': []
}
unclassified = []
for r in all_results:
    cov = r.get('coverage', '')
    if cov == 'Submitted and indexed':
        buckets['submitted_indexed'].append(r)
    elif cov == 'Excluded by noindex tag':
        buckets['noindex'].append(r)
    elif cov == 'Crawled - currently not indexed':
        buckets['crawled_not_indexed'].append(r)
    elif cov == 'Discovered - currently not indexed':
        buckets['discovered_not_indexed'].append(r)
    elif 'Alternative page with proper canonical tag' in cov:
        buckets['alternative_canonical'].append(r)
    elif 'Page with redirect' in cov:
        buckets['page_with_redirect'].append(r)
    elif cov == 'Soft 404':
        buckets['soft_404'].append(r)
    elif cov == 'URL is unknown to Google':
        buckets['unknown'].append(r)
    elif cov == 'ERROR':
        buckets['other'].append(r)
    else:
        buckets['other'].append(r)
        unclassified.append(r)

# Save buckets
out_dir = Path('/home/admin1/qfinhub/.optimizer-data')
for name, items in buckets.items():
    (out_dir / f'rejection-bucket-{name}.json').write_text(
        json.dumps(items, indent=2))

# Summary
log('\n=== REJECTION BUCKETS ===')
total_in_buckets = 0
for name, items in buckets.items():
    log(f'{name}: {len(items)}')
    total_in_buckets += len(items)
log(f'TOTAL: {total_in_buckets}')

if unclassified:
    log(f'\n=== UNCLASSIFIED COVERAGE STATES ({len(unclassified)}) ===')
    from collections import Counter
    states = Counter(r.get('coverage', '') for r in unclassified)
    for state, cnt in states.most_common():
        log(f'  {state!r}: {cnt}')

# Save full results too
Path('/home/admin1/qfinhub/.optimizer-data/full-url-inspection-results.json').write_text(json.dumps(all_results, indent=2))
log('\nDone. Files saved.')
