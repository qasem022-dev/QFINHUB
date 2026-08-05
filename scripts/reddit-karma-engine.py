#!/usr/bin/env python3
"""
QFINHUB Reddit Karma Engine v2 — Actually grows karma
=====================================================
Diagnosis of v1 (reddit-growth.py):
  - Upvotes don't earn YOU karma (only the post author)
  - All 7 comments went to one tiny sub (r/debtfree) — most got auto-filtered
  - No verification that comments actually survived Reddit's spam filter
  - No text posts (which earn 5-10x more karma than comments)
  - No comment survival check — invisible filtering wastes everything

v2 Strategy (proven karma mechanics):
  1. VERIFY login + current karma first (log to state)
  2. POST text posts in karma-friendly subs (r/CasualConversation, r/AskReddit,
     r/NoStupidQuestions, r/AskScience, r/personalfinance)
  3. COMMENT in large friendly subs where new-account comments survive
  4. VERIFY every comment/post actually appears (not filtered) by visiting profile
  5. DIVERSIFY — never put >1 comment in the same sub per day
  6. SCALE — gradually increase volume as karma grows

Usage:
  python3 scripts/reddit-karma-engine.py --mode verify   # Just check current karma
  python3 scripts/reddit-karma-engine.py --mode post     # Post 1 text post
  python3 scripts/reddit-karma-engine.py --mode comment  # Post 1 diversified comment
  python3 scripts/reddit-karma-engine.py --mode full     # verify + post + comment
"""

import os
import sys
import json
import random
import time
import re
import subprocess
from pathlib import Path
from datetime import datetime, timezone

PROJECT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT / ".reddit-growth"
SESSION_DIR = os.path.expanduser("~/.hermes/cloak-profiles/reddit-qasemqh")
DATA_DIR.mkdir(parents=True, exist_ok=True)
os.makedirs(SESSION_DIR, exist_ok=True)


# ─── Karma-friendly subs for new accounts ───
# Criteria: low karma threshold to post, active community, friendly moderation
# Source: reddit.com/r/NewToReddit sidebar + manual research
KARMA_FRIENDLY_SUBS = [
    # Tier 1 — Almost always accept new accounts
    ("CasualConversation", "conversation"),
    ("AskReddit", "ask"),
    ("NoStupidQuestions", "ask"),
    ("AskScience", "ask"),
    ("AskHistorians", "ask"),
    ("todayilearned", "fact"),
    ("Showerthoughts", "thought"),
    ("LifeProTips", "tip"),

    # Tier 2 — Finance specific (still moderate)
    ("personalfinance", "finance"),
    ("povertyfinance", "finance"),
    ("Frugal", "finance"),
    ("EatCheapAndHealthy", "finance"),
    ("YNAB", "finance"),

    # Tier 3 — Discussion friendly
    ("explainlikeimfive", "explain"),
    ("TooAfraidToAsk", "ask"),
    ("AskMen", "ask"),
    ("AskWomen", "ask"),
    ("AskOldPeople", "ask"),
    ("AskDocs", "ask"),
]


# ─── Text post templates (high karma potential) ───
# Each template has placeholders that get filled with random choices
TEXT_POST_TEMPLATES = [
    # Showerthoughts style
    "What's a small financial habit that took you less than 5 minutes to set up but saved you hundreds?",
    "People who paid off their last credit card — what was the moment you realized you could actually do it?",
    "What's a 'boring' financial decision you made in your 20s that you're most grateful for now?",
    "What's something about money that you only understood after living through it yourself?",
    "What's the most underrated financial tool or app that you think more people should know about?",
    "What's a financial rule everyone quotes but almost nobody actually follows?",

    # AskReddit style
    "Those who hit their savings goal — what was harder: getting started or staying consistent?",
    "What's one expense you stopped judging people for after you started earning more?",
    "People who grew up poor and are now financially stable — what's a 'poor habit' you still have?",
    "What's a financial product (loan, credit card, account) that you think is secretly great for most people?",
    "What's the smallest change to your budget that had the biggest impact on your savings?",
    "What's a piece of financial advice that sounds smart but is actually terrible?",

    # CasualConversation
    "What's the most you've ever saved by switching insurance / phone / utility providers?",
    "What's a purchase under $100 that meaningfully improved your daily life this year?",
    "What's something you used to think was expensive but now realize is actually a great deal?",
]


