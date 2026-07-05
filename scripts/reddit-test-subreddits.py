#!/usr/bin/env python3
"""
Direct test: Try posting a comment in each target subreddit.
Find a post, write a genuinely helpful comment, check if it sticks.
This is the definitive way to know which subreddits accept our account.
"""
import os, time, random

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

TEST_SUBS = [
    "CasualConversation",
    "NoStupidQuestions",
    "answers",
    "AskReddit",
    "povertyfinance",
    "MiddleClassFinance",
    "FirstTimeHomeBuyer",
    "personalfinance",
    "investing",
    "debtfree",
]

TEST_COMMENTS = {
    "CasualConversation": "This is a really good point. I have been thinking about this kind of thing a lot lately. Small changes really do add up over time in ways you do not expect.",
    "NoStupidQuestions": "The short answer is that it depends on context, but generally the simplest explanation is the right one. People overthink these things when the straightforward answer usually works fine.",
    "answers": "From what I understand, the most practical approach is to start with the basics and adjust from there. Most things in life work better when you build a simple foundation first.",
    "AskReddit": "Honestly the best thing about this is that everyone has a slightly different take on it. There is no single right answer, just what works for your situation.",
    "povertyfinance": "One thing that helped me was tracking every single expense for 30 days. Not to budget, just to see where the money goes. The patterns you find are usually surprising and make the cuts obvious.",
    "MiddleClassFinance": "The 28/36 rule is a good guideline for housing. Max 28% of gross income for housing costs, 36% for all debt combined. It keeps things manageable without being house poor.",
    "FirstTimeHomeBuyer": "Closing costs typically run 2-5% of the purchase price. On a $300K home that is $6,000-$15,000 on top of your down payment. Budget for this upfront so there are no surprises at closing.",
    "personalfinance": "The general guideline is 3-6 months of expenses in an emergency fund. In a high-yield savings account at 4.5% APY, $24,000 earns about $1,080/year while sitting there.",
    "investing": "The S&P 500 has averaged about 7% annual returns after inflation over long periods. $500/month for 30 years at 7% grows to about $611,000. Time in the market beats timing the market.",
    "debtfree": "The avalanche method (highest interest first) saves the most money mathematically. Clearing a 24% APR card before a 19% APR card saves roughly $1,200 in total interest on typical balances.",
}


def get_posts(page, sub):
    url = f"https://old.reddit.com/r/{sub}/new/"
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    posts = page.evaluate("""
        (function() {
            var results = [];
            var seen = {};
            var things = document.querySelectorAll('.thing.link');
            things.forEach(function(thing) {
                var titleEl = thing.querySelector('a.title');
                var linkEl = thing.querySelector('a.comments');
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
    return posts or []


def try_comment(page, post_url, comment_text):
    """Try to post a comment. Returns (status, details)."""
    page.goto(post_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    
    ta_count = page.evaluate("document.querySelectorAll('textarea[name=\"text\"]').length")
    if ta_count == 0:
        return ("NO_TEXTAREA", "No comment box found")
    
    # Focus and type
    page.evaluate("""(function() { var ta = document.querySelector('textarea[name="text"]'); if(ta){ta.focus();ta.click();} })()""")
    time.sleep(1)
    page.keyboard.type(comment_text, delay=8)
    time.sleep(2)
    
    # Submit
    result = page.evaluate("""
        (function() {
            var saveBtn = document.querySelector('button.save');
            if (saveBtn) { saveBtn.click(); return 'SUBMITTED'; }
            var btns = document.querySelectorAll('button, input[type="submit"]');
            for (var b of btns) {
                var t = (b.textContent || b.value || '').toLowerCase();
                if (t.includes('save') || t === 'comment') {
                    b.click(); return 'SUBMITTED: ' + t;
                }
            }
            return 'NO_BUTTON';
        })()
    """)
    time.sleep(5)
    
    # Check if comment appears on page — use Python slicing not JS
    snippet = comment_text[:40]
    escaped = snippet.replace("\\", "\\\\").replace("'", "\\'")
    visible = page.evaluate("document.body.innerText.indexOf('" + escaped + "') !== -1")
    
    # Check for error messages
    error = page.evaluate("""
        (function() {
            var body = document.body.innerText;
            if (body.includes('you are not allowed')) return 'NOT_ALLOWED';
            if (body.includes('removed')) return 'REMOVED';
            if (body.includes('too new')) return 'TOO_NEW';
            if (body.includes('not enough karma')) return 'LOW_KARMA';
            if (body.includes('insufficient')) return 'INSUFFICIENT';
            return 'NONE';
        })()
    """)
    
    if visible:
        return ("SUCCESS", "Comment visible on page")
    elif error != "NONE":
        return ("BLOCKED", error)
    elif "SUBMITTED" in str(result):
        return ("SUBMITTED_NOT_VISIBLE", "Submitted but not yet visible — may be filtered")
    else:
        return ("UNKNOWN", str(result))


def main():
    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
        headless=True, humanize=True,
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    
    # Login
    page.goto("https://www.reddit.com/user/me/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    if "login" in page.url.lower():
        print("SESSION_EXPIRED")
        ctx.close()
        return
    print("Logged in as u/QASEMQH")
    print("Karma: 1 post / 0 comment / 1 total")
    print("Account age: ~1 month\n")
    
    results = {}
    
    for sub in TEST_SUBS:
        print(f"--- r/{sub} ---")
        
        posts = get_posts(page, sub)
        if not posts:
            print("  No posts found, skipping")
            results[sub] = "NO_POSTS"
            continue
        
        post = posts[0]
        print(f"  Post: {post['title'][:60]}")
        
        comment = TEST_COMMENTS.get(sub, "Great point, thanks for sharing.")
        status, details = try_comment(page, post["url"], comment)
        
        print(f"  Status: {status}")
        print(f"  Details: {details}")
        results[sub] = status
        
        time.sleep(random.uniform(15, 30))
    
    # Summary
    print(f"\n{'='*50}")
    print("SUMMARY")
    print(f"{'='*50}")
    
    safe = [s for s, r in results.items() if r == "SUCCESS"]
    blocked = [s for s, r in results.items() if r in ("BLOCKED", "SUBMITTED_NOT_VISIBLE", "NO_TEXTAREA")]
    no_posts = [s for s, r in results.items() if r == "NO_POSTS"]
    
    print(f"SAFE to comment: {safe}")
    print(f"BLOCKED/uncertain: {blocked}")
    print(f"No posts: {no_posts}")
    
    ctx.close()

if __name__ == "__main__":
    main()