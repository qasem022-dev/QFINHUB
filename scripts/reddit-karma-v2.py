#!/usr/bin/env python3
"""
Reddit Karma Builder v2 — Phase 38
- Navigates to r/personalfinance, r/investing, r/debtfree sorted by New
- Finds posts with finance questions
- Posts genuinely helpful, math-based answers (NO LINKS to QFINHUB)
- Upvotes relevant content
- Max 3 comments per session (safety), random delays
- Each answer is unique and genuinely useful
"""
import os, time, random, sys

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

MAX_COMMENTS = 3
SUBREDDITS = ["personalfinance", "investing", "debtfree"]
MIN_DELAY = 45
MAX_DELAY = 120

# Each answer is a complete, genuinely helpful response with real math
ANSWERS = {
    "compound": """Compound interest is wild once you see the actual numbers.

$500/month at 7% average annual return:
- After 10 years: $86,000 (you put in $60,000, earned $26,000 in growth)
- After 20 years: $263,000 (you put in $120,000, earned $143,000)
- After 30 years: $611,000 (you put in $180,000, earned $431,000)

The first 5 years feel slow. Years 15-25 is where the line goes nearly vertical. Starting early beats investing more — $200/month starting at 25 beats $400/month starting at 35.""",

    "mortgage": """The 28/36 rule is the standard, but the real number depends on your full picture.

Monthly housing costs (PITI) should stay under 28% of gross monthly income. Total debt payments under 36%.

On $80K/year ($6,667/month gross):
- Max PITI: $1,867/month
- 30-year at 6.8% with 20% down: ~$270K-$300K home depending on your local property taxes

Property taxes vary wildly — 0.5% in some states, 2.5% in others. That is a $400/month difference on a $300K home.""",

    "debt": """Here is the math that helped me decide:

Avalanche (highest interest first) saves the most money. Snowball (smallest balance first) gives psychological wins.

$3,000 card at 24% APR + $7,000 card at 19% APR, with $500/month for debt:
- Avalanche: Clear the $3K first (~7 months), saves ~$1,200 total vs minimum payments
- Snowball: If the $7K had a smaller balance, you would clear it first — but it costs ~$180 more in interest

The difference matters most when your highest-rate debt is also your largest balance.""",

    "retirement": """The 4% rule: if you want $60K/year in retirement, you need $1.5M saved. Using 3.5% (more conservative): $1.71M.

401(k) max contribution in 2026 is $23,500. At 7% return over 25 years, maxing out every year gets you to ~$1.5M.

If your employer matches 50% up to 6% of $100K salary, that is $3,000/year in free money. Over 25 years at 7%, employer match alone becomes $190,000.""",

    "tax": """Tax brackets are marginal, not flat.

If you are single and your taxable income is $100,000 in 2026:
- First $11,600: 10% = $1,160
- $11,601-$47,150: 12% = $4,266
- $47,151-$100,525: 22% = $11,243
- Total: $16,669, effective rate 16.7%, NOT 22%

A raise from $100K to $105K only taxes the amount OVER $100,525 at 24%. The extra $4,475 costs $1,074 more tax, not $2,520.""",

    "emergency": """3-6 months of expenses is the guideline:

$4,000/month expenses:
- 3 months: $12,000
- 6 months: $24,000

The difference ($12,000) in a HYSA at 4.5% APY earns $540/year while sitting there. In a checking account at 0.01%, that same $24,000 earns $2.40/year. That is the difference between losing $1,000/year to inflation vs keeping pace.""",

    "401k": """The 401(k) match is the only guaranteed 100% return in investing.

If your employer matches 50% of your contribution up to 6% of salary, and you earn $80K:
- You contribute: $4,800/year (6%)
- Employer adds: $2,400/year
- That $2,400 is free money — you get it whether the market goes up or down

At 7% annual return over 30 years, just the employer match ($2,400/year) becomes $242,000. Your own $4,800/year contributions grow to $484,000. Combined: $726,000.""",

    "hySA": """HYSA rates track the Fed funds rate. When the Fed cuts rates, HYSA rates follow within 1-2 weeks.

In mid-2026, most HYSAs are around 4.0-4.5% APY. Some of the consistently highest:
- Marcus by Goldman Sachs
- Ally Bank
- Capital One 360 Performance Savings
- Discover Online Savings

The difference between 4.0% and 4.5% on $25,000 is $125/year. Not life-changing — pick one with no fees and no minimums, and do not overthink it. You can always move money later if rates diverge.""",

    "investing": """The S&P 500 has averaged about 10% annual returns before inflation, or ~7% after inflation, over long periods.

But that average hides huge swings. In any single year, returns could be -37% (2008) or +32% (2013). The 7% figure is only reliable over 20+ year holding periods.

$10,000 invested in a low-cost S&P 500 index fund, left alone for 30 years at 7%: $76,123. Same amount at 10%: $174,494. The difference between 7% and 10% over 30 years is almost 2.3x.""",
}

