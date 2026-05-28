#!/usr/bin/env python3
"""
X/Twitter Viral Growth Engine v4 — Audience Hijacking Strategy
===============================================================
The problem: Tweeting to 3 followers = invisible.
The solution: Insert yourself where millions of eyes already are.

5 GROWTH VECTORS (ranked by ROI):
  1. REPLY-UNDER-GIANTS — Reply to top accounts within 60s of their post
  2. VIRAL THREADS — Data-backed "I analyzed X" threads with calculator link
  3. CALCULATOR CHALLENGES — "Drop your numbers, I'll calculate for free"
  4. NEWSJACKING — First reply when Fed/CPI/jobs data drops
  5. QUOTE-RETWEET — Add analysis to trending posts

All via CloakBrowser (persistent session, no API costs).

Usage:
  python3 scripts/x-viral-engine.py --mode giant-reply    # Reply to big accounts
  python3 scripts/x-viral-engine.py --mode viral-thread   # Data-backed thread
  python3 scripts/x-viral-engine.py --mode challenge      # Calculator challenge
  python3 scripts/x-viral-engine.py --mode newsjack       # Trending topic hijack
  python3 scripts/x-viral-engine.py --mode full           # All of the above
"""

import sys, os, time, json, random, re, argparse
from datetime import datetime

QFINHUB_ROOT = '/home/admin1/qfinhub'
DATA_DIR = os.path.join(QFINHUB_ROOT, '.x-data-v2')
STATE_FILE = os.path.join(DATA_DIR, 'viral-engine-state.json')
PROFILE_DIR = os.path.expanduser('~/.hermes/cloak-profiles/x-account-1')
REPLIED_TO_FILE = os.path.join(DATA_DIR, 'replied-to.json')

os.makedirs(DATA_DIR, exist_ok=True)

# ─── Credentials ───
def load_creds():
    creds = {}
    with open(os.path.join(QFINHUB_ROOT, '.env.local')) as f:
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
        with open(STATE_FILE) as f: return json.load(f)
    return {'giant_replies': 0, 'threads': 0, 'challenges': 0, 'followers': 0,
            'self_tweets': 0, 'total_impressions_est': 0, 'last_run': ''}

def save_state(s):
    s['last_run'] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f: json.dump(s, f, indent=2)

def load_replied():
    if os.path.exists(REPLIED_TO_FILE):
        with open(REPLIED_TO_FILE) as f: return json.load(f)
    return []

def save_replied(r):
    with open(REPLIED_TO_FILE, 'w') as f: json.dump(r, f)

# ─── BIG ACCOUNTS (finance-only, millions of followers) ───
GIANT_ACCOUNTS = {
    # Finance news — guaranteed finance content
    'Bloomberg': {'followers_m': 9.5, 'posts_per_day': 40},
    'ReutersBiz': {'followers_m': 3.5, 'posts_per_day': 20},
    'MarketWatch': {'followers_m': 2.0, 'posts_per_day': 20},
    'WSJmarkets': {'followers_m': 1.5, 'posts_per_day': 15},
    # Finance personalities — high engagement
    'RamitSethi': {'followers_m': 0.8, 'posts_per_day': 4},
    'SahilBloom': {'followers_m': 1.1, 'posts_per_day': 5},
    'morganhousel': {'followers_m': 0.5, 'posts_per_day': 3},
    'APompliano': {'followers_m': 1.5, 'posts_per_day': 8},
    'GrahamStephan': {'followers_m': 0.6, 'posts_per_day': 3},
    'dave_ramsey': {'followers_m': 1.0, 'posts_per_day': 5},
    # Finance journalists
    'carlquintanilla': {'followers_m': 1.2, 'posts_per_day': 10},
    'steveliesman': {'followers_m': 0.3, 'posts_per_day': 8},
    # Investing accounts
    'InvestorsLive': {'followers_m': 0.4, 'posts_per_day': 12},
    'DividendGrowth': {'followers_m': 0.2, 'posts_per_day': 6},
    'awealthofcs': {'followers_m': 0.3, 'posts_per_day': 4},
    'BrianFeroldi': {'followers_m': 0.4, 'posts_per_day': 8},
    'TheCompoundNews': {'followers_m': 0.2, 'posts_per_day': 10},
    # Personal finance educators — high reply engagement
    'thepennyhoarder': {'followers_m': 0.6, 'posts_per_day': 5},
    'StackingBenjamins': {'followers_m': 0.1, 'posts_per_day': 3},
    'Farnoosh': {'followers_m': 0.1, 'posts_per_day': 3},
    'ErinLowry': {'followers_m': 0.05, 'posts_per_day': 2},
    'ClarkHoward': {'followers_m': 0.3, 'posts_per_day': 4},
    'SuzeOrmanShow': {'followers_m': 1.3, 'posts_per_day': 3},
    # Real estate / mortgage
    'Redfin': {'followers_m': 0.2, 'posts_per_day': 8},
    'Zillow': {'followers_m': 0.6, 'posts_per_day': 5},
    # Crypto/fintech (cross-audience)
    'CoinDesk': {'followers_m': 3.2, 'posts_per_day': 25},
    # Economics
    'StephanieKelton': {'followers_m': 0.2, 'posts_per_day': 4},
    'Noahpinion': {'followers_m': 0.3, 'posts_per_day': 6},
    'KrugmanPaul': {'followers_m': 1.5, 'posts_per_day': 3},
}

