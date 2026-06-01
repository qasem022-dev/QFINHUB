#!/usr/bin/env python3
"""Re-extract with pagination fix — reuses existing Google session."""
import os, sys, json, time
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

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

def extract(page, name, url, max_pages=100):
    print(f"\n--- {name} ---", flush=True)
    page.goto(url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(5)
    
    if 'accounts.google.com' in page.url:
        print("  ❌ Not authenticated", flush=True)
        return []
    
    print(f"  Title: {page.evaluate('document.title')}", flush=True)
    urls = []
    seen = set()
    
    for p in range(max_pages):
        time.sleep(2)
        
        new = page.evaluate('''() => {
            const s = new Set();
            document.querySelectorAll('a[href*="www.qfinhub.com"]').forEach(e => {
                if(!e.href.includes(".xml") && !e.href.includes("search.google.com") && !e.href.includes("accounts.google.com")) 
                    s.add(e.href);
            });
            const m = document.body.innerText.match(/https?:\\/\\/www\\.qfinhub\\.com[^\\s]*/gi);
            if(m) m.forEach(u => s.add(u));
            return [...s];
        }''')
        
        added = 0
        for u in new:
            u = u.strip().rstrip(')').rstrip('.').rstrip(',')
            if u not in seen and 'www.qfinhub.com' in u:
                seen.add(u); urls.append(u); added += 1
        
        print(f"  pg{p+1}: +{added} → {len(urls)} total", flush=True)
        
        if len(new) == 0:
            print("  No URLs found — done", flush=True)
            break
        
        # PAGINATION: scroll the GSC table container (not page body)
        # GSC uses an internal scrollable table, not page-level pagination
        clicked = False
        
        # Strategy 1: Scroll within the table container
        scrolled = page.evaluate('''() => {
            // Find the scrollable table container in GSC
            const containers = document.querySelectorAll('[role="grid"], .mat-mdc-table-container, .gsc-table-container, .cdk-virtual-scroll-viewport');
            for (const c of containers) {
                if (c.scrollHeight > c.clientHeight) {
                    c.scrollTop = c.scrollHeight;
                    return true;
                }
            }
            // Fallback: scroll any overflow-auto div
            const scrollables = document.querySelectorAll('div[style*="overflow"]');
            for (const s of scrollables) {
                if (s.scrollHeight > s.clientHeight + 50) {
                    s.scrollTop = s.scrollHeight;
                    return true;
                }
            }
            return false;
        }''')
        if scrolled:
            time.sleep(2)
            clicked = True
    
    return urls

def main():
    os.makedirs(OUT, exist_ok=True)
    
    print("Connecting to existing profile...", flush=True)
    ctx = launch_persistent_context(user_data_dir=PROFILE, headless=True, humanize=True)
    page = ctx.new_page()
    
    try:
        # Verify session still valid
        print("Checking session...", flush=True)
        test = 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&pages=ALL_URLS&sharing_key=7KE0EhsgFfMsx4PXYTAsyw'
        page.goto(test, wait_until='domcontentloaded', timeout=30000)
        time.sleep(4)
        
        if 'accounts.google.com' in page.url:
            print("Session expired — need to re-login", flush=True)
            ctx.close(); return
        
        print("Session valid! Extracting...", flush=True)
        
        results = {}
        for name, url in REPORTS.items():
            urls = extract(page, name, url)
            results[name] = urls
            
            with open(f'{OUT}/{name}.json', 'w') as f:
                json.dump({'report_name': name, 'url_count': len(urls), 'urls': urls}, f, indent=2)
            print(f"  💾 {len(urls)} URLs saved", flush=True)
        
        print(f"\n{'='*50}", flush=True)
        for n, u in results.items():
            print(f"  {n}: {len(u)} URLs", flush=True)
    finally:
        ctx.close()

if __name__ == '__main__':
    main()
