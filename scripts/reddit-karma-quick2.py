#!/usr/bin/env python3
"""Reddit karma — fix: use evaluate to focus + keyboard.type instead of locator.click."""
import os, time, random, sys

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

def main():
    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
        headless=True, humanize=True,
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()

    # Verify login
    page.goto("https://www.reddit.com/user/me/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    if "login" in page.url.lower():
        print("SESSION_EXPIRED")
        ctx.close()
        return
    print("Logged in")

    # Go to r/personalfinance/new
    page.goto("https://www.reddit.com/r/personalfinance/new/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)

    # Get unique posts
    posts = page.evaluate("""
        (function() {
            var results = [];
            var seen = {};
            var articles = document.querySelectorAll('shreddit-post, article, [data-testid="post-container"]');
            articles.forEach(function(article) {
                var titleEl = article.querySelector('a[slot="title"], h3, [data-testid="post-title"]');
                var linkEl = article.querySelector('a[href*="/comments/"]');
                if (titleEl && linkEl) {
                    var url = linkEl.href;
                    if (!seen[url]) {
                        seen[url] = true;
                        results.push({title: titleEl.textContent.trim(), url: url});
                    }
                }
            });
            return results;
        })()
    """)
    print(f"Found {len(posts)} unique posts")

    # Find an investing/debt/tax/mortgage related post
    keywords = ["invest", "compound", "debt", "mortgage", "tax", "retire", "401k", "savings", "emergency", "loan", "interest", "fund"]
    target = None
    for post in posts:
        title_lower = post["title"].lower()
        for kw in keywords:
            if kw in title_lower:
                target = post
                break
        if target:
            break

    if not target:
        target = posts[0] if posts else None

    if not target:
        print("No posts found")
        ctx.close()
        return

    print(f"Target: {target['title'][:80]}")
    print(f"URL: {target['url']}")

    # Navigate to the post
    page.goto(target["url"], wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)

    # Check if comment box exists
    ce_count = page.evaluate("document.querySelectorAll('[contenteditable=\"true\"]').length")
    ta_count = page.evaluate("document.querySelectorAll('textarea[name=\"body\"]').length")
    print(f"Contenteditable: {ce_count}, Textareas: {ta_count}")

    # Focus the comment box via evaluate (avoids humanize click interception)
    focused = page.evaluate("""
        (function() {
            // Try contenteditable first
            var ce = document.querySelectorAll('div[contenteditable="true"][role="textbox"]');
            if (ce.length > 0) {
                ce[0].focus();
                ce[0].click();
                return 'CE_FOCUSED';
            }
            // Try textarea
            var ta = document.querySelectorAll('textarea[name="body"]');
            if (ta.length > 0) {
                ta[0].focus();
                ta[0].click();
                return 'TA_FOCUSED';
            }
            // Try any contenteditable
            var anyCe = document.querySelectorAll('[contenteditable="true"]');
            if (anyCe.length > 0) {
                anyCe[0].focus();
                anyCe[0].click();
                return 'ANY_CE_FOCUSED';
            }
            return 'NOTHING_FOUND';
        })()
    """)
    print(f"Focus result: {focused}")
    time.sleep(2)

    if "FOCUSED" in str(focused):
        # Type the comment using keyboard.type (simulates real typing)
        comment = "The math on this depends on your time horizon. If you are investing for 10+ years, a low-cost S&P 500 index fund has historically averaged about 7% annual returns after inflation. On $500/month over 30 years at 7%, you end up with about $611,000. Starting early matters more than the amount."
        
        print("Typing comment...")
        page.keyboard.type(comment, delay=15)
        time.sleep(2)
        
        # Try to find and click Comment/Reply button
        submitted = page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button, [role="button"]');
                for (var btn of btns) {
                    var t = (btn.textContent || '').toLowerCase().trim();
                    if ((t === 'comment' || t === 'reply') && t.length < 15) {
                        var disabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true';
                        if (!disabled) {
                            btn.click();
                            return 'SUBMITTED: ' + t;
                        }
                        return 'DISABLED: ' + t;
                    }
                }
                return 'NO_BUTTON_FOUND';
            })()
        """)
        print(f"Submit: {submitted}")
        time.sleep(3)
        print(f"Post-submit URL: {page.url}")
    else:
        # Check what is on the page
        body = page.evaluate("document.body.innerText.substring(0, 600)")
        print(f"Page text: {body[:300]}")
        
        # Maybe need to login to comment? Check for signin prompt
        if "sign in" in body.lower() or "log in" in body.lower():
            print("LOGIN REQUIRED TO COMMENT")
        else:
            # Try scrolling down to find comment section
            page.evaluate("window.scrollTo(0, 500)")
            time.sleep(2)
            ce_count2 = page.evaluate("document.querySelectorAll('[contenteditable=\"true\"]').length")
            print(f"After scroll - contenteditable: {ce_count2}")

    ctx.close()
    print("Done")

if __name__ == "__main__":
    main()