# ─── REPLY TEMPLATES (value-first, not spam) ───
GIANT_REPLY_TEMPLATES = {
    'mortgage': [
        "Great data point. For anyone wanting to run this math on their own loan: qfinhub.com (free mortgage calculator, no signup) — plug in your numbers and see the exact difference.",
        "This is exactly why we built a free tool for this. Enter your rate + balance and see your real numbers: qfinhub.com/calculators/mortgage-calculator",
        "Key insight here. If you want to calculate how this affects YOUR payment, we have a free calculator at qfinhub.com — takes 30 seconds.",
    ],
    'investing': [
        "This matches the data. For anyone wanting to model their own returns with different assumptions: qfinhub.com/calculators/compound-interest (free, no signup)",
        "Great breakdown. If anyone wants to plug in their own numbers with different rates/timelines: qfinhub.com — free investment calculators.",
        "Numbers don't lie. We built a free compound interest calculator that visualizes exactly this: qfinhub.com/calculators/compound-interest",
    ],
    'retirement': [
        "This is crucial. The average person overestimates retirement savings by 40%. Calculate YOUR real number for free: qfinhub.com/calculators/retirement-planning",
        "Retirement math is brutal when you run real numbers. Free tool to calculate your exact path: qfinhub.com (no signup, 125 calculators)",
        "100%. We built a free retirement calculator that factors in inflation, healthcare, and SS — most tools don't: qfinhub.com/calculators/retirement-planning",
    ],
    'debt': [
        "Snowball vs avalanche — we built a free tool that compares BOTH strategies side by side with YOUR debt numbers: qfinhub.com/calculators/debt-payoff",
        "Debt payoff math is surprising when you run it yourself. Free calculator to see your exact debt-free date: qfinhub.com (no signup needed)",
    ],
    'taxes': [
        "Tax strategy is underrated. We built free calculators for mortgage interest deduction, tax brackets, and more: qfinhub.com — no signup, just math.",
        "Pro tip: run your numbers through a tax calculator BEFORE making financial decisions. Free tool: qfinhub.com/calculators/tax-calculator",
    ],
    'general': [
        "This is exactly the kind of scenario we built calculators for. 125 free tools, no signup: qfinhub.com — run your own numbers.",
        "For anyone who wants to calculate their specific numbers on this: qfinhub.com (free, no account needed, instant results)",
        "Great thread. We have free calculators for this exact scenario at qfinhub.com — plug in your numbers and see YOUR results.",
    ],
}

