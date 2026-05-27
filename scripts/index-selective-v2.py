#!/usr/bin/env python3
"""
QFINHUB V2 — Selective Indexing Engine
========================================
Only submits pages that PASS the V2 quality gate:
- Pages with impressions > 0 (Google already showing them)
- Top 25 calculator pages (core authority)
- Blog posts from last 7 days (fresh content)
- NO formula-based variant pages
- NO parameter scenarios
- NO thin content

Replaces: seo-indexing-engine.py (mass submission)
"""

import json, urllib.request, urllib.error, os, sys, time, re
from datetime import datetime, timedelta
from pathlib import Path

TOKEN_FILE = os.path.expanduser("~/.hermes/google-indexing-token.json")
LOG_FILE = os.path.expanduser("~/.hermes/logs/indexing-engine-log.json")
PROJECT_DIR = "/home/admin1/qfinhub"

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
            "client_id": client_id, "client_secret": client_secret,
            "refresh_token": refresh, "grant_type": "refresh_token",
        }).encode()
        req = urllib.request.Request(
            "https://oauth2.googleapis.com/token",
            data=params,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            new_data = json.loads(resp.read())
        data["access_token"] = new_data["access_token"]
        with open(TOKEN_FILE, "w") as f:
            json.dump(data, f)
        return new_data["access_token"]
    except:
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

def get_quality_urls():
    """V2: Only return URLs that pass the quality gate."""
    urls = []
    
    # 1. Pages with GSC impressions (Google is already showing them)
    briefing_file = os.path.join(PROJECT_DIR, ".optimizer-data", "growth-briefing.json")
    if os.path.exists(briefing_file):
        with open(briefing_file) as f:
            briefing = json.load(f)
        for t in briefing.get("gsc", {}).get("low_ctr_targets", []):
            urls.append(t["page"])
    
    # 2. Top 25 calculators (core authority pages)
    calc_index = os.path.join(PROJECT_DIR, "src/lib/calculators/index.ts")
    with open(calc_index) as f:
        calc_slugs = re.findall(r'slug:\s*"([^"]+)"', f.read())
    
    top_calcs = [
        "mortgage-calculator", "compound-interest", "retirement-planning",
        "tax-calculator", "debt-payoff", "budget-planner", "auto-loan",
        "401k-calculator", "investment-return", "credit-card-payoff",
        "refinance-calculator", "rent-vs-buy", "savings-goal",
        "fire-calculator", "net-worth", "loan-calculator", "amortization-schedule",
        "mortgage-affordability", "debt-to-income", "emergency-fund",
        "annuity-calculator", "roi-calculator", "car-loan",
        "retirement-savings", "financial-independence"
    ]
    for slug in top_calcs:
        if slug in calc_slugs:
            urls.append(f"https://www.qfinhub.com/calculators/{slug}")
    
    # 3. Blog posts from last 7 days
    posts_file = os.path.join(PROJECT_DIR, "src/lib/blog/posts.ts")
    with open(posts_file) as f:
        content = f.read()
    
    blog_entries = re.findall(
        r'slug:\s*"([^"]+)".*?publishedAt:\s*new Date\("([^"]+)"\)',
        content, re.DOTALL
    )
    
    cutoff = datetime.now() - timedelta(days=7)
    for slug, date_str in blog_entries:
        try:
            pub_date = datetime.strptime(date_str, "%Y-%m-%d")
            if pub_date >= cutoff:
                urls.append(f"https://www.qfinhub.com/blog/{slug}")
        except:
            pass
    
    # Deduplicate
    urls = list(dict.fromkeys(urls))
    return urls

def main():
    print("=" * 55)
    print("🎯 QFINHUB V2 — Selective Indexing Engine")
    print(f"   Quality-only: NO formula variants, NO thin content")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)
    
    token = get_token()
    if not token:
        print("⚠️  Refreshing token...")
        token = refresh_token()
    if not token:
        print("❌ No valid token")
        return
    
    urls = get_quality_urls()
    
    # Filter OUT formula variants
    filtered = []
    for url in urls:
        if '/tools/' in url:
            slug = url.split('/tools/')[-1]
            # Skip formula variants (noindexed)
            is_formula = bool(re.match(r'^[a-z]+-\d', slug)) and \
                         len([p for p in slug.split('-') if re.search(r'\d|pct|yr|mo', p)]) >= 2
            if is_formula:
                continue
        filtered.append(url)
    
    print(f"\n📊 Quality URLs: {len(filtered)} (filtered {len(urls)-len(filtered)} formula variants)")
    print(f"   • GSC pages with impressions: {sum(1 for u in filtered if '/tools/' in u or '/calculators/' in u)}")
    print(f"   • Core calculator pages: {sum(1 for u in filtered if '/calculators/' in u)}")
    print(f"   • Recent blog posts: {sum(1 for u in filtered if '/blog/' in u)}")
    print("-" * 55)
    
    success = 0
    failed = 0
    errors = []
    
    for i, url in enumerate(filtered):
        ok, error = submit_url(url, token)
        if ok:
            success += 1
            slug = url.rsplit("/", 1)[-1] or "home"
            cat = "📐" if "/calculators/" in url else ("📝" if "/blog/" in url else "🔧")
            print(f"  ✅ [{i+1}/{len(filtered)}] {cat} {slug[:50]}")
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
            print(f"  ❌ [{i+1}/{len(filtered)}] {url.rsplit('/',1)[-1][:50]}")
        
        time.sleep(0.25)
    
    print(f"\n{'='*55}")
    print(f"✅ {success} submitted | ❌ {failed} failed | 🎯 {len(filtered)} quality URLs")
    
    # Log
    entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "submitted": success, "failed": failed,
        "total_urls": len(filtered),
        "type": "v2-selective",
        "errors": errors[:3],
    }
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(json.dumps(entry) + "\n")

if __name__ == "__main__":
    main()