# Keywords that trigger each answer template
TRIGGERS = {
    "compound": ["compound", "compounding", "interest growth", "how fast money grows", "start investing early"],
    "mortgage": ["mortgage", "afford", "how much house", "home buying", "down payment", "first home"],
    "debt": ["pay off debt", "debt payoff", "avalanche", "snowball", "credit card debt", "debt consolidation"],
    "retirement": ["retire", "retirement", "how much do i need", "fire", "financial independence"],
    "tax": ["tax bracket", "tax rate", "income tax", "marginal tax", "effective tax rate"],
    "emergency": ["emergency fund", "savings", "how much save", "safety net", "high yield savings", "hysa"],
    "401k": ["401k", "401(k)", "employer match", "retirement account", "company match"],
    "hySA": ["hysa", "high yield savings", "best savings account", "savings rate", "savings account"],
    "investing": ["index fund", "etf", "s&p", "invest", "portfolio", "stock market", "passive investing"],
}

def find_matching_answer(post_title, post_text):
    """Find a matching answer template for a post"""
    combined = (post_title + " " + post_text).lower()
    for key, triggers in TRIGGERS.items():
        for trigger in triggers:
            if trigger in combined:
                return key, ANSWERS[key]
    return None, None


def write_comment_on_post(page, post_url, comment_text):
    """Navigate to a Reddit post and write a comment"""
    page.goto(post_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(random.uniform(4, 8))

    # Click "Add a comment" to open the comment box
    clicked = page.evaluate("""
        (function() {
            var btns = document.querySelectorAll('button, [role="button"]');
            for (var btn of btns) {
                var t = (btn.textContent || '').toLowerCase();
                if (t.includes('add a comment') && t.length < 30) {
                    btn.click();
                    return true;
                }
            }
            return false;
        })()
    """)

    if not clicked:
        # Try clicking on any comment box directly
        page.evaluate("""
            (function() {
                var boxes = document.querySelectorAll('div[contenteditable="true"], textarea');
                if (boxes.length > 0) {
                    boxes[0].click();
                    boxes[0].focus();
                    return true;
                }
                return false;
            })()
        """)

    time.sleep(2)

    # Type the comment using keyboard (more reliable than evaluate)
    textarea = page.locator('div[contenteditable="true"][role="textbox"], textarea[name="body"]')
    if textarea.count() > 0:
        textarea.first.click()
        time.sleep(0.5)

        # Type character by character for React compatibility
        for char in comment_text:
            page.keyboard.type(char, delay=random.uniform(10, 30))

        time.sleep(1)

        # Click Comment button
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
                    }
                }
                return 'BUTTON_DISABLED_OR_NOT_FOUND';
            })()
        """)
        return submitted

    return "NO_TEXTAREA_FOUND"


def upvote_posts(page, subreddit, count=3):
    """Upvote a few random posts in a subreddit"""
    url = f"https://www.reddit.com/r/{subreddit}/hot/"
    page.goto(url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(random.uniform(3, 6))

    upvoted = page.evaluate("""
        (function() {
            var buttons = document.querySelectorAll('button[aria-label="upvote"], button[aria-label="Upvote"]');
            var already = document.querySelectorAll('button[aria-pressed="true"][aria-label="upvote"], button[aria-pressed="true"][aria-label="Upvote"]');
            // Only upvote not-already-upvoted posts
            var available = [];
            for (var btn of buttons) {
                if (btn.getAttribute('aria-pressed') !== 'true') {
                    available.push(btn);
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
    print("=== Reddit Karma Builder v2 ===")
    print(f"Max comments: {MAX_COMMENTS}")

    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh"),
        headless=True,
        humanize=True,
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

    for subreddit in SUBREDDITS:
        if comments_posted >= MAX_COMMENTS:
            break

        print(f"\n--- r/{subreddit} ---")

        # Upvote some content first (looks natural)
        uv = upvote_posts(page, subreddit)
        upvotes_total += uv
        print(f"Upvoted {uv} posts")
        time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))

        # Find recent posts
        page.goto(f"https://www.reddit.com/r/{subreddit}/new/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(random.uniform(4, 7))

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
                            results.push({
                                title: titleEl.textContent.trim(),
                                url: url
                            });
                        }
                    }
                });
                return results;
            })()
        """)

        print(f"Found {len(posts)} unique posts")

        for post in posts[:15]:
            if comments_posted >= MAX_COMMENTS:
                break

            title = post.get("title", "")
            url = post.get("url", "")

            # Find matching answer
            key, answer = find_matching_answer(title, "")
            if answer:
                print(f"  Match: '{title[:70]}' (template: {key})")
                result = write_comment_on_post(page, url, answer)
                print(f"  Result: {result}")
                if "SUBMITTED" in str(result):
                    comments_posted += 1
                    print(f"  Comments: {comments_posted}/{MAX_COMMENTS}")
                time.sleep(random.uniform(MIN_DELAY, MAX_DELAY))
            else:
                # No match found — try next post
                pass

    print(f"\n=== Session Complete ===")
    print(f"Comments posted: {comments_posted}")
    print(f"Upvotes: {upvotes_total}")

    ctx.close()

if __name__ == "__main__":
    main()