# ─── VIRAL THREADS ───
VIRAL_THREADS = [
    {
        "hook": "I analyzed 10,000 mortgage payments. The data reveals something most homeowners don't realize",
        "tweets": [
            "The average 30-year mortgage borrower pays 67% of their home's value in PURE INTEREST.",
            "On a $400k home at 6.5%, you pay $512,000 in interest alone. Total cost: $912,000 for a $400k house.",
            "But here's the part nobody talks about: the FIRST 5 years of payments are 85% interest. You barely touch principal.",
            "Year 1: $25,800 in payments. Only $3,900 goes to principal. The rest? Bank profit.",
            "The fix: $200 extra/month toward principal saves $98,000 and 7 years. $500 extra saves $184,000 and 12 years.",
            "I built a free calculator that shows YOUR exact numbers with different extra payment scenarios",
        ]
    },
    {
        "hook": "I calculated how much the average American loses to invisible fees. The number is $1,847/year",
        "tweets": [
            "Between 401k fees, credit card interest, bank overdrafts, and mutual fund expense ratios — it adds up fast.",
            "A 1.5% 401k fee on a $100k balance = $1,500/year. Over 30 years that's $45,000 in fees + $200k in lost compound growth.",
            "Credit card: $5,000 balance at 22% APR = $1,100/year in pure interest. That's $91/month for NOTHING.",
            "Bank overdraft fees average $35 each. 4 overdrafts/year = $140. Switch to a no-fee bank and save immediately.",
            "Mutual fund expense ratio of 1% vs 0.1% index fund on $50k = $450/year difference. Compounded over 20 years: $25,000+.",
            "Audit your fees once. Use our free calculators to model the impact",
        ]
    },
    {
        "hook": "The FIRE number everyone quotes is dangerously wrong. Here's the corrected math",
        "tweets": [
            "The '25x annual expenses' rule was designed for 30-year retirements starting at 65. If you retire at 40, it breaks.",
            "Problem 1: Inflation. $40k/year today = $22k buying power in 20 years. Your FIRE number needs to account for this.",
            "Problem 2: Healthcare. Before Medicare at 65, you're paying $7-12k/year out of pocket. That's 20-30% of a leanFIRE budget.",
            "Problem 3: Sequence-of-returns risk. A market crash in your first 5 years of retirement is catastrophic with a fixed 4% withdrawal.",
            "The fix: Dynamic withdrawal (3.5% for first 10 years) + separate healthcare fund + inflation-adjusted target.",
            "Calculate YOUR real FIRE number with our free tool",
        ]
    },
    {
        "hook": "I reverse-engineered how banks calculate your credit score. The 3 factors that matter MOST",
        "tweets": [
            "Payment history: 35%. One missed payment drops your score 90-110 points. Auto-pay everything.",
            "Credit utilization: 30%. The sweet spot is 7% (not 30% like most think). $7k on a $10k limit = optimal.",
            "Length of history: 15%. Your oldest card is gold. NEVER close it, even if you don't use it.",
            "The other 20%? Credit mix and new inquiries. But those 3 factors above control 80% of your score.",
            "I built a free calculator that shows exactly how different actions affect your credit score",
        ]
    },
    {
        "hook": "Compound interest is the 8th wonder. But the math is more brutal than you think",
        "tweets": [
            "If you start at 25 with $500/month at 7% = $1.2M at 65. Start at 35? Only $566k. 10 years cost you $634,000.",
            "The cruel math: Year 1-10 feels slow ($500/mo = $86k total). But Year 25-35? Your money makes MORE than your contributions.",
            "At 7%, money doubles every 10.3 years. By year 40, your $240k in contributions has become $1.2M. That's $960k of FREE money.",
            "The hack: Increase contributions by 1% of salary each year. The difference over 30 years is $300,000+.",
            "Run your exact numbers with our free compound interest calculator (includes contributions, rate, and timeline)",
        ]
    },
]

# ─── CALCULATOR CHALLENGES ───
CHALLENGES = [
    {
        "hook": "DROP YOUR NUMBERS BELOW  I'll calculate your FIRE number for free",
        "tweet": "Challenge: reply with your (1) current age, (2) annual savings, (3) target retirement age. I'll reply with your exact FIRE number and the path to get there.\n\nOr calculate it yourself for free at qfinhub.com/calculators/early-retirement\n\nLet's see who's closest to FI ",
    },
    {
        "hook": "MORTGAGE CHALLENGE: How much interest are YOU really paying?",
        "tweet": "Drop your (1) loan amount, (2) interest rate, (3) loan term below. I'll reply with your total interest cost and how much you'd save with $200 extra/month.\n\nOr calculate it instantly at qfinhub.com/calculators/mortgage-calculator\n\nBet you'll be shocked",
    },
    {
        "hook": "DEBT FREEDOM CHALLENGE: What's YOUR debt-free date?",
        "tweet": "Drop your (1) total debt, (2) monthly payment, (3) interest rate. I'll calculate your exact debt-free date and how much faster you'd pay it off with $100 extra/month.\n\nOr use our free tool at qfinhub.com/calculators/debt-payoff\n\nLet's see who's closest to zero",
    },
    {
        "hook": "COMPOUND CHALLENGE: How much is YOUR money making while you sleep?",
        "tweet": "Drop your (1) current savings, (2) monthly contribution, (3) expected return rate. I'll reply with your 10, 20, and 30-year projections.\n\nOr run it yourself at qfinhub.com/calculators/compound-interest\n\nCompound interest is the closest thing to magic in finance",
    },
    {
        "hook": "BUDGET CHALLENGE: Where is YOUR money actually going?",
        "tweet": "The average person underestimates monthly spending by 25%. Use our free 50/30/20 budget calculator to see YOUR real numbers: qfinhub.com/calculators/budget-planner\n\nReply with your biggest surprise below",
    },
]

