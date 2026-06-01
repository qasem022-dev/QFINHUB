#!/usr/bin/env python3
"""
GSC Shared Report URL Extractor
Uses CloakBrowser to log into Google and extract URLs from shared Search Console reports.
"""
import os, sys, json, time, re
from pathlib import Path

# Set LD_LIBRARY_PATH for libnspr4
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")

from cloakbrowser import launch_persistent_context

# Google credentials
creds = {}
env_path = '/home/admin1/qfinhub/.env.local'
with open(env_path) as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            creds[k.strip()] = v.strip().strip('"').strip("'")

GOOGLE_EMAIL = creds.get('GMAIL_ADDRESS', 'q.finhub@gmail.com')
GOOGLE_APP_PASSWORD = creds.get('GMAIL_APP_PASSWORD', '')

# Shared report URLs
REPORTS = {
    'indexed-pages': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&pages=ALL_URLS&sharing_key=7KE0EhsgFfMsx4PXYTAsyw',
    'discovered-currently-not-indexed': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYFiAC&sharing_key=B5F6ZhvC11Yet5Z4HNEFdQ',
    'excluded-by-noindex': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYCCAC&sharing_key=s1VH50T61MGzQO0ZU4secg',
    'not-found-404': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYDSAC&sharing_key=J4M5nGymhtXnv9s19YIQ_Q',
    'crawled-currently-not-indexed': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYFyAC&sharing_key=xCay63OYcMyLGTom4c1WFA',
    'alternative-page-with-canonical': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYGCAC&sharing_key=XaLUOrrhNOFsJPn8mIjTGA',
    'page-with-redirect': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYCyAC&sharing_key=5nl1Ae4mKiCC-_8Xo55gag',
}

OUTPUT_DIR = '/home/admin1/qfinhub/.optimizer-data/gsc-shared-exports'
PROFILE_DIR = os.path.expanduser('~/.hermes/cloak-profiles/google-account')

def login_google(page):
    """Log into Google account. Uses app password if available."""
    print("Navigating to Google login...")
    page.goto('https://accounts.google.com/signin', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)
    
    # Enter email
    print("Entering email...")
    email_input = page.evaluate('''() => {
        const el = document.querySelector('input[type="email"]');
        if (!el) return null;
        const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        nativeSetter.call(el, arguments[0]);
        el.dispatchEvent(new Event('input', {bubbles: true}));
        el.dispatchEvent(new Event('change', {bubbles: true}));
        return 'ok';
    }''')
    
    # Alternative: use keyboard
    try:
        page.fill('input[type="email"]', GOOGLE_EMAIL)
    except:
        pass
    time.sleep(1)
    
    # Click Next
    next_btn = page.locator('button').filter(has_text='Next')
    if next_btn.count() > 0:
        next_btn.first.click()
        time.sleep(3)
    
    # Check if we got to password screen
    pw_input = page.locator('input[type="password"]')
    if pw_input.count() > 0:
        print("Entering password...")
        pw_input.first.fill(GOOGLE_APP_PASSWORD or '')
        time.sleep(1)
        next_btn = page.locator('button').filter(has_text='Next')
        if next_btn.count() > 0:
            next_btn.first.click()
            time.sleep(5)
    
    # Check if login succeeded
    current_url = page.url
    if 'myaccount.google.com' in current_url or 'console.cloud.google.com' in current_url:
        print("Login successful!")
        return True
    
    # Check for 2FA / verification
    if 'challenge' in current_url.lower() or 'verify' in current_url.lower():
        print(f"WARNING: Verification/challenge page detected: {current_url}")
        page.screenshot(path=f'{OUTPUT_DIR}/google-challenge.png')
        return False
    
    print(f"Login status unclear. Current URL: {current_url}")
    return 'Sign in' not in page.content()[:2000]

