#!/usr/bin/env python3
"""Reddit karma - v3: Try r/debtfree (lower karma req), use old.reddit.com for reliable comment form."""
import os, time, sys

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
    print("Logged in as u/QASEMQH")

    # Use OLD reddit - much simpler HTML, reliable comment form
    page.goto("https://old.reddit.com/r/debtfree/new/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)

    # Get posts from old reddit
    posts = page.evaluate("""
        (function() {
            var results = [];
            var things = document.querySelectorAll('.thing.link');
            things.forEach(function(thing) {
                var titleEl = thing.querySelector('a.title');
                var linkEl = thing.querySelector('a.comments');
                if (titleEl && linkEl) {
                    results.push({
                        title: titleEl.textContent.trim(),
                        url: linkEl.href
                    });
                }
            });
            return results;
        })()
    """)
    print(f"Found {len(posts)} posts in r/debtfree")

    if not posts:
        # Try r/financialindependence
        page.goto("https://old.reddit.com/r/financialindependence/new/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        posts = page.evaluate("""
            (function() {
                var results = [];
                var things = document.querySelectorAll('.thing.link');
                things.forEach(function(thing) {
                    var titleEl = thing.querySelector('a.title');
                    var linkEl = thing.querySelector('a.comments');
                    if (titleEl && linkEl) {
                        results.push({
                            title: titleEl.textContent.trim(),
                            url: linkEl.href
                        });
                    }
                });
                return results;
            })()
        """)
        print(f"Found {len(posts)} posts in r/financialindependence")

    if not posts:
        # Try r/leanfire
        page.goto("https://old.reddit.com/r/leanfire/new/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        posts = page.evaluate("""
            (function() {
                var results = [];
                var things = document.querySelectorAll('.thing.link');
                things.forEach(function(thing) {
                    var titleEl = thing.querySelector('a.title');
                    var linkEl = thing.querySelector('a.comments');
                    if (titleEl && linkEl) {
                        results.push({
                            title: titleEl.textContent.trim(),
                            url: linkEl.href
                        });
                    }
                });
                return results;
            })()
        """)
        print(f"Found {len(posts)} posts in r/leanfire")

    if not posts:
        print("NO_POSTS_FOUND in any subreddit")
        ctx.close()
        return

    # Print first 5 posts
    for i, post in enumerate(posts[:5]):
        print(f"  {i+1}. {post['title'][:80]}")

    # Navigate to first post on old reddit
    post_url = posts[0]["url"]
    print(f"\nNavigating to: {post_url}")
    page.goto(post_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)

    # On old reddit, the comment form is a textarea with name="text" or name="thing_id"
    # Check for comment box
    textarea_count = page.evaluate("document.querySelectorAll('textarea[name=\"text\"]').length")
    print(f"Comment textareas: {textarea_count}")

    # Check if we see the comment form
    if textarea_count > 0:
        print("Found comment textarea on old reddit")
        
        # Focus via evaluate
        page.evaluate("""
            (function() {
                var ta = document.querySelector('textarea[name="text"]');
                if (ta) {
                    ta.focus();
                    ta.click();
                }
            })()
        """)
        time.sleep(1)

        # Type comment using keyboard
        comment = "The avalanche method (highest interest first) saves the most money mathematically. "
        comment += "If you have a $3,000 card at 24% APR and a $7,000 card at 19% APR, clearing the 24% one first "
        comment += "saves roughly $1,200 in total interest vs minimum payments. The snowball method gives psychological "
        comment += "wins but costs more in interest. Run the numbers both ways and pick what keeps you motivated."
        
        print("Typing comment...")
        page.keyboard.type(comment, delay=5)
        time.sleep(2)

        # On old reddit, the submit button is input[type="submit"] with value="save" or a button with class "save"
        submitted = page.evaluate("""
            (function() {
                // Try save button (old reddit comment form)
                var saveBtn = document.querySelector('button.save');
                if (saveBtn) {
                    saveBtn.click();
                    return 'SUBMITTED_VIA_SAVE';
                }
                // Try input submit
                var inputs = document.querySelectorAll('input[type="submit"]');
                for (var inp of inputs) {
                    if (inp.value && inp.value.toLowerCase().includes('save')) {
                        inp.click();
                        return 'SUBMITTED_VIA_INPUT: ' + inp.value;
                    }
                }
                // Try any button near the textarea
                var buttons = document.querySelectorAll('button');
                for (var btn of buttons) {
                    var t = (btn.textContent || '').toLowerCase().trim();
                    if (t === 'save' || t === 'comment' || t === 'submit') {
                        btn.click();
                        return 'SUBMITTED_VIA_BUTTON: ' + t;
                    }
                }
                return 'NO_SUBMIT_BUTTON';
            })()
        """)
        print(f"Submit: {submitted}")
        time.sleep(3)
        print(f"Final URL: {page.url}")
        
        # Check if comment appeared
        body = page.evaluate("document.body.innerText.substring(0, 500)")
        if "avalanche" in body.lower():
            print("COMMENT APPEARED ON PAGE - SUCCESS!")
        else:
            print("Comment not visible in page text")
    else:
        # Maybe need to click "comment" link first to show the form
        print("No textarea found - trying to click comment link...")
        clicked = page.evaluate("""
            (function() {
                var commentLinks = document.querySelectorAll('a');
                for (var link of commentLinks) {
                    if (link.textContent.trim().toLowerCase() === 'comment' || 
                        (link.classList.contains('comments') && link.textContent.includes('comment'))) {
                        link.click();
                        return 'CLICKED: ' + link.textContent.trim().substring(0, 50);
                    }
                }
                return 'NOT_FOUND';
            })()
        """)
        print(f"Comment link: {clicked}")
        time.sleep(3)
        
        # Check again
        textarea_count2 = page.evaluate("document.querySelectorAll('textarea[name=\"text\"]').length")
        print(f"Textareas after click: {textarea_count2}")
        
        if textarea_count2 > 0:
            # Same flow as above
            page.evaluate("""(function() { var ta = document.querySelector('textarea[name="text"]'); if(ta){ta.focus();ta.click();} })()""")
            time.sleep(1)
            
            comment = "The avalanche method (highest interest first) saves the most money mathematically."
            comment += " If you have a $3,000 card at 24% and a $7,000 card at 19%, clearing the 24% one first"
            comment += " saves roughly $1,200 in total interest vs minimum payments."
            
            print("Typing comment...")
            page.keyboard.type(comment, delay=5)
            time.sleep(2)
            
            submitted = page.evaluate("""
                (function() {
                    var saveBtn = document.querySelector('button.save');
                    if (saveBtn) { saveBtn.click(); return 'SUBMITTED_VIA_SAVE'; }
                    var btns = document.querySelectorAll('button, input[type="submit"]');
                    for (var b of btns) {
                        var t = (b.textContent || b.value || '').toLowerCase();
                        if (t.includes('save') || t === 'comment') {
                            b.click();
                            return 'SUBMITTED: ' + t;
                        }
                    }
                    return 'NO_BUTTON';
                })()
            """)
            print(f"Submit: {submitted}")
            time.sleep(3)
            print(f"Final URL: {page.url}")

    ctx.close()
    print("Done")

if __name__ == "__main__":
    main()