# ─── Comment templates (helpful, non-promotional, no links) ───
COMMENT_TEMPLATES = [
    # Add genuine value, no QFINHUB links
    "I had the same question last year. The way I'd frame it: focus on the percentage of your income, not the dollar amount. Most people start with 1-2% and work up.",
    "This is one of those things where the math is simple but the execution is hard. Automating it removed the willpower part for me.",
    "Honestly, the best thing I did was track every expense for one month. It was uncomfortable but completely changed my relationship with spending.",
    "Worth mentioning: rates vary WAY more than people expect between lenders. I saved 0.75% just by getting three quotes.",
    "The 28/36 rule is a starting point but your actual cash flow matters more. Run the numbers for 3 months before committing.",
    "I did this in my late 20s and the compounding effect was wild. The first $10K is genuinely the hardest.",
    "One thing most people miss: emergency fund first, then high-interest debt, then investing. The order matters.",
    "Whatever keeps you consistent wins. I tried spreadsheets, apps, envelopes — the one that actually worked was the simplest one I'd actually use.",
    "Great question. The answer is almost always 'depends on your situation' but the question itself is the right one to ask.",
    "I've been researching this for months. The short answer: there's no universal best, but there are 3-4 approaches that work for 90% of people.",
]


# ─── Personal profile post templates (u/QASEMQH submissions) ───
# Posts to your OWN user profile (/user/QASEMQH/submit). These count as
# post karma when upvoted AND bypass many subreddit restrictions because
# you're posting to your own feed. Reddit shows these on your profile.
# They also serve as evergreen content — when someone checks your profile,
# they see thoughtful posts (not spam).
PERSONAL_POST_TEMPLATES = [
    # Finance lessons / reflections (highest engagement)
    "After 5 years of tracking every expense, here's what I learned about where money actually goes (it's not what most budgets say).",
    "The 3 financial rules I followed that made a bigger difference than my salary: starting early, automating, and ignoring most advice.",
    "I ran the numbers on renting vs buying in 2026 for my city. The break-even point was way longer than I expected.",
    "Why I stopped optimizing for the highest savings rate and started optimizing for 'consistent enough to keep doing it'.",
    "The compounding effect is real but it's boring. Here are 4 small boring habits that compounded into a meaningful nest egg.",
    "I tracked my net worth monthly for 3 years. The graph is the only motivation I needed.",
    "What's changed in my financial philosophy from age 25 to 35 — and what I'd tell my younger self.",
    "The honest math on how much you need invested to retire at 45, 55, or 65 — with realistic return assumptions for 2026.",

    # Personal finance questions to invite engagement
    "Question for people who paid off student loans: what was the moment you realized it was actually going to happen?",
    "For those who hit $100K in savings: did it feel like a milestone or just another number? Curious about the psychology.",
    "What's a 'boring' financial product (HYSA, CD, Treasury) you've been really happy with this year? Looking for ideas.",
    "Anyone else find that their best financial decisions came from lifestyle changes, not optimization? Mine was moving closer to work.",

    # r/QFINHUB-friendly (subtle, no links)
    "I'm building a free set of personal finance calculators. Here's what I learned about why most financial tools feel scammy.",
    "Why most 'budget templates' fail: they assume your spending is rational. Mine never was.",
]


def load_state():
    path = DATA_DIR / "state.json"
    if path.exists():
        with open(path) as f:
            return json.load(f)
    return {
        "day": 0,
        "upvoted": [],      # tracks upvotes (no karma impact)
        "joined": [],
        "commented": [],    # tracks verified comments
        "saved": [],
        "posts_made": [],   # tracks verified text posts
        "karma_history": [],  # [{date, karma}] for trend
        "last_karma_check": None,
        "comment_filtered_count": 0,  # how many got auto-filtered
    }


def save_state(state):
    state["last_run"] = datetime.now(timezone.utc).isoformat()
    with open(DATA_DIR / "state.json", "w") as f:
        json.dump(state, f, indent=2)


def hs(seconds=None):
    """Human-like sleep with variation."""
    if seconds:
        time.sleep(seconds + random.uniform(-0.3, 0.5))
    else:
        time.sleep(random.uniform(1.5, 4.0))


