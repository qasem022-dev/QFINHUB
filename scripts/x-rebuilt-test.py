#!/usr/bin/env python3
"""X Login v3 — Follow X.com's subtask chain (JS instrumentation → email → password)"""
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

async def test():
    creds = get_credentials()
    browser = StealthBrowser()
    
    try:
        await browser.init(profile='x-subtask-test', headless=False)
        page = browser._page_obj
        
        # Track the last task response
        last_task_response = {}
        
        async def capture_response(resp):
            if 'onboarding/task.json' in resp.url:
                try:
                    body = await resp.text()
                    data = json.loads(body)
                    last_task_response['data'] = data
                    print(f"\n📋 TASK RESPONSE: {json.dumps(data, indent=2)[:500]}")
                except:
                    pass
        
        page.on('response', lambda r: asyncio.ensure_future(capture_response(r)))
        
        # ── Step 1: Load login page ──
        print("1️⃣ Loading login page...")
        await browser.navigate('https://x.com/i/flow/login')
        await browser.wait(6000)
        
        # ── Step 2: Enter email ──
        print("2️⃣ Entering email...")
        await browser.type('input[name="text"]', creds['email'])
        await browser.wait(1000)
        
        # ── Step 3: Click Next and wait for subtask response ──
        print("3️⃣ Clicking Next...")
        await browser.click('[role="button"]:has-text("Next")')
        await browser.wait(3000)
        
        # Check what subtask we got
        await browser.wait(3000)  # Wait for response to arrive
        task_data = last_task_response.get('data', {})
        subtasks = task_data.get('subtasks', [])
        
        for sub in subtasks:
            sid = sub.get('subtask_id', '')
            print(f"   Subtask: {sid}")
            
            if 'LoginJsInstrumentationSubtask' in sid:
                # Need to load JS instrumentation URL
                js_url = sub.get('js_instrumentation', {}).get('url', '')
                if js_url:
                    print(f"   🔧 Loading JS instrumentation: {js_url}")
                    await browser.navigate(js_url)
                    await browser.wait(3000)
                    
                    # Now navigate back and re-submit
                    await browser.navigate('https://x.com/i/flow/login')
                    await browser.wait(4000)
                    await browser.type('input[name="text"]', creds['email'])
                    await browser.wait(1000)
                    await browser.click('[role="button"]:has-text("Next")')
                    await browser.wait(6000)
        
        # ── Step 4: Check page state after all subtasks ──
        print("\n4️⃣ Checking page state...")
        await browser.wait(5000)
        
        inputs = await browser.evaluate("""
            var all = document.querySelectorAll('input');
            var result = [];
            for (var i = 0; i < all.length; i++) {
                if (all[i].offsetParent !== null) {
                    result.push({type: all[i].type, name: all[i].name, autocomplete: all[i].autocomplete});
                }
            }
            JSON.stringify(result);
        """)
        print(f"   Visible inputs: {inputs}")
        
        parsed = json.loads(inputs)
        has_pw = any(inp['type'] == 'password' for inp in parsed)
        has_text = any(inp.get('name') == 'text' for inp in parsed)
        
        # ── Step 5: Handle password or retry ──
        if has_pw:
            print("\n5️⃣ Password page reached! Entering password...")
            await browser.type('input[type="password"]', creds['password'])
            await browser.wait(1000)
            await browser.click('[role="button"]:has-text("Log in")')
            await browser.wait(10000)
        elif has_text:
            print("\n5️⃣ Still on text input — trying one more time...")
            # Check latest task response
            task_data = last_task_response.get('data', {})
            sub_ids = [s.get('subtask_id', '') for s in task_data.get('subtasks', [])]
            print(f"   Current subtasks: {sub_ids}")
        else:
            print("\n5️⃣ Unknown state")
        
        # ── Final verification ──
        print("\n🔍 Verifying...")
        await browser.navigate('https://x.com/home')
        await browser.wait(5000)
        content = await browser.get_content()
        
        if 'Home' in content or 'Timeline' in content or 'Following' in content:
            print("🎉 LOGIN SUCCESSFUL!")
            await browser.save_session('x-engagement-bot')
        else:
            print(f"❌ Not logged in. Page: {content[:200]}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()

asyncio.run(test())
