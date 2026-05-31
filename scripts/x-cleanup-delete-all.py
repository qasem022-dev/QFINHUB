#!/usr/bin/env python3
"""
Delete ALL visible tweets from @qfinhub profile.
Strategy: Navigate to each visible tweet one by one, delete it.
Only 10 tweets are visible (May 13-14), rest are hidden.
"""

import sys, os, time

lib_dir = os.path.expanduser("~/.local/lib")
if os.path.exists(os.path.join(lib_dir, "libnspr4.so")):
    os.environ["LD_LIBRARY_PATH"] = lib_dir

from cloakbrowser import launch_persistent_context

PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/x-account-1")

def get_visible_tweet_ids(page):
    """Get all tweet status IDs visible on the profile page."""
    return page.evaluate("""(function() {
        var ids = [];
        var links = document.querySelectorAll('a[href*="/status/"]');
        var seen = {};
        links.forEach(function(l) {
            var href = l.getAttribute('href');
            var match = href.match(/\\/status\\/(\\d+)/);
            if (match) {
                var id = match[1];
                if (!seen[id]) {
                    seen[id] = true;
                    ids.push(id);
                }
            }
        });
        return ids;
    })()""")

def delete_tweet(page, username, tweet_id):
    """Navigate to a tweet and delete it."""
    url = f"https://x.com/{username}/status/{tweet_id}"
    print(f"  Navigating to: {url}")
    
    page.goto(url, wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    
    # Step 1: Click "More" button
    more_clicked = page.evaluate("""(function() {
        // Try aria-label="More" first
        var btns = document.querySelectorAll('[aria-label="More"]');
        for (var i = 0; i < btns.length; i++) {
            if (btns[i].offsetParent !== null) {
                btns[i].click();
                return 'clicked-aria-more';
            }
        }
        // Try data-testid="caret"
        var carets = document.querySelectorAll('[data-testid="caret"]');
        for (var i = 0; i < carets.length; i++) {
            carets[i].click();
            return 'clicked-caret';
        }
        return 'no-more-btn';
    })()""")
    print(f"    More button: {more_clicked}")
    
    if 'clicked' not in str(more_clicked):
        return False
    
    time.sleep(1.5)
    
    # Step 2: Click "Delete" in dropdown
    delete_clicked = page.evaluate("""(function() {
        var items = document.querySelectorAll('[role="menuitem"]');
        for (var i = 0; i < items.length; i++) {
            if (items[i].offsetParent !== null) {
                var txt = items[i].textContent || '';
                if (txt.trim() === 'Delete' || txt.includes('Delete')) {
                    items[i].click();
                    return 'clicked-delete';
                }
            }
        }
        // Fallback: find span with "Delete"
        var spans = document.querySelectorAll('div[role="menu"] span, div[data-testid="Dropdown"] span');
        for (var i = 0; i < spans.length; i++) {
            if (spans[i].textContent.trim() === 'Delete' && spans[i].offsetParent !== null) {
                spans[i].click();
                return 'clicked-delete-span';
            }
        }
        return 'no-delete-option';
    })()""")
    print(f"    Delete option: {delete_clicked}")
    
    if 'clicked-delete' not in str(delete_clicked):
        return False
    
    time.sleep(1.5)
    
    # Step 3: Confirm deletion
    confirmed = page.evaluate("""(function() {
        var btn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
        if (btn) {
            btn.click();
            return 'confirmed';
        }
        // Fallback: look for "Delete" button in confirmation
        var allBtns = document.querySelectorAll('[role="button"]');
        for (var i = 0; i < allBtns.length; i++) {
            if (allBtns[i].offsetParent !== null) {
                var txt = allBtns[i].textContent || '';
                if (txt.trim() === 'Delete') {
                    allBtns[i].click();
                    return 'confirmed-btn';
                }
            }
        }
        return 'no-confirm';
    })()""")
    print(f"    Confirm: {confirmed}")
    
    return 'confirm' in str(confirmed)

def main():
    print("Launching CloakBrowser...")
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    page = context.new_page()
    
    try:
        # Login check
        page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        content = page.content()
        if "Log in" in content and "Timeline" not in content:
            print("ERROR: Not logged in!")
            return 1
        print("✅ Logged in\n")
        
        # Go to profile and get all visible tweet IDs
        print("Loading profile...")
        page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        
        # Scroll to load all
        for i in range(8):
            page.keyboard.press("End")
            time.sleep(1.5)
        time.sleep(3)
        
        tweet_ids = get_visible_tweet_ids(page)
        print(f"Found {len(tweet_ids)} visible tweet IDs: {tweet_ids}\n")
        
        if not tweet_ids:
            print("No tweets to delete!")
            return 0
        
        # Delete each one
        deleted = 0
        failed = 0
        
        for i, tid in enumerate(tweet_ids):
            print(f"[{i+1}/{len(tweet_ids)}] Tweet ID: {tid}")
            success = delete_tweet(page, "QFinhub", tid)
            
            if success:
                deleted += 1
                print(f"  ✅ DELETED\n")
            else:
                failed += 1
                print(f"  ❌ FAILED\n")
            
            # Increasing delay to avoid rate limiting
            time.sleep(3 + i * 0.5)
        
        print(f"{'='*50}")
        print(f"RESULT: {deleted} deleted, {failed} failed out of {len(tweet_ids)}")
        
        # Verify
        page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
        time.sleep(4)
        remaining = get_visible_tweet_ids(page)
        print(f"Remaining visible tweets: {len(remaining)}")
        
    finally:
        context.close()

if __name__ == "__main__":
    sys.exit(main())
