#!/usr/bin/env python3
"""
X Tweet Cleanup — Delete bot-like tweets that triggered shadowban
Uses CloakBrowser with persistent profile (auto-login).
"""

import sys, os, time, json

# Handle libnspr4 if needed
lib_dir = os.path.expanduser("~/.local/lib")
if os.path.exists(os.path.join(lib_dir, "libnspr4.so")):
    os.environ["LD_LIBRARY_PATH"] = lib_dir

from cloakbrowser import launch_persistent_context

PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/x-account-1")
REPLIED_TO_FILE = os.path.expanduser("/home/admin1/qfinhub/.x-data-v2/replied-to.json")

# The 8 most problematic replies (replied to big accounts — biggest bot signal)
with open(REPLIED_TO_FILE) as f:
    PROBLEM_TWEETS = json.load(f)

print(f"Found {len(PROBLEM_TWEETS)} problematic reply targets")
for t in PROBLEM_TWEETS:
    print(f"  {t}")

def main():
    print("Launching CloakBrowser with persistent X profile...")
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    page = context.new_page()
    
    try:
        # 1. Check login state
        print("\n[1] Checking login state...")
        page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        
        content = page.content()
        if "Log in" in content and "Timeline" not in content:
            print("ERROR: Not logged in! Session expired. Cannot clean tweets.")
            context.close()
            return 1
        
        print("✅ Logged in successfully")
        
        # 2. Navigate to profile to see tweets
        print("\n[2] Navigating to profile...")
        page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        
        # Scroll to load tweets
        for i in range(10):
            page.keyboard.press("End")
            time.sleep(1.5 + (i * 0.3))
        time.sleep(2)
        
        # Get all tweet elements
        tweets_found = page.evaluate("""(function() {
            var articles = document.querySelectorAll('article[data-testid="tweet"]');
            var results = [];
            articles.forEach(function(a, idx) {
                var text = a.textContent.substring(0, 200);
                var links = [];
                a.querySelectorAll('a').forEach(function(link) {
                    var href = link.getAttribute('href');
                    if (href && href.includes('/status/')) {
                        links.push(href);
                    }
                });
                var timeEl = a.querySelector('time');
                var timeStr = timeEl ? timeEl.getAttribute('datetime') : '';
                results.push({idx: idx, text: text, links: links, time: timeStr});
            });
            return results;
        })()""")
        
        print(f"\nFound {len(tweets_found) if tweets_found else 0} tweets on profile")
        
        if tweets_found:
            for t in tweets_found[:20]:
                print(f"  [{t['idx']}] {t['time'][:19] if t.get('time') else '?'}: {t['text'][:100]}...")
                if t.get('links'):
                    for l in t['links']:
                        # Check if this is one of our problem replies
                        full_url = 'https://x.com' + l
                        if any(pt in full_url or full_url in pt for pt in PROBLEM_TWEETS):
                            print(f"      🔴 MATCHES PROBLEM REPLY: {l}")
        
        # 3. Delete each problematic tweet by navigating to it directly
        deleted = 0
        failed = 0
        
        for tweet_url in PROBLEM_TWEETS:
            print(f"\n[3] Processing: {tweet_url}")
            
            # Extract the tweet ID from the URL
            # Format: https://x.com/User/status/1234567890 or .../photo/1
            parts = tweet_url.rstrip('/').split('/')
            
            # Skip photo URLs or non-status URLs
            if 'photo' in parts or 'status' not in parts:
                print(f"  ⏭️ Skipping non-tweet URL")
                continue
            
            status_idx = parts.index('status')
            tweet_id = parts[status_idx + 1]
            print(f"  Tweet ID: {tweet_id}")
            
            # Navigate to the user's tweet page
            username = parts[status_idx - 1]
            status_page = f"https://x.com/{username}/status/{tweet_id}"
            
            try:
                page.goto(status_page, wait_until="domcontentloaded", timeout=20000)
                time.sleep(4)
                
                # Check if this is our own tweet (we should see delete option)
                # Click the "..." more menu button
                deleted_success = page.evaluate("""(function() {
                    // Find the caret/more button
                    var buttons = document.querySelectorAll('[data-testid="caret"]');
                    for (var i = 0; i < buttons.length; i++) {
                        buttons[i].click();
                        return 'clicked-caret-' + i;
                    }
                    // Fallback: find aria-label with "More"
                    var moreBtns = document.querySelectorAll('[aria-label="More"]');
                    if (moreBtns.length > 0) {
                        moreBtns[0].click();
                        return 'clicked-more';
                    }
                    return 'no-caret-found';
                })()""")
                
                print(f"  Caret click result: {deleted_success}")
                
                if 'clicked' in str(deleted_success):
                    time.sleep(1.5)
                    
                    # Now find and click "Delete" in the dropdown
                    delete_result = page.evaluate("""(function() {
                        var spans = document.querySelectorAll('span');
                        for (var i = 0; i < spans.length; i++) {
                            if (spans[i].textContent.trim() === 'Delete') {
                                spans[i].click();
                                return 'clicked-delete';
                            }
                        }
                        // Try role=menuitem
                        var items = document.querySelectorAll('[role="menuitem"]');
                        for (var i = 0; i < items.length; i++) {
                            if (items[i].textContent.includes('Delete')) {
                                items[i].click();
                                return 'clicked-menuitem';
                            }
                        }
                        return 'no-delete-found';
                    })()""")
                    
                    print(f"  Delete click result: {delete_result}")
                    
                    if 'clicked-delete' in str(delete_result) or 'clicked-menuitem' in str(delete_result):
                        time.sleep(1.5)
                        
                        # Confirm deletion
                        confirm_result = page.evaluate("""(function() {
                            var buttons = document.querySelectorAll('[data-testid="confirmationSheetConfirm"]');
                            if (buttons.length > 0) {
                                buttons[0].click();
                                return 'confirmed';
                            }
                            // Fallback: find any confirm button
                            var spans = document.querySelectorAll('span');
                            for (var i = 0; i < spans.length; i++) {
                                if (spans[i].textContent.trim() === 'Delete') {
                                    var btn = spans[i].closest('[role="button"]');
                                    if (btn) { btn.click(); return 'confirmed-alt'; }
                                }
                            }
                            return 'no-confirm';
                        })()""")
                        
                        print(f"  Confirm result: {confirm_result}")
                        
                        if 'confirm' in str(confirm_result):
                            deleted += 1
                            print(f"  ✅ DELETED tweet {tweet_id}")
                        else:
                            failed += 1
                            print(f"  ⚠️ Could not confirm deletion for {tweet_id}")
                    else:
                        failed += 1
                        print(f"  ⚠️ Could not find Delete option for {tweet_id}")
                else:
                    failed += 1
                    print(f"  ⚠️ Could not find caret button for {tweet_id}")
                    
                time.sleep(3)  # Rate limit between deletions
                
            except Exception as e:
                failed += 1
                print(f"  ❌ Error processing {tweet_id}: {e}")
        
        # 4. Also delete recent self-tweets that look overly promotional
        print(f"\n[4] Deleting promotional self-tweets...")
        page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
        time.sleep(4)
        
        # Find tweets with links to qfinhub.com (self-promotional)
        promo_tweets = page.evaluate("""(function() {
            var articles = document.querySelectorAll('article[data-testid="tweet"]');
            var results = [];
            articles.forEach(function(a, idx) {
                var text = a.textContent || '';
                var hasLink = text.includes('qfinhub.com') || text.includes('QFINHUB');
                var hasCTA = text.includes('free') || text.includes('calculator') || text.includes('tool');
                
                // Get tweet link
                var links = [];
                a.querySelectorAll('a[href*="/status/"]').forEach(function(l) {
                    links.push(l.getAttribute('href'));
                });
                
                if (hasLink || (hasCTA && links.length > 0)) {
                    results.push({
                        idx: idx,
                        text: text.substring(0, 150),
                        links: links,
                        spamScore: (hasLink ? 2 : 0) + (hasCTA ? 1 : 0)
                    });
                }
            });
            return results;
        })()""")
        
        print(f"  Found {len(promo_tweets) if promo_tweets else 0} promotional tweets")
        if promo_tweets:
            for t in promo_tweets[:15]:
                print(f"    [{t['idx']}] score={t['spamScore']}: {t['text'][:80]}...")
        
        # 5. Summary
        print(f"\n{'='*50}")
        print(f"CLEANUP COMPLETE")
        print(f"  Deleted: {deleted}")
        print(f"  Failed: {failed}")
        print(f"  Problem replies processed: {len(PROBLEM_TWEETS)}")
        print(f"{'='*50}")
        
    finally:
        context.close()

if __name__ == "__main__":
    sys.exit(main())