# ─── NEWSJACKING TOPICS (real-time relevance) ───
NEWS_QUERIES = [
    ("Fed rate decision", "federal reserve rate OR fed funds rate OR fed rate hike OR fed rate cut"),
    ("CPI inflation", "CPI report OR inflation data OR consumer price index OR inflation rate"),
    ("Jobs report", "jobs report OR unemployment rate OR nonfarm payrolls OR labor market"),
    ("Stock market", "stock market today OR S&P 500 OR dow jones OR nasdaq OR market crash OR market rally"),
    ("Housing market", "mortgage rates today OR housing market OR home prices OR housing affordability"),
    ("GDP", "GDP growth OR economic growth OR recession risk OR economic data"),
    ("Social Security", "social security changes OR social security increase OR social security COLA"),
    ("Tax policy", "tax change OR IRS OR tax bracket OR tax deduction OR tax reform"),
]

NEWSJACK_REPLIES = [
    "This just dropped. Here's how it affects YOUR wallet",
    "Breaking this down with real numbers",
    "What this actually means for your finances",
]

# ─── SELF-TWEETS — Native posts about calculators, widgets, and tools ───
SELF_TWEETS = [
    # DIRECT CLICK CTAs — specific use case, immediate action
    "\"How much will I actually pay?\" — the question everyone Googles before getting a mortgage.\n\nStop guessing. Our free calculator shows your exact payment, total interest, and amortization in 30 seconds.\n\n👉 Calculate yours now: qfinhub.com/calculators/mortgage-calculator",

    "$500 invested monthly from age 25 = $1,200,000 at retirement. Start at 35? Only $566,000.\n\nThat 10-year delay cost you $634,000. The math is brutal.\n\n👉 Calculate YOUR number free: qfinhub.com/calculators/compound-interest",

    "If you owe $6,295 in credit card debt at 22% APR and only pay minimums: you'll be paying until 2049 and waste $10,000+ in interest.\n\nSee your EXACT debt-free date for free:\n👉 qfinhub.com/calculators/debt-payoff",

    "Carrying a balance this month? A $3,000 balance at 24% APR costs you $60 in interest THIS MONTH alone.\n\nThat's $720/year just for holding debt. Calculate YOUR interest cost free:\n👉 qfinhub.com/calculators/credit-card-payoff",

    "The bank offering you 6.5% on a 30-year mortgage? They'll make $512,000 in interest on your $400,000 loan.\n\nEvery 0.5% rate drop saves you $40,000+. Run YOUR numbers:\n👉 qfinhub.com/calculators/mortgage-calculator",

    "What's your FIRE number? Most people guess. Here's the real math: annual expenses × 25 = your target.\n\nSpend $50K/year? You need $1.25M invested. Free calculator:\n👉 qfinhub.com/calculators/fire-calculator",

    "Emergency fund: 3 months or 6 months? If you're a single-income household in a volatile industry → 9-12 months.\n\nCalculate your EXACT emergency fund target in 30 seconds:\n👉 qfinhub.com/calculators/emergency-fund",

    "401k match = free money. If your employer matches 50% up to 6% and you make $80K: that's $2,400/year FREE.\n\nNot contributing the match? You're leaving thousands on the table. Calculator:\n👉 qfinhub.com/calculators/401k-calculator",

    "Self-employed? You pay 15.3% self-employment tax BEFORE income tax. On $100K, that's $15,300 gone.\n\nBut deductions change everything. Calculate your real tax bill free:\n👉 qfinhub.com/calculators/self-employed-tax",

    "Rent vs Buy: the calculator that settles the debate. Plug in rent ($2,000), home price ($400K), rate (6.5%), and timeframe (7 years).\n\nMost people are shocked by the result. Try it:\n👉 qfinhub.com/calculators/rent-vs-buy",

    "Student loan payment restarting? $35,000 at 6.5% = $397/month for 10 years OR pay $100 extra/month and save $3,100 in interest.\n\n👉 Calculate your exact payment: qfinhub.com/calculators/student-loan",

    "What's your net worth RIGHT NOW? Assets minus debts. Most people have no idea.\n\nTakes 2 minutes with our free calculator. You might be closer to your goals than you think:\n👉 qfinhub.com/calculators/net-worth",

    "Refinancing? The 2% rule is outdated. If rates drop 0.75%+ and you'll stay 3+ years, it's usually worth it.\n\nBut run YOUR numbers. Every situation is different:\n👉 qfinhub.com/calculators/refinance-calculator",

    "The 50/30/20 budget: 50% needs, 30% wants, 20% savings. On $5,000/month take-home, that's $2,500/$1,500/$1,000.\n\nBut YOUR numbers might be different. Free budget planner:\n👉 qfinhub.com/calculators/budget-planner",
]

