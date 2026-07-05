#!/usr/bin/env python3
"""Batch 1: Test 5 subreddits for karma requirements."""
import os, time, random, json

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

SUBS = ["CasualConversation", "NoStupidQuestions", "answers", "AskReddit", "povertyfinance"]

COMMENTS = {
    "CasualConversation": "This is a really good point. Small changes really do add up over time in ways you dont expect.",
    "NoStupidQuestions": "The short answer is it depends on context, but generally the simplest explanation is the right one.",
    "answers": "From what I understand, the most practical approach is to start with the basics and adjust from there.",
    "AskReddit": "Honestly everyone has a slightly different take. There is no single right answer, just what works for you.",
    "povertyfinance": "One thing that helped me was tracking every expense for 30 days. Not to budget, just to see where money goes.",
}

def main():
    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
        headless=True, humanize=False,
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    
    page.goto("https://www.reddit.com/user/me/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    if "login" in page.url.lower():
        print("SESSION_EXPIRED")
        ctx.close()
        return
    print("Logged in as u/QASEMQH (karma: 1, age: 1mo)")
    
    results = {}
    
    for sub in SUBS:
        print(f"\n--- r/{sub} ---")
        
        # Get posts
        page.goto(f"https://old.reddit.com/r/{sub}/new/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(3)
        posts = page.evaluate("""
            (function() {
                var results = [];
                var seen = {};
                var things = document.querySelectorAll('.thing.link');
                things.forEach(function(thing) {
                    var titleEl = thing.querySelector('a.title');
                    var linkEl = thing.querySelector('a.comments');
                    if (titleEl && linkEl && !seen[linkEl.href]) {
                        seen[linkEl.href] = true;
                        results.push({title: titleEl.textContent.trim(), url: linkEl.href});
                    }
                });
                return results;
            })()
        """)
        
        if not posts:
            print("  No posts")
            results[sub] = "NO_POSTS"
            continue
        
        post = posts[0]
        print(f"  Post: {post['title'][:60]}")
        
        # Navigate to post
        page.goto(post["url"], wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        
        ta = page.evaluate("document.querySelectorAll('textarea[name=\"text\"]').length")
        if ta == 0:
            print("  NO_TEXTAREA")
            results[sub] = "NO_TEXTAREA"
            continue
        
        # Type comment
        comment = COMMENTS.get(sub, "Good point.")
        page.evaluate("""(function() { var ta = document.querySelector('textarea[name="text"]'); if(ta){ta.focus();ta.click();} })()""")
        time.sleep(1)
        page.keyboard.type(comment, delay=5)
        time.sleep(2)
        
        # Submit
        page.evaluate("""(function() { var b = document.querySelector('button.save'); if(b) b.click(); })()""")
        time.sleep(5)
        
        # Check visibility
        snippet = comment[:30].replace("'", "\\'")
        visible = page.evaluate("document.body.innerText.indexOf('" + snippet + "') !== -1")
        
        # Check for errors
        error = page.evaluate("""
            (function() {
                var b = document.body.innerText;
                if (b.indexOf('not allowed') > -1) return 'NOT_ALLOWED';
                if (b.indexOf('too new') > -1) return 'TOO_NEW';
                if (b.indexOf('not enough') > -1) return 'LOW_KARMA';
                if (b.indexOf('removed') > -1) return 'REMOVED';
                return 'NONE';
            })()
        """)
        
        if visible:
            print(f"  SUCCESS")
            results[sub] = "SUCCESS"
        elif error != "NONE":
            print(f"  BLOCKED: {error}")
            results[sub] = f"BLOCKED:{error}"
        else:
            print(f"  SUBMITTED_NOT_VISIBLE (may be filtered)")
            results[sub] = "FILTERED"
        
        time.sleep(10)
    
    print(f"\n=== BATCH 1 SUMMARY ===")
    for sub, status in results.items():
        emoji = "OK" if status == "SUCCESS" else "BLOCKED" if "BLOCKED" in status else "UNCERTAIN"
        print(f"  r/{sub}: {emoji} ({status})")
    
    # Save results
    with open("/tmp/reddit-sub-results-batch1.json", "w") as f:
        json.dump(results, f, indent=2)
    
    ctx.close()

if __name__ == "__main__":
    main()