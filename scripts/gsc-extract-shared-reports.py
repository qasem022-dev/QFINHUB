#!/usr/bin/env python3
"""
GSC Shared Report URL Extractor — Google Login via CloakBrowser
Logs into q.finhub@gmail.com, navigates to shared reports, extracts URLs.
"""
import os, sys, json, time, re
from pathlib import Path

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

GOOGLE_EMAIL = "q.finhub@gmail.com"
GOOGLE_PASSWORD = "Mohammed0411@"
PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/google-account")
OUTPUT_DIR = "/home/admin1/qfinhub/.optimizer-data/gsc-shared-exports"

REPORTS = {
    'indexed-pages': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&pages=ALL_URLS&sharing_key=7KE0EhsgFfMsx4PXYTAsyw',
    'discovered-currently-not-indexed': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYFiAC&sharing_key=B5F6ZhvC11Yet5Z4HNEFdQ',
    'excluded-by-noindex': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYCCAC&sharing_key=s1VH50T61MGzQO0ZU4secg',
    'not-found-404': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYDSAC&sharing_key=J4M5nGymhtXnv9s19YIQ_Q',
    'crawled-currently-not-indexed': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYFyAC&sharing_key=xCay63OYcMyLGTom4c1WFA',
    'alternative-page-with-canonical': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYGCAC&sharing_key=XaLUOrrhNOFsJPn8mIjTGA',
    'page-with-redirect': 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&item_key=CAMYCyAC&sharing_key=5nl1Ae4mKiCC-_8Xo55gag',
}

def login_google(page):
    """Log into Google. Returns True if logged in, False if needs 2FA."""
    print("=" * 50)
    print("GOOGLE LOGIN")
    print("=" * 50)
    
    page.goto('https://accounts.google.com/signin', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)
    
    current_url = page.url
    print(f"Current URL: {current_url[:100]}")
    
    # Check if already logged in
    if 'myaccount' in current_url or 'console' in current_url:
        print("Already logged in!")
        return True
    
    # Step 1: Enter email
    print("Step 1: Entering email...")
    try:
        email_input = page.locator('input[type="email"]')
        if email_input.count() > 0:
            email_input.first.fill(GOOGLE_EMAIL)
            time.sleep(1)
            next_btn = page.locator('button').filter(has_text='Next')
            if next_btn.count() > 0:
                next_btn.first.click()
                time.sleep(4)
    except Exception as e:
        print(f"Email step error: {e}")
    
    # Step 2: Enter password
    print("Step 2: Entering password...")
    try:
        pw_input = page.locator('input[type="password"]')
        if pw_input.count() > 0:
            pw_input.first.fill(GOOGLE_PASSWORD)
            time.sleep(1)
            next_btn = page.locator('button').filter(has_text='Next')
            if next_btn.count() > 0:
                next_btn.first.click()
                time.sleep(5)
                print("Password submitted. Waiting for 2FA prompt...")
    except Exception as e:
        print(f"Password step error: {e}")
    
    # Step 3: Check what happened
    time.sleep(3)
    current_url = page.url
    print(f"After password URL: {current_url[:120]}")
    
    # Check for 2FA challenge
    page_content = page.content()[:3000].lower()
    if '2-step verification' in page_content or 'verify' in page_content:
        print("\n⚠️  2FA REQUIRED — Qasem must approve on phone")
        print("Waiting 60 seconds for approval...")
        screenshot_path = f"{OUTPUT_DIR}/google-2fa-prompt.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved: {screenshot_path}")
        time.sleep(60)  # Give Qasem time to approve
        
        # Check if we're past 2FA
        current_url = page.url
        if '2-step' not in page.content()[:3000].lower() and 'verify' not in page.content()[:3000].lower():
            print("2FA approved! Proceeding...")
            return True
        else:
            print("Still on 2FA screen — waiting another 30s...")
            time.sleep(30)
            current_url = page.url
            if '2-step' not in page.content()[:3000].lower():
                print("2FA approved!")
                return True
            else:
                print("2FA may not have been approved yet. Continuing anyway...")
                return False
    
    # Check if we're on a Google page (logged in)
    if 'myaccount' in current_url or 'console' in current_url or 'search.google.com' in current_url:
        print("Login successful!")
        return True
    
    # Check for "unusual activity" verification
    if 'challenge' in current_url.lower() or 'unusual' in page_content:
        print("\n⚠️  Unusual activity check detected")
        screenshot_path = f"{OUTPUT_DIR}/google-challenge.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot: {screenshot_path}")
        # Try "Try again" or "Continue"
        try:
            continue_btn = page.locator('button').filter(has_text='Try again')
            if continue_btn.count() > 0:
                continue_btn.first.click()
                time.sleep(5)
        except:
            pass
    
    return 'Sign in' not in page.content()[:2000]