def extract_urls_from_table(page, report_name, max_pages=100):
    """Extract URLs from the GSC drilldown table."""
    urls = []
    seen = set()
    
    for page_num in range(max_pages):
        time.sleep(2)
        
        # Try to extract URLs from the current page
        new_urls = page.evaluate('''() => {
            const urls = [];
            // GSC uses various table structures - try multiple selectors
            const rows = document.querySelectorAll('tr, .table-row, [role="row"]');
            for (const row of rows) {
                const links = row.querySelectorAll('a[href*="qfinhub.com"]');
                for (const link of links) {
                    const url = link.href || link.textContent;
                    if (url && url.includes('qfinhub.com')) {
                        urls.push(url);
                    }
                }
                // Also check text content for URLs
                const text = row.textContent || '';
                const matches = text.match(/https?:\\/\\/[^\\s]*qfinhub\\.com[^\\s]*/gi);
                if (matches) {
                    for (const m of matches) {
                        urls.push(m);
                    }
                }
            }
            return [...new Set(urls)];
        }''')
        
        for url in new_urls:
            # Clean URL (remove trailing chars)
            url = url.strip().rstrip(')').rstrip('.').rstrip(',')
            if url not in seen and 'qfinhub.com' in url and not url.endswith('.xml'):
                seen.add(url)
                urls.append(url)
        
        print(f"  Page {page_num + 1}: found {len(new_urls)} raw, {len(urls)} unique total")
        
        if len(new_urls) == 0:
            print(f"  No more URLs found on page {page_num + 1}. Stopping.")
            break
        
        # Try to click "Next page" or scroll for infinite scroll
        next_btn = page.locator('button').filter(has_text='Next')
        next_arrow = page.locator('[aria-label="Next page"], [aria-label="Next"]')
        
        if next_btn.count() > 0:
            try:
                next_btn.first.click()
                time.sleep(2)
            except:
                break
        elif next_arrow.count() > 0:
            try:
                next_arrow.first.click()
                time.sleep(2)
            except:
                break
        else:
            # Try scrolling for infinite scroll
            prev_count = len(urls)
            page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            time.sleep(2)
            # If no new URLs after scroll, we're done
            if len(urls) == prev_count:
                print("  No more pages to load. Done.")
                break
    
    return urls

def extract_report(page, report_name, report_url):
    """Navigate to a shared report and extract URLs."""
    print(f"\n{'='*60}")
    print(f"Extracting: {report_name}")
    print(f"{'='*60}")
    
    page.goto(report_url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(5)
    
    # Check if we landed on the report or got redirected to login
    current_url = page.url
    if 'accounts.google.com' in current_url:
        print("Redirected to login. Need to authenticate first.")
        return None
    
    print(f"Landed on: {current_url[:100]}")
    
    # Check page title/content
    title = page.evaluate('document.title')
    print(f"Page title: {title}")
    
    # Extract URLs
    urls = extract_urls_from_table(page, report_name)
    
    # Save to file
    output_path = f'{OUTPUT_DIR}/{report_name}.json'
    with open(output_path, 'w') as f:
        json.dump({
            'report_name': report_name,
            'report_url': report_url,
            'url_count': len(urls),
            'urls': urls
        }, f, indent=2)
    print(f"Saved {len(urls)} URLs to {output_path}")
    
    return urls

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("Launching CloakBrowser...")
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    page = context.new_page()
    
    try:
        # First check if already logged in
        page.goto('https://search.google.com/search-console', wait_until='domcontentloaded', timeout=30000)
        time.sleep(4)
        
        current_url = page.url
        if 'accounts.google.com' in current_url:
            print("Not logged in. Authenticating...")
            success = login_google(page)
            if not success:
                print("WARNING: Login may have failed. Continuing anyway...")
        else:
            print(f"Already logged in (URL: {current_url[:80]})")
        
        # Extract each report
        results = {}
        for report_name, report_url in REPORTS.items():
            urls = extract_report(page, report_name, report_url)
            results[report_name] = urls
        
        # Summary
        print(f"\n{'='*60}")
        print("EXTRACTION SUMMARY")
        print(f"{'='*60}")
        for name, urls in results.items():
            count = len(urls) if urls else 0
            print(f"  {name}: {count} URLs")
    
    finally:
        context.close()

if __name__ == '__main__':
    main()
