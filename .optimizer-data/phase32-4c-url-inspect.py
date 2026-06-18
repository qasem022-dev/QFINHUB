import json, time, urllib.request, os, socket
socket.setdefaulttimeout(8)

token = json.load(open(os.path.expanduser('~/.hermes/google-indexing-token.json')))['access_token']

urls = [
    'https://www.qfinhub.com/loan-scenarios/small-emergency-loan-5000-15-percent',
    'https://www.qfinhub.com/loan-scenarios/good-credit-loan-20000-8-percent',
    'https://www.qfinhub.com/loan-scenarios/debt-consolidation-loan-25000-10-percent',
    'https://www.qfinhub.com/loan-scenarios/fair-credit-loan-20000-20-percent',
    'https://www.qfinhub.com/loan-payment-table',
    'https://www.qfinhub.com/data',
]

results = {}
for url in urls:
    try:
        p = json.dumps({'inspectionUrl': url, 'siteUrl': 'https://www.qfinhub.com/', 'languageCode': 'en-US'}).encode()
        req = urllib.request.Request('https://searchconsole.googleapis.com/v1/urlInspection/index:inspect', data=p, headers={'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'})
        d = json.loads(urllib.request.urlopen(req, timeout=8).read())
        ir = d.get('inspectionResult', {}).get('indexStatusResult', {})
        slug = url.split('qfinhub.com')[-1]
        results[slug] = {'verdict': ir.get('verdict', '?'), 'coverageState': ir.get('coverageState', ''), 'lastCrawlTime': ir.get('lastCrawlTime', '')}
        print(f'{slug}: {ir.get("coverageState")}')
    except Exception as e:
        print(f'{url}: ERR {str(e)[:60]}')
        results[slug] = {'error': str(e)[:100]}
    time.sleep(1.5)

with open('.optimizer-data/phase32-4c-url-inspection.json', 'w') as f:
    json.dump(results, f, indent=2)
print('Saved')
