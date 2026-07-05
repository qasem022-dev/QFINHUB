#!/usr/bin/env python3
"""
Reddit Karma Builder v3 — PRODUCTION
Uses old.reddit.com for reliable comment forms.
Posts genuinely helpful, math-based answers with NO LINKS to QFINHUB.
Upvotes relevant content for natural activity.

Safety:
- Max 3 comments per session
- 45-120 second random delays between actions
- Only subreddits with low karma requirements (r/debtfree, r/leanfire, r/MiddleClassFinance)
- Each answer is unique with real math
"""
import os, time, random, sys

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

MAX_COMMENTS = 3
SUBREDDITS = ["debtfree", "MiddleClassFinance", "leanfire"]
MIN_DELAY = 45
MAX_DELAY = 120

# 9 unique answer templates — each with real math, genuinely helpful
ANSWERS = [
    "The avalanche method (highest interest first) saves the most money mathematically. If you have a $3,000 card at 24% APR and a $7,000 card at 19% APR, clearing the 24% one first saves roughly $1,200 in total interest vs minimum payments. The snowball method gives psychological wins but costs more in interest. Run the numbers both ways and pick what keeps you motivated.",
    
    "Compound interest is wild once you see the actual numbers. $500/month at 7% average annual return: After 10 years: $86,000. After 20 years: $263,000. After 30 years: $611,000. The first 5 years feel slow. Years 15-25 is where the line goes nearly vertical. Starting early beats investing more — $200/month starting at 25 beats $400/month starting at 35.",
    
    "The 28/36 rule is the standard for housing affordability. Monthly housing costs (PITI) should stay under 28% of gross monthly income. Total debt payments under 36%. On $80K/year ($6,667/month gross): Max PITI = $1,867/month. 30-year at 6.8% with 20% down = roughly a $270K-$300K home depending on your local property taxes. Property taxes vary wildly — 0.5% in some states, 2.5% in others.",
    
    "Tax brackets are marginal, not flat. If you are single and your taxable income is $100,000 in 2026: First $11,600 at 10% = $1,160. $11,601-$47,150 at 12% = $4,266. $47,151-$100,525 at 22% = $11,243. Total = $16,669. Effective rate = 16.7%, NOT 22%. A raise from $100K to $105K only taxes the amount OVER $100,525 at 24%.",
    
    "The 401(k) match is the only guaranteed 100% return in investing. If your employer matches 50% up to 6% of salary, and you earn $80K: You contribute $4,800/year, employer adds $2,400. At 7% return over 30 years, just the employer match becomes $242,000. Your own contributions grow to $484,000. Combined: $726,000. Always contribute at least up to the match.",
    
    "Here is the math on emergency funds. $4,000/month expenses: 3 months = $12,000, 6 months = $24,000. The difference ($12,000) in a HYSA at 4.5% APY earns $540/year while sitting there. In a checking account at 0.01%, that same $24,000 earns $2.40/year. That is the difference between keeping pace with inflation vs losing $1,000/year to it.",
    
    "The S&P 500 has averaged about 10% annual returns before inflation, or about 7% after inflation, over long periods. But that average hides huge swings. In any single year, returns could be -37% (2008) or +32% (2013). The 7% figure is only reliable over 20+ year holding periods. $10,000 in a low-cost S&P 500 index fund, left alone for 30 years at 7% = $76,123.",
    
    "The 4% rule for retirement: if you want $60K/year in retirement, you need $1.5M saved. Using 3.5% (more conservative): $1.71M. 401(k) max contribution in 2026 is $23,500. At 7% return over 25 years, maxing out every year gets you to about $1.5M. If your employer matches 50% up to 6% of $100K salary, that is $3,000/year in free money.",
    
    "On HYSA rates — they track the Fed funds rate. When the Fed cuts rates, HYSA rates follow within 1-2 weeks. In mid-2026, most HYSAs are around 4.0-4.5% APY. The difference between 4.0% and 4.5% on $25,000 is $125/year. Not life-changing — pick one with no fees and no minimums.",
]

# Keywords that trigger each answer
TRIGGERS = [
    ["debt", "payoff", "avalanche", "snowball", "credit card", "loan payoff", "interest rate"],
    ["compound", "invest", "growth", "portfolio", "index fund", "s&p", "start investing"],
    ["mortgage", "afford", "house", "home", "how much house", "down payment", "first home"],
    ["tax", "bracket", "income tax", "marginal", "taxable income", "raise"],
    ["401k", "401(k)", "employer match", "retirement account", "company match", "free money"],
    ["emergency", "savings", "safety net", "how much save", "high yield", "hysa"],
    ["index fund", "etf", "s&p", "stock market", "passive", "long term investing"],
    ["retire", "retirement", "fire", "financial independence", "how much do i need"],
    ["hysa", "high yield savings", "savings account", "savings rate", "best savings"],
]