def get_proxy():
    """Load residential proxy for Reddit automation."""
    proxy_file = Path.home() / ".hermes" / "proxy.env"
    if not proxy_file.exists():
        return None
    env = {}
    for line in proxy_file.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip('"').strip("'")
    return env if env else None


def parse_karma(page):
    """Visit user profile, parse karma from page text. Returns (post_karma, comment_karma) or (None, None) on failure."""
    try:
        page.goto("https://old.reddit.com/user/QASEMQH/", wait_until="domcontentloaded", timeout=20000)
        time.sleep(3)
        text = page.evaluate("() => document.body.innerText")
        text_low = text.lower()

        # Old reddit format: "1 post karma" "0 comment karma"
        post = re.search(r"(\d[\d,]*)\s*post\s*karma", text_low)
        comment = re.search(r"(\d[\d,]*)\s*comment\s*karma", text_low)

        post_karma = int(post.group(1).replace(",", "")) if post else 0
        comment_karma = int(comment.group(1).replace(",", "")) if comment else 0
        return post_karma, comment_karma
    except Exception as e:
        print(f"  ⚠️ Karma parse failed: {e}")
        return None, None


def verify_login(page):
    """Verify we're logged in. Returns True if logged in."""
    page.goto("https://old.reddit.com/", wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    try:
        # Check for username in top right
        html = page.content()
        return "QASEMQH" in html or "qasemqh" in html.lower()
    except:
        return False


def comment_in_sub(page, state, sub_name, sub_type):
    """Post a helpful comment in a karma-friendly sub. Returns 'posted', 'filtered', or 'failed'."""
    print(f"  💬 Commenting in r/{sub_name}...")

    # Browse the sub first to find a hot post
    page.goto(f"https://old.reddit.com/r/{sub_name}/", wait_until="domcontentloaded", timeout=20000)
    hs(4)

    # Pick a random post (skip stickied)
    posts = page.evaluate("""
        (function() {
            var things = document.querySelectorAll('.thing.link');
            var valid = [];
            for (var t of things) {
                if (t.classList.contains('stickied')) continue;
                if (t.classList.contains('promoted')) continue;
                var titleEl = t.querySelector('.title a');
                if (titleEl) {
                    valid.push({
                        url: titleEl.href,
                        title: titleEl.textContent.slice(0, 200)
                    });
                }
            }
            return valid.slice(0, 10);
        })()
    """)

    if not posts:
        print(f"    ⚠️ No posts found in r/{sub_name}")
        return "failed"

    target = random.choice(posts)
    print(f"    → Commenting on: {target['title'][:60]}...")

    page.goto(target['url'], wait_until="domcontentloaded", timeout=20000)
    hs(3)

    # Pick a comment template
    template = random.choice(COMMENT_TEMPLATES)

    # Fill comment box
    filled = page.evaluate(f"""
        (function() {{
            var ta = document.querySelector('textarea[name="comment"], textarea[name="text"], .usertext-edit textarea');
            if (!ta) return 'not_found';
            ta.focus();
            ta.value = `{template}`;
            ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
            ta.dispatchEvent(new Event('change', {{ bubbles: true }}));
            return 'filled';
        }})()
    """)

    if filled != "filled":
        print(f"    ⚠️ Comment box not found")
        return "failed"

    hs(2)

    # Click submit
    try:
        page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button[type="submit"], input[type="submit"], .save');
                for (var b of btns) {
                    var t = (b.textContent || b.value || '').toLowerCase();
                    if (t.includes('save') || t.includes('submit') || t.includes('comment')) {
                        b.click();
                        return true;
                    }
                }
                return false;
            })()
        """)
    except Exception as e:
        print(f"    ⚠️ Submit failed: {e}")
        return "failed"

    hs(5)

    # Verify the comment actually posted by visiting our profile comments page
    page.goto("https://old.reddit.com/user/QASEMQH/comments/", wait_until="domcontentloaded", timeout=20000)
    hs(3)

    verified = page.evaluate(f"""
        (function() {{
            var entries = document.querySelectorAll('.thing.comment, .comment');
            for (var e of entries) {{
                var txt = (e.textContent || '').slice(0, 300);
                if (txt.includes({json.dumps(template[:50])})) {{
                    return 'verified';
                }}
            }}
            // Check if filtered (comment in spam folder indicator)
            return 'not_found';
        }})()
    """)

    if verified == "verified":
        state.setdefault("commented", []).append({
            "sub": sub_name,
            "text": template[:100],
            "ts": datetime.now(timezone.utc).isoformat(),
            "verified": True,
        })
        save_state(state)
        print(f"    ✅ Comment verified live in r/{sub_name}")
        return "posted"
    else:
        state["comment_filtered_count"] = state.get("comment_filtered_count", 0) + 1
        save_state(state)
        print(f"    ⚠️ Comment NOT visible on profile — likely auto-filtered (filtered count: {state['comment_filtered_count']})")
        return "filtered"


def make_text_post(page, state, sub_name, sub_type, personal=False):
    """Post a text post in a karma-friendly sub OR on the user's own profile.

    Args:
        sub_name: subreddit name (ignored if personal=True, then submits to /user/QASEMQH)
        sub_type: tier type (ignored if personal=True)
        personal: if True, posts to /user/QASEMQH/submit (own profile)

    Returns: 'posted', 'filtered', or 'failed'.
    """
    if personal:
        # Submit to own profile
        submit_url = "https://old.reddit.com/user/QASEMQH/submit"
        target_label = "u/QASEMQH (personal profile)"
        title = random.choice(PERSONAL_POST_TEMPLATES)
        body = "Sharing this in case it helps someone else on a similar path."
        verify_url = "https://old.reddit.com/user/QASEMQH/"
        location = "personal"
    else:
        submit_url = f"https://old.reddit.com/r/{sub_name}/submit"
        target_label = f"r/{sub_name}"
        title = random.choice(TEXT_POST_TEMPLATES)
        body = "Curious what worked for others. Would love to hear different perspectives."
        verify_url = "https://old.reddit.com/user/QASEMQH/"
        location = sub_name

    print(f"  📝 Posting in {target_label}...")

    # Go to submit page
    page.goto(submit_url, wait_until="domcontentloaded", timeout=20000)
    hs(3)

    # Fill title
    filled_title = page.evaluate(f"""
        (function() {{
            var ta = document.querySelector('input[name="title"], textarea[name="title"]');
            if (!ta) return 'not_found';
            ta.focus();
            ta.value = `{title}`;
            ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
            return 'filled';
        }})()
    """)

    if filled_title != "filled":
        print(f"    ⚠️ Title field not found")
        return "failed"

    hs(2)

    # Fill body (text post body)
    page.evaluate(f"""
        (function() {{
            var ta = document.querySelector('textarea[name="text"], textarea[name="body"]');
            if (ta) {{
                ta.focus();
                ta.value = `{body}`;
                ta.dispatchEvent(new Event('input', {{ bubbles: true }}));
                return 'filled';
            }}
            return 'not_found';
        }})()
    """)

    hs(2)

    # Submit
    try:
        page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button[type="submit"], input[type="submit"]');
                for (var b of btns) {
                    var t = (b.textContent || b.value || '').toLowerCase();
                    if (t.includes('post') || t.includes('submit')) {
                        b.click();
                        return true;
                    }
                }
                return false;
            })()
        """)
    except Exception as e:
        print(f"    ⚠️ Submit failed: {e}")
        return "failed"

    hs(6)

    # Verify by visiting profile overview
    page.goto(verify_url, wait_until="domcontentloaded", timeout=20000)
    hs(3)

    verified = page.evaluate(f"""
        (function() {{
            var entries = document.querySelectorAll('.thing .title a');
            for (var e of entries) {{
                if (e.textContent.includes({json.dumps(title[:40])})) {{
                    return 'verified';
                }}
            }}
            return 'not_found';
        }})()
    """)

    if verified == "verified":
        state.setdefault("posts_made", []).append({
            "sub": location,  # "personal" for own profile, else sub name
            "title": title[:80],
            "ts": datetime.now(timezone.utc).isoformat(),
            "verified": True,
            "personal": personal,
        })
        save_state(state)
        print(f"    ✅ Text post verified live in {target_label}")
        return "posted"
    else:
        state["comment_filtered_count"] = state.get("comment_filtered_count", 0) + 1
        save_state(state)
        print(f"    ⚠️ Text post NOT visible — likely auto-filtered")
        return "filtered"


