#!/usr/bin/env python3
"""
GSC Shared Report URL Extractor v2 — Fixed Google Login
Handles: email → device verification (phone tap) → password → 2FA
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

def wait_for_page_change(page, prev_url, timeout=120, check_interval=3):
    """Wait for the page URL to change (e.g., after phone approval)."""
    print(f"  Waiting up to {timeout}s for page to advance...", flush=True)
    for i in range(timeout // check_interval):
        time.sleep(check_interval)
        current = page.url
        if current != prev_url:
            print(f"  Page changed! New URL: {current[:100]}", flush=True)
            return True
        # Also check if we're past the verification screen
        body = page.content()[:2000].lower()
        if 'password' in body and 'verify' not in body:
            print(f"  Password field detected — verification passed!", flush=True)
            return True
        if 'search-console' in current:
            print(f"  GSC detected — already logged in!", flush=True)
            return True
    print(f"  Timeout after {timeout}s", flush=True)
    return False

def login_google(page):
    """Log into Google with proper handling of device verification."""
    print("=" * 50, flush=True)
    print("GOOGLE LOGIN", flush=True)
    print("=" * 50, flush=True)
    
    # Check authentication against a drilldown report, not the homepage
    # The homepage loads with cached cookies even without real auth
    print("Checking real auth against drilldown report...", flush=True)
    test_url = 'https://search.google.com/u/1/search-console/index/drilldown?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F&pages=ALL_URLS&sharing_key=7KE0EhsgFfMsx4PXYTAsyw'
    page.goto(test_url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(4)
    url = page.url
    if 'accounts.google.com' not in url and 'search.google.com' in url:
        print("Already authenticated for drilldown reports!", flush=True)
        return True
    
    print("Need to authenticate. Starting login flow...", flush=True)
    page.goto('https://accounts.google.com/signin', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)
    
    # STEP 1: Enter email
    print("\nStep 1: Entering email...", flush=True)
    email_input = page.locator('input[type="email"]')
    if email_input.count() == 0:
        # Google might use different identifier field
        email_input = page.locator('input[identifier]')
    if email_input.count() > 0:
        email_input.first.fill(GOOGLE_EMAIL)
        time.sleep(1)
    
    next_btn = page.locator('button').filter(has_text='Next')
    if next_btn.count() > 0:
        next_btn.first.click()
        time.sleep(5)
    
    # CHECK: Did we go to password page, or verification page?
    current_url = page.url
    body_lower = page.content()[:3000].lower()
    
    if 'password' in body_lower and 'input[type="password"]' not in str(body_lower):
        print("Looking for password field...", flush=True)
    
    # STEP 1.5: Handle device verification (between email and password)
    if 'verify' in body_lower or 'challenge' in body_lower or 'unusual' in body_lower or 'confirm' in body_lower:
        print("\n⚠️  DEVICE VERIFICATION REQUIRED", flush=True)
        print("   Google wants to verify it's you on this new device.", flush=True)
        print("   → QASEM: Check your phone and tap 'Yes' to approve", flush=True)
        print("   Waiting for approval...", flush=True)
        
        # Try to find and click "Continue" or "Try another way" if needed
        try:
            continue_btn = page.locator('button').filter(has_text='Continue')
            if continue_btn.count() > 0:
                continue_btn.first.click()
                time.sleep(3)
        except:
            pass
        
        # Wait for Qasem to approve on phone (up to 2 minutes)
        if wait_for_page_change(page, current_url, timeout=120):
            time.sleep(3)
        else:
            print("Verification may have timed out. Proceeding anyway...", flush=True)
    
    # STEP 2: Enter password
    print("\nStep 2: Checking for password field...", flush=True)
    time.sleep(2)
    
    pw_input = page.locator('input[type="password"]')
    if pw_input.count() > 0:
        print("  Password field found. Entering password...", flush=True)
        pw_input.first.fill(GOOGLE_PASSWORD)
        time.sleep(1)
        
        next_btn = page.locator('button').filter(has_text='Next')
        if next_btn.count() > 0:
            next_btn.first.click()
            time.sleep(5)
        print("  Password submitted!", flush=True)
    else:
        # Maybe the verification auto-advanced us past password too
        current_url = page.url
        body_lower = page.content()[:3000].lower()
        if 'search-console' in current_url or 'myaccount' in current_url:
            print("  No password needed — verification auto-logged us in!", flush=True)
            return True
        else:
            body_preview = page.content()[:2000]
            print(f"  WARNING: No password field found.", flush=True)
            print(f"  Current URL: {current_url[:120]}", flush=True)
            print(f"  Body preview: {body_preview[:500]}", flush=True)
            # Save screenshot for debugging
            page.screenshot(path=f'{OUTPUT_DIR}/login-debug.png')
            print(f"  Screenshot saved to login-debug.png", flush=True)
    
    # STEP 3: Check for 2FA
    time.sleep(3)
    current_url = page.url
    body_lower = page.content()[:3000].lower()
    
    if '2-step' in body_lower or 'verify' in body_lower:
        print("\n⚠️  2FA REQUIRED — Qasem: tap 'Yes' on phone again", flush=True)
        page.screenshot(path=f'{OUTPUT_DIR}/google-2fa.png')
        if wait_for_page_change(page, current_url, timeout=90):
            time.sleep(3)
    
    # Final check: are we logged in?
    current_url = page.url
    if 'accounts.google.com/signin' in current_url or 'signin' in current_url:
        # Still on login page
        body_preview = page.content()[:1000]
        print(f"\nERROR: Still on login page!", flush=True)
        print(f"  URL: {current_url[:120]}", flush=True)
        print(f"  Body: {body_preview[:500]}", flush=True)
        page.screenshot(path=f'{OUTPUT_DIR}/login-failed.png')
        return False
    
    # Verify by trying GSC
    print("\nVerifying GSC access...", flush=True)
    page.goto('https://search.google.com/search-console', wait_until='domcontentloaded', timeout=30000)
    time.sleep(4)
    if 'search.google.com/search-console' in page.url and 'accounts.google.com' not in page.url:
        print("✅ LOGIN SUCCESSFUL!", flush=True)
        return True
    else:
        print(f"❌ GSC verification failed. URL: {page.url[:120]}", flush=True)
        return False

def extract_urls_from_report(page, report_name, report_url):
    """Navigate to shared GSC report and extract all URLs."""
    print(f"\n{'='*60}", flush=True)
    print(f"REPORT: {report_name}", flush=True)
    print(f"{'='*60}", flush=True)
    
    page.goto(report_url, wait_until='domcontentloaded', timeout=30000)
    time.sleep(5)
    
    if 'accounts.google.com' in page.url:
        print("ERROR: Redirected to login — not authenticated", flush=True)
        return []
    
    title = page.evaluate('document.title')
    print(f"Title: {title}", flush=True)
    print(f"URL: {page.url[:100]}", flush=True)
    
    # Check for empty report
    body_text = page.evaluate('document.body.innerText')[:1000]
    if 'No data' in body_text:
        print("Report appears empty", flush=True)
    
    all_urls = []
    seen = set()
    
    for page_num in range(200):
        time.sleep(2)
        
        new_urls = page.evaluate('''() => {
            const urls = new Set();
            document.querySelectorAll('a[href*="qfinhub.com"]').forEach(el => {
                const href = el.href;
                if (href && !href.includes('.xml')) urls.add(href);
            });
            const text = document.body.innerText;
            const matches = text.match(/https?:\\/\\/[^\\s]*qfinhub\\.com[^\\s]*/gi);
            if (matches) matches.forEach(m => urls.add(m));
            return [...urls];
        }''')
        
        before = len(all_urls)
        for url in new_urls:
            url = url.strip().rstrip(')').rstrip('.').rstrip(',')
            if url not in seen and 'qfinhub.com' in url:
                seen.add(url)
                all_urls.append(url)
        
        added = len(all_urls) - before
        print(f"  Page {page_num+1}: +{added} URLs ({len(all_urls)} total)", flush=True)
        
        if len(new_urls) == 0 and page_num > 0:
            break
        
        # Pagination
        next_clicked = False
        for sel in ['[aria-label="Next page"]', 'button:has-text("Next")', 'a:has-text("Next")']:
            try:
                btn = page.locator(sel)
                if btn.count() > 0:
                    btn.first.click()
                    next_clicked = True
                    time.sleep(2)
                    break
            except:
                pass
        
        if not next_clicked:
            prev = len(all_urls)
            page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
            time.sleep(2)
            if len(all_urls) == prev:
                break
    
    return all_urls

def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    os.makedirs(PROFILE_DIR, exist_ok=True)
    
    print("Launching CloakBrowser...", flush=True)
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    page = context.new_page()
    
    try:
        logged_in = login_google(page)
        
        if not logged_in:
            print("\n❌ Login failed. Cannot extract reports.", flush=True)
            context.close()
            return
        
        all_results = {}
        for report_name, report_url in REPORTS.items():
            urls = extract_urls_from_report(page, report_name, report_url)
            all_results[report_name] = urls
            
            output_path = f'{OUTPUT_DIR}/{report_name}.json'
            with open(output_path, 'w') as f:
                json.dump({
                    'report_name': report_name,
                    'url_count': len(urls),
                    'urls': urls
                }, f, indent=2)
            print(f"  💾 Saved: {output_path}", flush=True)
        
        # Summary
        print(f"\n{'='*60}", flush=True)
        print("EXTRACTION SUMMARY", flush=True)
        print(f"{'='*60}", flush=True)
        for name, urls in all_results.items():
            print(f"  {name}: {len(urls)} URLs", flush=True)
    
    finally:
        context.close()

if __name__ == '__main__':
    main()
