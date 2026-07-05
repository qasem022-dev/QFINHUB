#!/usr/bin/env python3
"""Check Reddit messages/notifications for automod removal notices."""
import os, time

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
    headless=True, humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Check messages
page.goto("https://old.reddit.com/message/messages/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)
body = page.evaluate("document.body.innerText.substring(0, 3000)")
print("=== Messages ===")
print(body[:2000])

# Check notifications  
page.goto("https://old.reddit.com/message/notifications/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)
body2 = page.evaluate("document.body.innerText.substring(0, 2000)")
print("\n=== Notifications ===")
print(body2[:1500])

# Check inbox
page.goto("https://old.reddit.com/message/inbox/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)
body3 = page.evaluate("document.body.innerText.substring(0, 2000)")
print("\n=== Inbox ===")
print(body3[:1500])

# Test r/CasualConversation — can we comment there?
print("\n\n=== Testing r/CasualConversation comment ===")
page.goto("https://old.reddit.com/r/CasualConversation/new/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

posts = page.evaluate("""
    (function() {
        var results = [];
        var things = document.querySelectorAll('.thing.link');
        things.forEach(function(thing) {
            var titleEl = thing.querySelector('a.title');
            var scoreEl = thing.querySelector('.score.unvoted');
            var linkEl = thing.querySelector('a.comments');
            if (titleEl && linkEl) {
                results.push({
                    title: titleEl.textContent.trim(),
                    url: linkEl.href,
                    score: scoreEl ? scoreEl.textContent : '?'
                });
            }
        });
        return results;
    })()
""")
print(f"Found {len(posts)} posts")
for p in posts[:5]:
    print(f"  {p['title'][:70]} (score: {p['score']})")

# Try first post
if posts:
    post_url = posts[0]["url"]
    print(f"\nNavigating to: {post_url}")
    page.goto(post_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    
    ta_count = page.evaluate("document.querySelectorAll('textarea[name=\"text\"]').length")
    print(f"Comment textareas: {ta_count}")
    
    if ta_count > 0:
        page.evaluate("""(function() { var ta = document.querySelector('textarea[name="text"]'); if(ta){ta.focus();ta.click();} })()""")
        time.sleep(1)
        
        comment = "Totally agree with this. Small consistent habits compound over time in ways you cannot predict."
        page.keyboard.type(comment, delay=5)
        time.sleep(2)
        
        submitted = page.evaluate("""
            (function() {
                var saveBtn = document.querySelector('button.save');
                if (saveBtn) { saveBtn.click(); return 'SUBMITTED'; }
                return 'NO_BUTTON';
            })()
        """)
        print(f"Submit: {submitted}")
        time.sleep(3)
        
        # Verify
        page.goto("https://old.reddit.com/user/QASEMQH/comments/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(2)
        body4 = page.evaluate("document.body.innerText.substring(0, 1000)")
        if "CasualConversation" in body4:
            print("SUCCESS — comment posted on r/CasualConversation!")
        else:
            print(f"Check if posted: {body4[:300]}")

# Also test r/NoStupidQuestions
print("\n\n=== Testing r/NoStupidQuestions ===")
page.goto("https://old.reddit.com/r/NoStupidQuestions/new/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)
posts2 = page.evaluate("document.querySelectorAll('.thing.link').length")
print(f"Posts: {posts2}")

ctx.close()