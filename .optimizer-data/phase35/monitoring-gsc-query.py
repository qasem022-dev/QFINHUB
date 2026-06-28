"""Phase 35 monitoring — pull page-level GSC data for key targets."""
import sys
import os
sys.path.insert(0, 'scripts')

# Load service account credentials directly (not via the auth module's token)
from google.oauth2 import service_account
import google.auth.transport.requests
import googleapiclient.discovery

KEY_PATH = os.path.expanduser("~/.hermes/gsc-service-account-key.json")
SCOPES = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/indexing",
    "https://www.googleapis.com/auth/analytics.readonly",
]

credentials = service_account.Credentials.from_service_account_file(KEY_PATH, scopes=SCOPES)
credentials.refresh(google.auth.transport.requests.Request())
service = googleapiclient.discovery.build('searchconsole', 'v1', credentials=credentials)
SITE = 'https://www.qfinhub.com'
DATE_RANGE = {'startDate': '2026-06-17', 'endDate': '2026-06-23'}

# --- Page-level targets ---
targets = {
    'parent_compound': 'https://www.qfinhub.com/calculators/compound-interest',
    'parent_mortgage': 'https://www.qfinhub.com/calculators/mortgage-calculator',
    'parent_loan': 'https://www.qfinhub.com/calculators/loan-calculator',
    'blog_20k_loan': 'https://www.qfinhub.com/blog/20000-loan-5-years-8-percent-monthly-payment',
}

print("=== PARENT CALCULATORS + BLOG ===")
for label, url in targets.items():
    request = {
        'startDate': DATE_RANGE['startDate'],
        'endDate': DATE_RANGE['endDate'],
        'dimensions': ['page'],
        'dimensionFilterGroups': [{
            'filters': [{
                'dimension': 'page',
                'operator': 'equals',
                'expression': url
            }]
        }],
        'rowLimit': 5,
        'startRow': 0
    }
    try:
        response = service.searchanalytics().query(siteUrl=SITE, body=request).execute()
        rows = response.get('rows', [])
        if rows:
            r = rows[0]
            keys = r.get('keys', [])
            print(f"  {label}: {r.get('impressions',0)} imp, {r.get('clicks',0)} clicks, CTR {r.get('ctr',0)*100:.2f}%, pos {r.get('position',0):.1f}")
        else:
            print(f"  {label}: 0 imp, 0 clicks (no data)")
    except Exception as e:
        print(f"  {label}: ERROR - {e}")

# --- Noindexed variants ---
print("\n=== NOINDEXED VARIANTS (via query) ===")
variant_queries = ['compound interest 10000', 'mortgage 300000 30 year', 'loan payment 20000']
for q in variant_queries:
    request = {
        'startDate': DATE_RANGE['startDate'],
        'endDate': DATE_RANGE['endDate'],
        'dimensions': ['query', 'page'],
        'dimensionFilterGroups': [{
            'filters': [{
                'dimension': 'query',
                'operator': 'contains',
                'expression': q
            }]
        }],
        'rowLimit': 20,
        'startRow': 0
    }
    try:
        response = service.searchanalytics().query(siteUrl=SITE, body=request).execute()
        rows = response.get('rows', [])
        variant_rows = [r for r in rows if '/tools/' in r.get('keys', ['',''])[1]]
        print(f"  '{q}': {len(variant_rows)} variant page(s)")
        for r in variant_rows[:3]:
            k = r.get('keys', ['?', '?'])
            print(f"    {k[1]}: {r.get('impressions',0)} imp")
    except Exception as e:
        print(f"  '{q}': ERROR - {e}")

# --- /all-pages ---
print("\n=== /all-pages ===")
request = {
    'startDate': DATE_RANGE['startDate'],
    'endDate': DATE_RANGE['endDate'],
    'dimensions': ['page'],
    'dimensionFilterGroups': [{
        'filters': [{
            'dimension': 'page',
            'operator': 'equals',
            'expression': 'https://www.qfinhub.com/all-pages'
        }]
    }],
    'rowLimit': 5,
    'startRow': 0
}
try:
    response = service.searchanalytics().query(siteUrl=SITE, body=request).execute()
    rows = response.get('rows', [])
    if rows:
        r = rows[0]
        print(f"  /all-pages: {r.get('impressions',0)} imp, pos {r.get('position',0):.1f}")
    else:
        print(f"  /all-pages: 0 imp — NOT appearing in GSC (good)")
except Exception as e:
    print(f"  /all-pages: ERROR - {e}")

# --- Content clicks ---
print("\n=== CONTENT CLICKS ===")
request = {
    'startDate': DATE_RANGE['startDate'],
    'endDate': DATE_RANGE['endDate'],
    'dimensions': ['page'],
    'dimensionFilterGroups': [{
        'filters': [{
            'dimension': 'page',
            'operator': 'notContains',
            'expression': '/tools/'
        }]
    }],
    'rowLimit': 250,
    'startRow': 0
}
try:
    response = service.searchanalytics().query(siteUrl=SITE, body=request).execute()
    rows = response.get('rows', [])
    clicks = sum(r.get('clicks', 0) for r in rows)
    print(f"  Non-tool clicks (7d): {clicks}")
    if clicks > 0:
        for r in rows[:5]:
            k = r.get('keys', ['?'])
            print(f"    {k[0]}: {r.get('clicks',0)} clicks, {r.get('impressions',0)} imp")
except Exception as e:
    print(f"  ERROR - {e}")
