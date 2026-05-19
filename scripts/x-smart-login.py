#!/usr/bin/env python3
"""
X.com Smart Login — Reacts to on-screen state, not API-driven.
Types email, clicks Next, waits for page changes, reacts to what appears.
Human-like: watches screen, decides what to do.
"""
import sys, os, asyncio, json, random

sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QFINHUB_ROOT = '/home/admin1/qfinhub'

def get_credentials():
    creds = {}
    with open(f'{QFINHUB_ROOT}/.env.local') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                v = v.strip().strip('"').strip("'")
                if k == 'X_EMAIL': creds['email'] = v
                elif k == 'X_PASSWORD': creds['password'] = v
                elif k == 'X_USERNAME': creds['username'] = v
    return creds

async def read_screen(page):
    """What does the human see right now?"""
    visible_inputs = await page.evaluate("""
        var all = document.querySelectorAll('input');
        var result = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].offsetParent !== null) {
                result.push({
                    type: all[i].type, 
                    name: all[i].name,
                    autocomplete: all[i].autocomplete,
                    placeholder: all[i].placeholder || ''
                });
            }
        }
        JSON.stringify(result);
    """)
    
    visible_buttons = await page.evaluate("""
        var all = document.querySelectorAll('[role="button"]');
        var result = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].offsetParent !== null) {
                var txt = all[i].textContent.trim();
                if (txt) result.push(txt.substring(0, 40));
            }
        }
        JSON.stringify(result);
    """)
    
    body = await page.evaluate("document.body ? document.body.innerText.substring(0, 500) : ''");
    
    return {
        'inputs': json.loads(visible_inputs),
        'buttons': json.loads(visible_buttons),
        'body': body,
        'url': page.url,
    }

async def wait_for_change(page, browser, check_fn, timeout_ms=15000, poll_ms=500):
    """Wait until check_fn returns truthy, polling the screen."""
    elapsed = 0
    while elapsed < timeout_ms:
        result = await check_fn(page)
        if result:
            return result
        await browser.wait(poll_ms)
        elapsed += poll_ms
    return None

