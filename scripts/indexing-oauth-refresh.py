#!/usr/bin/env python3
"""
Phase 5 Step 1: Re-authorize Google OAuth via CloakBrowser
Uses the `google-account` profile (already logged into q.finhub@gmail.com).

Strategy: Use redirect_uri=http://localhost (standard Desktop-app pattern
accepted by Google). Bind a server on localhost:80 to capture the redirect,
OR (if port 80 unavailable) capture the URL from Playwright directly.

Sync Playwright. Real-time logging.
"""
import os, json, urllib.request, urllib.parse, time, sys, re
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from threading import Thread

OAUTH_KEY = Path.home() / '.hermes' / 'google-oauth.json'
TOKEN_PATH = Path.home() / '.hermes' / 'google-indexing-token.json'
PROFILE_DIR = '/home/admin1/.hermes/cloak-profiles/google-account'
SCOPES = ['https://www.googleapis.com/auth/indexing']

# Capture the code from the redirect
captured_code = None
captured_error = None

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global captured_code, captured_error
        parsed = urllib.parse.urlparse(self.path)
        qs = urllib.parse.parse_qs(parsed.query)
        print('  [callback server] GET ' + self.path[:200])
        if 'code' in qs:
            captured_code = qs['code'][0]
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><h2>Authorization complete</h2><p>You can close this tab now.</p></body></html>')
        elif 'error' in qs:
            captured_error = qs.get('error', ['unknown'])[0]
            self.send_response(400)
            self.send_header('Content-Type', 'text/html')
            self.end_headers()
            self.wfile.write(b'<html><body><h2>Authorization error</h2></body></html>')
        else:
            self.send_response(404)
            self.end_headers()
    def log_message(self, *args):
        pass

def start_callback_server(port):
    """Try to bind port; if port=80 is taken, fail loudly."""
    server = HTTPServer(('127.0.0.1', port), CallbackHandler)
    t = Thread(target=server.serve_forever, daemon=True)
    t.start()
    return server

def get_auth_url():
    cfg = json.loads(OAUTH_KEY.read_text())['installed']
    redirect_uri = 'http://localhost'
    params = {
        'client_id': cfg['client_id'],
        'redirect_uri': redirect_uri,
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent',
    }
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params), redirect_uri

def exchange_code(code, redirect_uri):
    cfg = json.loads(OAUTH_KEY.read_text())['installed']
    data = urllib.parse.urlencode({
        'code': code.strip(),
        'client_id': cfg['client_id'],
        'client_secret': cfg['client_secret'],
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }).encode()
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())

def main():
    global captured_code, captured_error
    os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')

    # Try port 80 first (matches Google OAuth Desktop pattern "http://localhost")
    server = None
    port = 80
    try:
        server = start_callback_server(port)
        print('✅ Callback server listening on http://localhost:' + str(port))
    except OSError as e:
        print('❌ Could not bind port 80: ' + str(e))
        print('   Will fall back to Playwright URL capture')
        server = None

    auth_url, redirect_uri = get_auth_url()

    from cloakbrowser import launch_persistent_context
    print('Launching CloakBrowser...')
    ctx = launch_persistent_context(user_data_dir=PROFILE_DIR, headless=True)
    page = ctx.new_page()
    page.set_viewport_size({'width': 1920, 'height': 1080})

    # Log all navigations
    page.on('framenavigated', lambda f: print('  [nav] ' + f.url[:200]))

    print('Navigating to auth URL...')
    try:
        page.goto(auth_url, wait_until='domcontentloaded', timeout=30000)
    except Exception as e:
        print('goto error (may be OK if redirected): ' + str(e))

    # Wait for code via either: callback server (port 80) OR browser URL change
    print('Waiting for consent grant (max 90s)...')
    cur_url = ''
    for attempt in range(90):
        time.sleep(1)
        if captured_code:
            print('✅ Code captured via callback server after ' + str(attempt+1) + 's')
            break
        if captured_error:
            print('❌ OAuth error: ' + captured_error)
            break
        # Fallback: capture URL from Playwright
        try:
            cur_url = page.url
            if 'code=' in cur_url and 'localhost' in cur_url:
                m = re.search(r'code=([^&]+)', cur_url)
                if m:
                    captured_code = m.group(1)
                    print('✅ Code captured via URL inspection after ' + str(attempt+1) + 's')
                    break
        except Exception:
            pass
        if attempt % 15 == 14:
            print('  still waiting... ' + str(attempt+1) + 's, url=' + cur_url[:120])

    # Capture final URL for diagnostics
    try:
        print('Final URL: ' + page.url[:300])
    except Exception:
        pass

    ctx.close()
    if server:
        server.shutdown()

    if not captured_code:
        print('❌ No code captured. Aborting.')
        sys.exit(1)

    print('Exchanging code for refresh token...')
    tok = exchange_code(captured_code, redirect_uri)
    tok['created_at'] = time.time()
    TOKEN_PATH.write_text(json.dumps(tok))
    print('✅ Token saved to ' + str(TOKEN_PATH))
    print('   refresh_token: ' + str(bool(tok.get('refresh_token'))))
    print('   access_token: ' + str(bool(tok.get('access_token'))))
    print('   expires_in: ' + str(tok.get('expires_in')))

if __name__ == '__main__':
    main()