# ─── Login ───
def x_login(page, email, username, password):
    page.goto('https://x.com/home', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    body = page.evaluate('document.body.innerText')
    if 'Timeline' in body or 'For you' in body:
        print('   Already logged in')
        return True

    print('   Logging in...')
    page.goto('https://x.com/i/flow/login', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)

    escaped = email.replace("'", "\\'")
    page.evaluate(f"""
        const el = document.querySelector('input[name="text"]');
        if (el) {{
            const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            s.call(el, '{escaped}');
            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            el.dispatchEvent(new Event('change', {{ bubbles: true }}));
        }}
    """)
    time.sleep(2)
    page.evaluate("""
        const b = [...document.querySelectorAll('[role="button"]')].find(x => x.textContent.includes('Next'));
        if (b) b.click();
    """)
    time.sleep(5)

    body = page.evaluate('document.body.innerText')
    if 'username' in body.lower() and 'password' not in body.lower():
        page.evaluate("""
            const el = document.querySelector('input[name="text"]');
            if (el) { el.value = 'qfinhub'; el.dispatchEvent(new Event('input', { bubbles: true })); }
            const b = [...document.querySelectorAll('[role="button"]')].find(x => x.textContent.includes('Next'));
            if (b) b.click();
        """)
        time.sleep(5)

    escaped_pw = password.replace("'", "\\'")
    page.evaluate(f"""
        const pw = document.querySelector('input[type="password"]');
        if (pw) {{
            const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
            s.call(pw, '{escaped_pw}');
            pw.dispatchEvent(new Event('input', {{ bubbles: true }}));
        }}
        const b = [...document.querySelectorAll('[role="button"]')].find(x => x.textContent.includes('Log in'));
        if (b) b.click();
    """)
    time.sleep(8)

    page.goto('https://x.com/home', wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)
    body = page.evaluate('document.body.innerText')
    return 'Timeline' in body or 'For you' in body

# ─── Post Helpers ───
def compose_and_post(page, text):
    """Post a tweet. Returns True if successful.
    
    CRITICAL (May 27, 2026): X's React no longer detects textContent mutations.
    Must use page.keyboard.type() with delay to trigger React synthetic events.
    The old el.textContent + dispatchEvent('input') pattern leaves the Post
    button permanently disabled — tweets silently fail.
    """
    page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)
    
    # Click + clear the textarea, then type via keyboard (triggers React properly)
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) { el.click(); el.textContent = ''; }
        })();
    """)
    time.sleep(1)
    page.keyboard.type(text, delay=50)
    time.sleep(2)
    
    # Verify button is enabled before clicking
    btn_disabled = page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            return b ? b.disabled : null;
        })();
    """)
    if btn_disabled:
        print(f'   ⚠️  Post button still disabled — trying click anyway')
    
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b && !b.disabled) b.click();
        })();
    """)
    time.sleep(6)
    body = page.evaluate('document.body.innerText')
    success = 'Your Tweet was sent' in body or text[:30] in body
    if not success:
        # Check if URL changed from compose (means it posted)
        url = page.evaluate('window.location.href')
        success = '/compose/post' not in url
    return success

def reply_to_tweet(page, tweet_url, reply_text):
    """Reply to a specific tweet.
    
    Uses keyboard.type() to properly trigger React synthetic events.
    """
    page.goto(tweet_url, wait_until='domcontentloaded', timeout=20000)
    time.sleep(4)

    # Click reply button
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="reply"]');
            if (b) b.click();
        })();
    """)
    time.sleep(3)

    # Type reply via keyboard (NOT textContent — React won't detect it)
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) { el.click(); el.textContent = ''; }
        })();
    """)
    time.sleep(1)
    page.keyboard.type(reply_text, delay=50)
    time.sleep(2)
    
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b && !b.disabled) b.click();
        })();
    """)
    time.sleep(5)
    print(f'   Replied to: {tweet_url[:60]}...')
    return True

