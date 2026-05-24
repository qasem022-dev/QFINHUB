#!/usr/bin/env python3
"""Submit the 5 new exact-match blog posts + homepage to Google Indexing API"""
import json, os, time, urllib.request, urllib.error

TOKEN_PATH = os.path.expanduser("~/.hermes/google-indexing-token.json")
OAUTH_PATH = os.path.expanduser("~/.hermes/google-oauth.json")

# Refresh token
with open(TOKEN_PATH) as f:
    td = json.load(f)
with open(OAUTH_PATH) as f:
    oauth = json.load(f)

resp = urllib.request.urlopen(urllib.request.Request(
    "https://oauth2.googleapis.com/token",
    data=urllib.parse.urlencode({
        "client_id": oauth["installed"]["client_id"],
        "client_secret": oauth["installed"]["client_secret"],
        "refresh_token": td["refresh_token"],
        "grant_type": "refresh_token",
    }).encode(),
    headers={"Content-Type": "application/x-www-form-urlencoded"}
))
new_td = json.loads(resp.read())
td["access_token"] = new_td["access_token"]
td["expires_at"] = time.time() + new_td.get("expires_in", 3600) - 60
with open(TOKEN_PATH, "w") as f:
    json.dump(td, f)
token = td["access_token"]

# 5 new blog URLs + homepage
urls = [
    "https://www.qfinhub.com/",
    "https://www.qfinhub.com/blog",
    "https://www.qfinhub.com/blog/20000-loan-5-years-8-percent-monthly-payment",
    "https://www.qfinhub.com/blog/200k-mortgage-payment-30-years",
    "https://www.qfinhub.com/blog/retire-by-40-calculator-how-much-needed",
    "https://www.qfinhub.com/blog/monthly-mortgage-payment-formula-tax-insurance",
    "https://www.qfinhub.com/blog/how-much-mortgage-afford-100k-salary",
]

print(f"📤 Submitting {len(urls)} new URLs to Indexing API...")
submitted = 0
for url in urls:
    try:
        req = urllib.request.Request(
            "https://indexing.googleapis.com/v3/urlNotifications:publish",
            data=json.dumps({"url": url, "type": "URL_UPDATED"}).encode(),
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            submitted += 1
        short = url.split("/")[-1] or "home"
        print(f"  ✅ {short}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"  ❌ {url.split('/')[-1]}: {json.loads(body).get('error',{}).get('message','?')[:80]}")
    time.sleep(0.3)

print(f"\n✅ {submitted}/{len(urls)} submitted")
