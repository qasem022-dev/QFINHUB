#!/usr/bin/env python3
"""Test different methods to enable the tweet button"""
from cloakbrowser import launch_persistent_context
import time

context = launch_persistent_context(
    user_data_dir="/home/admin1/.hermes/cloak-profiles/x-account-1",
    headless=True,
    humanize=True
)
page = context.new_page()
page.set_default_timeout(30000)

page.goto("https://x.com/compose/post", wait_until="domcontentloaded", timeout=20000)
time.sleep(5)

tweet = "Testing native input method " + str(int(time.time()))

# METHOD 1: Use native input setter + InputEvent (not just Event('input'))
print("=== METHOD 1: Native setter + InputEvent ===")
escaped = tweet.replace("'", "\\'").replace("$", "\\$").replace("\n", "\\n")
result = page.evaluate(f"""
    (function() {{
        const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                  document.querySelector('div[role="textbox"]');
        if (!el) return 'NO_EL';
        
        // Use native setter
        const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLDivElement.prototype, 'textContent'
        ) || Object.getOwnPropertyDescriptor(
            window.Node.prototype, 'textContent'
        );
        
        el.focus();
        el.textContent = '{escaped}';
        
        // Try InputEvent instead of Event
        el.dispatchEvent(new InputEvent('input', {{
            bubbles: true,
            cancelable: true,
            inputType: 'insertText',
            data: '{escaped}'
        }}));
        
        // Also try compositionend (React uses this)
        el.dispatchEvent(new CompositionEvent('compositionend', {{
            bubbles: true,
            data: '{escaped}'
        }}));
        
        return 'DONE';
    }})();
""")
print(f"Result: {result}")
time.sleep(3)

btn_state = page.evaluate("""
    (function() {
        const b = document.querySelector('[data-testid="tweetButton"]') ||
                 document.querySelector('[data-testid="tweetButtonInline"]');
        if (!b) return 'NOT FOUND';
        return { disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled') };
    })();
""")
print(f"Button after method 1: {btn_state}")

# METHOD 2: Try keyboard typing via CloakBrowser
if btn_state.get('disabled', True):
    print("\n=== METHOD 2: CloakBrowser keyboard.type ===")
    # Clear first
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) { el.textContent = ''; el.dispatchEvent(new Event('input', {bubbles: true})); }
        })();
    """)
    time.sleep(1)
    
    # Click on textarea
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) el.click();
        })();
    """)
    time.sleep(1)
    
    # Type character by character
    page.keyboard.type(tweet, delay=50)
    time.sleep(3)
    
    btn_state = page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (!b) return 'NOT FOUND';
            return { disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled') };
        })();
    """)
    print(f"Button after method 2: {btn_state}")

# METHOD 3: Skip compose page, use home page quick-compose
if btn_state.get('disabled', True):
    print("\n=== METHOD 3: Home page quick compose ===")
    page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)
    
    # Click "Post" or "What's happening" to open composer
    page.evaluate("""
        (function() {
            const links = [...document.querySelectorAll('a[href="/compose/post"]')];
            if (links[0]) links[0].click();
        })();
    """)
    time.sleep(3)
    
    page.keyboard.type(tweet + " v3", delay=50)
    time.sleep(3)
    
    btn_state = page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (!b) return 'NOT FOUND';
            return { disabled: b.disabled, ariaDisabled: b.getAttribute('aria-disabled') };
        })();
    """)
    print(f"Button after method 3: {btn_state}")

# If any worked, try posting
if btn_state.get('disabled') == False:
    print("\n=== BUTTON ENABLED! Posting... ===")
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b) b.click();
        })();
    """)
    time.sleep(5)
    print(f"URL after post: {page.evaluate('window.location.href')}")
    
    # Verify
    page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
    time.sleep(4)
    body = page.evaluate("document.body.innerText")
    if tweet in body:
        print("✅ VERIFIED ON PROFILE!")
    else:
        print("❌ Not on profile")
else:
    print(f"\n❌ BUTTON STILL DISABLED: {btn_state}")

context.close()