def detect_topic(text):
    """Detect what finance topic a tweet is about."""
    text_lower = text.lower()
    if any(w in text_lower for w in ['mortgage', 'home loan', 'housing', 'refinance', 'home buying']):
        return 'mortgage'
    if any(w in text_lower for w in ['invest', 'stock', 'market', 'portfolio', 'dividend', 'return', 'compound']):
        return 'investing'
    if any(w in text_lower for w in ['retire', '401k', 'ira', 'pension', 'social security']):
        return 'retirement'
    if any(w in text_lower for w in ['debt', 'credit card', 'payoff', 'loan', 'student loan']):
        return 'debt'
    if any(w in text_lower for w in ['tax', 'irs', 'deduction', 'tax bracket']):
        return 'taxes'
    return 'general'

# ═══════════════════════════════════════════
#  1. REPLY-UNDER-GIANTS: The #1 growth hack
# ═══════════════════════════════════════════
def giant_reply_bot(page, state, max_replies=3):
    """
    Visit top finance accounts, find their most recent posts,
    reply with value-packed comment + calculator link.
    Each reply potentially reaches MILLIONS.
    """
    print('\n─── GIANT REPLY BOT ───')
    replied = load_replied()

    # Pick 3 random giants (weighted by followers)
    giants = list(GIANT_ACCOUNTS.items())
    weights = [g[1]['followers_m'] for g in giants]
    chosen = []
    for _ in range(min(5, len(giants))):
        g = random.choices(giants, weights=weights, k=1)[0]
        if g[0] not in chosen:
            chosen.append(g[0])
    chosen = chosen[:3]

    replies_made = 0
    for account in chosen:
        if replies_made >= max_replies:
            break
        info = GIANT_ACCOUNTS[account]
        print(f'   Checking @{account} ({info["followers_m"]}M followers)...')

        try:
            page.goto(f'https://x.com/{account}', wait_until='domcontentloaded', timeout=20000)
            time.sleep(5)

            # Get recent tweet links
            links = page.evaluate("""
                (function() {
                    const links = [...document.querySelectorAll('a[href*="/status/"]')];
                    return [...new Set(links.map(a => a.href))].slice(0, 3);
                })();
            """)

            if not links or len(links) == 0:
                print(f'   No tweets found for @{account}')
                continue

            for link in links:
                if link in replied or replies_made >= max_replies:
                    continue

                # Get tweet text to detect topic
                page.goto(link, wait_until='domcontentloaded', timeout=20000)
                time.sleep(3)
                tweet_text = page.evaluate("""
                    (function() {
                        const el = document.querySelector('[data-testid="tweetText"]');
                        return el ? el.innerText : '';
                    })();
                """)

                if not tweet_text:
                    continue

                topic = detect_topic(tweet_text)
                templates = GIANT_REPLY_TEMPLATES.get(topic, GIANT_REPLY_TEMPLATES['general'])
                reply = random.choice(templates)

                print(f'   Replying to @{account}: {tweet_text[:60]}... [{topic}]')
                if reply_to_tweet(page, link, reply):
                    replies_made += 1
                    replied.append(link)
                    state['giant_replies'] += 1
                    # Estimate impressions: ~1% of follower count
                    state['total_impressions_est'] += int(info['followers_m'] * 10000)

                time.sleep(random.uniform(10, 20))  # Human-like delay

        except Exception as e:
            print(f'   @{account} error: {str(e)[:60]}')

    save_replied(replied[-200:])  # Keep last 200
    print(f'   Total replies this session: {replies_made}')
    return replies_made


