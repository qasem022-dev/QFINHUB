#!/usr/bin/env python3
"""
Post-NOW: Post 5 finance tweets via stealth browser immediately.
Each tweet has a hook, value prop, and calculator link.
"""

import sys, os, asyncio, json, time, random
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QFINHUB_ROOT = '/home/admin1/qfinhub'
LOG_FILE = f'{QFINHUB_ROOT}/.x-data-v2/stealth-post-log.json'

# ── 5 Tweets to post NOW ──
TWEETS = [
    {
        "text": "Checking mortgage rates? Rates are fluctuating daily — a 0.5% difference can cost you $30K+ over the life of your loan. Run the numbers before you lock in.",
        "link": "https://qfinhub.com/calculators/mortgage-calculator",
        "calc": "Mortgage Calculator",
    },
    {
        "text": "How much will compound interest actually earn you? The math is surprising. $500/month at 7% for 30 years = over $600K. See your number in seconds.",
        "link": "https://qfinhub.com/calculators/compound-interest",
        "calc": "Compound Interest Calculator",
    },
    {
        "text": "Do you know your 2025 tax bracket? Marginal rates changed this year — you might owe less (or more) than you think. Free calculator, no sign-up needed.",
        "link": "https://qfinhub.com/calculators/tax-calculator",
        "calc": "Tax Calculator",
    },
    {
        "text": "Credit card debt is expensive. Average APR is over 22% right now. Use our free payoff calculator to see exactly when you'll be debt-free — and how much you'll save by paying extra.",
        "link": "https://qfinhub.com/calculators/credit-card-payoff",
        "calc": "Credit Card Payoff Calculator",
    },
    {
        "text": "Are you on track for retirement? Most Americans aren't. The 4% rule says you need 25x your annual expenses saved. Run your retirement number now — it takes 30 seconds.",
        "link": "https://qfinhub.com/calculators/retirement-planning",
        "calc": "Retirement Calculator",
    },
]

def load_log():
    try:
        with open(LOG_FILE) as f:
            return json.load(f)
    except:
        return {"posts": [], "last_run": None}

def save_log(log):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, 'w') as f:
        json.dump(log, f, indent=2, default=str)

def get_credentials():
    creds = {}
    env_path = f'{QFINHUB_ROOT}/.env.local'
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

async def login_to_x(browser, creds):
    """Login to X and return True if successful."""
    username = creds.get('x_username') or creds.get('x_email') or creds.get('x_login_email')
    password = creds.get('x_password')

    if not username or not password:
        print("❌ Missing X credentials")
        return False

    await browser.navigate('https://x.com')
    await browser.random_action()
    await browser.wait(2000)

    content = await browser.get_content()
    if 'Sign in' not in content and 'Log in' not in content:
        print("✅ Already logged in")
        return True

    print("⚠️ Logging in via homepage...")

    try:
        # Step 1: Click "Sign in" on the homepage
        signin_selectors = [
            'a[href="/login"]',
            '[data-testid="loginButton"]',
            'a:has-text("Sign in")',
            'span:has-text("Sign in")',
        ]
        clicked = False
        for sel in signin_selectors:
            try:
                await browser.click(sel)
                clicked = True
                print(f"   Clicked sign-in: {sel}")
                break
            except:
                continue

        if not clicked:
            # Fallback: navigate directly
            await browser.navigate('https://x.com/login')

        await browser.wait(random.randint(3000, 5000))
        await browser.screenshot('/tmp/x-login-step1.png')

        # Step 2: Enter email/username (X uses a two-step flow)
        # Try multiple input selectors
        input_selectors = [
            'input[autocomplete="username"]',
            'input[name="text"]',
            'input[type="text"]',
            'input[type="email"]',
            'input',
        ]
        for sel in input_selectors:
            try:
                await browser.click(sel)
                await browser.random_action()
                await browser.type(sel, username)
                print(f"   Entered username in: {sel}")
                break
            except:
                continue

        await browser.random_action()
        await browser.wait(1000)

        # Step 3: Click Next/Advance button
        next_selectors = [
            '[role="button"]:has-text("Next")',
            'button:has-text("Next")',
            'span:has-text("Next")',
            '[data-testid="ocfEnterTextNextButton"]',
        ]
        for sel in next_selectors:
            try:
                await browser.click(sel)
                print(f"   Clicked next: {sel}")
                break
            except:
                continue

        await browser.wait(random.randint(3000, 5000))
        await browser.screenshot('/tmp/x-login-step2.png')

        # Step 4: Check for username verification
        content = await browser.get_content()
        if 'Enter your phone number or username' in content or 'verify' in content.lower():
            print("   Username verification requested...")
            for sel in input_selectors:
                try:
                    await browser.click(sel)
                    await browser.random_action()
                    await browser.type(sel, 'qfinhub')
                    break
                except:
                    continue
            await browser.random_action()
            for sel in next_selectors:
                try:
                    await browser.click(sel)
                    break
                except:
                    continue
            await browser.wait(random.randint(3000, 5000))

        # Step 5: Enter password
        pwd_selectors = [
            'input[type="password"]',
            'input[name="password"]',
            'input[autocomplete="current-password"]',
        ]
        for sel in pwd_selectors:
            try:
                await browser.click(sel)
                await browser.random_action()
                await browser.type(sel, password)
                print(f"   Entered password in: {sel}")
                break
            except:
                continue

        await browser.random_action()
        await browser.wait(1000)

        # Step 6: Click Log in
        login_selectors = [
            '[role="button"]:has-text("Log in")',
            '[data-testid="LoginForm_Login_Button"]',
            'button:has-text("Log in")',
        ]
        for sel in login_selectors:
            try:
                await browser.click(sel)
                print(f"   Clicked login: {sel}")
                break
            except:
                continue

        await browser.wait(random.randint(5000, 8000))
        await browser.screenshot('/tmp/x-login-step3.png')

        await browser.save_session('x-engagement-bot')
        content = await browser.get_content()
        if 'Sign in' in content or 'Log in' in content:
            print("❌ Login failed — check screenshots in /tmp/x-login-*.png")
            return False
        print("✅ Login successful!")
        return True
    except Exception as e:
        print(f"❌ Login error: {e}")
        import traceback
        traceback.print_exc()
        return False

