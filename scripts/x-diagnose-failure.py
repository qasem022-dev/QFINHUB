#!/usr/bin/env python3
"""Diagnose why tweets fail to post after May 14"""
from cloakbrowser import launch_persistent_context
import time

context = launch_persistent_context(
    user_data_dir="/home/admin1/.hermes/cloak-profiles/x-account-1",
    headless=True,
    humanize=True
)
page = context.new_page()
page.set_default_timeout(30000)

# Go to compose
print("1. Navigating to compose...")
page.goto("https://x.com/compose/post", wait_until="domcontentloaded", timeout=20000)
time.sleep(5)

# Check what's on screen
body = page.evaluate("document.body.innerText")
print(f"Page text (first 800): {body[:800]}")
print()

# Check if composer loaded
has_textarea = page.evaluate("""
    (function() {
        const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                  document.querySelector('div[role="textbox"]');
        return el ? 'FOUND' : 'NOT FOUND';
    })();
""")
print(f"2. Tweet textarea: {has_textarea}")

# Check for error messages
has_error = page.evaluate("""
    (function() {
        const body = document.body.innerText;
        if (body.includes('suspended') || body.includes('locked') || body.includes('verify') ||
            body.includes('limit') || body.includes('Try again') || body.includes('Something went wrong')) {
            return body.substring(0, 500);
        }
        return 'No error detected';
    })();
""")
print(f"3. Errors: {has_error}")

# Try to post
tweet = "Quick diagnostic test " + str(int(time.time()))
print(f"\n4. Attempting to post: '{tweet}'")
escaped = tweet.replace("'", "\\'").replace("$", "\\$")
page.evaluate(f"""
    (function() {{
        const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                  document.querySelector('div[role="textbox"]');
        if (el) {{ el.focus(); el.textContent = '{escaped}';
                  el.dispatchEvent(new Event('input', {{ bubbles: true }})); }}
    }})();
""")
time.sleep(2)

# Click tweet button
page.evaluate("""
    (function() {
        const b = document.querySelector('[data-testid="tweetButton"]') ||
                 document.querySelector('[data-testid="tweetButtonInline"]');
        if (b) b.click();
    })();
""")
time.sleep(8)

# Check what happened after clicking
after_body = page.evaluate("document.body.innerText")
print(f"5. After click (first 800): {after_body[:800]}")

# Check for common post-failure indicators
checks = {
    'tweet_sent': 'Your Tweet was sent' in after_body or 'sent' in after_body.lower()[:200],
    'rate_limited': 'limit' in after_body.lower() and ('rate' in after_body.lower() or 'try again' in after_body.lower()),
    'something_wrong': 'Something went wrong' in after_body,
    'still_on_composer': 'tweetTextarea' in after_body or 'textbox' in after_body.lower(),
}
for check, result in checks.items():
    print(f"   {check}: {result}")

# Go to profile to verify
page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
time.sleep(4)
profile_body = page.evaluate("document.body.innerText")
if tweet in profile_body:
    print(f"\n✅ TWEET VERIFIED on profile!")
else:
    print(f"\n❌ TWEET NOT FOUND on profile")
    
# Check if we can even see our own tweets
tweets = page.evaluate("""
    (function() {
        const tweets = [...document.querySelectorAll('[data-testid="tweet"]')];
        return tweets.length;
    })();
""")
print(f"   Visible tweets on profile: {tweets}")

context.close()