async def smart_login():
    creds = get_credentials()
    browser = StealthBrowser()
    
    try:
        await browser.init(profile='x-smart-v2', headless=False)
        page = browser._page_obj
        
        # Track what X.com's API is saying (for debugging)
        api_responses = []
        page.on('response', lambda r: (
            asyncio.ensure_future(_capture_api(r, api_responses))
            if 'onboarding/task.json' in r.url else None
        ))
        
        # ── Load login page and WAIT for it to render ──
        print("📍 Loading login page...")
        await page.goto('https://x.com/i/flow/login', wait_until='domcontentloaded')
        
        # Wait for the form to actually render (React hydration)
        print("   Waiting for form to render...")
        for i in range(10):
            await browser.wait(2000)
            screen = await read_screen(page)
            if screen['inputs']:
                print(f"   ✅ Form rendered after {(i+1)*2}s")
                break
            print(f"   ⏳ Still loading... ({(i+1)*2}s)")
        
        print(f"   Inputs: {[i['name']+':'+i['type'] for i in screen['inputs']]}")
        print(f"   Buttons: {screen['buttons'][:5]}")
        
        # ── PHASE 1: Enter email ──
        print("\n📧 PHASE 1: Entering email...")
        
        screen = await read_screen(page)
        text_inputs = [i for i in screen['inputs'] if i['name'] == 'text']
        
        if text_inputs:
            print("   ⌨️  Typing email...")
            await browser.type('input[name="text"]', creds['email'])
            await browser.wait(random.randint(800, 1500))
            
            # Click Next ONCE
            if 'Next' in screen['buttons']:
                print("   👆 Clicking Next (first time)...")
                await browser.click('[role="button"]:has-text("Next")')
            else:
                await page.keyboard.press('Enter')
            
            # WAIT LONG for page to transition through subtasks
            print("   ⏳ Waiting for subtask chain to complete (15s)...")
            await browser.wait(15000)
        else:
            print("   ⚠️ No text input found on initial load")
        
        # ── PHASE 2: React to whatever appears ──
        print("\n🔍 PHASE 2: Reading screen state...")
        
        screen = await read_screen(page)
        pw_inputs = [i for i in screen['inputs'] if i['type'] == 'password']
        text_inputs = [i for i in screen['inputs'] if i['name'] == 'text']
        
        print(f"   Password inputs: {len(pw_inputs)}, Text inputs: {len(text_inputs)}")
        print(f"   URL: {screen['url'][:80]}")
        
        if pw_inputs:
            print("\n🔑 Password field found! Entering password...")
            await browser.type('input[type="password"]', creds['password'])
            await browser.wait(random.randint(800, 1500))
            
            if 'Log in' in screen['buttons']:
                await browser.click('[role="button"]:has-text("Log in")')
            else:
                await page.keyboard.press('Enter')
            
            print("   ⏳ Waiting for login to complete (15s)...")
            await browser.wait(15000)
        
        elif text_inputs:
            print("\n📧 Still on text input — entering email once more...")
            await browser.type('input[name="text"]', creds['email'])
            await browser.wait(1000)
            
            if 'Next' in screen['buttons']:
                await browser.click('[role="button"]:has-text("Next")')
            else:
                await page.keyboard.press('Enter')
            
            print("   ⏳ Waiting (10s)...")
            await browser.wait(10000)
            
            # Check again for password
            screen = await read_screen(page)
            pw_inputs = [i for i in screen['inputs'] if i['type'] == 'password']
            
            if pw_inputs:
                print("🔑 Password appeared! Entering...")
                await browser.type('input[type="password"]', creds['password'])
                await browser.wait(1000)
                await browser.click('[role="button"]:has-text("Log in")')
                await browser.wait(15000)
        
        else:
            print(f"   Body: {screen['body'][:200]}")
            # Check if we were redirected to home (logged in!)
            if 'x.com/home' in screen['url'] or 'Home' in screen['body']:
                print("   🎉 Might already be logged in!")
        
        # ── PHASE 3: Handle post-login challenges (2FA, etc.) ──
        screen = await read_screen(page)
        
        if 'code' in screen['body'].lower() or 'verify' in screen['body'].lower():
            print("\n🔐 2FA/Verification detected — manual intervention needed")
        elif 'unusual' in screen['body'].lower():
            print("\n⚠️ Unusual activity page detected")
        
        # ── Verify ──
        print("\n🔍 Verifying login...")
        await page.goto('https://x.com/home', wait_until='domcontentloaded')
        await browser.wait(5000)
        
        content = await page.evaluate("document.body ? document.body.innerText : ''")
        
        if 'Home' in content or 'Timeline' in content or 'Following' in content:
            print("🎉🎉🎉 LOGIN SUCCESSFUL! 🎉🎉🎉")
            await browser.save_session('x-engagement-bot')
            print("💾 Session saved as 'x-engagement-bot'")
            
            # Print API trail
            print(f"\n📋 API Responses ({len(api_responses)} calls):")
            for r in api_responses[-5:]:
                print(f"   {r.get('status')} subtasks={r.get('subtask_ids', [])}")
            
            return True
        else:
            print(f"❌ Not logged in")
            print(f"   URL: {page.url}")
            print(f"   Page: {content[:200]}")
            print(f"\n📋 API trail:")
            for r in api_responses:
                print(f"   {r.get('status')} subtasks={r.get('subtask_ids', [])}")
            return False
            
    except Exception as e:
        print(f"💥 Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await browser.shutdown()

async def _capture_api(resp, storage):
    try:
        body = await resp.text()
        data = json.loads(body)
        storage.append({
            'status': resp.status,
            'subtask_ids': [s.get('subtask_id', '?')[:30] for s in data.get('subtasks', [])],
            'errors': [e.get('code') for e in data.get('errors', [])],
        })
    except:
        pass

if __name__ == '__main__':
    result = asyncio.run(smart_login())
    sys.exit(0 if result else 1)
