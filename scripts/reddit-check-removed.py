#!/usr/bin/env python3
"""Check if our r/debtfree comment was removed by automoderator."""
import os, time

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
    headless=True, humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Check our profile comments page
page.goto("https://old.reddit.com/user/QASEMQH/comments/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

body = page.evaluate("document.body.innerText")
print("=== Our Comments Page ===")
print(body[:2000])

# Check if the comment shows as removed/deleted
if "removed" in body.lower() or "[deleted]" in body.lower() or "[removed]" in body.lower():
    print("\n>>> COMMENT WAS REMOVED <<<")

# Check the actual post for our comment
page.goto("https://old.reddit.com/r/debtfree/comments/1ulhjlz/paid_off_my_highest_interest_student_loan_today/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

# Look specifically for our username
our_comment = page.evaluate("""
    (function() {
        var comments = document.querySelectorAll('.comment');
        for (var c of comments) {
            if (c.textContent.includes('QASEMQH')) {
                return c.textContent.trim().substring(0, 500);
            }
        }
        return 'NOT_FOUND_ON_POST';
    })()
""")
print(f"\n=== Our comment on post ===")
print(our_comment[:500])

# Check if it shows as removed
if "removed" in our_comment.lower():
    print("\n>>> CONFIRMED: Comment removed by automod <<<")

# Also check what subreddits have NO karma requirements
# Test r/CasualConversation, r/NoStupidQuestions, r/AskReddit
print("\n\n=== Testing subreddits with no karma requirements ===")
for sub in ["CasualConversation", "NoStupidQuestions", "FreeKarma4U", "karma4karma"]:
    page.goto(f"https://old.reddit.com/r/{sub}/new/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(2)
    
    post_count = page.evaluate("document.querySelectorAll('.thing.link').length")
    print(f"r/{sub}: {post_count} posts visible")

ctx.close()