#!/usr/bin/env python3
"""Check Reddit karma and profile details."""
import os, time
os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

ctx = launch_persistent_context(
    user_data_dir=os.path.expanduser('~/.hermes/cloak-profiles/reddit-qasemqh'),
    headless=True,
    humanize=True,
)
page = ctx.pages[0] if ctx.pages else ctx.new_page()

# Visit profile overview page
page.goto('https://www.reddit.com/user/QASEMQH/', wait_until='domcontentloaded', timeout=30000)
time.sleep(5)

# Try to extract karma info
karma = page.evaluate("""
(function() {
    var text = document.body.innerText;
    var lines = text.split('\\n');
    var results = [];
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].match(/karma/i) || lines[i].match(/\\d+\\s*(post|comment|total)/i)) {
            results.push(lines[i].trim());
        }
    }
    return results.join(' | ');
})()
""")
print(f"Karma info: {karma}")

# Count posts and comments visible
posts = page.evaluate("""
(function() {
    var postEls = document.querySelectorAll('[data-testid="post-container"], shreddit-post, [thingid]');
    return postEls.length;
})()
""")
print(f"Visible posts: {posts}")

# Get all visible text content for analysis
body = page.evaluate("document.body.innerText.substring(0, 4000)")
print("=== Full Body Text ===")
print(body[:3000])

# Also check if old.reddit.com has more info
page.goto('https://old.reddit.com/user/QASEMQH/', wait_until='domcontentloaded', timeout=30000)
time.sleep(3)
old_body = page.evaluate("document.body.innerText.substring(0, 2000)")
if 'login' not in page.url.lower():
    print("=== Old Reddit Profile ===")
    # Get karma from sidebar
    karma_old = page.evaluate("""
        (function() {
            var karmaEl = document.querySelector('.karma, .userkarma, .karmas');
            if (karmaEl) return karmaEl.textContent.trim();
            var sidebar = document.querySelector('.side .titlebox, .titlebox');
            if (sidebar) return sidebar.innerText.substring(0, 500);
            return 'NOT_FOUND';
        })()
    """)
    print(f"Old Reddit karma: {karma_old}")
    
    # Count posts
    post_links = page.evaluate("""
        (function() {
            var links = document.querySelectorAll('.thing.link');
            return links.length;
        })()
    """)
    print(f"Post count (old reddit): {post_links}")

ctx.close()