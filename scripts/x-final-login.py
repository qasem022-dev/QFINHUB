#!/usr/bin/env python3
"""X Login — Fresh profile, subtask-aware, persistent retry with human timing"""
import sys, os, asyncio, json, random, time

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

async def login():
    creds = get_credentials()
    
    # Fresh unique profile every time
    profile = f'x-fresh-{int(time.time())}'
    
    browser = StealthBrowser()
    
    try:
        await browser.init(profile=profile, headless=False)
        page = browser._page_obj
        
        # Track responses
        task_responses = []
        async def on_resp(r):
            if 'onboarding/task.json' in r.url:
                try:
                    body = await r.text()
                    data = json.loads(body)
                    task_responses.append({
                        'status': r.status,
                        'subs': [s.get('subtask_id','') for s in data.get('subtasks',[])],
                        'errors': [e.get('code') for e in data.get('errors',[])],
                        'token': data.get('flow_token','')[-20:],
                    })
                except:
                    pass
        page.on('response', lambda r: asyncio.ensure_future(on_resp(r)))
        
        # ── Load login and wait for form ──
        print("📍 Loading login page...")
        await page.goto('https://x.com/i/flow/login', wait_until='domcontentloaded')
        
        for i in range(20):
            await asyncio.sleep(1.5)
            has_input = await page.evaluate("""
                var el = document.querySelector('input[name="text"]');
                !!(el && el.offsetParent !== null);
            """)
            if has_input:
                print(f"   ✅ Form rendered at {int((i+1)*1.5)}s")
                break
        else:
            print("   ❌ Form never rendered")
            body = await page.evaluate("document.body ? document.body.innerText : ''")
            print(f"   Page: {body[:200]}")
            return False
        
        # ── Type email and click Next ONCE ──
        print("⌨️  Typing email...")
        await browser.type('input[name="text"]', creds['email'])
        await asyncio.sleep(random.uniform(0.8, 1.5))
        
        print("👆 Clicking Next...")
        await browser.click('[role="button"]:has-text("Next")')
        
        # ── Wait for subtask chain and REACT to what appears ──
        print("⏳ Monitoring subtask chain...")
        
        password_found = False
        last_text_entry = 0  # Track when we last typed
        
        for i in range(30):
            await asyncio.sleep(1.5)
            
            # Check inputs
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
            has_pw = any(inp['type'] == 'password' for inp in parsed)
            has_txt = any(inp.get('name') == 'text' for inp in parsed)
            
            if has_pw:
                print(f"   [{int(i*1.5)}s] 🔑 PASSWORD FIELD!")
                password_found = True
                break
            
            # If text input visible and we got a 200 response, ENTER EMAIL AGAIN
            # X.com's LoginEnterUserIdentifierSSO means "enter your identifier now"
            if has_txt:
                last_resp = task_responses[-1] if task_responses else None
                last_status = last_resp['status'] if last_resp else 0
                
                # Enter email if: we got a successful response AND haven't typed in last 5s
                if last_status == 200 and (i - last_text_entry) > 3:
                    print(f"   [{int(i*1.5)}s] 📧 LoginEnterUserIdentifierSSO — re-entering email...")
                    await browser.type('input[name="text"]', creds['email'])
                    await asyncio.sleep(random.uniform(0.5, 1.0))
                    
                    # Click Next again
                    print(f"   [{int(i*1.5)}s] 👆 Clicking Next...")
                    try:
                        await browser.click('[role="button"]:has-text("Next")')
                    except:
                        await page.keyboard.press('Enter')
                    
                    last_text_entry = i
                    await asyncio.sleep(3)  # Let the response arrive
        
        # ── Enter password if found ──
        if password_found:
            print("\n🔑 Entering password...")
            await browser.type('input[type="password"]', creds['password'])
            await asyncio.sleep(random.uniform(0.8, 1.5))
            
            print("👆 Clicking Log in...")
            try:
                await browser.click('[role="button"]:has-text("Log in")')
            except:
                await page.keyboard.press('Enter')
            
            await asyncio.sleep(12)
            
            # Verify
            await page.goto('https://x.com/home', wait_until='domcontentloaded')
            await asyncio.sleep(5)
            content = await page.evaluate("document.body ? document.body.innerText : ''")
            
            if 'Home' in content or 'Timeline' in content or 'Following' in content:
                print("\n🎉🎉🎉 LOGIN SUCCESSFUL! 🎉🎉🎉")
                await browser.save_session('x-engagement-bot')
                return True
            else:
                print(f"\n❌ Post-login page: {content[:150]}")
        else:
            print("\n❌ Password field never appeared")
            print(f"\n📋 Task response trail:")
            for r in task_responses:
                print(f"   {r['status']} subs={[s[:40] for s in r['subs']]} errors={r['errors']}")
        
        return False
        
    except Exception as e:
        print(f"💥 {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await browser.shutdown()

if __name__ == '__main__':
    result = asyncio.run(login())
    sys.exit(0 if result else 1)
