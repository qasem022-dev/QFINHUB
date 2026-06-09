#!/usr/bin/env python3
"""Desktop OAuth flow — out-of-band method (no localhost server needed).
You open the link in your browser, Google shows a code, you paste it here.
Once done, the refresh token auto-refreshes forever — no browser needed again.
"""
import urllib.request, urllib.parse, json, os, sys, subprocess

TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")

with open(TOKEN_PATH) as f:
    tok = json.load(f)

CLIENT_ID = tok["client_id"]
CLIENT_SECRET = tok["client_secret"]
SCOPES = [
    "https://www.googleapis.com/auth/webmasters",
    "https://www.googleapis.com/auth/indexing",
    "https://www.googleapis.com/auth/analytics.readonly",
]

# Out-of-band redirect — Google shows code on a page instead of redirecting
auth_params = urllib.parse.urlencode({
    "client_id": CLIENT_ID,
    "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
    "response_type": "code",
    "scope": " ".join(SCOPES),
    "access_type": "offline",
    "prompt": "consent",
})
auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{auth_params}"

print("=" * 60)
print("FULL GSC CONTROL SETUP — one-time authorization")
print("=" * 60)
print(f"\n1. Open this link in YOUR browser (on Windows):\n")
print(f"   {auth_url}\n")
print("2. Sign in with q.finhub@gmail.com")
print("3. Google will show you an authorization CODE")
print("4. Copy the ENTIRE code and paste it below\n")

# Try to open in Windows browser
try:
    subprocess.run(["cmd.exe", "/c", "start", "", auth_url], timeout=5)
    print("(Tried to open in your Windows browser)\n")
except:
    pass

# Accept code as CLI argument or from stdin
if len(sys.argv) > 1:
    code = sys.argv[1].strip()
else:
    try:
        code = input("Paste the authorization code: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nCancelled.")
        sys.exit(1)

if not code or len(code) < 10:
    print("Invalid code.")
    sys.exit(1)

# Extract just the code (user might paste "4/0Aan..." or the full URL)
if "code=" in code:
    from urllib.parse import urlparse, parse_qs
    parsed = urlparse(code)
    params = parse_qs(parsed.query)
    if "code" in params:
        code = params["code"][0]
        print(f"Extracted code from URL.")

print(f"\nExchanging code for tokens...")

token_body = urllib.parse.urlencode({
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "code": code,
    "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
    "grant_type": "authorization_code",
}).encode()

req = urllib.request.Request("https://oauth2.googleapis.com/token", data=token_body)
try:
    resp = urllib.request.urlopen(req)
    new_tok = json.loads(resp.read())
except urllib.error.HTTPError as e:
    err = e.read().decode()
    print(f"\n❌ Token exchange failed: {err}")
    if "redirect_uri_mismatch" in err:
        print("   OOB redirect might be blocked for this client. Trying localhost method...")
        sys.exit(2)
    sys.exit(1)

# Update token file
tok["access_token"] = new_tok["access_token"]
if "refresh_token" in new_tok:
    tok["refresh_token"] = new_tok["refresh_token"]
    print(f"✅ New refresh token obtained!")

with open(TOKEN_PATH, "w") as f:
    json.dump(tok, f)

# Test the new token
print(f"\nTesting token with URL Inspection API...")
test_body = json.dumps({
    "inspectionUrl": "https://www.qfinhub.com/",
    "siteUrl": "https://www.qfinhub.com/"
}).encode()
test_req = urllib.request.Request(
    "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
    data=test_body,
    headers={"Authorization": f"Bearer {tok['access_token']}", "Content-Type": "application/json"}
)
try:
    test_resp = urllib.request.urlopen(test_req, timeout=10)
    test_data = json.loads(test_resp.read())
    insp = test_data.get("inspectionResult", {}).get("indexStatusResult", {})
    print(f"✅ API WORKS! coverageState: {insp.get('coverageState', 'N/A')}")
    print(f"   verdict: {insp.get('verdict', 'N/A')}")
    print(f"   lastCrawlTime: {insp.get('lastCrawlTime', 'N/A')}")
except urllib.error.HTTPError as e:
    err_body = e.read().decode()
    print(f"❌ API test failed: HTTP {e.code}")
    print(f"   {err_body[:300]}")
    sys.exit(1)

# Test auto-refresh works
print(f"\nTesting auto-refresh...")
refresh_body = urllib.parse.urlencode({
    "client_id": CLIENT_ID,
    "client_secret": CLIENT_SECRET,
    "refresh_token": tok["refresh_token"],
    "grant_type": "refresh_token",
}).encode()
refresh_req = urllib.request.Request("https://oauth2.googleapis.com/token", data=refresh_body)
try:
    refresh_resp = urllib.request.urlopen(refresh_req)
    refresh_data = json.loads(refresh_resp.read())
    print(f"✅ Auto-refresh WORKS — future refreshes are fully automatic!\n")
except urllib.error.HTTPError as e:
    print(f"⚠️  Auto-refresh failed: {e.read().decode()[:200]}")
    print(f"   This is fine NOW but the token will expire in ~1 hour.\n")

print("=" * 60)
print("✅ FULL GSC CONTROL is now active for Hermes!")
print("=" * 60)
print(f"Token saved to: {TOKEN_PATH}")
print(f"Auto-refresh: python3 scripts/refresh-gsc-token.py")
print(f"\nVerification: python3 scripts/refresh-gsc-token.py")