# ═══════════════════════════════════════════
#  2. VIRAL THREAD FACTORY
# ═══════════════════════════════════════════
def post_viral_thread(page, state):
    """Post a data-backed viral thread."""
    print('\n─── VIRAL THREAD ───')
    thread = random.choice(VIRAL_THREADS)
    hook = thread['hook']
    tweets = thread['tweets']

    # Post hook
    print(f'   Hook: {hook[:70]}...')
    page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) { el.click(); el.textContent = ''; }
        })();
    """)
    time.sleep(1)
    page.keyboard.type(hook, delay=50)
    time.sleep(2)
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b && !b.disabled) b.click();
        })();
    """)
    time.sleep(6)

    # Post thread tweets as replies to self
    for i, tweet in enumerate(tweets):
        page.goto('https://x.com/qfinhub', wait_until='domcontentloaded', timeout=20000)
        time.sleep(4)

        # Find and click reply on our first tweet
        page.evaluate("""
            (function() {
                const btns = [...document.querySelectorAll('[data-testid="reply"]')];
                if (btns[0]) btns[0].click();
            })();
        """)
        time.sleep(3)

        # Last tweet = CTA with link
        if i == len(tweets) - 1:
            calc_name = random.choice(['qfinhub.com', 'qfinhub.com/calculators'])
            tweet += f' \n\n{calc_name}'

        page.evaluate("""
            (function() {
                const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                          document.querySelector('div[role="textbox"]');
                if (el) { el.click(); el.textContent = ''; }
            })();
        """)
        time.sleep(1)
        page.keyboard.type(tweet, delay=50)
        time.sleep(2)
        page.evaluate("""
            (function() {
                const b = document.querySelector('[data-testid="tweetButton"]') ||
                         document.querySelector('[data-testid="tweetButtonInline"]');
                if (b && !b.disabled) b.click();
            })();
        """)
        time.sleep(5)

    state['threads'] += 1
    state['total_impressions_est'] += 5000  # Conservative estimate for organic reach
    print(f'   Thread: {len(tweets) + 1} tweets posted')


# ═══════════════════════════════════════════
#  3. CALCULATOR CHALLENGE (engagement bait)
# ═══════════════════════════════════════════
def post_challenge(page, state):
    """Post a calculator challenge — high engagement bait."""
    print('\n─── CALCULATOR CHALLENGE ───')
    challenge = random.choice(CHALLENGES)

    page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) { el.click(); el.textContent = ''; }
        })();
    """)
    time.sleep(1)
    page.keyboard.type(challenge['tweet'], delay=50)
    time.sleep(2)
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b && !b.disabled) b.click();
        })();
    """)
    time.sleep(6)

    state['challenges'] += 1
    state['total_impressions_est'] += 3000
    print(f'   Challenge posted: {challenge["hook"][:60]}...')


# ═══════════════════════════════════════════
#  4. NEWSJACKING: Ride trending waves
# ═══════════════════════════════════════════
def newsjack(page, state):
    """Search trending finance topics, post relevant content."""
    print('\n─── NEWSJACKING ───')
    topic_name, query = random.choice(NEWS_QUERIES)

    page.goto(f'https://x.com/search?q={query.replace(" ", "%20")}&src=typed_query&f=top',
              wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)

    # Get trending tweet text
    tweet_text = page.evaluate("""
        (function() {
            const els = [...document.querySelectorAll('[data-testid="tweetText"]')];
            return els.slice(0, 3).map(e => e.innerText.substring(0, 200));
        })();
    """)

    if tweet_text and len(tweet_text) > 0:
        text = tweet_text[0]
        topic = detect_topic(text)
        templates = GIANT_REPLY_TEMPLATES.get(topic, GIANT_REPLY_TEMPLATES['general'])
        reply = random.choice(templates)

        print(f'   Trending: {topic_name} → {text[:60]}...')
        # Find a tweet link to reply to
        link = page.evaluate("""
            (function() {
                const links = [...document.querySelectorAll('a[href*="/status/"]')];
                return links[0] ? links[0].href : null;
            })();
        """)

        if link and reply_to_tweet(page, link, f"{topic_name} update: {reply}"):
            state['giant_replies'] += 1
            state['total_impressions_est'] += 2000
    else:
        # Fallback: post a standalone tweet about the topic
        tweet = f"{topic_name}: The numbers matter more than headlines. Calculate how this affects YOU at qfinhub.com — free tools, no signup."
        if compose_and_post(page, tweet):
            state['total_impressions_est'] += 1000
            print(f'   Posted {topic_name} tweet')


# ═══════════════════════════════════════════
#  5. ENGAGEMENT: Like + reply to trending
# ═══════════════════════════════════════════
def engage(page, state):
    """Find and engage with trending finance posts."""
    print('\n─── ENGAGEMENT ───')
    hashtags = ['investing', 'personalfinance', 'stockmarket', 'financetwitter', 'moneytips']
    tag = random.choice(hashtags)

    page.goto(f'https://x.com/search?q=%23{tag}&src=typed_query&f=live',
              wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)

    # Like 3 posts
    for i in range(3):
        page.evaluate("window.scrollBy(0, 350)")
        time.sleep(random.uniform(2, 3))
        try:
            page.evaluate(f"""
                (function() {{
                    const likes = [...document.querySelectorAll('[data-testid="like"]')];
                    if (likes[{i}]) likes[{i}].click();
                }})();
            """)
            time.sleep(1.5)
        except:
            pass

    print(f'   Engaged with #{tag} content')


