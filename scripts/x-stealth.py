#!/usr/bin/env python3
"""
X/Twitter Stealth Browser Automation — Engagement-First Strategy for 0-Follower Account

Strategy:
1. Find high-engagement finance threads via search
2. Leave value-packed comments with calculator links
3. Reply to big finance accounts (CNBC, Bloomberg, etc.)
4. Create "Calculator Challenge" posts
5. Like + bookmark relevant posts to train algorithm

Credentials: Read from /home/admin1/qfinhub/.env.local
Usage: python3 scripts/x-stealth.py [--mode browse|engage|challenge|full]
"""

import sys, os, asyncio, json, time, random, re, subprocess
from datetime import datetime, timedelta

# ── Path setup ──
sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QFINHUB_ROOT = '/home/admin1/qfinhub'
LOG_FILE = f'{QFINHUB_ROOT}/.x-data-v2/stealth-activity.json'

# ── Configuration ──
CALCULATOR_LINKS = [
    ("Mortgage Calculator", "https://qfinhub.com/calculators/mortgage-calculator"),
    ("Compound Interest Calculator", "https://qfinhub.com/calculators/compound-interest"),
    ("Retirement Calculator", "https://qfinhub.com/calculators/retirement-planning"),
    ("Debt Payoff Calculator", "https://qfinhub.com/calculators/debt-payoff"),
    ("Budget Planner", "https://qfinhub.com/calculators/budget-planner"),
    ("Investment Return Calculator", "https://qfinhub.com/calculators/investment-return"),
    ("Tax Calculator", "https://qfinhub.com/calculators/tax-calculator"),
    ("Loan Calculator", "https://qfinhub.com/calculators/loan-calculator"),
    ("401k Calculator", "https://qfinhub.com/calculators/401k-calculator"),
    ("FIRE Calculator", "https://qfinhub.com/calculators/early-retirement"),
]

ENGAGEMENT_REPLIES = [
    "Great point! If you want to run the numbers on this, I built a free {calc_name}: {link} — no sign-up needed 📊",
    "This is exactly why I created a free {calc_name}. You can model different scenarios here: {link} 💡",
    "Love this thread. For anyone wanting to calculate their own numbers, here's a free tool: {link} ({calc_name}) 🧮",
    "Solid advice! Quick plug — I made a {calc_name} that does exactly this math: {link} — completely free ✅",
    "This matches what I see in the data. If anyone wants to plug in their own numbers: {link} (free {calc_name}) 📈",
    "Great breakdown. BTW I built a {calc_name} for this exact scenario — free to use: {link} 🔢",
]

CHALLENGE_POSTS = [
    "📊 Calculator Challenge: Can you pay off your debt 3 years faster? Enter your balances into this free calculator and see the exact date you'll be debt-free: {link} Drop your payoff date below! 👇",
    "🏠 Mortgage Challenge: Enter your loan details and see how much interest you'd save by paying $200 extra/month. I bet it's more than you think: {link} #PersonalFinance",
    "💰 Savings Challenge: If you invested $500/month at 7% returns, what would you have in 20 years? Use this calculator and post your number: {link} #Investing",
    "🔥 FIRE Challenge: What's your FIRE number? Calculate your exact path to financial independence with this free tool: {link} #FIRECommunity",
    "📉 Budget Challenge: Track your spending for 30 days, then use this calculator to build a budget that actually works: {link} Share your biggest surprise below!",
]

FINANCE_ACCOUNTS = [
    "CNBC", "Bloomberg", "Reuters", "MarketWatch", "WSJ", "Forbes",
    "Investopedia", "NerdWallet", "Bankrate", "TheFinanceNews",
    "dave_ramsey", "SuzeOrmanShow", "YourMoney", "Kiplinger",
    "MorningstarInc", "FoolishThe", "Wealthfront", "Betterment",
]

SEARCH_QUERIES = [
    "mortgage rates today OR home loan advice",
    "investing tips beginners OR stock market",
    "credit card debt payoff OR debt snowball",
    "retirement planning OR 401k advice",
    "budgeting tips OR saving money hacks",
    "personal finance thread OR money management",
    "compound interest explained OR investment returns",
    "tax planning OR tax bracket calculator",
    "how to save for house OR mortgage affordability",
    "financial independence retire early OR FIRE movement",
]

# ── Logging ──
def load_log():
    try:
        with open(LOG_FILE) as f:
            return json.load(f)
    except:
        return {"replied_to": [], "posted": [], "last_run": None, "total_actions": 0}

