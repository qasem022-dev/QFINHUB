#!/usr/bin/env python3
"""Quick Reddit karma test — 1 comment, minimal delays, to verify the mechanism works."""
import os, time, random, sys

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

SUBREDDIT = "personalfinance"

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
    page.goto(f"https://www.reddit.com/r/{SUBREDDIT}/new/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)

    # Get unique posts with titles
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

    # Find a post about investing/compound/debt/mortgage/tax/retirement
    keywords = ["invest", "compound", "debt", "mortgage", "tax", "retire", "401k", "savings", "emergency", "loan", "interest"]
    target_post = None
    for post in posts:
        title_lower = post["title"].lower()
        for kw in keywords:
            if kw in title_lower:
                target_post = post
                break
        if target_post:
            break

    if not target_post:
        # Fall back to first post
        target_post = posts[0] if posts else None

    if not target_post:
        print("No posts found")
        ctx.close()
        return

    print(f"Target post: {target_post['title'][:80]}")
    print(f"URL: {target_post['url']}")

    # Navigate to the post
    page.goto(target_post["url"], wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)

    # Try to click "Add a comment" button
    clicked = page.evaluate("""
        (function() {
            var btns = document.querySelectorAll('button, [role="button"]');
            for (var btn of btns) {
                var t = (btn.textContent || '').toLowerCase();
                if (t.includes('add a comment') && t.length < 30) {
                    btn.click();
                    return 'CLICKED: ' + t.trim();
                }
            }
            return 'NOT_FOUND';
        })()
    """)
    print(f"Add comment button: {clicked}")
    time.sleep(3)

    # Check for comment textarea
    textarea_count = page.evaluate("""
        (function() {
            var boxes = document.querySelectorAll('div[contenteditable="true"][role="textbox"], textarea[name="body"], div[data-lexical-editor="true"]');
            return boxes.length;
        })()
    """)
    print(f"Textareas found: {textarea_count}")

    if textarea_count > 0:
        # Type a short test comment
        test_comment = "Great question. The math depends on your specific situation — have you looked at the 28/36 rule for housing affordability? It is a useful starting point."
        
        textarea = page.locator('div[contenteditable="true"][role="textbox"], textarea[name="body"]').first
        textarea.click()
        time.sleep(1)
        
        # Type using keyboard
        page.keyboard.type(test_comment, delay=20)
        time.sleep(2)
        
        # Try to submit
        submitted = page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button, [role="button"]');
                for (var btn of btns) {
                    var t = (btn.textContent || '').toLowerCase().trim();
                    if (t === 'comment' || t === 'reply') {
                        if (!btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
                            btn.click();
                            return 'SUBMITTED';
                        }
                        return 'DISABLED: ' + t;
                    }
                }
                return 'NO_BUTTON';
            })()
        """)
        print(f"Submit result: {submitted}")
        time.sleep(3)
        print(f"Post-submit URL: {page.url}")
    else:
        # Maybe comment box is inside a shadow DOM or needs different selector
        body = page.evaluate("document.body.innerText.substring(0, 500)")
        print(f"Page text: {body[:300]}")
        
        # Try finding contenteditable
        ce_count = page.evaluate("document.querySelectorAll('[contenteditable=\"true\"]').length")
        print(f"Contenteditable elements: {ce_count}")
        
        if ce_count > 0:
            page.evaluate("""
                (function() {
                    var els = document.querySelectorAll('[contenteditable="true"]');
                    els[0].focus();
                    els[0].click();
                })()
            """)
            time.sleep(1)
            test_comment = "Good question. The 28/36 rule is a useful starting point for housing affordability."
            page.keyboard.type(test_comment, delay=20)
            time.sleep(2)
            
            submitted = page.evaluate("""
                (function() {
                    var btns = document.querySelectorAll('button, [role="button"]');
                    for (var btn of btns) {
                        var t = (btn.textContent || '').toLowerCase().trim();
                        if (t === 'comment' || t === 'reply') {
                            if (!btn.disabled && btn.getAttribute('aria-disabled') !== 'true') {
                                btn.click();
                                return 'SUBMITTED';
                            }
                            return 'DISABLED';
                        }
                    }
                    return 'NO_BUTTON';
                })()
            """)
            print(f"Submit result (ce): {submitted}")

    ctx.close()
    print("Done")

if __name__ == "__main__":
    main()