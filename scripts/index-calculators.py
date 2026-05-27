#!/usr/bin/env python3
"""
QFINHUB Calculator-First Indexing — Submits ALL 125 calculator pages to Google Indexing API.
Prioritizes calculators (the money pages) over scenarios/tools.
Run: python3 scripts/index-calculators.py
"""
import json, urllib.request, urllib.error, os, sys, time, re
from datetime import datetime
from pathlib import Path

TOKEN_FILE = os.path.expanduser("~/.hermes/google-indexing-token.json")
PROJECT_DIR = "/home/admin1/qfinhub"
LOG_FILE = os.path.expanduser("~/.hermes/logs/indexing-engine-log.json")

def get_token():
    try:
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        return data.get("access_token")
    except:
        return None

def refresh_token():
    try:
        with open(TOKEN_FILE) as f:
            data = json.load(f)
        refresh = data.get("refresh_token")
        if not refresh:
            return None
        oauth_file = os.path.expanduser("~/.hermes/google-oauth.json")
        with open(oauth_file) as f:
            oauth = json.load(f)
        client_id = oauth["installed"]["client_id"]
        client_secret = oauth["installed"]["client_secret"]
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
        data["access_token"] = new_data["access_token"]
        data["expires_in"] = new_data.get("expires_in", 3600)
        with open(TOKEN_FILE, "w") as f:
            json.dump(data, f)
        return new_data["access_token"]
    except Exception as e:
        return None

def submit_url(url, token):
    data = json.dumps({"url": url, "type": "URL_UPDATED"}).encode()
    req = urllib.request.Request(
        "https://indexing.googleapis.com/v3/urlNotifications:publish",
        data=data,
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return True, None
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            msg = json.loads(body).get("error", {}).get("message", str(e))
        except:
            msg = str(e)
        return False, msg

def get_all_calculator_urls():
    """Extract ALL 125 calculator slugs from index.ts."""
    index_file = os.path.join(PROJECT_DIR, "src/lib/calculators/index.ts")
    with open(index_file) as f:
        slugs = re.findall(r'slug:\s*"([^"]+)"', f.read())
    return [f"https://www.qfinhub.com/calculators/{s}" for s in slugs]

def get_all_blog_urls():
    """Get ALL blog post slugs."""
    posts_file = os.path.join(PROJECT_DIR, "src/lib/blog/posts.ts")
    with open(posts_file) as f:
        slugs = re.findall(r'slug:\s*"([^"]+)"', f.read())
    return [f"https://www.qfinhub.com/blog/{s}" for s in slugs]

def main():
    print("=" * 55)
    print("📊 QFINHUB Calculator-First Indexing")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)

    token = get_token()
    if not token:
        print("⚠️  Refreshing token...")
        token = refresh_token()
    if not token:
        print("❌ No valid token")
        return

    # Build URL list — calculators FIRST (the money pages)
    urls = []
    calc_urls = get_all_calculator_urls()
    print(f"\n📐 Found {len(calc_urls)} calculator URLs")
    urls.extend(calc_urls)  # ALL 125 calculators

    # Then blogs
    blog_urls = get_all_blog_urls()
    print(f"📝 Found {len(blog_urls)} blog URLs")
    
    # Add blogs to fill remaining quota
    remaining = 85 - len(urls)
    if remaining > 0:
        urls.extend(blog_urls[-remaining:])

    urls = list(dict.fromkeys(urls))[:85]
    print(f"\n📤 Submitting {len(urls)} URLs (calculators + blogs)...")
    print("-" * 55)

    success = 0
    failed = 0
    errors = []

    for i, url in enumerate(urls):
        ok, error = submit_url(url, token)
        if ok:
            success += 1
            slug = url.rsplit("/", 1)[-1] or "home"
            cat = "📐" if "/calculators/" in url else "📝"
            print(f"  ✅ [{i+1}/{len(urls)}] {cat} {slug[:50]}")
        else:
            if "429" in str(error) or "RESOURCE_EXHAUSTED" in str(error) or "Quota exceeded" in str(error):
                print(f"  ⛔ Rate limited at {i} — stopping")
                break
            elif "401" in str(error):
                token = refresh_token()
                if token:
                    ok, error = submit_url(url, token)
                    if ok:
                        success += 1
                        continue
            failed += 1
            errors.append(str(error)[:100])
            slug = url.rsplit("/", 1)[-1] or "home"
            print(f"  ❌ [{i+1}/{len(urls)}] {slug[:50]}")

        time.sleep(0.25)

    print(f"\n{'='*55}")
    print(f"✅ {success} submitted | ❌ {failed} failed | 📊 {len(urls)} total")

    # Log
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "submitted": success,
        "failed": failed,
        "total_urls": len(urls),
        "type": "calculator-first",
        "errors": errors[:3],
    }
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    print(f"📊 Logged to {LOG_FILE}")

if __name__ == "__main__":
    main()
