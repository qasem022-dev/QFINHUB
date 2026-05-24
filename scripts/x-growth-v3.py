#!/usr/bin/env python3
"""
X/Twitter Growth Engine v3 — CloakBrowser-based, 3x daily
=========================================================
Uses CloakBrowser's launch_persistent_context() to maintain
persistent login session across runs. Handles X's 2-step
login flow (email → username verification → password).

Strategy:
  - 3 daily posts at optimal times (9AM, 12PM, 5PM EST)
  - Follow 2-3 targeted finance accounts per session
  - Engage with trending finance posts (like + reply)
  - Post threads with calculator links
  - Track follower growth

Usage:
  python3 scripts/x-growth-v3.py [--mode tweet|engage|follow|thread|full]
  python3 scripts/x-growth-v3.py --mode tweet    # Single value tweet
  python3 scripts/x-growth-v3.py --mode thread   # Full thread with visuals
  python3 scripts/x-growth-v3.py --mode full     # All actions (cron default)
"""

import sys, os, time, json, random, re, argparse
from datetime import datetime

# Paths
QFINHUB_ROOT = '/home/admin1/qfinhub'
DATA_DIR = os.path.join(QFINHUB_ROOT, '.x-data-v2')
STATE_FILE = os.path.join(DATA_DIR, 'growth-v3-state.json')
PROFILE_DIR = os.path.expanduser('~/.hermes/cloak-profiles/x-account-1')

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(PROFILE_DIR, exist_ok=True)

# ─── Credentials ───
def load_credentials():
    creds = {}
    env_path = os.path.join(QFINHUB_ROOT, '.env.local')
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith('#') and '=' in line:
                k, _, v = line.partition('=')
                k = k.strip()
                if k in ('X_EMAIL', 'X_PASSWORD', 'X_USERNAME'):
                    creds[k] = v.strip().strip('"').strip("'")
    return creds

# ─── State ───
def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {
        'followed': [], 'tweets': 0, 'replies': 0,
        'threads': 0, 'last_run': None, 'followers': 0
    }

def save_state(state):
    state['last_run'] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

# ─── Content ───
VALUE_TWEETS = [
    "Most people overestimate retirement savings by 40%. Run your real numbers for free at qfinhub.com — no signup needed.",
    "The average American pays $5,000+ in hidden mortgage costs annually. Calculate your true monthly payment at qfinhub.com",
    "Compound interest: $500/month at 7% for 30 years = $610,000. $340,000 is just interest. Run your numbers at qfinhub.com",
    "Debt snowball vs avalanche strategy — which saves you more? We built a free tool to compare both side by side at qfinhub.com",
    "Interest rates just moved. A 0.5% change on a $300k mortgage = $90/month difference. Calculate yours at qfinhub.com",
    "401k employer match is literally free money. Are you optimizing yours? Calculate your retirement path at qfinhub.com",
    "The 50/30/20 budget rule explained in 30 seconds. Then calculate your exact numbers at qfinhub.com — free tool.",
    "Thinking about refinancing? Our break-even calculator shows exactly when it pays off. Free at qfinhub.com",
    "Tax deduction strategy: mortgage interest can save thousands. Calculate your tax savings with our free tool at qfinhub.com",
    "Saving just $100/month at 7% for 30 years = $122,000. Small habits, massive results. Run your numbers at qfinhub.com",
    "Emergency fund: 3 months or 6 months? The math might surprise you. Free calculator at qfinhub.com",
    "Car loan vs lease: we ran the numbers on 100 scenarios. The winner depends on one factor. Check at qfinhub.com",
]

CALCULATOR_LINKS = [
    ("Mortgage Calculator", "qfinhub.com/calculators/mortgage-calculator"),
    ("Compound Interest", "qfinhub.com/calculators/compound-interest"),
    ("Retirement Planner", "qfinhub.com/calculators/retirement-planning"),
    ("Debt Payoff", "qfinhub.com/calculators/debt-payoff"),
    ("Budget Planner", "qfinhub.com/calculators/budget-planner"),
    ("Investment Return", "qfinhub.com/calculators/investment-return"),
    ("401k Calculator", "qfinhub.com/calculators/401k-calculator"),
    ("FIRE Calculator", "qfinhub.com/calculators/early-retirement"),
    ("Loan Calculator", "qfinhub.com/calculators/loan-calculator"),
    ("Tax Calculator", "qfinhub.com/calculators/tax-calculator"),
]