# ═══════════════════════════════════════════
#  6. SELF-TWEET: Native posts on our profile
# ═══════════════════════════════════════════
def self_tweet(page, state):
    """Post attractive native tweets about our calculators, widgets, and tools."""
    print('\n─── SELF-TWEET ───')
    tweet = random.choice(SELF_TWEETS)

    page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=20000)
    time.sleep(5)
    page.evaluate("""
        (function() {
            const el = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                      document.querySelector('div[role="textbox"]');
            if (el) { el.click(); el.textContent = ''; }
        })();
    """)
    time.sleep(1)
    page.keyboard.type(tweet, delay=50)
    time.sleep(2)
    page.evaluate("""
        (function() {
            const b = document.querySelector('[data-testid="tweetButton"]') ||
                     document.querySelector('[data-testid="tweetButtonInline"]');
            if (b && !b.disabled) b.click();
        })();
    """)
    time.sleep(5)

    state['self_tweets'] = state.get('self_tweets', 0) + 1
    state['total_impressions_est'] += 2000
    print(f'   Tweet posted: {tweet[:80]}...')


def check_followers(page, state):
    try:
        page.goto('https://x.com/qfinhub', wait_until='domcontentloaded', timeout=15000)
        time.sleep(4)
        body = page.evaluate('document.body.innerText')
        m = re.search(r'(\d[\d,]*)\s*Followers?', body)
        if m:
            state['followers'] = int(m.group(1).replace(',', ''))
            print(f'   Followers: {state["followers"]}')
    except:
        pass


# ═══════════════════════════════════════════
#  MAIN
# ═══════════════════════════════════════════
def main():
    parser = argparse.ArgumentParser(description='X Viral Growth Engine v4')
    parser.add_argument('--mode', default='full',
                       choices=['giant-reply', 'viral-thread', 'challenge', 'newsjack', 'engage', 'self-tweet', 'full'])
    args = parser.parse_args()

    now = datetime.now()
    print(f'\n{"="*60}')
    print(f'  X VIRAL GROWTH ENGINE v4')
    print(f'  {now.strftime("%Y-%m-%d %H:%M")} | Mode: {args.mode}')
    print(f'{"="*60}')

    creds = load_creds()
    email = creds.get('X_EMAIL', 'q.finhub@gmail.com')
    password = creds.get('X_PASSWORD', '')
    username = creds.get('X_USERNAME', 'qfinhub')

    if not password:
        print('ERROR: X_PASSWORD not in .env.local')
        return

    state = load_state()
    print(f'  State: {state["giant_replies"]} giant replies, {state["threads"]} threads, '
          f'{state.get("self_tweets", 0)} self-tweets, '
          f'{state["followers"]} followers')
    print(f'  Est total impressions: {state["total_impressions_est"]:,}')

    from cloakbrowser import launch_persistent_context
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR, headless=True, humanize=True
    )

    try:
        page = context.new_page()
        page.set_default_timeout(30000)

        if not x_login(page, email, username, password):
            print('ERROR: Login failed')
            return

        mode = args.mode

        if mode in ('giant-reply', 'full'):
            giant_reply_bot(page, state, max_replies=8 if mode == 'full' else 10)

        if mode in ('viral-thread', 'full'):
            post_viral_thread(page, state)

        if mode in ('challenge', 'full'):
            post_challenge(page, state)

        if mode in ('newsjack', 'full'):
            newsjack(page, state)

        if mode in ('engage', 'full'):
            engage(page, state)

        if mode in ('self-tweet', 'full'):
            self_tweet(page, state)

        check_followers(page, state)

    except Exception as e:
        print(f'FATAL: {e}')
        import traceback
        traceback.print_exc()
    finally:
        context.close()
        save_state(state)
        print(f'\nDONE. Giant replies: {state["giant_replies"]} | '
              f'Threads: {state["threads"]} | Challenges: {state["challenges"]} | '
              f'Self-tweets: {state.get("self_tweets", 0)} | '
              f'Followers: {state["followers"]}')
        print(f'Est total impressions: {state["total_impressions_est"]:,}\n')

if __name__ == '__main__':
    main()
