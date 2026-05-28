#!/usr/bin/env python3
"""Diagnose X restriction: check settings, rate limits, account status"""
from cloakbrowser import launch_persistent_context
import time, re

context = launch_persistent_context(
    user_data_dir="/home/admin1/.hermes/cloak-profiles/x-account-1",
    headless=True,
    humanize=True
)
page = context.new_page()
page.set_default_timeout(30000)

# 1. Check account settings/status
print("=== CHECKING ACCOUNT STATUS ===")
page.goto("https://x.com/settings/account", wait_until="domcontentloaded", timeout=20000)
time.sleep(5)
body = page.evaluate("document.body.innerText")
print(body[:2000])

# Look for restriction keywords
for kw in ['locked', 'suspended', 'verify', 'confirm', 'restrict', 'limit', 'challenge', 'unusual', 'temporary']:
    if kw.lower() in body.lower():
        # Find context around the keyword
        idx = body.lower().find(kw.lower())
        start = max(0, idx - 50)
        end = min(len(body), idx + 100)
        print(f"\n⚠️  '{kw}' found: ...{body[start:end]}...")

# 2. Check for any notification banners  
print("\n=== CHECKING NOTIFICATIONS ===")
page.goto("https://x.com/notifications", wait_until="domcontentloaded", timeout=20000)
time.sleep(4)
notifs = page.evaluate("document.body.innerText")
# Look for automated/system messages
for kw in ['automated', 'violation', 'policy', 'removed', 'hidden', 'temporary', 'spam']:
    if kw.lower() in notifs.lower():
        idx = notifs.lower().find(kw.lower())
        start = max(0, idx - 50)
        end = min(len(notifs), idx + 100)
        print(f"⚠️  '{kw}' found in notifications: ...{notifs[start:end]}...")

# 3. Try to post with screenshot capture of the post result
print("\n=== DETAILED POST ATTEMPT ===")
page.goto("https://x.com/compose/post", wait_until="domcontentloaded", timeout=20000)
time.sleep(5)

tweet = "Test " + str(int(time.time()))
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

# Check button state
btn_state = page.evaluate("""
    (function() {
        const b = document.querySelector('[data-testid="tweetButton"]') ||
                 document.querySelector('[data-testid="tweetButtonInline"]');
        if (!b) return 'BUTTON NOT FOUND';
        return {
            disabled: b.disabled,
            ariaDisabled: b.getAttribute('aria-disabled'),
            text: b.innerText || b.getAttribute('aria-label'),
            role: b.getAttribute('role')
        };
    })();
""")
print(f"Button state: {btn_state}")

# Click
page.evaluate("""
    (function() {
        const b = document.querySelector('[data-testid="tweetButton"]') ||
                 document.querySelector('[data-testid="tweetButtonInline"]');
        if (b) b.click();
    })();
""")
time.sleep(5)

# What's the URL now?
current_url = page.evaluate("window.location.href")
print(f"URL after post: {current_url}")

# Check for toast/notification
post_page_body = page.evaluate("document.body.innerText")
# Look for specific post-confirmation messages
for msg in ['sent', 'posted', 'live', 'published', 'error', 'failed', 'try again']:
    if msg in post_page_body.lower()[:500]:
        print(f"Found '{msg}' in response")

# Does the tweet text still appear (meaning composer is still open)?
if tweet in post_page_body:
    print("Tweet text still on page — composer didn't close")

context.close()
