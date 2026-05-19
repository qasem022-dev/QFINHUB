#!/usr/bin/env python3
"""X Login v11 — Intercept request bodies to see what's being sent"""
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
        await browser.init(profile='x-v11', headless=False)
        page = browser._page_obj
        
        # Intercept requests to log full details
        async def log_request(req):
            if 'onboarding' in req.url or 'login' in req.url or 'auth' in req.url:
                print(f'\n  [REQ] {req.method} {req.url}')
                print(f'  Headers: {dict(req.headers)}')
                try:
                    post_data = req.post_data
                    if post_data:
                        print(f'  Body: {post_data[:500]}')
                except:
                    print(f'  Body: <unavailable>')
        
        async def log_response(resp):
            if 'onboarding' in resp.url or 'login' in resp.url or 'auth' in resp.url:
                print(f'  [RESP {resp.status}] {resp.url}')
                try:
                    body = await resp.text()
                    print(f'  Response body: {body[:500]}')
                except:
                    print(f'  Response body: <unavailable>')
        
        page.on('request', lambda req: asyncio.ensure_future(log_request(req)))
        page.on('response', lambda resp: asyncio.ensure_future(log_response(resp)))
        
        # ── Navigate ──
        print("=== Navigate to i/flow/login ===")
        await browser.navigate('https://x.com/i/flow/login')
        await page.wait_for_timeout(5000)
        
        # ── Type email ──
        print("\n=== Type email ===")
        await page.locator('input[name="text"]').click()
        await page.wait_for_timeout(500)
        await page.keyboard.type(creds['email'], delay=80)
        await page.wait_for_timeout(1500)
        
        # ── Press Enter ──
        print("\n=== Press Enter ===")
        await page.keyboard.press('Enter')
        await page.wait_for_timeout(8000)
        
        url = await browser.get_url()
        print(f"\n=== After submit ===")
        print(f"URL: {url}")
        
        body = await page.locator('body').inner_text()
        
        # Check for error messages
        if 'Sorry' in body:
            error_line = [l for l in body.split('\n') if 'Sorry' in l or 'wrong' in l.lower() or 'exist' in l.lower()]
            print(f"Error: {error_line}")
        
        if 'Enter your password' in body:
            print("✅ REACHED PASSWORD PAGE!")
        elif 'Enter your phone number or username' in body:
            print("⚠️ Username verification page")
        else:
            print(f"Body: {body[:300]}")
        
        await page.wait_for_timeout(2000)  # Wait for any late responses
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()

asyncio.run(test())
