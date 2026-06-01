#!/usr/bin/env python3
"""GSC Extractor v3 — clean login with device already trusted."""
import os, sys, json, time
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

EMAIL = "q.finhub@gmail.com"
PASSWORD = "Mohammed0411@"
PROFILE = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3")
OUT = "/home/admin1/qfinhub/.optimizer-data/gsc-shared-exports"

REPORTS = {
    'indexed-pages': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&pages=ALL_URLS&sharing_key=7KE0EhsgFfMsx4PXYTAsyw',
    'discovered-currently-not-indexed': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYFiAC&sharing_key=B5F6ZhvC11Yet5Z4HNEFdQ',
    'excluded-by-noindex': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYCCAC&sharing_key=s1VH50T61MGzQO0ZU4secg',
    'not-found-404': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYDSAC&sharing_key=J4M5nGymhtXnv9s19YIQ_Q',
    'crawled-currently-not-indexed': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYFyAC&sharing_key=xCay63OYcMyLGTom4c1WFA',
    'alternative-page-with-canonical': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYGCAC&sharing_key=XaLUOrrhNOFsJPn8mIjTGA',
    'page-with-redirect': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYCyAC&sharing_key=5nl1Ae4mKiCC-_8Xo55gag',
}

def login(page):
    print("=== GOOGLE LOGIN ===", flush=True)
    page.goto('https://accounts.google.com/signin/v2/identifier', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)
    
    # Enter email
    ei = page.locator('input[type="email"]')
    if ei.count() > 0:
        ei.first.fill(EMAIL)
        time.sleep(0.5)
        btn = page.locator('button').filter(has_text='Next')
        if btn.count() > 0: btn.first.click()
        time.sleep(6)
    print(f"After email: {page.url[:100]}", flush=True)
    
    # Wait out any challenge (device now trusted, should auto-pass)
    time.sleep(4)
    
    # Enter password  
    pw = page.locator('input[type="password"]')
    if pw.count() > 0:
        print("Entering password...", flush=True)
        pw.first.fill(PASSWORD)
        time.sleep(0.5)
        btn = page.locator('button').filter(has_text='Next')
        if btn.count() > 0: btn.first.click()
        time.sleep(8)
    print(f"After password: {page.url[:100]}", flush=True)
    
    # CRITICAL: post-password challenge (challenge/pwd)
    if 'challenge' in page.url.lower() or 'verify' in page.url.lower():
        print("⚠️ Post-password challenge! Qasem: approve on phone...", flush=True)
        for i in range(30):
            time.sleep(3)
            if 'challenge' not in page.url.lower() and 'verify' not in page.url.lower():
                print(f"  Challenge cleared after {(i+1)*3}s", flush=True)
                break
            if i % 5 == 0: print(f"  Waiting... ({(i+1)*3}s)", flush=True)
        time.sleep(3)
    print(f"After challenge wait: {page.url[:100]}", flush=True)
    
    # Wait for any 2FA
    time.sleep(3)
    
    # Verify GSC access
    page.goto('https://search.google.com/search-console', wait_until='domcontentloaded', timeout=30000)
    time.sleep(4)
    ok = 'accounts.google.com' not in page.url and 'search.google.com' in page.url
    print(f"{'✅' if ok else '❌'} Login: {page.url[:100]}", flush=True)
    return ok

def extract(page, name, url):
    print(f"\n--- {name} ---", flush=True)
    page.goto(url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(5)
    if 'accounts.google.com' in page.url:
        print("  ❌ Redirected to login", flush=True)
        return []
    
    print(f"  Title: {page.evaluate('document.title')}", flush=True)
    urls = []
    seen = set()
    
    for p in range(200):
        time.sleep(2)
        new = page.evaluate('''() => {
            const s = new Set();
            // ONLY capture www.qfinhub.com page URLs, not GSC nav links
            document.querySelectorAll('a[href*="www.qfinhub.com"]').forEach(e => {
                if(!e.href.includes(".xml") && !e.href.includes("search.google.com") && !e.href.includes("accounts.google.com")) 
                    s.add(e.href);
            });
            // Also capture from text content (URLs displayed as text in table cells)
            const m = document.body.innerText.match(/https?:\\/\\/www\\.qfinhub\\.com[^\\s]*/gi);
            if(m) m.forEach(u => s.add(u));
            return [...s];
        }''')
        
        added = 0
        for u in new:
            u = u.strip().rstrip(')').rstrip('.').rstrip(',')
            if u not in seen and 'qfinhub.com' in u:
                seen.add(u); urls.append(u); added += 1
        
        print(f"  pg{p+1}: +{added} → {len(urls)} total", flush=True)
        if len(new) == 0 and p > 0: break
        
        for sel in ['[aria-label="Next page"]', '[aria-label="Next"]', 'button:has-text("Next")']:
            try:
                b = page.locator(sel)
                if b.count() > 0: b.first.click(); time.sleep(2); break
            except: pass
        else:
            prev = len(urls)
            page.evaluate('window.scrollTo(0,document.body.scrollHeight)')
            time.sleep(2)
            if len(urls) == prev: break
    
    with open(f'{OUT}/{name}.json', 'w') as f:
        json.dump({'report_name': name, 'url_count': len(urls), 'urls': urls}, f, indent=2)
    print(f"  💾 {len(urls)} URLs saved", flush=True)
    return urls

def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PROFILE, exist_ok=True)
    
    print("Starting CloakBrowser...", flush=True)
    ctx = launch_persistent_context(user_data_dir=PROFILE, headless=True, humanize=True)
    page = ctx.new_page()
    
    try:
        if not login(page):
            print("Login failed.", flush=True)
            ctx.close(); return
        
        results = {}
        for name, url in REPORTS.items():
            results[name] = extract(page, name, url)
        
        print(f"\n{'='*50}", flush=True)
        for n, u in results.items():
            print(f"  {n}: {len(u)} URLs", flush=True)
    finally:
        ctx.close()

if __name__ == '__main__':
    main()