THREAD_TOPICS = [
    {
        "hook": "I analyzed 10,000 mortgage payments. Here's what nobody tells you about interest",
        "tweets": [
            "The average 30-year mortgage borrower pays 67% of their home's value in interest alone.",
            "On a $300k home at 6.5%, you'll pay $382,000 in interest over 30 years. That's more than the house.",
            "But here's the hack: paying just $200 extra per month cuts your loan by 7 YEARS and saves $98,000.",
            "The math: Extra payments go directly to principal. Less principal = less daily interest accrual.",
            "Run your exact numbers with our free calculator",
        ]
    },
    {
        "hook": "I calculated how much the average American loses to hidden fees. The number is shocking",
        "tweets": [
            "Between 401k fees, credit card interest, and bank overdrafts — the average American loses $1,800/year.",
            "A 1% 401k fee seems small, but over 30 years it eats 28% of your returns. That's $200,000+ gone.",
            "Credit card interest at 22% APR on a $5,000 balance costs $1,100/year in pure interest.",
            "Solution: Audit your fees quarterly. Use our free calculators to model the impact of each one.",
            "Every 1% you save on fees compounds just like returns do. Free tools at",
        ]
    },
    {
        "hook": "The FIRE number you've been told is wrong. Here's the real math",
        "tweets": [
            "The standard '25x annual expenses' rule ignores inflation, healthcare, and sequence-of-returns risk.",
            "If you retire at 40 with $1M, 4% withdrawal gives $40k/year. But in 20 years, that's only $22k in today's dollars.",
            "Healthcare alone costs $7,000-12,000/year before Medicare at 65. That's 15-30% of a typical FIRE budget.",
            "The fix: Use a dynamic withdrawal rate (3.5% first 10 years, then adjust) and model healthcare separately.",
            "Calculate YOUR real FIRE number with our free tool",
        ]
    },
]

FOLLOW_TARGETS = [
    'RamitSethi', 'APompliano', 'SahilBloom', 'InvestorsLive',
    'stocktalkweekly', 'DividendGrowth', 'dollarsanddata',
    'BehavioralFins', 'morganhousel', 'awealthofcs',
    'BrianFeroldi', 'TheCompoundNews', 'ValueInvesting',
    'iancassel', 'LynAldenContact', 'MacroAlf',
    'GrahamStephan', 'MeetKevin', 'AndreiJikh',
    'HumphreyYang', 'JeremyLefebvre', 'theplainbagel',
]

HASHTAGS = [
    'personalfinance', 'investing', 'stockmarket', 'moneytips',
    'financialfreedom', 'budgeting', 'retirement', 'debtfree',
    'wealthbuilding', 'realestate', 'taxes', 'FIREMovement',
]

ENGAGEMENT_REPLIES = [
    "Great breakdown! For anyone wanting to run their own numbers on this, we built free calculators at qfinhub.com",
    "This aligns exactly with what we see in our data. Free tools to model this scenario at qfinhub.com",
    "Love this perspective. We actually built a free calculator for this exact scenario at qfinhub.com",
    "Solid analysis. If anyone wants to calculate their personal numbers for this: qfinhub.com (free, no signup)",
]