async def post_tweet(browser, tweet_text, link, calc_name):
    """Post a single tweet and return True on success."""
    full_text = f"{tweet_text}\n\n{link}"
    
    print(f"\n📝 Posting ({calc_name}): {tweet_text[:80]}...")

    try:
        await browser.wait(random.randint(2000, 4000))
        
        # Try multiple compose approaches
        compose_worked = False
        compose_selectors = [
            '[data-testid="SideNav_NewTweet_Button"]',
            '[aria-label="Post"]',
            'a[href="/compose/post"]',
        ]
        
        for sel in compose_selectors:
            try:
                await browser.click(sel)
                compose_worked = True
                break
            except:
                continue
        
        if not compose_worked:
            await browser.navigate('https://x.com/compose/post')
        
        await browser.random_action()
        await browser.wait(random.randint(2000, 3500))

        # Type the tweet
        textarea_selectors = [
            '[data-testid="tweetTextarea_0"]',
            '[role="textbox"]',
            '[contenteditable="true"]',
            'div[data-text="true"]',
        ]
        
        typed = False
        for sel in textarea_selectors:
            try:
                await browser.type(sel, full_text)
                typed = True
                break
            except:
                continue
        
        if not typed:
            print("   ⚠️ Could not find textarea")
            return False

        await browser.random_action()
        await browser.wait(random.randint(2000, 4000))

        # Click post
        post_selectors = [
            '[data-testid="tweetButtonInline"]',
            '[data-testid="tweetButton"]',
            '[role="button"]:has-text("Post")',
        ]
        
        posted = False
        for sel in post_selectors:
            try:
                await browser.click(sel)
                posted = True
                break
            except:
                continue
        
        if not posted:
            print("   ⚠️ Could not find post button")
            return False

        await browser.wait(random.randint(3000, 5000))
        print(f"   ✅ Posted: {calc_name}")
        return True

    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False

async def main():
    print("\n" + "=" * 60)
    print("  🐦 QFINHUB X/Twitter — Post 5 Finance Tweets NOW")
    print(f"  Time: {datetime.now().isoformat()}")
    print("=" * 60)

    creds = get_credentials()
    log = load_log()
    browser = StealthBrowser()

    try:
        await browser.init(profile='x-engagement-bot', headless=True)
        
        if not await login_to_x(browser, creds):
            await browser.shutdown()
            return

        posted_count = 0

        for i, tweet in enumerate(TWEETS):
            if posted_count >= 5:
                break

            success = await post_tweet(
                browser,
                tweet["text"],
                tweet["link"],
                tweet["calc"]
            )

            if success:
                log["posts"].append({
                    "time": datetime.now().isoformat(),
                    "calc": tweet["calc"],
                    "text": tweet["text"][:80],
                })
                posted_count += 1
            
            # Space out posts (45-90s)
            if i < len(TWEETS) - 1:
                delay = random.randint(45, 90)
                print(f"   ⏳ Waiting {delay}s before next tweet...")
                await browser.wait(delay * 1000)

        log["last_run"] = datetime.now().isoformat()
        save_log(log)
        await browser.save_session('x-engagement-bot')

        print(f"\n{'='*60}")
        print(f"  ✅ DONE! {posted_count}/5 tweets posted")
        print(f"  📊 Total all-time: {len(log['posts'])} posts")
        print(f"{'='*60}\n")

    except Exception as e:
        print(f"❌ Fatal: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()

if __name__ == '__main__':
    asyncio.run(main())
