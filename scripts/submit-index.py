#!/usr/bin/env python3
"""
Google Indexing API — Full OAuth 2.0 Integration
=================================================
Submits URLs to Google Indexing API for immediate crawling.
Uses OAuth 2.0 with refresh token storage.

SETUP (one-time):
  1. Go to https://console.cloud.google.com/apis/credentials
  2. Create OAuth 2.0 Client ID (Desktop app type)
  3. Download JSON, save as ~/.hermes/google-oauth.json
  4. Run: python3 scripts/submit-index.py --auth
  5. Complete the browser authorization flow
  6. Token saved for future use

USAGE:
  python3 scripts/submit-index.py              # Submit top 20 URLs
  python3 scripts/submit-index.py --all        # Submit all 35 URLs
  python3 scripts/submit-index.py --url <URL>  # Submit a single URL
  python3 scripts/submit-index.py --auth       # Re-authenticate
"""
import sys, os, json, time, urllib.request, urllib.parse, urllib.error
import webbrowser
from pathlib import Path

# Configuration
OAUTH_KEY_PATH = Path.home() / '.hermes' / 'google-oauth.json'
TOKEN_PATH = Path.home() / '.hermes' / 'google-indexing-token.json'
SCOPES = ['https://www.googleapis.com/auth/indexing']

TOP_URLS = [
    "https://www.qfinhub.com/",
    "https://www.qfinhub.com/calculators",
    "https://www.qfinhub.com/blog",
    "https://www.qfinhub.com/calculators/mortgage-calculator",
    "https://www.qfinhub.com/calculators/compound-interest",
    "https://www.qfinhub.com/calculators/retirement-planning",
    "https://www.qfinhub.com/calculators/debt-snowball",
    "https://www.qfinhub.com/calculators/budget-planner",
    "https://www.qfinhub.com/calculators/loan-calculator",
    "https://www.qfinhub.com/calculators/tax-calculator",
    "https://www.qfinhub.com/calculators/credit-card-payoff",
    "https://www.qfinhub.com/calculators/mortgage-affordability",
    "https://www.qfinhub.com/calculators/investment-calculator",
    "https://www.qfinhub.com/calculators/cd-calculator",
    "https://www.qfinhub.com/calculators/salary-calculator",
    "https://www.qfinhub.com/calculators/inflation-calculator",
    "https://www.qfinhub.com/calculators/net-worth-calculator",
    "https://www.qfinhub.com/calculators/roi-calculator",
    "https://www.qfinhub.com/calculators/401k-calculator",
    "https://www.qfinhub.com/calculators/self-employed-tax",
]

MORE_URLS = [
    "https://www.qfinhub.com/calculators/debt-avalanche",
    "https://www.qfinhub.com/calculators/amortization-schedule",
    "https://www.qfinhub.com/calculators/auto-loan",
    "https://www.qfinhub.com/calculators/student-loan",
    "https://www.qfinhub.com/calculators/personal-loan",
    "https://www.qfinhub.com/calculators/refinance-calculator",
    "https://www.qfinhub.com/calculators/biweekly-mortgage",
    "https://www.qfinhub.com/calculators/savings-goal",
    "https://www.qfinhub.com/calculators/emergency-fund",
    "https://www.qfinhub.com/calculators/capital-gains-tax",
    "https://www.qfinhub.com/calculators/dividend-calculator",
    "https://www.qfinhub.com/calculators/cagr-calculator",
    "https://www.qfinhub.com/calculators/retirement-calculator",
    "https://www.qfinhub.com/calculators/mortgage-payoff",
    "https://www.qfinhub.com/calculators/debt-to-income",
]

def load_oauth_config():
    """Load OAuth client configuration."""
    if not OAUTH_KEY_PATH.exists():
        print(f"❌ OAuth key not found at {OAUTH_KEY_PATH}")
        print("\n📋 Setup Instructions:")
        print("1. Go to https://console.cloud.google.com/apis/credentials")
        print("2. Click '+ CREATE CREDENTIALS' → 'OAuth client ID'")
        print("3. Choose 'Desktop app' as application type")
        print("4. Name it 'QFINHUB Indexing'")
        print("5. Download the JSON file")
        print(f"6. Save it as: {OAUTH_KEY_PATH}")
        return None
    
    with open(OAUTH_KEY_PATH) as f:
        config = json.load(f)
    
    # Support both 'installed' and 'web' format
    if 'installed' in config:
        return config['installed']
    if 'web' in config:
        return config['web']
    return config

def get_auth_url(config):
    """Generate the OAuth 2.0 authorization URL."""
    params = {
        'client_id': config['client_id'],
        'redirect_uri': 'urn:ietf:wg:oauth:2.0:oob',
        'response_type': 'code',
        'scope': ' '.join(SCOPES),
        'access_type': 'offline',
        'prompt': 'consent',
    }
    return 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode(params)

def exchange_code_for_token(config, code):
    """Exchange authorization code for refresh token."""
    data = urllib.parse.urlencode({
        'code': code,
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'redirect_uri': 'urn:ietf:wg:oauth:2.0:oob',
        'grant_type': 'authorization_code',
    }).encode()
    
    req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
    resp = urllib.request.urlopen(req, timeout=15)
    token_data = json.loads(resp.read())
    
    # Save token
    token_data['created_at'] = time.time()
    TOKEN_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(TOKEN_PATH, 'w') as f:
        json.dump(token_data, f)
    
    print(f"✅ Token saved to {TOKEN_PATH}")
    return token_data