def find_matching_answer(title):
    """Find the best matching answer for a post title"""
    title_lower = title.lower()
    best_match = -1
    best_score = 0
    
    for i, triggers in enumerate(TRIGGERS):
        score = sum(1 for t in triggers if t in title_lower)
        if score > best_score:
            best_score = score
            best_match = i
    
    if best_match >= 0 and best_score > 0:
        return ANSWERS[best_match]
    return None


def get_posts(page, subreddit):
    """Get posts from old.reddit.com/r/{subreddit}/new/"""
    url = f"https://old.reddit.com/r/{subreddit}/new/"
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(random.uniform(3, 5))
    
    posts = page.evaluate("""
        (function() {
            var results = [];
            var things = document.querySelectorAll('.thing.link');
            things.forEach(function(thing) {
                var titleEl = thing.querySelector('a.title');
                var linkEl = thing.querySelector('a.comments');
                if (titleEl && linkEl) {
                    results.push({title: titleEl.textContent.trim(), url: linkEl.href});
                }
            });
            return results;
        })()
    """)
    return posts or []


def post_comment(page, post_url, comment_text):
    """Navigate to a post on old reddit and post a comment"""
    page.goto(post_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(random.uniform(4, 7))
    
    # Check for comment textarea
    ta_count = page.evaluate("document.querySelectorAll('textarea[name=\"text\"]').length")
    if ta_count == 0:
        return "NO_TEXTAREA"
    
    # Focus the textarea
    page.evaluate("""(function() { var ta = document.querySelector('textarea[name="text"]'); if(ta){ta.focus();ta.click();} })()""")
    time.sleep(1)
    
    # Type the comment
    page.keyboard.type(comment_text, delay=5)
    time.sleep(2)
    
    # Click save button
    submitted = page.evaluate("""
        (function() {
            var saveBtn = document.querySelector('button.save');
            if (saveBtn) { saveBtn.click(); return 'SUBMITTED'; }
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
    time.sleep(3)
    return submitted


def upvote_posts(page, subreddit, count=3):
    """Upvote a few posts in a subreddit on old reddit"""
    url = f"https://old.reddit.com/r/{subreddit}/hot/"
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(random.uniform(3, 5))
    
    upvoted = page.evaluate("""
        (function() {
            var arrows = document.querySelectorAll('div.uparrow, button.up');
            var available = [];
            for (var a of arrows) {
                if (!a.classList.contains('upmod') && a.style.display !== 'none') {
                    available.push(a);
                }
            }
            var target = Math.min(3, available.length);
            for (var i = 0; i < target; i++) {
                try { available[i].click(); } catch(e) {}
            }
            return target;
        })()
    """)
    return upvoted


def main():
    print("=== Reddit Karma Builder v3 ===")
    print(f"Max comments: {MAX_COMMENTS}")
    
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
    
    comments_posted = 0
    upvotes_total = 0
    used_answers = set()  # Track which answers we've used to avoid duplicates
    
    for subreddit in SUBREDDITS:
        if comments_posted >= MAX_COMMENTS:
            break
        
        print(f"\n--- r/{subreddit} ---")
        
        # Upvote some content first (natural activity)
        uv = upvote_posts(page, subreddit)
        if uv:
            print(f"Upvoted {uv} posts")
            upvotes_total += uv
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
        
        # Find posts
        posts = get_posts(page, subreddit)
        print(f"Found {len(posts)} posts")
        
        for post in posts[:15]:
            if comments_posted >= MAX_COMMENTS:
                break
            
            title = post.get("title", "")
            url = post.get("url", "")
            
            # Find matching answer
            answer = find_matching_answer(title)
            if answer and answer not in used_answers:
                print(f"  Match: '{title[:70]}'")
                result = post_comment(page, url, answer)
                print(f"  Result: {result}")
                if "SUBMITTED" in str(result):
                    comments_posted += 1
                    used_answers.add(answer)
                    print(f"  Comments: {comments_posted}/{MAX_COMMENTS}")
                time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
    
    print(f"\n=== Session Complete ===")
    print(f"Comments posted: {comments_posted}")
    print(f"Upvotes: {upvotes_total}")
    print(f"Next session: run again in 6-8 hours")
    
    ctx.close()

if __name__ == "__main__":
    main()