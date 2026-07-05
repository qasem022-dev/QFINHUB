#!/usr/bin/env python3
"""Check Reddit session status and profile info."""
import os, time, sys
os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')

from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser('~/.hermes/cloak-profiles/reddit-qasemqh'),
    headless=True,
    humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Check if logged in by visiting profile
page.goto('https://www.reddit.com/user/me/', wait_until='domcontentloaded', timeout=30000)
time.sleep(5)

url = page.url
print(f'Current URL: {url}')

if 'login' in url.lower() or 'accounts' in url.lower():
    print('SESSION_EXPIRED — need re-auth')
    # Try visiting reddit homepage to see if logged in
    page.goto('https://www.reddit.com/', wait_until='domcontentloaded', timeout=30000)
    time.sleep(3)
    body = page.evaluate('document.body.innerText.substring(0, 500)')
    if 'Log In' in body or 'Sign Up' in body:
        print('NOT LOGGED IN')
    else:
        print('Homepage text:', body[:300])
else:
    # We're logged in — get profile info
    body_text = page.evaluate('document.body.innerText.substring(0, 3000)')
    print('=== Profile Page ===')
    print(body_text[:1500])

    # Try to get username
    username_el = page.evaluate("""
        (function() {
            var el = document.querySelector('[data-testid="user-drawer-username"]');
            if (!el) el = document.querySelector('h1');
            if (!el) {
                var link = document.querySelector('a[href*="/user/"]');
                if (link) return link.textContent;
            }
            return el ? el.textContent : 'UNKNOWN';
        })()
    """)
    print(f'\nUsername: {username_el}')

ctx.close()