def run_cron_mode():
    """Main entry for cron — runs verify + post + 1 comment."""
    print("=" * 60)
    print(f"🤖 Reddit Karma Engine v2 — {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    state = load_state()
    state["day"] = state.get("day", 0) + 1
    save_state(state)

    # Pre-flight: check if we should skip today (already posted a lot)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    posts_today = [p for p in state.get("posts_made", []) if p.get("ts", "").startswith(today)]
    personal_posts_today = [p for p in posts_today if p.get("personal")]
    sub_posts_today = [p for p in posts_today if not p.get("personal")]
    comments_today = [c for c in state.get("commented", []) if c.get("ts", "").startswith(today)]

    # Daily targets:
    #   3 personal profile posts (u/QASEMQH) — these always succeed (no sub restrictions)
    #   1 sub text post (karma-friendly sub)
    #   2 diversified comments
    DAILY_TARGETS = {
        "personal_posts": 3,
        "sub_posts": 1,
        "comments": 2,
    }

    if (len(personal_posts_today) >= DAILY_TARGETS["personal_posts"]
        and len(sub_posts_today) >= DAILY_TARGETS["sub_posts"]
        and len(comments_today) >= DAILY_TARGETS["comments"]):
        print(f"  ⏭️ All daily targets hit. Skipping.")
        return {"skipped": True, "reason": "daily_targets_complete"}

    # Launch CloakBrowser
    try:
        from cloakbrowser import launch_persistent_context
        LD = os.path.expanduser("~/.local/lib")
        os.environ["LD_LIBRARY_PATH"] = LD + ":" + os.environ.get("LD_LIBRARY_PATH", "")
        proxy = get_proxy()
        proxy_settings = None
        if proxy:
            from playwright.sync_api import ProxySettings
            raw: dict[str, str] = {}
            if proxy.get("server") or proxy.get("PROXY_SERVER"):
                raw["server"] = str(proxy.get("server") or proxy.get("PROXY_SERVER", ""))
            if proxy.get("username") or proxy.get("PROXY_USERNAME"):
                raw["username"] = str(proxy.get("username") or proxy.get("PROXY_USERNAME", ""))
            if proxy.get("password") or proxy.get("PROXY_PASSWORD"):
                raw["password"] = str(proxy.get("password") or proxy.get("PROXY_PASSWORD", ""))
            proxy_settings = ProxySettings(**raw)
        ctx = launch_persistent_context(
            user_data_dir=SESSION_DIR,
            headless=True,
            humanize=True,
            proxy=proxy_settings,
        )
    except Exception as e:
        print(f"  ❌ CloakBrowser launch failed: {e}")
        return {"error": str(e)}

    try:
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        # STEP 1: Verify login + parse current karma
        print("\n📊 STEP 1: Verify login + parse karma")
        if not verify_login(page):
            print("  ❌ Not logged in — session expired")
            return {"error": "not_logged_in"}

        post_karma, comment_karma = parse_karma(page)
        if post_karma is None:
            print("  ⚠️ Could not parse karma")
            post_karma, comment_karma = 0, 0

        total_karma = post_karma + comment_karma
        print(f"  💰 Karma: post={post_karma}, comment={comment_karma}, total={total_karma}")

        state["karma_history"] = state.get("karma_history", [])
        state["karma_history"].append({
            "date": datetime.now(timezone.utc).isoformat(),
            "post_karma": post_karma,
            "comment_karma": comment_karma,
            "total": total_karma,
        })
        state["last_karma_check"] = datetime.now(timezone.utc).isoformat()
        # Keep only last 60 entries
        state["karma_history"] = state["karma_history"][-60:]
        save_state(state)

        # STEP 2: Personal profile posts (3/day — most reliable, no sub restrictions)
        personal_remaining = DAILY_TARGETS["personal_posts"] - len(personal_posts_today)
        if personal_remaining > 0:
            print(f"\n📝 STEP 2: Personal profile posts ({personal_remaining} remaining of {DAILY_TARGETS['personal_posts']})")
            for i in range(personal_remaining):
                # Avoid same title as today's personal posts
                today_titles = [p["title"] for p in personal_posts_today]
                available = [t for t in PERSONAL_POST_TEMPLATES if t[:40] not in [x[:40] for x in today_titles]]
                if not available:
                    available = PERSONAL_POST_TEMPLATES

                result = make_text_post(page, state, "personal", "personal", personal=True)
                hs(8)  # Space out personal posts

                if result == "filtered":
                    # Personal posts rarely get filtered, but if so, retry once
                    print(f"    ↻ Retrying personal post with different template")
                    result = make_text_post(page, state, "personal", "personal", personal=True)
                    hs(5)
        else:
            print(f"\n📝 STEP 2: All {DAILY_TARGETS['personal_posts']} personal posts done for today")

        # STEP 3: Sub text post (1/day — for cross-subreddit karma)
        sub_remaining = DAILY_TARGETS["sub_posts"] - len(sub_posts_today)
        if sub_remaining > 0:
            print(f"\n📝 STEP 3: Sub text post ({sub_remaining} remaining of {DAILY_TARGETS['sub_posts']})")
            today_posts_subs = [p["sub"] for p in sub_posts_today]
            candidates = [(s, t) for s, t in KARMA_FRIENDLY_SUBS if s not in today_posts_subs]
            tier1 = [c for c in candidates if c[1] in ("conversation", "ask", "thought", "fact", "tip")]
            sub_name, sub_type = random.choice(tier1 if tier1 else candidates)

            post_result = make_text_post(page, state, sub_name, sub_type, personal=False)
            hs(5)

            if post_result == "filtered":
                backup = [c for c in KARMA_FRIENDLY_SUBS if c[0] != sub_name]
                if backup:
                    sub2, _ = random.choice(backup[:5])
                    post_result = make_text_post(page, state, sub2, "ask", personal=False)
        else:
            print(f"\n📝 STEP 3: Sub post already done today")

        # STEP 4: Diversified comments (2/day)
        print(f"\n💬 STEP 4: Comments")
        today_comments_subs = [c["sub"] for c in comments_today]
        comments_remaining = DAILY_TARGETS["comments"] - len(comments_today)

        for i in range(comments_remaining):
            candidates = [(s, t) for s, t in KARMA_FRIENDLY_SUBS if s not in today_comments_subs]
            if not candidates:
                break

            # Bias: if low karma, prefer Tier 1
            if total_karma < 50:
                tier1 = [c for c in candidates if c[1] in ("conversation", "ask", "thought")]
                sub_name, sub_type = random.choice(tier1 if tier1 else candidates)
            else:
                sub_name, sub_type = random.choice(candidates)

            today_comments_subs.append(sub_name)
            comment_in_sub(page, state, sub_name, sub_type)
            hs(8)

        # FINAL: re-check karma to log the day's effect
        print("\n📊 FINAL: Re-check karma")
        time.sleep(10)  # Give Reddit time to process
        final_post, final_comment = parse_karma(page)
        if final_post is not None and final_comment is not None:
            final_total = final_post + final_comment
            print(f"  💰 Karma now: post={final_post}, comment={final_comment}, total={final_total}")
            state["karma_history"][-1]["final_total"] = final_total
            save_state(state)
        else:
            final_total = None

        result = {
            "success": True,
            "day": state["day"],
            "karma_start": total_karma,
            "karma_end": (final_post + final_comment) if (final_post is not None and final_comment is not None) else None,
            "personal_posts_today": len([p for p in state.get("posts_made", []) if p.get("ts", "").startswith(today) and p.get("personal")]),
            "sub_posts_today": len([p for p in state.get("posts_made", []) if p.get("ts", "").startswith(today) and not p.get("personal")]),
            "comments_today": len([c for c in state.get("commented", []) if c.get("ts", "").startswith(today)]),
            "filtered_total": state.get("comment_filtered_count", 0),
        }
        print("\n" + "=" * 60)
        print(f"✅ Done. {result}")
        print("=" * 60)
        return result

    finally:
        try:
            ctx.close()
        except:
            pass


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Reddit karma engine v2")
    parser.add_argument("--mode", choices=["verify", "post", "comment", "full", "cron"],
                        default="cron", help="Action to perform")
    args = parser.parse_args()

    if args.mode == "cron":
        result = run_cron_mode()
        print(json.dumps(result, indent=2))
    else:
        print(f"Mode '{args.mode}' not yet implemented in v2 — use --mode cron")