def refresh_access_token(config):
    """Refresh the access token using refresh token."""
    if not TOKEN_PATH.exists():
        return None
    
    with open(TOKEN_PATH) as f:
        token_data = json.load(f)
    
    refresh_token = token_data.get('refresh_token')
    if not refresh_token:
        return None
    
    data = urllib.parse.urlencode({
        'client_id': config['client_id'],
        'client_secret': config['client_secret'],
        'refresh_token': refresh_token,
        'grant_type': 'refresh_token',
    }).encode()
    
    try:
        req = urllib.request.Request('https://oauth2.googleapis.com/token', data=data)
        resp = urllib.request.urlopen(req, timeout=15)
        new_token = json.loads(resp.read())
        
        # Update token but keep refresh token
        token_data['access_token'] = new_token['access_token']
        token_data['expires_in'] = new_token.get('expires_in', 3600)
        token_data['created_at'] = time.time()
        
        with open(TOKEN_PATH, 'w') as f:
            json.dump(token_data, f)
        
        return new_token['access_token']
    except Exception as e:
        print(f"Token refresh failed: {e}")
        return None

def get_access_token(config):
    """Get a valid access token, refreshing if needed."""
    if TOKEN_PATH.exists():
        with open(TOKEN_PATH) as f:
            token_data = json.load(f)
        
        # Check if still valid
        created = token_data.get('created_at', 0)
        expires = token_data.get('expires_in', 3600)
        if time.time() - created < expires - 60:
            return token_data['access_token']
    
    # Need to refresh
    return refresh_access_token(config)

def notify_google(url, access_token):
    """Notify Google that a URL has been updated (URL_UPDATED)."""
    api_url = 'https://indexing.googleapis.com/v3/urlNotifications:publish'
    
    body = json.dumps({
        'url': url,
        'type': 'URL_UPDATED'
    }).encode()
    
    req = urllib.request.Request(api_url, data=body, headers={
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {access_token}',
    })
    
    try:
        resp = urllib.request.urlopen(req, timeout=15)
        result = json.loads(resp.read())
        return True, result
    except urllib.error.HTTPError as e:
        error_body = e.read().decode()
        return False, f"HTTP {e.code}: {error_body[:200]}"
    except Exception as e:
        return False, str(e)

def do_auth_flow():
    """Complete the OAuth authorization flow."""
    config = load_oauth_config()
    if not config:
        return False
    
    auth_url = get_auth_url(config)
    
    print("\n" + "=" * 60)
    print("🔐 Google OAuth Authorization Required")
    print("=" * 60)
    print("\n1. Open this URL in your browser:\n")
    print(f"   {auth_url}\n")
    print("2. Sign in with your Google account (q.finhub@gmail.com)")
    print("3. Click 'Allow' to grant Indexing API access")
    print("4. Copy the authorization code shown\n")
    
    # Try to open browser
    try:
        webbrowser.open(auth_url)
        print("📂 Browser opened automatically.")
    except:
        pass
    
    code = input("Paste authorization code: ").strip()
    
    if not code:
        print("❌ No code provided")
        return False
    
    token_data = exchange_code_for_token(config, code)
    if token_data:
        print("✅ Authorization complete!")
        return True
    return False

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Google Indexing API URL Submitter')
    parser.add_argument('--auth', action='store_true', help='Run OAuth authorization flow')
    parser.add_argument('--all', action='store_true', help='Submit all 35 URLs')
    parser.add_argument('--url', help='Submit a single URL')
    parser.add_argument('--list', action='store_true', help='List URLs without submitting')
    args = parser.parse_args()
    
    if args.list:
        print("Top 20 URLs:")
        for i, u in enumerate(TOP_URLS, 1):
            print(f"  {i:2d}. {u}")
        return
    
    if args.auth:
        do_auth_flow()
        return
    
    # Load config and get token
    config = load_oauth_config()
    if not config:
        print("\n💡 Run with --auth for first-time setup")
        return
    
    access_token = get_access_token(config)
    if not access_token:
        print("❌ No valid access token. Run with --auth to authorize.")
        return
    
    # Determine URLs
    if args.url:
        urls = [args.url]
    elif args.all:
        urls = TOP_URLS + MORE_URLS
    else:
        urls = TOP_URLS
    
    print("=" * 60)
    print(f"Google Indexing API — URL_UPDATED Notification")
    print(f"URLs to submit: {len(urls)}")
    print("=" * 60)
    
    success = 0
    for i, url in enumerate(urls, 1):
        print(f"[{i}/{len(urls)}] {url}")
        ok, result = notify_google(url, access_token)
        
        if ok:
            success += 1
            notify_time = result.get('urlNotificationMetadata', {}).get('latestUpdate', {}).get('notifyTime', 'now')
            print(f"   ✅ Submitted ({notify_time})")
        else:
            print(f"   ❌ {result}")
        
        if i < len(urls):
            time.sleep(1)
    
    print(f"\n{'='*60}")
    print(f"Results: {success}/{len(urls)} submitted")
    print(f"{'='*60}")

if __name__ == '__main__':
    main()
