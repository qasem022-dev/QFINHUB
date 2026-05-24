#!/usr/bin/env python3
"""
QFINHUB Reddit Growth Engine — Human-like account aging & growth
Uses CloakBrowser for undetectable automation.
Phase 1 (Days 4-6): Browse, upvote, join subs, save, light comments
Phase 2 (Day 7+): Value posts + engagement

Usage:
  python3 scripts/reddit-growth.py              # Daily growth routine
  python3 scripts/reddit-growth.py --login-only # Login + save session (visible)
  python3 scripts/reddit-growth.py --dry-run    # Show what would happen
"""

import os, sys, json, random, time, re
from pathlib import Path
from datetime import datetime

PROJECT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT / ".reddit-growth"
SESSION_DIR = os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh")

DATA_DIR.mkdir(parents=True, exist_ok=True)
os.makedirs(SESSION_DIR, exist_ok=True)


def load_env():
    env_path = PROJECT / ".env.local"
    if env_path.exists():
        for line in env_path.read_text().split("\n"):
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, _, val = line.partition("=")
                os.environ[key.strip()] = val.strip().strip('"').strip("'")


def hs(seconds=None):
    """Human-like sleep with variation."""
    if seconds:
        time.sleep(seconds + random.uniform(-0.3, 0.5))
    else:
        time.sleep(random.uniform(1.5, 4.0))


def random_scroll(page):
    """Scroll like a human — variable distance, pause sometimes."""
    scrolls = random.randint(1, 4)
    for _ in range(scrolls):
        distance = random.randint(200, 600)
        page.evaluate(f"window.scrollBy(0, {distance})")
        time.sleep(random.uniform(0.8, 2.5))
        # Sometimes pause to "read"
        if random.random() < 0.3:
            time.sleep(random.uniform(2, 6))


def load_state():
    path = DATA_DIR / "state.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {"day": 0, "upvoted": [], "joined": [], "commented": [], "saved": [], "posts_made": []}


def save_state(state):
    state["last_run"] = datetime.utcnow().isoformat()
    with open(DATA_DIR / "state.json", "w") as f:
        json.dump(state, f, indent=2)


# ─── Subreddits to join (progressively) ───
SUBREDDITS_PHASE1 = [
    "personalfinance", "FIRE", "investing", "Bogleheads",
    "realestate", "FirstTimeHomeBuyer", "debtfree", "povertyfinance",
    "financialindependence", "budget", "tax", "studentloans",
    "creditcards", "leanfire", "fatFIRE", "dividends",
    "StockMarket", "ETFs", "realestateinvesting", "Economics",
]

SUBREDDITS_PHASE2 = [
    "personalfinance", "FIRE", "investing", "realestate",
    "FirstTimeHomeBuyer", "debtfree", "financialindependence",
]

# Finance keywords for finding engaging posts
FINANCE_KEYWORDS = [
    "mortgage", "interest rate", "refinance", "down payment",
    "retirement", "401k", "IRA", "Roth", "FIRE",
    "debt", "payoff", "snowball", "avalanche", "credit card",
    "investing", "compound", "index fund", "ETF", "dividend",
    "budget", "saving", "emergency fund", "net worth",
    "tax", "deduction", "capital gains", "IRS",
    "loan", "student loan", "car loan", "APR",
    "salary", "raise", "promotion", "side hustle",
]

# Safe comment templates for aging phase (no links, purely helpful)
COMMENT_TEMPLATES = [
    "Good question — I've been looking into this too. The key is running the actual numbers for your situation.",
    "This is solid advice. Tracking every expense for just one month changed how I think about spending.",
    "The math checks out. Most people don't realize how much small changes compound over 20-30 years.",
    "Worth noting that rates vary by lender — shopping around saved me 0.5% on my last one.",
    "I had the same question. The 28/36 rule is a good starting point but your actual DTI matters more.",
    "Great breakdown. The psychological aspect is just as important as the math — whatever keeps you consistent wins.",
    "This helped me a lot when I was starting out. The first $100K is the hardest, then momentum takes over.",
    "Solid advice. Automating savings was the single best financial decision I made.",
]


