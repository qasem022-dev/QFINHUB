#!/usr/bin/env python3
"""GSC Extractor v4 — Robust pagination. All 7 reason drilldowns."""
import os, sys, json, time
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

EMAIL = "q.finhub@gmail.com"
PASSWORD = "Mohammed0411@"
PROFILE = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v4")
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
    ei = page.locator('input[type="email"]')
    if ei.count() > 0:
        ei.first.fill(EMAIL)
        time.sleep(0.5)
        btn = page.locator('button').filter(has_text='Next')
        if btn.count() > 0: btn.first.click()
        time.sleep(6)
    print(f"After email: {page.url[:100]}", flush=True)
    time.sleep(4)
    pw = page.locator('input[type="password"]')
    if pw.count() > 0:
        print("Entering password...", flush=True)
        pw.first.fill(PASSWORD)
        time.sleep(0.5)
        btn = page.locator('button').filter(has_text='Next')
        if btn.count() > 0: btn.first.click()
        time.sleep(8)
    print(f"After password: {page.url[:100]}", flush=True)
    if 'challenge' in page.url.lower() or 'verify' in page.url.lower():
        print("⚠️ Post-password challenge! Approve on phone...", flush=True)
        for i in range(30):
            time.sleep(3)
            if 'challenge' not in page.url.lower() and 'verify' not in page.url.lower():
                print(f"  Challenge cleared after {(i+1)*3}s", flush=True)
                break
            if i % 5 == 0: print(f"  Waiting... ({(i+1)*3}s)", flush=True)
        time.sleep(3)
    time.sleep(3)
    page.goto('https://search.google.com/search-console', wait_until='domcontentloaded', timeout=30000)
    time.sleep(4)
    ok = 'accounts.google.com' not in page.url and 'search.google.com' in page.url
    print(f"{'✅' if ok else '❌'} Login: {page.url[:100]}", flush=True)
    return ok

JS_EXTRACT = '''() => {
    const s = new Set();
    // ONLY capture www.qfinhub.com page URLs from text content (GSC lists them as text in table cells)
    const m = document.body.innerText.match(/https?:\\/\\/www\\.qfinhub\\.com[^\\s]*/gi);
    if(m) m.forEach(u => s.add(u));
    return [...s];
}'''

def extract(page, name, url):
    print(f"\n--- {name} ---", flush=True)
    page.goto(url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(6)
    if 'accounts.google.com' in page.url:
        print("  ❌ Redirected to login", flush=True)
        return []
    print(f"  Title: {page.evaluate('document.title')}", flush=True)
    urls = []
    seen = set()
    last_first_url = None
    stagnant = 0
    for p in range(500):  # up to 500 pages = 5000 URLs
        time.sleep(2.5)
        new = page.evaluate(JS_EXTRACT)
        added = 0
        for u in new:
            u = u.strip().rstrip(')').rstrip('.').rstrip(',').rstrip(';')
            # Filter out GSC's own URLs and only keep qfinhub
            if u not in seen and 'qfinhub.com' in u and 'search.google.com' not in u:
                seen.add(u); urls.append(u); added += 1
        # Detect stagnation: same first URL 3 times in a row means Next didn't move
        first = sorted(seen)[0] if seen else None
        stagnant_now = (first == last_first_url)
        stagnant = stagnant + 1 if stagnant_now else 0
        last_first_url = first
        print(f"  pg{p+1}: +{added} → {len(urls)} total (stagnant={stagnant})", flush=True)
        if stagnant >= 3:
            print(f"  ⏹ No progress after 3 pages — pagination exhausted", flush=True)
            break
        # Click Next — try multiple selectors
        clicked = False
        for sel in [
            '[aria-label="Next page"]',
            '[aria-label="Next"]',
            'button[aria-label*="ext"]',
            'button:has-text("Next")',
            'span:has-text("Next")',
            '[data-id="next-page"]',
            'button[mat-icon-button]:has(i:has-text("chevron_right"))',
        ]:
            try:
                loc = page.locator(sel)
                cnt = loc.count()
                if cnt > 0:
                    # Check if enabled
                    disabled = loc.first.evaluate('el => el.disabled || el.getAttribute("aria-disabled") === "true" || el.classList.contains("mat-button-disabled")')
                    if not disabled:
                        loc.first.click()
                        clicked = True
                        break
            except Exception as e:
                pass
        if not clicked:
            # Try keyboard
            try:
                page.keyboard.press('PageDown')
                time.sleep(0.5)
                page.keyboard.press('End')
            except: pass
            # Try scroll
            page.evaluate('window.scrollTo(0,document.body.scrollHeight)')
            time.sleep(2)
            # Check if scrolling worked
            check = page.evaluate(JS_EXTRACT)
            if len(check) == len(new):
                print(f"  ⏹ No Next button, scroll didn't change content — done", flush=True)
                break
    path = f'{OUT}/{name}.json'
    with open(path, 'w') as f:
        json.dump({'report_name': name, 'url_count': len(urls), 'urls': urls}, f, indent=2)
    print(f"  💾 {len(urls)} URLs → {path}", flush=True)
    return urls

def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(PROFILE, exist_ok=True)
    print("Starting CloakBrowser v4...", flush=True)
    ctx = launch_persistent_context(user_data_dir=PROFILE, headless=True, humanize=True)
    page = ctx.new_page()
    try:
        if not login(page):
            print("Login failed.", flush=True); ctx.close(); return
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