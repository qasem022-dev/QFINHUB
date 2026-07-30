#!/usr/bin/env python3
"""
Manual OAuth re-authorization for Google Indexing API.
You do the browser steps yourself; this script just generates the URL,
exchanges the code you paste, and saves the token.

Usage:
  python3 scripts/indexing-oauth-refresh.py --manual
"""
import sys, json, urllib.request, urllib.parse, time
from pathlib import Path

OAUTH_KEY = Path.home() / '.hermes' / 'google-oauth.json'
TOKEN_PATH = Path.home() / '.hermes' / 'google-indexing-token.json'
SCOPES = ['https://www.googleapis.com/auth/indexing']

REDIRECT_URI = 'http://localhost'  # standard Desktop-app redirect accepted by Google

def get_auth_url():
    cfg = json.loads(OAUTH_KEY.read_text())['installed']
    params = {
        'client_id': cfg['client_id'],
        'redirect_uri': REDIRECT_URI,
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent',
    }
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)

def exchange_code(code):
    cfg = json.loads(OAUTH_KEY.read_text())['installed']
    data = urllib.parse.urlencode({
        'code': code.strip(),
        'client_id': cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'redirect_uri': REDIRECT_URI,
        'grant_type': 'authorization_code',
    }).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'HTTP {e.code}: {body}')
        return None

def main():
    url = get_auth_url()
    print('=' * 70)
    print('STEP 1 — Open this URL in your browser:')
    print('=' * 70)
    print()
    print(url)
    print()
    print('=' * 70)
    print('STEP 2 — Sign in with q.finhub@gmail.com')
    print('STEP 3 — Click "Allow" on the consent screen')
    print('STEP 4 — Your browser will fail to load http://localhost (this is normal).')
    print('         The address bar will show:')
    print('           http://localhost/?code=XXXX&scope=...')
    print('         Copy the ENTIRE address bar URL and paste it below.')
    print('=' * 70)
    print()

    code_input = input('Paste the redirect URL (or just the code value): ').strip()

    # Extract code if user pasted full URL
    if code_input.startswith('http'):
        import re
        m = re.search(r'code=([^&]+)', code_input)
        if not m:
            print('ERROR: Could not find code= in URL')
            sys.exit(1)
        code = m.group(1)
    else:
        code = code_input

    print(f'\nExchanging code (first 20 chars): {code[:20]}...')
    tok = exchange_code(code)
    if not tok:
        print('Token exchange failed.')
        sys.exit(1)

    if 'error' in tok:
        print(f'OAuth error: {tok}')
        sys.exit(1)

    tok['created_at'] = time.time()
    TOKEN_PATH.write_text(json.dumps(tok))
    print('=' * 70)
    print('SUCCESS — Token saved to ' + str(TOKEN_PATH))
    print('  refresh_token: ' + str(bool(tok.get('refresh_token'))))
    print('  access_token: ' + str(bool(tok.get('access_token'))))
    print('  expires_in: ' + str(tok.get('expires_in')) + 's')
    print('=' * 70)

if __name__ == '__main__':
    if '--manual' in sys.argv:
        main()
    else:
        print('Run with --manual for manual auth flow')