def login_reddit(context, visible=False):
    """Log in to Reddit via CloakBrowser. Returns True if logged in."""
    page = context.new_page()

    # Try loading Reddit — check if already logged in
    page.goto("https://www.reddit.com/", wait_until="domcontentloaded", timeout=30000)
    hs(5)

    html = page.content()
    saved_username = os.environ.get("REDDIT_USERNAME", "")
    logged_in = saved_username.lower() in html.lower()

    if logged_in:
        print("  ✅ Already logged in to Reddit")
        return True, page

    print("  🔐 Logging in to Reddit...")

    # Go to login page
    page.goto("https://www.reddit.com/login/", wait_until="domcontentloaded", timeout=30000)
    hs(4)

    # Fill credentials via evaluate — try email first, fall back to username
    reddit_email = os.environ.get("REDDIT_EMAIL", "")
    reddit_username = os.environ.get("REDDIT_USERNAME", "")
    reddit_password = os.environ.get("REDDIT_PASSWORD", "")
    login_id = reddit_email if reddit_email else reddit_username
    
    filled = page.evaluate(f"""
        (function() {{
            var uname = document.querySelector('input[name="username"], #loginUsername, input[type="text"]');
            var pword = document.querySelector('input[name="password"], #loginPassword, input[type="password"]');
            if (uname && pword) {{
                uname.value = '{login_id}';
                uname.dispatchEvent(new Event('input', {{ bubbles: true }}));
                uname.dispatchEvent(new Event('change', {{ bubbles: true }}));
                pword.value = '{reddit_password}';
                pword.dispatchEvent(new Event('input', {{ bubbles: true }}));
                pword.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return 'filled';
            }}
            return 'not found';
        }})()
    """)
    
    if filled == 'not found':
        print("  ⚠️ Could not find login fields — trying alternate approach")
        # Try clicking login button first (sometimes fields appear after)
        page.evaluate("""
            (function() {
                var links = document.querySelectorAll('a');
                for (var a of links) {
                    if (a.textContent.includes('Log In') || a.href.includes('login')) {
                        a.click(); return;
                    }
                }
            })()
        """)
        hs(5)
        # Retry with email
        page.evaluate(f"""
            (function() {{
                var uname = document.querySelector('input[name="username"], #loginUsername, input[type="text"]');
                var pword = document.querySelector('input[name="password"], #loginPassword, input[type="password"]');
                if (uname && pword) {{
                    uname.value = '{login_id}';
                    pword.value = '{reddit_password}';
                    return 'filled';
                }}
                return 'still not found';
            }})()
        """)
    hs(2)

    # Click login button
    try:
        page.locator('button[type="submit"]').first.click()
    except:
        page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button');
                for (var b of btns) {
                    if (b.textContent.includes('Log') || b.textContent.includes('Sign')) {
                        b.click(); return;
                    }
                }
            })()
        """)

    hs(8)

    # Verify login
    html = page.content()
    logged_in = username.lower() in html.lower()
    if logged_in:
        print("  ✅ Login successful")
    else:
        print("  ❌ Login failed — check credentials")

    return logged_in, page


def browse_feed(page, minutes=5):
    """Browse Reddit front page like a human."""
    print(f"  📖 Browsing feed ({minutes} min)...")
    page.goto("https://www.reddit.com/", wait_until="domcontentloaded", timeout=30000)
    hs(3)

    for _ in range(minutes * 3):  # ~3 actions per minute
        random_scroll(page)
        hs()


def upvote_posts(page, state, count=5):
    """Upvote finance-related posts."""
    print(f"  ⬆️ Upvoting {count} posts...")

    # Browse a finance subreddit
    sub = random.choice(SUBREDDITS_PHASE1)
    page.goto(f"https://www.reddit.com/r/{sub}/", wait_until="domcontentloaded", timeout=30000)
    hs(4)

    upvoted = 0
    for _ in range(count * 3):  # Look through more posts than we upvote
        random_scroll(page)
        hs()

        if upvoted >= count:
            break

        # Find upvote buttons
        try:
            # Randomly decide to upvote (not every post)
            if random.random() < 0.4:
                buttons = page.locator('button[aria-label="Upvote"], button[data-click-id="upvote"]')
                count_btns = buttons.count()
                if count_btns > 0:
                    idx = random.randint(0, min(count_btns - 1, 10))
                    btn = buttons.nth(idx)

                    # Check if it's a finance post first
                    parent_text = page.evaluate(f"""
                        (function() {{
                            var btns = document.querySelectorAll('button[aria-label="Upvote"], button[data-click-id="upvote"]');
                            if (btns[{idx}]) {{
                                var card = btns[{idx}].closest('article, [data-testid="post-container"], shreddit-post');
                                return card ? card.textContent.slice(0, 200) : '';
                            }}
                            return '';
                        }})()
                    """)

                    if any(kw in parent_text.lower() for kw in FINANCE_KEYWORDS[:10]):
                        btn.click()
                        upvoted += 1
                        hs(2)
        except:
            pass

    print(f"    Upvoted {upvoted} posts in r/{sub}")


def join_subreddits(page, state, count=5):
    """Join new subreddits."""
    joined = state.get("joined", [])
    available = [s for s in SUBREDDITS_PHASE1 if s not in joined]
    to_join = available[:count]

    if not to_join:
        print("  📋 All target subreddits already joined")
        return

    print(f"  ➕ Joining {len(to_join)} subreddits...")
    for sub in to_join:
        try:
            page.goto(f"https://www.reddit.com/r/{sub}/", wait_until="domcontentloaded", timeout=30000)
            hs(3)

            # Click join button
            page.evaluate("""
                (function() {
                    var btns = document.querySelectorAll('button');
                    for (var b of btns) {
                        var t = b.textContent.trim();
                        if (t === 'Join' || t.includes('Join')) {
                            b.click(); return;
                        }
                    }
                })()
            """)
            hs(2)

            joined.append(sub)
            state["joined"] = joined
            save_state(state)
            print(f"    Joined r/{sub}")
        except Exception as e:
            print(f"    Failed r/{sub}: {e}")

        hs(random.uniform(8, 15))  # Long pause between joins


def save_posts(page, state, count=3):
    """Save interesting posts."""
    print(f"  💾 Saving {count} posts...")

    sub = random.choice([s for s in SUBREDDITS_PHASE1 if s in state.get("joined", [])] or SUBREDDITS_PHASE1)
    page.goto(f"https://www.reddit.com/r/{sub}/top/?t=week", wait_until="domcontentloaded", timeout=30000)
    hs(4)

    saved = 0
    for _ in range(count * 3):
        random_scroll(page)
        hs()
        if saved >= count:
            break

        if random.random() < 0.35:
            try:
                page.evaluate("""
                    (function() {
                        var btns = document.querySelectorAll('button');
                        for (var b of btns) {
                            if (b.textContent.includes('Save') || b.getAttribute('aria-label') === 'Save') {
                                b.click(); return;
                            }
                        }
                    })()
                """)
                saved += 1
                state.setdefault("saved", []).append(f"r/{sub}")
                save_state(state)
                hs(3)
            except:
                pass

    print(f"    Saved {saved} posts")


def make_comment(page, state):
    """Make one light, helpful comment in a small subreddit."""
    # Only comment in small subs (<100K members) to build karma safely
    small_subs = ["debtfree", "leanfire", "dividends", "studentloans", "budget"]
    sub = random.choice([s for s in small_subs if s in state.get("joined", small_subs)])

    page.goto(f"https://www.reddit.com/r/{sub}/new/", wait_until="domcontentloaded", timeout=30000)
    hs(4)
    random_scroll(page)

    comment_text = random.choice(COMMENT_TEMPLATES)

    try:
        # Find the first post and open it
        posts = page.locator('a[data-click-id="body"]')
        if posts.count() > 0:
            posts.first.click()
            hs(4)

            # Pre-compute escaped comment text
            escaped_comment = comment_text.replace("'", "\\'").replace("\n", " ")

            # Find comment box and type
            comment_js = (
                "(function() {"
                "  var textareas = document.querySelectorAll('textarea, [contenteditable=\"true\"], div[role=\"textbox\"]');"
                "  for (var el of textareas) {"
                "    el.focus();"
                "    if (el.contentEditable === 'true') {"
                "      el.textContent = '" + escaped_comment + "';"
                "    } else {"
                "      el.value = '" + escaped_comment + "';"
                "    }"
                "    el.dispatchEvent(new Event('input', { bubbles: true }));"
                "    break;"
                "  }"
                "})()"
            )
            page.evaluate(comment_js)
            hs(3)

            # Click comment button
            page.evaluate("""
                (function() {
                    var btns = document.querySelectorAll('button');
                    for (var b of btns) {
                        if (b.textContent.trim() === 'Comment') { b.click(); return; }
                    }
                })()
            """)
            hs(5)

            state.setdefault("commented", []).append({"sub": sub, "text": comment_text[:40]})
            save_state(state)
            print(f"  💬 Commented in r/{sub}: \"{comment_text[:60]}...\"")

    except Exception as e:
        print(f"  ⚠️ Comment failed: {e}")


def daily_routine(visible=False):
    """Run the full daily Reddit growth routine."""
    load_env()
    state = load_state()
    state["day"] = state.get("day", 0) + 1

    print(f"🤖 QFINHUB Reddit Growth Engine — Day {state['day']}")
    print("=" * 55)

    username = os.environ.get("REDDIT_USERNAME", "")
    if not username:
        print("❌ REDDIT_USERNAME not set in .env.local")
        return

    from cloakbrowser import launch_persistent_context

    context = launch_persistent_context(
        str(SESSION_DIR),
        headless=not visible,
        humanize=True,
        human_preset="careful",
        viewport={"width": 1440, "height": 900},
    )

    try:
        # Login
        logged_in, page = login_reddit(context, visible=visible)
        if not logged_in:
            print("❌ Cannot proceed without login")
            context.close()
            return

        # ─── Phase detection ───
        account_age_days = state["day"] + 3  # Account was 4d old at setup

        if account_age_days <= 7:
            print(f"\n📅 Phase 1: Aging (Day {account_age_days}/7)")
            print("   Activities: browse + upvote + join + save + light comments")

            # Browse feeds (3 min day 4-5, 2 min day 6-7)
            browse_min = 3 if account_age_days <= 5 else 2
            browse_feed(page, browse_min)

            # Upvote posts
            upvote_count = min(account_age_days, 8)
            upvote_posts(page, state, upvote_count)

            # Join subreddits (5/day days 4-5, 2/day days 6-7)
            join_count = 5 if account_age_days <= 5 else 2
            join_subreddits(page, state, join_count)

            # Save posts
            save_posts(page, state, 3)

            # Light comment (starting day 5-6)
            if account_age_days >= 5:
                make_comment(page, state)

        else:
            print(f"\n📅 Phase 2: Growth (Day {account_age_days})")
            print("   Activities: browse + upvote + value posts + engagement")

            browse_feed(page, 5)
            upvote_posts(page, state, 5)

            # TODO: Phase 2 — value posts (implemented when account is ready)
            print("   ⏳ Value posting unlocked at Day 10+")

        save_state(state)
        phase_label = "Phase 1: Aging" if account_age_days <= 7 else "Phase 2: Growth"
        joined_count = len(state.get("joined", []))
        upvoted_count = len(state.get("upvoted", []))
        print(f"\n✅ Day {state['day']} complete. {phase_label} | joined={joined_count} subs, upvoted={upvoted_count} posts")

    finally:
        context.close()


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--login-only", action="store_true", help="Just login and save session")
    p.add_argument("--dry-run", action="store_true", help="Show plan without executing")
    p.add_argument("--visible", action="store_true", help="Show browser window")
    args = p.parse_args()

    if args.login_only:
        load_env()
        from cloakbrowser import launch_persistent_context
        context = launch_persistent_context(str(SESSION_DIR), headless=False, humanize=True, human_preset="careful")
        try:
            logged_in, _ = login_reddit(context, visible=True)
            if logged_in:
                print("✅ Session saved. Future runs will be auto-logged in.")
        finally:
            context.close()
    elif args.dry_run:
        print("🔍 DRY RUN — Day", load_state().get("day", 0) + 1)
        print("Would: browse feeds, upvote finance posts, join subs, save posts, light comment")
    else:
        daily_routine(visible=args.visible)
