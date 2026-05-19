#!/usr/bin/env python3
"""
X/Twitter Login Test — Step-by-step with screenshots
Uses evaluate() pattern for React-controlled inputs (proven working May 19, 2026)
"""
import sys, os, asyncio, time
from datetime import datetime

sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QFINHUB_ROOT = '/home/admin1/qfinhub'
SCREENSHOT_DIR = '/tmp/x-login-test'

os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def get_credentials():
    """Read X credentials from .env.local"""
    creds = {}
    env_path = f'{QFINHUB_ROOT}/.env.local'
    with open(env_path) as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                v = v.strip().strip('"').strip("'")
                if k == 'X_EMAIL':
                    creds['email'] = v
                elif k == 'X_PASSWORD':
                    creds['password'] = v
                elif k == 'X_USERNAME':
                    creds['username'] = v
    return creds

async def test_login():
    creds = get_credentials()
    print(f"Credentials found: email={'***' if creds.get('email') else 'MISSING'}, "
          f"password={'***' if creds.get('password') else 'MISSING'}, "
          f"username={creds.get('username', 'MISSING')}")
    
    if not creds.get('email') or not creds.get('password'):
        print("❌ Missing credentials!")
        return
    
    browser = StealthBrowser()
    
    try:
        # Init browser — headless=False so we can see
        print("\n🚀 Starting browser (headless=False)...")
        await browser.init(profile='x-login-test', headless=False)
        
        # Step 1: Navigate to login page
        print("\n📱 Step 1: Navigating to x.com/login...")
        await browser.navigate('https://x.com/login')
        await browser.wait(4000)
        await browser.screenshot(f'{SCREENSHOT_DIR}/01-login-page.png')
        print("   📸 Screenshot: 01-login-page.png")
        
        # Step 2: Enter email via evaluate()
        print(f"\n📧 Step 2: Entering email via evaluate()...")
        await browser.evaluate(f'''
            const el = document.querySelector('input[name="text"]');
            if (el) {{
                el.focus();
                el.value = '{creds["email"]}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        ''')
        await browser.wait(2000)
        await browser.screenshot(f'{SCREENSHOT_DIR}/02-email-entered.png')
        print("   📸 Screenshot: 02-email-entered.png")
        
        # Step 3: Click Next button via evaluate()
        print("\n🔘 Step 3: Clicking 'Next'...")
        await browser.evaluate('''
            const btn = [...document.querySelectorAll('[role="button"]')]
                .find(b => b.textContent.includes('Next'));
            if (btn) btn.click();
            else console.log('NO NEXT BUTTON FOUND');
        ''')
        await browser.wait(6000)
        await browser.screenshot(f'{SCREENSHOT_DIR}/03-after-next.png')
        print("   📸 Screenshot: 03-after-next.png")
        
        # Step 4: Check page state — password or username verification?
        print("\n🔍 Step 4: Checking page state...")
        html = await browser.get_html()
        page_text = await browser.get_content()
        
        if 'Enter your phone number or username' in page_text or \
           ('username' in html.lower() and 'password' not in html.lower()):
            print("   ⚠️ Username verification requested!")
            await browser.evaluate(f'''
                const el = document.querySelector('input[name="text"]');
                if (el) {{
                    el.value = '{creds.get("username", "qfinhub")}';
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
                const btn = [...document.querySelectorAll('[role="button"]')]
                    .find(b => b.textContent.includes('Next'));
                if (btn) btn.click();
            ''')
            await browser.wait(5000)
            await browser.screenshot(f'{SCREENSHOT_DIR}/04a-username-verification.png')
            print("   📸 Screenshot: 04a-username-verification.png")
        
        # Step 5: Enter password via evaluate()
        print(f"\n🔑 Step 5: Entering password via evaluate()...")
        await browser.evaluate(f'''
            const pw = document.querySelector('input[type="password"]');
            if (pw) {{
                pw.focus();
                pw.value = '{creds["password"]}';
                pw.dispatchEvent(new Event('input', {{ bubbles: true }}));
                pw.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }} else {{
                console.log('NO PASSWORD FIELD FOUND');
                console.log('Available inputs:', 
                    [...document.querySelectorAll('input')].map(i => ({{
                        type: i.type, name: i.name, placeholder: i.placeholder
                    }})));
            }}
        ''')
        await browser.wait(2000)
        await browser.screenshot(f'{SCREENSHOT_DIR}/05-password-entered.png')
        print("   📸 Screenshot: 05-password-entered.png")
        
        # Step 6: Click "Log in" button
        print("\n🔓 Step 6: Clicking 'Log in'...")
        await browser.evaluate('''
            const loginBtn = [...document.querySelectorAll('[role="button"]')]
                .find(b => b.textContent.includes('Log in') || b.textContent.includes('Sign in'));
            if (loginBtn) {{
                loginBtn.click();
                console.log('LOGIN BUTTON CLICKED');
            }} else {{
                console.log('NO LOGIN BUTTON FOUND');
                console.log('All buttons:', [...document.querySelectorAll('[role="button"]')].map(b => b.textContent));
            }}
        ''')
        await browser.wait(8000)
        await browser.screenshot(f'{SCREENSHOT_DIR}/06-after-login-click.png')
        print("   📸 Screenshot: 06-after-login-click.png")
        
        # Step 7: Verify login by navigating to home
        print("\n✅ Step 7: Verifying login (navigating to /home)...")
        await browser.navigate('https://x.com/home')
        await browser.wait(4000)
        await browser.screenshot(f'{SCREENSHOT_DIR}/07-home-page.png')
        print("   📸 Screenshot: 07-home-page.png")
        
        content = await browser.get_content()
        logged_in = 'Home' in content or 'Timeline' in content
        
        if logged_in:
            print("\n🎉 LOGIN SUCCESS! Session saved.")
            await browser.save_session('x-engagement-bot')
        else:
            print("\n❌ LOGIN FAILED after all steps.")
            # Check what page we're on
            url = await browser.get_url()
            print(f"   Current URL: {url}")
            print(f"   Page content preview: {content[:300]}")
        
        # Final screenshot
        await browser.screenshot(f'{SCREENSHOT_DIR}/08-final-state.png')
        print(f"\n📁 All screenshots saved to: {SCREENSHOT_DIR}/")
        print(f"   Files: {', '.join(sorted(os.listdir(SCREENSHOT_DIR)))}")
        
    except Exception as e:
        print(f"\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        try:
            await browser.screenshot(f'{SCREENSHOT_DIR}/99-error.png')
        except:
            pass
    finally:
        print("\n🧹 Shutting down browser...")
        await browser.shutdown()

if __name__ == '__main__':
    asyncio.run(test_login())