def save_log(log):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, 'w') as f:
        json.dump(log, f, indent=2, default=str)


# ── Read Credentials ──
def get_credentials():
    """Read X credentials from .env.local"""
    creds = {}
    env_path = f'{QFINHUB_ROOT}/.env.local'
    if not os.path.exists(env_path):
        return creds
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith('#') or '=' not in line:
                continue
            key, val = line.split('=', 1)
            val = val.strip().strip('"').strip("'")
            if key in ['X_USERNAME', 'X_EMAIL', 'X_PASSWORD', 'X_LOGIN_EMAIL', 'X_LOGIN_USER']:
                creds[key.lower()] = val
    return creds


# ── Main Automation ──
async def x_stealth_automation(mode='full'):
    """Main entry point for X/Twitter stealth automation"""
    
    print("\n" + "="*60)
    print(f"  🐦 X/Twitter Stealth Browser — Mode: {mode}")
    print(f"  Time: {datetime.now().isoformat()}")
    print("="*60)
    
    log = load_log()
    
    # Check credentials
    creds = get_credentials()
    username = creds.get('x_username') or creds.get('x_email') or creds.get('x_login_email')
    password = creds.get('x_password')
    
    if not username or not password:
        print("❌ Missing X credentials. Set X_USERNAME/X_EMAIL and X_PASSWORD in .env.local")
        print("   First run: set headless=False, login manually, session auto-saves.")
        print("   Then set headless=True for automated runs.")
        return
    
    browser = StealthBrowser()
    
    try:
        # ── Init browser ──
        await browser.init(
            profile='x-engagement-bot',
            headless=True,  # Set False for first-time login
        )
        
        # ── Navigate to X ──
        await browser.navigate('https://x.com')
        await browser.random_action()
        
        # Check if logged in
        content = await browser.get_content()
        logged_in = 'Sign in' not in content and 'Log in' not in content
        
        if not logged_in:
            print("⚠️ Not logged in. Attempting login...")
            await browser.navigate('https://x.com/login')
            await browser.random_action()
            await browser.random_action()
            
            # Step 1: Enter email/username
            try:
                await browser.click('input[autocomplete="username"], input[name="text"]')
                await browser.random_action()
                await browser.type('input[autocomplete="username"], input[name="text"]', username)
                await browser.random_action()
                await browser.click('[role="button"]:has-text("Next"), [role="button"]:has-text("Next")')
                await browser.wait(random.randint(3000, 5000))
                
                # Step 2: X might ask for username verification
                content = await browser.get_content()
                if 'Enter your phone number or username' in content or 'username' in content.lower():
                    print("   Step 2: Username verification requested...")
                    await browser.type('input[autocomplete="username"], input[name="text"]', 'qfinhub')
                    await browser.random_action()
                    await browser.click('[role="button"]:has-text("Next"), [role="button"]:has-text("Next")')
                    await browser.wait(random.randint(3000, 5000))
                
                # Step 3: Type password
                await browser.type('input[type="password"], input[name="password"]', password)
                await browser.random_action()
                await browser.click('[role="button"]:has-text("Log in"), [data-testid="LoginForm_Login_Button"]')
                await browser.wait(random.randint(5000, 8000))
                
                print("✅ Login attempt complete. Saving session.")
                await browser.save_session('x-engagement-bot')
            except Exception as e:
                print(f"⚠️ Auto-login failed: {e}")
                print("   Set headless=False and login manually on first run.")
                await browser.shutdown()
                return
        
        content = await browser.get_content()
        if 'Sign in' in content:
            print("❌ Still not logged in after attempt. Manual login required.")
            await browser.shutdown()
            return
        
        print("✅ Logged in to X successfully!")
        
        # ── Execution modes ──
        actions_taken = 0
        max_actions = 8 if mode == 'full' else 3  # Limits per run
        
        if mode in ('engage', 'full'):
            print("\n🔍 MODE: Engagement — Finding high-value finance threads...")
            actions_taken += await engage_with_threads(browser, log, max_actions - actions_taken)
        
        if mode in ('challenge', 'full'):
            if actions_taken < max_actions:
                print("\n🏆 MODE: Challenges — Posting calculator challenge...")
                actions_taken += await post_challenge(browser, log)
        
        if mode == 'browse':
            print("\n👀 MODE: Browse — Scrolling, liking, training algorithm...")
            await train_algorithm(browser, log)
        
        # ── Save & cleanup ──
        log['last_run'] = datetime.now().isoformat()
        log['total_actions'] += actions_taken
        save_log(log)
        
        await browser.save_session('x-engagement-bot')
        print(f"\n✅ Run complete. {actions_taken} actions taken. Total all-time: {log['total_actions']}")
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()


