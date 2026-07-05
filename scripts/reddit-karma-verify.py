#!/usr/bin/env python3
"""Verify if our test comment was actually posted on Reddit."""
import os, time

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
    headless=True, humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Check our profile for recent comments
page.goto("https://old.reddit.com/user/QASEMQH/comments/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

body = page.evaluate("document.body.innerText.substring(0, 2000)")
print("=== Our Comments Page ===")
print(body[:1500])

# Also check the specific post we commented on
page.goto("https://old.reddit.com/r/debtfree/comments/1ulhjlz/paid_off_my_highest_interest_student_loan_today/", wait_until="domcontentloaded", timeout=30000)
time.sleep(3)

# Look for our comment text
has_comment = page.evaluate("""
    (function() {
        var body = document.body.innerText;
        return body.includes('avalanche method') || body.includes('saves the most money');
    })()
""")
print(f"\nOur comment visible on post: {has_comment}")

# Get all comment text
comments = page.evaluate("""
    (function() {
        var commentEls = document.querySelectorAll('.comment .md');
        var texts = [];
        commentEls.forEach(function(el) {
            texts.push(el.textContent.trim().substring(0, 100));
        });
        return texts;
    })()
""")
print(f"\nComments on post ({len(comments)}):")
for c in comments[:10]:
    print(f"  {c[:80]}")

ctx.close()