def extract_urls_from_report(page, report_name, report_url):
    """Navigate to a shared GSC report and extract all URLs."""
    print(f"\n{'='*60}")
    print(f"REPORT: {report_name}")
    print(f"{'='*60}")
    
    page.goto(report_url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(5)
    
    current_url = page.url
    if 'accounts.google.com' in current_url:
        print("ERROR: Redirected to login — not authenticated")
        return []
    
    print(f"Landed on: {current_url[:100]}")
    
    # Get page title
    title = page.evaluate('document.title')
    print(f"Page title: {title}")
    
    # Check for "No data" or empty state
    body_text = page.evaluate('document.body.innerText')[:500]
    if 'No data' in body_text or 'No URLs found' in body_text:
        print("Report is empty — no URLs to extract")
        return []
    
    # Extract URLs — try different table structures
    all_urls = []
    seen = set()
    max_pages = 150  # safety limit
    
    for page_num in range(max_pages):
        time.sleep(2)
        
        # Extract URLs from current table view
        new_urls = page.evaluate('''() => {
            const urls = new Set();
            // Try all common GSC table selectors
            const selectors = [
                'a[href*="qfinhub.com"]',
                '[role="gridcell"] a',
                'td a',
                '.table a',
                '[data-url]',
            ];
            for (const sel of selectors) {
                document.querySelectorAll(sel).forEach(el => {
                    const href = el.href || el.getAttribute('data-url') || '';
                    if (href.includes('qfinhub.com') && !href.includes('.xml')) {
                        urls.add(href);
                    }
                });
            }
            // Also try finding URLs in text
            const allText = document.body.innerText;
            const matches = allText.match(/https?:\\/\\/[^\\s]*qfinhub\\.com[^\\s]*/gi);
            if (matches) {
                matches.forEach(m => urls.add(m));
            }
            return [...urls];
        }''')
        
        before = len(all_urls)
        for url in new_urls:
            url = url.strip().rstrip(')').rstrip('.').rstrip(',')
            if url not in seen and 'qfinhub.com' in url:
                seen.add(url)
                all_urls.append(url)
        
        added = len(all_urls) - before
        print(f"  Page {page_num + 1}: +{added} new URLs, {len(all_urls)} total")
        
        if len(new_urls) == 0:
            print("  No URLs found on this page. Done.")
            break
        
        # Try to go to next page
        # GSC uses various pagination patterns
        next_clicked = False
        for btn_text in ['Next', '>', '›', 'Next page']:
            try:
                btn = page.locator(f'button:has-text("{btn_text}"), a:has-text("{btn_text}"), [aria-label="{btn_text}"]')
                if btn.count() > 0:
                    btn.first.click()
                    next_clicked = True
                    time.sleep(2)
                    break
            except:
                pass
        
        if not next_clicked:
            # Try scrolling for infinite scroll
            prev_total = len(all_urls)
            page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            time.sleep(2)
            if len(all_urls) == prev_total:
                print("  No more pages. Done.")
                break
    
    return all_urls

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PROFILE_DIR, exist_ok=True)
    
    print("Launching CloakBrowser...")
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,  # Google 2FA uses phone tap, not on-screen code
        humanize=True,
    )
    page = context.new_page()
    
    try:
        # Login
        logged_in = login_google(page)
        
        if not logged_in:
            print("\n⚠️  Login may not have completed. Continuing anyway...")
            print("If reports fail, re-run after login succeeds.")
        
        # Verify we can access GSC
        print("\n" + "=" * 50)
        print("VERIFYING GSC ACCESS")
        print("=" * 50)
        page.goto('https://search.google.com/search-console', wait_until='domcontentloaded', timeout=30000)
        time.sleep(4)
        url = page.url
        if 'accounts.google.com' in url:
            print("ERROR: Still on login page — cannot access GSC")
            context.close()
            return
        
        print(f"GSC URL: {url[:120]}")
        
        # Extract each report
        all_results = {}
        for report_name, report_url in REPORTS.items():
            urls = extract_urls_from_report(page, report_name, report_url)
            all_results[report_name] = urls
            
            # Save immediately
            output_path = f'{OUTPUT_DIR}/{report_name}.json'
            with open(output_path, 'w') as f:
                json.dump({
                    'report_name': report_name,
                    'report_url': report_url,
                    'url_count': len(urls),
                    'urls': urls
                }, f, indent=2)
            print(f"  Saved: {output_path} ({len(urls)} URLs)")
        
        # Summary
        print(f"\n{'='*60}")
        print("EXTRACTION SUMMARY")
        print(f"{'='*60}")
        for name, urls in all_results.items():
            print(f"  {name}: {len(urls)} URLs")
        
    finally:
        context.close()

if __name__ == '__main__':
    main()