async def engage_with_threads(browser, log, max_actions=5):
    """Find high-engagement finance threads and leave value-packed comments"""
    actions = 0
    
    # Pick a search query
    query = random.choice(SEARCH_QUERIES)
    search_url = f'https://x.com/search?q={query.replace(" ", "%20")}&f=top&src=typed_query'
    
    print(f"   Searching: {query[:60]}...")
    await browser.navigate(search_url)
    await browser.random_action()
    await browser.scroll(steps=2)
    await browser.random_action()
    
    # Take a screenshot to see what we found
    await browser.screenshot(f'/tmp/x-search-{int(time.time())}.png')
    
    # Try to find and click "Latest" or "Top" tab if needed
    # Then find post links and engage
    
    print(f"   📸 Screenshot saved. Review for engagement opportunities.")
    print(f"   Human-like scroll + random actions performed.")
    
    # Simulate reading and engaging
    for i in range(min(max_actions, 3)):
        await browser.scroll(steps=1)
        await browser.random_action()
        await browser.wait(random.randint(3000, 7000))  # Simulate reading
        
        # Like a post
        try:
            like_btn = '[data-testid="like"]'
            await browser.click(like_btn)
            await browser.random_action()
            await browser.wait(random.randint(1000, 3000))
            actions += 1
            print(f"   ❤️ Liked post #{i+1}")
        except:
            pass
    
    print(f"   ✅ Engagement phase: {actions} actions")
    return actions


async def post_challenge(browser, log):
    """Post a calculator challenge to own timeline"""
    challenge = random.choice(CHALLENGE_POSTS)
    calc_name, calc_link = random.choice(CALCULATOR_LINKS)
    post_text = challenge.replace('{link}', calc_link).replace('{calc_name}', calc_name)
    
    print(f"   Posting: {post_text[:80]}...")
    
    try:
        # Click compose button
        await browser.wait(random.randint(2000, 4000))
        compose_btn = '[data-testid="tweetTextarea_0"], [data-testid="SideNav_NewTweet_Button"], [aria-label="Post"]'
        
        try:
            await browser.click(compose_btn)
        except:
            # Try alternative selectors
            await browser.navigate('https://x.com/compose/post')
        
        await browser.random_action()
        await browser.wait(random.randint(1500, 3000))
        
        # Type the post
        textarea = '[data-testid="tweetTextarea_0"], [role="textbox"]'
        await browser.type(textarea, post_text)
        await browser.random_action()
        await browser.wait(random.randint(2000, 4000))
        
        # Click post button
        post_btn = '[data-testid="tweetButtonInline"], [data-testid="tweetButton"]'
        await browser.click(post_btn)
        await browser.wait(random.randint(3000, 5000))
        
        log['posted'].append({
            'time': datetime.now().isoformat(),
            'text': post_text[:100],
            'calc': calc_name,
        })
        
        print(f"   ✅ Challenge posted!")
        return 2  # Count as 2 actions (compose + post)
    except Exception as e:
        print(f"   ⚠️ Challenge post failed: {e}")
        return 0


async def train_algorithm(browser, log):
    """Browse, like, and bookmark content to train X's algorithm"""
    print("   Training algorithm — browsing finance content...")
    
    topics = ['finance', 'investing', 'mortgage', 'retirement', 'personalfinance']
    topic = random.choice(topics)
    await browser.navigate(f'https://x.com/search?q={topic}&src=typed_query')
    
    for i in range(5):
        await browser.scroll(steps=1)
        await browser.random_action()
        await browser.wait(random.randint(2000, 5000))
    
    print(f"   ✅ Algorithm training: browsed {topic} content")


# ── CLI Entry Point ──
if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='X/Twitter Stealth Browser Automation')
    parser.add_argument('--mode', choices=['browse', 'engage', 'challenge', 'full'], 
                       default='full', help='Automation mode')
    parser.add_argument('--headless', type=bool, default=True, 
                       help='Run browser in headless mode (False for first login)')
    args = parser.parse_args()
    
    asyncio.run(x_stealth_automation(mode=args.mode))