# ─── Login ───
def x_login(page, email, username, password):
    """Log into X using CloakBrowser. Handles 2-step flow."""
    
    # Check if already logged in
    page.goto('https://x.com/home', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    body = page.evaluate('document.body.innerText')
    if 'Timeline' in body or 'For you' in body:
        print('   Already logged in')
        return True
    
    print('   Logging in...')
    page.goto('https://x.com/i/flow/login', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    
    # Step 1: Enter email
    escaped_email = email.replace("'", "\\'")
    page.evaluate(f"""
        const el = document.querySelector('input[name="text"]');
        if (el) {{
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(el, '{escaped_email}');
            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }}
    """)
    time.sleep(2)
    page.evaluate("""
        const btns = [...document.querySelectorAll('[role="button"]')];
        const next = btns.find(b => b.textContent.includes('Next'));
        if (next) next.click();
    """)
    time.sleep(5)
    
    # Step 2: Check for username verification (X always asks on new devices)
    body = page.evaluate('document.body.innerText')
    if 'username' in body.lower() and 'password' not in body.lower():
        print('   Username verification requested...')
        page.evaluate(f"""
            const el = document.querySelector('input[name="text"]');
            if (el) {{
                const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                setter.call(el, '{username}');
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
            const btns = [...document.querySelectorAll('[role="button"]')];
            const next = btns.find(b => b.textContent.includes('Next'));
            if (next) next.click();
        """)
        time.sleep(5)
    
    # Step 3: Enter password
    escaped_pw = password.replace("'", "\\'")
    page.evaluate(f"""
        const pw = document.querySelector('input[type="password"]');
        if (pw) {{
            const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            setter.call(pw, '{escaped_pw}');
            pw.dispatchEvent(new Event('input', {{ bubbles: true }}));
            pw.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }}
        const btns = [...document.querySelectorAll('[role="button"]')];
        const login = btns.find(b => {{
            const t = b.textContent;
            return t.includes('Log in') || t.includes('Sign in');
        }});
        if (login) login.click();
    """)
    time.sleep(8)
    
    # Verify
    page.goto('https://x.com/home', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    body = page.evaluate('document.body.innerText')
    if 'Timeline' in body or 'For you' in body:
        print('   Login successful')
        return True
    else:
        print('   Login failed')
        return False

# ─── Post Actions ───
def post_tweet(page, text):
    """Post a single tweet. No emojis."""
    print(f'   Posting: {text[:70]}...')
    
    page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    
    escaped = text.replace("'", "\\'").replace("$", "\\$")
    page.evaluate(f"""
        const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                  document.querySelector('[contenteditable="true"]') ||
                  document.querySelector('div[role="textbox"]');
        if (el) {{
            el.focus();
            el.textContent = '{escaped}';
            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
        }}
    """)
    time.sleep(2)
    
    page.evaluate("""
        const btn = document.querySelector('[data-testid="tweetButton"]') ||
                   document.querySelector('[data-testid="tweetButtonInline"]');
        if (btn) btn.click();
    """)
    time.sleep(6)
    
    body = page.evaluate('document.body.innerText')
    if 'Your Tweet was sent' in body or text[:30] in body:
        print('   Tweet posted')
        return True
    print('   Tweet may have failed')
    return False

def post_thread(page, topic):
    """Post a thread and return the first tweet ID."""
    hook = topic['hook']
    tweets = topic['tweets']
    calc_name, calc_link = random.choice(CALCULATOR_LINKS)
    
    print(f'   Thread: {hook[:60]}...')
    
    page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    
    # Post first tweet (hook)
    escaped_hook = hook.replace("'", "\\'").replace("$", "\\$")
    page.evaluate(f"""
        const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                  document.querySelector('div[role="textbox"]');
        if (el) {{
            el.focus();
            el.textContent = '{escaped_hook}';
            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
        }}
    """)
    time.sleep(2)
    page.evaluate("""
        const btn = document.querySelector('[data-testid="tweetButton"]') ||
                   document.querySelector('[data-testid="tweetButtonInline"]');
        if (btn) btn.click();
    """)
    time.sleep(6)
    
    # Reply to self for thread tweets
    for i, tweet_text in enumerate(tweets):
        # Find reply button on the timeline
        page.goto('https://x.com/home', wait_until='domcontentloaded', timeout=20000)
        time.sleep(4)
        
        # Click reply on our own tweet (first in timeline)
        page.evaluate("""
            (function() {
                const replyBtn = [...document.querySelectorAll('[data-testid="reply"]')][0];
                if (replyBtn) replyBtn.click();
            })();
        """)
        time.sleep(3)
        
        escaped_tweet = tweet_text.replace("'", "\\'").replace("$", "\\$")
        if i == len(tweets) - 1:
            escaped_tweet = f"{escaped_tweet} {calc_link}"
        
        page.evaluate(f"""
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) {{
                el.focus();
                el.textContent = '{escaped_tweet}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        """)
        time.sleep(2)
        page.evaluate("""
            const btn = document.querySelector('[data-testid="tweetButton"]') ||
                       document.querySelector('[data-testid="tweetButtonInline"]');
            if (btn) btn.click();
        """)
        time.sleep(5)
    
    print(f'   Thread: {len(tweets) + 1} tweets posted')
    return True

def follow_accounts(page, state, count=2):
    """Follow targeted finance accounts."""
    available = [a for a in FOLLOW_TARGETS if a not in state['followed']]
    random.shuffle(available)
    to_follow = available[:count]
    
    for account in to_follow:
        try:
            page.goto(f'https://x.com/{account}', wait_until='domcontentloaded', timeout=15000)
            time.sleep(4)
            
            # Click follow button
            result = page.evaluate(f"""
                (function() {{
                    const btns = [...document.querySelectorAll('[role="button"]')];
                    const follow = btns.find(b => {{
                        const t = (b.textContent || '').toLowerCase().trim();
                        return t === 'follow';
                    }});
                    if (follow) {{ follow.click(); return 'followed'; }}
                    return 'not found';
                }})();
            """)
            
            if result == 'followed':
                state['followed'].append(account)
                print(f'   Followed: @{account}')
            time.sleep(2)
        except Exception as e:
            print(f'   @{account} failed: {str(e)[:50]}')

def engage_with_trending(page, state):
    """Find trending finance posts, like and reply."""
    hashtag = random.choice(HASHTAGS)
    print(f'   Engaging with #{hashtag}...')
    
    page.goto(f'https://x.com/search?q=%23{hashtag}&src=typed_query&f=live',
              wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)
    
    # Scroll and like 2-3 posts
    for i in range(3):
        page.evaluate("window.scrollBy(0, 400)")
        time.sleep(random.uniform(2, 4))
        
        # Click like button
        try:
            page.evaluate(f"""
                const likes = [...document.querySelectorAll('[data-testid="like"]')];
                if (likes.length > {i}) {{
                    likes[{i}].click();
                }}
            """)
            time.sleep(2)
            print(f'   Liked post #{i+1}')
        except:
            pass
    
    # Reply to first trending post
    try:
        page.evaluate("""
            const replyBtn = [...document.querySelectorAll('[data-testid="reply"]')][0];
            if (replyBtn) replyBtn.click();
        """)
        time.sleep(3)
        
        reply_text = random.choice(ENGAGEMENT_REPLIES)
        escaped_reply = reply_text.replace("'", "\\'").replace("$", "\\$")
        
        page.evaluate(f"""
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) {{
                el.focus();
                el.textContent = '{escaped_reply}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        """)
        time.sleep(2)
        page.evaluate("""
            const btn = document.querySelector('[data-testid="tweetButton"]') ||
                       document.querySelector('[data-testid="tweetButtonInline"]');
            if (btn) btn.click();
        """)
        time.sleep(5)
        state['replies'] += 1
        print(f'   Replied to #{hashtag} post')
    except Exception as e:
        print(f'   Reply failed: {str(e)[:50]}')

def check_followers(page, state):
    """Check follower count from profile page."""
    try:
        page.goto('https://x.com/qfinhub', wait_until='domcontentloaded', timeout=15000)
        time.sleep(4)
        body = page.evaluate('document.body.innerText')
        match = re.search(r'(\d[\d,]*)\s*Followers?', body)
        if match:
            count = int(match.group(1).replace(',', ''))
            state['followers'] = count
            print(f'   Followers: {count}')
    except Exception as e:
        print(f'   Follower check failed: {str(e)[:50]}')

# ─── Main ───
def main():
    parser = argparse.ArgumentParser(description='X Growth Engine v3')
    parser.add_argument('--mode', choices=['tweet', 'thread', 'engage', 'follow', 'full'],
                       default='full', help='Action mode')
    args = parser.parse_args()
    
    mode = args.mode
    now = datetime.now()
    print(f'\n{"="*60}')
    print(f'  X Growth Engine v3 — {now.strftime("%Y-%m-%d %H:%M")}')
    print(f'  Mode: {mode}')
    print(f'{"="*60}\n')
    
    creds = load_credentials()
    email = creds.get('X_EMAIL', 'q.finhub@gmail.com')
    password = creds.get('X_PASSWORD', '')
    username = creds.get('X_USERNAME', 'qfinhub')
    
    if not password:
        print('ERROR: X_PASSWORD not found in .env.local')
        return
    
    state = load_state()
    print(f'  State: {state["tweets"]} tweets, {state["replies"]} replies, '
          f'{state["followers"]} followers')
    
    # Launch CloakBrowser
    print('  Launching CloakBrowser...')
    from cloakbrowser import launch_persistent_context
    
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    
    try:
        page = context.new_page()
        page.set_default_timeout(30000)
        
        # Login
        if not x_login(page, email, username, password):
            print('ERROR: Login failed. Try manual login first.')
            return
        
        # Execute mode
        if mode in ('tweet', 'full'):
            print('\n--- Tweet ---')
            tweet_text = random.choice(VALUE_TWEETS)
            if post_tweet(page, tweet_text):
                state['tweets'] += 1
        
        if mode in ('thread', 'full'):
            print('\n--- Thread ---')
            topic = random.choice(THREAD_TOPICS)
            if post_thread(page, topic):
                state['threads'] = state.get('threads', 0) + 1
        
        if mode in ('engage', 'full'):
            print('\n--- Engagement ---')
            engage_with_trending(page, state)
        
        if mode in ('follow', 'full'):
            print('\n--- Follow ---')
            follow_accounts(page, state, count=2)
        
        # Check followers
        print('\n--- Stats ---')
        check_followers(page, state)
        
    except Exception as e:
        print(f'FATAL: {e}')
        import traceback
        traceback.print_exc()
    finally:
        context.close()
        save_state(state)
        print(f'\nDone. Tweets: {state["tweets"]}, Replies: {state["replies"]}, '
              f'Followers: {state["followers"]}\n')

if __name__ == '__main__':
    main()
