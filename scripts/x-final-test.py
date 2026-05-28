#!/usr/bin/env python3
"""End-to-end: post a tweet with keyboard.type and verify"""
from cloakbrowser import launch_persistent_context
import time

context = launch_persistent_context(
    user_data_dir="/home/admin1/.hermes/cloak-profiles/x-account-1",
    headless=True,
    humanize=True
)
page = context.new_page()
page.set_default_timeout(30000)

tweet = "🔧 System test — keyboard input method verified. Your financial calculators are working again at qfinhub.com"

# Go to home and use the quick-compose box
page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=20000)
time.sleep(4)

# Click What's Happening / Post button to open composer
page.evaluate("""
    (function() {
        const links = [...document.querySelectorAll('a[href="/compose/post"]')];
        if (links[0]) links[0].click();
    })();
""")
time.sleep(3)

# Type the tweet character by character (this triggers React properly)
page.keyboard.type(tweet, delay=50)
time.sleep(2)

# Verify button is enabled
btn_state = page.evaluate("""
    (function() {
        const b = document.querySelector('[data-testid="tweetButton"]') ||
                 document.querySelector('[data-testid="tweetButtonInline"]');
        return { disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled') };
    })();
""")
print(f"Button: {btn_state}")

if not btn_state['disabled']:
    # Click post
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b && !b.disabled) b.click();
        })();
    """)
    time.sleep(5)
    
    # Wait for post to complete (URL changes)
    for i in range(10):
        url = page.evaluate("window.location.href")
        if '/compose/post' not in url:
            print(f"Post complete — URL: {url}")
            break
        time.sleep(2)
    
    # Now go to profile and verify
    time.sleep(5)  # Extra wait for X to process
    page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
    time.sleep(5)
    
    # Scroll to load tweets
    for i in range(3):
        page.evaluate("window.scrollBy(0, 500)")
        time.sleep(1.5)
    
    body = page.evaluate("document.body.innerText")
    if "System test" in body or "keyboard input method" in body:
        print("✅ TWEET VERIFIED ON PROFILE!")
    else:
        print("Tweet not immediately visible — checking latest tweet...")
        # Get first tweet text
        first_tweet = page.evaluate("""
            (function() {
                const tweets = [...document.querySelectorAll('[data-testid="tweet"]')];
                if (tweets[0]) {
                    const text = tweets[0].querySelector('[data-testid="tweetText"]');
                    const time = tweets[0].querySelector('time');
                    return {
                        text: text ? text.innerText.substring(0, 100) : 'NO TEXT',
                        time: time ? time.getAttribute('datetime') : 'NO TIME'
                    };
                }
                return 'NO TWEETS';
            })();
        """)
        print(f"Latest tweet: {first_tweet}")
else:
    print("Button still disabled!")

context.close()
