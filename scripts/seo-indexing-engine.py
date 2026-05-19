#!/usr/bin/env python3
"""
QFINHUB Daily Indexing Engine
Submits new and updated pages to Google Indexing API.
Run: python3 scripts/seo-indexing-engine.py
"""
import json, urllib.request, urllib.error, os, sys
from datetime import datetime, timedelta

TOKEN_FILE = os.path.expanduser("~/.hermes/google-indexing-token.json")
LOG_FILE = os.path.expanduser("~/.hermes/logs/indexing-engine-log.json")
PROJECT_DIR = os.path.expanduser("/home/admin1/qfinhub")

# Priority pages to always submit
PRIORITY_URLS = [
    "https://www.qfinhub.com/",
    "https://www.qfinhub.com/calculators",
    "https://www.qfinhub.com/blog",
    # Top calculators (high search volume)
    "https://www.qfinhub.com/calculators/mortgage-calculator",
    "https://www.qfinhub.com/calculators/compound-interest",
    "https://www.qfinhub.com/calculators/retirement-planning",
    "https://www.qfinhub.com/calculators/tax-calculator",
    "https://www.qfinhub.com/calculators/401k-calculator",
    "https://www.qfinhub.com/calculators/debt-snowball",
    "https://www.qfinhub.com/calculators/budget-planner",
    # More high-value calculators
    "https://www.qfinhub.com/calculators/auto-loan",
    "https://www.qfinhub.com/calculators/credit-card-payoff",
    "https://www.qfinhub.com/calculators/loan-calculator",
    "https://www.qfinhub.com/calculators/amortization-schedule",
    "https://www.qfinhub.com/calculators/refinance-calculator",
    "https://www.qfinhub.com/calculators/rent-vs-buy",
    "https://www.qfinhub.com/calculators/investment-return",
    "https://www.qfinhub.com/calculators/retirement-savings",
    "https://www.qfinhub.com/calculators/annuity-calculator",
    "https://www.qfinhub.com/calculators/roi-calculator",
    "https://www.qfinhub.com/calculators/roi-cagr",
    "https://www.qfinhub.com/calculators/net-worth",
    "https://www.qfinhub.com/calculators/mortgage-affordability",
    "https://www.qfinhub.com/calculators/debt-to-income",
    "https://www.qfinhub.com/calculators/car-loan",
    "https://www.qfinhub.com/calculators/savings-goal",
    "https://www.qfinhub.com/calculators/financial-independence",
    "https://www.qfinhub.com/calculators/fire-calculator",
    "https://www.qfinhub.com/calculators/emergency-fund",
    "https://www.qfinhub.com/calculators/inflation-calculator",
]

def get_token():
    try:
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        return data.get("access_token")
    except:
        return None

def refresh_token():
    """Attempt to refresh the token using refresh_token"""
    try:
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        refresh = data.get("refresh_token")
        if not refresh:
            return False
        
        # Read client secret
        oauth_file = os.path.expanduser("~/.hermes/google-oauth.json")
        with open(oauth_file) as f:
            oauth = json.load(f)
        
        client_id = oauth["installed"]["client_id"]
        client_secret = oauth["installed"]["client_secret"]
        
        import urllib.parse
        params = urllib.parse.urlencode({
            "client_id": client_id,
            "client_secret": client_secret,
            "refresh_token": refresh,
            "grant_type": "refresh_token",
        }).encode()
        
        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=params,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            new_data = json.loads(resp.read())
        
        # Save updated token
        data["access_token"] = new_data["access_token"]
        data["expires_in"] = new_data.get("expires_in", 3600)
        with open(TOKEN_FILE, "w") as f:
            json.dump(data, f)
        
        return new_data["access_token"]
    except Exception as e:
        print(f"  ⚠️ Token refresh failed: {e}")
        return None

def submit_url(url, token):
    """Submit a single URL to Indexing API"""
    data = json.dumps({"url": url, "type": "URL_UPDATED"}).encode()
    req = urllib.request.Request(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        data=data,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return True, None
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        error = json.loads(body).get("error", {})
        return False, error.get("message", str(e))

def get_recent_blog_posts():
    """Get blog posts added in the last 48 hours"""
    posts_file = os.path.join(PROJECT_DIR, "src/lib/blog/posts.ts")
    if not os.path.exists(posts_file):
        return []
    
    with open(posts_file) as f:
        content = f.read()
    
    import re
    slugs = re.findall(r'slug:\s*"([^"]+)"', content)
    
    # Return the last 10 blog slugs
    urls = [f"https://www.qfinhub.com/blog/{s}" for s in slugs[-10:]]
    return urls

def get_tool_variant_pages():
    """Get programmatic /tools variant page slugs"""
    variants_file = os.path.join(PROJECT_DIR, "src/lib/programmatic-seo/variant-templates.ts")
    if not os.path.exists(variants_file):
        return []
    
    with open(variants_file) as f:
        content = f.read()
    
    import re
    slugs = re.findall(r'slug:\s*"([^"]+)"', content)
    
    # Return up to 20 tool variant URLs
    urls = [f"https://www.qfinhub.com/tools/{s}" for s in slugs[:20]]
    return urls

def log_result(success, failed, errors):
    """Log results to JSON log file"""
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "submitted": success,
        "failed": failed,
        "errors": errors[:3],  # Keep first 3 errors
    }
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")
    except:
        pass

def main():
    print("=" * 50)
    print("🔍 QFINHUB Daily Indexing Engine")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    # Get token
    token = get_token()
    if not token:
        print("⚠️ No token found. Trying refresh...")
        token = refresh_token()
    
    if not token:
        print("❌ No valid token. Run: python3 scripts/submit-index.py --auth")
        return
    
    # Build URL list
    urls = list(PRIORITY_URLS)
    blog_urls = get_recent_blog_posts()
    urls.extend([u for u in blog_urls if u not in urls])
    tool_urls = get_tool_variant_pages()
    urls.extend([u for u in tool_urls if u not in urls][:15])  # Cap tool pages at 15 to avoid rate limits
    
    print(f"\n📤 Submitting {len(urls)} URLs...")
    
    success = 0
    failed = 0
    errors = []
    
    for url in urls:
        ok, error = submit_url(url, token)
        if ok:
            success += 1
            short = url.split("/")[-1] or "home"
            print(f"  ✅ {short}")
        else:
            failed += 1
            if "Unauthorized" in str(error) or "401" in str(error):
                print("  🔄 Token expired, refreshing...")
                token = refresh_token()
                if token:
                    ok, error = submit_url(url, token)
                    if ok:
                        success += 1
                        continue
            errors.append(str(error)[:100])
            short = url.split("/")[-1] or "home"
            print(f"  ❌ {short}")
    
    print(f"\n{'='*50}")
    print(f"✅ {success} submitted | ❌ {failed} failed")
    
    log_result(success, failed, errors)

if __name__ == "__main__":
    main()
