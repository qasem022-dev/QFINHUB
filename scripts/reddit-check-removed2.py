#!/usr/bin/env python3
"""Check if r/debtfree comment was removed by automod (not visible to others)."""
import os, time

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
    headless=True, humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Go to the r/debtfree post as logged in user
url = "https://old.reddit.com/r/debtfree/comments/1ulhjlz/paid_off_my_highest_interest_student_loan_today/"
page.goto(url, wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

# Find all comments - look for "removed" status
result = page.evaluate("""
    (function() {
        var comments = document.querySelectorAll('.comment');
        var results = [];
        comments.forEach(function(c) {
            var author = c.querySelector('.author') ? c.querySelector('.author').textContent : 'unknown';
            var body = c.querySelector('.md') ? c.querySelector('.md').textContent.trim().substring(0, 100) : 'no body';
            var removed = c.classList.contains('deleted') || c.querySelector('.removed') || c.textContent.includes('[removed]');
            results.push({author: author, body: body, removed: removed, classes: c.className});
        });
        return results;
    })()
""")

print(f"Total comments on post: {len(result)}")
for r in result:
    status = "REMOVED" if r['removed'] else "ACTIVE"
    print(f"  [{status}] u/{r['author'][:20]}: {r['body'][:60]} classes={r['classes'][:50]}")

# Now check r/CasualConversation comment
print("\n=== Checking r/CasualConversation comment ===")
page.goto("https://old.reddit.com/r/CasualConversation/comments/1ulw8bu/for_someone_whos_never_experienced_it_whats_the/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

result2 = page.evaluate("""
    (function() {
        var comments = document.querySelectorAll('.comment');
        var results = [];
        comments.forEach(function(c) {
            var author = c.querySelector('.author') ? c.querySelector('.author').textContent : 'unknown';
            var body = c.querySelector('.md') ? c.querySelector('.md').textContent.trim().substring(0, 100) : 'no body';
            if (author === 'QASEMQH') {
                results.push({author: author, body: body, classes: c.className});
            }
        });
        return results;
    })()
""")

if result2:
    print("Our comment found on r/CasualConversation:")
    for r in result2:
        print(f"  u/{r['author']}: {r['body'][:80]} classes={r['classes'][:50]}")
else:
    print("Our comment NOT found on r/CasualConversation post")

# Check our current karma
page.goto("https://old.reddit.com/user/QASEMQH/", wait_until="domcontentloaded", timeout=30000)
time.sleep(2)
karma = page.evaluate("""
    (function() {
        var text = document.body.innerText;
        if (text.match(/(\d+) post karma/)) return 'post:' + text.match(/(\d+) post karma/)[1];
        if (text.match(/(\d+) comment karma/)) return 'comment:' + text.match(/(\d+) comment karma/)[1];
        return text.substring(0, 200);
    })()
""")
print(f"\nKarma: {karma}")

# Also check the new Reddit karma display
page.goto("https://www.reddit.com/user/QASEMQH/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)
karma2 = page.evaluate("document.body.innerText")
# Extract karma numbers
import re
post_karma = re.findall(r'(\d+)\s*post karma', karma2, re.IGNORECASE)
comment_karma = re.findall(r'(\d+)\s*comment karma', karma2, re.IGNORECASE)
total_karma = re.findall(r'(\d+)\s*karma', karma2, re.IGNORECASE)
print(f"New Reddit karma: post={post_karma}, comment={comment_karma}, total={total_karma[:3] if total_karma else 'none'}")

ctx.close()