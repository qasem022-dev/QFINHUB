#!/usr/bin/env python3
"""
X Tweet Cleanup v2 — Delete own replies and bot-like tweets
Go to profile /with_replies tab, find and delete problematic content.
"""

import sys, os, time, json

lib_dir = os.path.expanduser("~/.local/lib")
if os.path.exists(os.path.join(lib_dir, "libnspr4.so")):
    os.environ["LD_LIBRARY_PATH"] = lib_dir

from cloakbrowser import launch_persistent_context

PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/x-account-1")
REPLIED_TO_FILE = os.path.expanduser("/home/admin1/qfinhub/.x-data-v2/replied-to.json")

with open(REPLIED_TO_FILE) as f:
    TARGET_TWEETS = json.load(f)

# Extract just the usernames we replied to (for matching)
TARGET_ACCOUNTS = set()
for url in TARGET_TWEETS:
    parts = url.rstrip('/').split('/')
    if 'status' in parts and 'photo' not in parts:
        idx = parts.index('status')
        if idx > 0:
            TARGET_ACCOUNTS.add(parts[idx - 1].lower())
print(f"Target accounts replied to: {TARGET_ACCOUNTS}")

def main():
    print("Launching CloakBrowser...")
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    page = context.new_page()
    
    try:
        # 1. Check login
        print("\n[1] Checking login...")
        page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        
        content = page.content()
        if "Log in" in content and "Timeline" not in content:
            print("ERROR: Not logged in!")
            return 1
        print("✅ Logged in")
        
        # 2. Go to profile WITH REPLIES (shows both tweets and replies)
        print("\n[2] Loading profile with replies...")
        page.goto("https://x.com/qfinhub/with_replies", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        
        # Aggressive scrolling to load all content
        print("  Scrolling to load all tweets...")
        for i in range(15):
            page.keyboard.press("End")
            time.sleep(2)
        time.sleep(3)
        
        # 3. Find ALL tweets/replies on the page
        all_tweets = page.evaluate("""(function() {
            var articles = document.querySelectorAll('article[data-testid="tweet"]');
            var results = [];
            articles.forEach(function(a, idx) {
                var fullText = a.textContent || '';
                
                // Get the status link (our own tweet URL)
                var ownLinks = [];
                a.querySelectorAll('a[href*="/QFinhub/status/"], a[href*="/qfinhub/status/"]').forEach(function(l) {
                    ownLinks.push(l.getAttribute('href'));
                });
                
                // Check if this is a reply (has "Replying to" text)
                var isReply = fullText.includes('Replying to');
                
                // Check who it's replying to
                var replyingTo = '';
                var replyMatch = fullText.match(/Replying to\\s+@(\\w+)/i);
                if (replyMatch) replyingTo = replyMatch[1];
                
                // Get time
                var timeEl = a.querySelector('time');
                var timeStr = timeEl ? timeEl.getAttribute('datetime') : '';
                
                results.push({
                    idx: idx,
                    isReply: isReply,
                    replyingTo: replyingTo,
                    ownLinks: ownLinks,
                    time: timeStr,
                    preview: fullText.substring(0, 120)
                });
            });
            return results;
        })()""")
        
        print(f"\nFound {len(all_tweets) if all_tweets else 0} total tweets/replies")
        
        # Identify which are replies to target accounts (biggest bot signal)
        to_delete = []
        for t in (all_tweets or []):
            reason = ""
            if t.get('isReply') and t.get('replyingTo', '').lower() in TARGET_ACCOUNTS:
                reason = f"REPLY TO BIG ACCOUNT: @{t['replyingTo']}"
            elif t.get('isReply') and any(acc in t.get('preview', '').lower() for acc in TARGET_ACCOUNTS):
                reason = "LIKELY BIG ACCOUNT REPLY"
            
            if reason:
                to_delete.append(t)
                print(f"  🔴 [{t['idx']}] {reason}")
                print(f"     Time: {t.get('time', '?')[:19]}")
                print(f"     Preview: {t['preview'][:100]}")
                for link in t.get('ownLinks', []):
                    print(f"     Link: {link}")
        
        # Also identify self-promotional tweets (lots of links, CTA language)
        promo_to_delete = []
        promo_keywords = ['free tool', 'free calculator', 'calculate your', 'drop your', 'check out', 'qfinhub.com']
        for t in (all_tweets or []):
            preview_lower = t.get('preview', '').lower()
            is_promo = any(kw in preview_lower for kw in promo_keywords)
            has_qfinhub_link = 'qfinhub.com' in preview_lower
            
            if (is_promo or has_qfinhub_link) and not t.get('isReply'):
                # Only flag self-tweets (not replies)
                if t not in to_delete:
                    promo_to_delete.append(t)
        
        print(f"\n  🟡 {len(promo_to_delete)} promotional self-tweets also flagged")
        for t in promo_to_delete[:5]:
            print(f"     [{t['idx']}] {t['preview'][:100]}...")
        
        # Combine all tweets to delete
        all_to_delete = to_delete + promo_to_delete
        print(f"\n  Total to delete: {len(all_to_delete)}")
        
        if not all_to_delete:
            print("\n✅ No problematic tweets found on profile. Done.")
            return 0
        
        # 4. Delete each tweet's own link (navigate to each one and delete)
        deleted = 0
        failed = 0
        
        for i, tweet_info in enumerate(all_to_delete):
            own_links = tweet_info.get('ownLinks', [])
            if not own_links:
                failed += 1
                print(f"\n  ⚠️ Tweet [{tweet_info['idx']}] has no own links — can't navigate to it")
                continue
            
            tweet_url = "https://x.com" + own_links[0]
            print(f"\n[{i+1}/{len(all_to_delete)}] Deleting: {tweet_url}")
            print(f"  Preview: {tweet_info['preview'][:80]}...")
            
            try:
                page.goto(tweet_url, wait_until="domcontentloaded", timeout=20000)
                time.sleep(3)
                
                # Click the "More" (caret) button
                caret_clicked = page.evaluate("""(function() {
                    // Find the more button - it's usually aria-label="More"
                    var btns = document.querySelectorAll('[aria-label="More"]');
                    for (var i = 0; i < btns.length; i++) {
                        if (btns[i].offsetParent !== null) { // visible
                            btns[i].click();
                            return 'clicked-more-visible';
                        }
                    }
                    // Fallback: data-testid="caret"
                    var carets = document.querySelectorAll('[data-testid="caret"]');
                    for (var i = 0; i < carets.length; i++) {
                        if (carets[i].offsetParent !== null) {
                            carets[i].click();
                            return 'clicked-caret-visible';
                        }
                    }
                    // Last resort: click any caret
                    if (carets.length > 0) {
                        carets[0].click();
                        return 'clicked-caret-any';
                    }
                    return 'no-button-found';
                })()""")
                
                print(f"  Caret: {caret_clicked}")
                
                if 'clicked' in str(caret_clicked):
                    time.sleep(2)
                    
                    # Find "Delete" in the dropdown menu
                    delete_clicked = page.evaluate("""(function() {
                        // Look for menu items
                        var items = document.querySelectorAll('[role="menuitem"]');
                        for (var i = 0; i < items.length; i++) {
                            var text = items[i].textContent || '';
                            if (text.trim() === 'Delete' || text.includes('Delete')) {
                                items[i].click();
                                return 'clicked-menuitem';
                            }
                        }
                        // Fallback: look for span with "Delete" text
                        var spans = document.querySelectorAll('span');
                        for (var i = 0; i < spans.length; i++) {
                            if (spans[i].textContent.trim() === 'Delete') {
                                // Find clickable parent
                                var parent = spans[i].closest('[role="menuitem"], [role="button"], div[tabindex]');
                                if (parent) { parent.click(); return 'clicked-span-parent'; }
                                spans[i].click();
                                return 'clicked-span-raw';
                            }
                        }
                        // Debug: what menu items are visible?
                        var visibleItems = [];
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].offsetParent !== null) {
                                visibleItems.push(items[i].textContent.substring(0, 30));
                            }
                        }
                        return 'no-delete-found. visible items: ' + visibleItems.join(', ');
                    })()""")
                    
                    print(f"  Delete: {delete_clicked}")
                    
                    if 'clicked-menuitem' in str(delete_clicked) or 'clicked-span' in str(delete_clicked):
                        time.sleep(2)
                        
                        # Confirm deletion
                        confirmed = page.evaluate("""(function() {
                            var btn = document.querySelector('[data-testid="confirmationSheetConfirm"]');
                            if (btn) { btn.click(); return 'confirmed-sheet'; }
                            
                            // Alternative: look for "Delete" button in confirmation dialog
                            var spans = document.querySelectorAll('span');
                            for (var i = 0; i < spans.length; i++) {
                                if (spans[i].textContent.trim() === 'Delete') {
                                    var clickable = spans[i].closest('[role="button"]');
                                    if (clickable && clickable.offsetParent !== null) {
                                        clickable.click();
                                        return 'confirmed-alt';
                                    }
                                }
                            }
                            return 'no-confirm-dialog';
                        })()""")
                        
                        print(f"  Confirm: {confirmed}")
                        
                        if 'confirm' in str(confirmed):
                            deleted += 1
                            print(f"  ✅ DELETED")
                        else:
                            failed += 1
                            print(f"  ⚠️ Could not confirm")
                    else:
                        failed += 1
                        print(f"  ⚠️ Delete option not in menu")
                else:
                    failed += 1
                    print(f"  ⚠️ More button not found")
                
                time.sleep(3 + (i * 0.5))  # Increasing delay for rate limiting
                
            except Exception as e:
                failed += 1
                print(f"  ❌ Error: {e}")
        
        # Summary
        print(f"\n{'='*50}")
        print(f"CLEANUP COMPLETE")
        print(f"  Deleted: {deleted}")
        print(f"  Failed: {failed}")
        print(f"  Total processed: {len(all_to_delete)}")
        print(f"{'='*50}")
        
    finally:
        context.close()

if __name__ == "__main__":
    sys.exit(main())
