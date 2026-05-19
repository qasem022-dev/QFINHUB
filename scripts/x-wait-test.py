#!/usr/bin/env python3
"""X Login — Minimal intervention: click Next once, then WAIT"""
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
    return creds

async def test():
    creds = get_credentials()
    browser = StealthBrowser()
    
    try:
        await browser.init(profile='x-wait', headless=False)
        page = browser._page_obj
        
        # Track API
        api_events = []
        page.on('response', lambda r: (
            asyncio.ensure_future(_log(r, api_events))
            if 'onboarding/task.json' in r.url else None
        ))
        
        # Load login
        print("📍 Loading login page...")
        await page.goto('https://x.com/i/flow/login', wait_until='domcontentloaded')
        
        # Wait for form
        for i in range(15):
            await browser.wait(2000)
            has_input = await page.evaluate("""
                var el = document.querySelector('input[name="text"]');
                !!(el && el.offsetParent !== null);
            """)
            if has_input:
                print(f"✅ Form rendered at {(i+1)*2}s")
                break
        
        # Type email once
        print("⌨️  Typing email...")
        await browser.type('input[name="text"]', creds['email'])
        await browser.wait(1000)
        
        # Click Next ONCE
        print("👆 Clicking Next...")
        await browser.click('[role="button"]:has-text("Next")')
        
        # Now WAIT — monitor what happens for 60 seconds
        print("⏳ Waiting 60s for X.com to auto-advance...")
        for i in range(30):
            await browser.wait(2000)
            
            # Check state every 2 seconds
            inputs = await page.evaluate("""
                var all = document.querySelectorAll('input');
                var result = [];
                for (var j = 0; j < all.length; j++) {
                    if (all[j].offsetParent !== null) {
                        result.push({type: all[j].type, name: all[j].name});
                    }
                }
                JSON.stringify(result);
            """)
            
            parsed = json.loads(inputs)
            pw = any(inp['type'] == 'password' for inp in parsed)
            txt = any(inp.get('name') == 'text' for inp in parsed)
            url = page.url
            
            if pw:
                print(f"  [{i*2}s] 🔑 PASSWORD FIELD APPEARED!")
                break
            elif not txt and 'home' in url:
                print(f"  [{i*2}s] 🏠 Redirected to home!")
                break
            elif (i+1) % 5 == 0:
                print(f"  [{i*2}s] Still on text input. URL: {url[-40:]}")
        
        # Check final state
        print(f"\n📊 Final state:")
        inputs = await page.evaluate("""
            var all = document.querySelectorAll('input');
            var result = [];
            for (var j = 0; j < all.length; j++) {
                if (all[j].offsetParent !== null) {
                    result.push({type: all[j].type, name: all[j].name});
                }
            }
            JSON.stringify(result);
        """)
        print(f"   Inputs: {inputs}")
        print(f"   URL: {page.url}")
        
        # API trail
        print(f"\n📋 API events:")
        for e in api_events:
            print(f"   [{e['time']:.0f}s] {e['status']} subtasks={e.get('subs', [])} errors={e.get('errors', [])}")
        
        # Try to log in if password present
        parsed = json.loads(inputs)
        if any(inp['type'] == 'password' for inp in parsed):
            print("\n🔑 Entering password...")
            await browser.type('input[type="password"]', creds['password'])
            await browser.wait(1000)
            await browser.click('[role="button"]:has-text("Log in")')
            await browser.wait(10000)
            
            await page.goto('https://x.com/home', wait_until='domcontentloaded')
            await browser.wait(5000)
            content = await page.evaluate("document.body ? document.body.innerText : ''")
            if 'Home' in content or 'Timeline' in content:
                print("🎉 LOGGED IN!")
                await browser.save_session('x-engagement-bot')
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()

_start_time = 0
async def _log(resp, storage):
    global _start_time
    if not _start_time:
        _start_time = asyncio.get_event_loop().time()
    try:
        body = await resp.text()
        data = json.loads(body)
        storage.append({
            'time': asyncio.get_event_loop().time() - _start_time,
            'status': resp.status,
            'subs': [s.get('subtask_id','?')[:25] for s in data.get('subtasks',[])],
            'errors': [e.get('code') for e in data.get('errors',[])],
        })
    except:
        pass

asyncio.run(test())
