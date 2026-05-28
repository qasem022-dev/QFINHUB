#!/usr/bin/env python3
"""Check actual tweet dates and content on @qfinhub"""
from cloakbrowser import launch_persistent_context
import time, re

context = launch_persistent_context(
    user_data_dir="/home/admin1/.hermes/cloak-profiles/x-account-1",
    headless=True,
    humanize=True
)
page = context.new_page()
page.set_default_timeout(30000)

page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
time.sleep(5)

# Scroll to load tweets
for i in range(5):
    page.evaluate("window.scrollBy(0, 800)")
    time.sleep(2)

# Now get tweet texts and timestamps
tweets_data = page.evaluate("""
    (function() {
        const tweets = [...document.querySelectorAll('[data-testid="tweet"]')];
        return tweets.map(t => {
            const text = t.querySelector('[data-testid="tweetText"]');
            const time = t.querySelector('time');
            return {
                text: text ? text.innerText.substring(0, 120) : 'NO TEXT',
                time: time ? time.getAttribute('datetime') : 'NO TIME'
            };
        });
    })();
""")

print(f"=== Found {len(tweets_data)} tweets ===")
for i, t in enumerate(tweets_data[:10]):
    print(f"\n[{i+1}] {t['time']}")
    print(f"    {t['text']}")

# Also check the "23 posts" count vs actual visible tweets
post_count = page.evaluate("""
    (function() {
        const el = document.querySelector('a[href*="/verified_followers"]');
        return el ? el.innerText : 'not found';
    })();
""")
print(f"\nPost count element: {post_count}")

context.close()
