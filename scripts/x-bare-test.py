#!/usr/bin/env python3
"""X Login Bare Playwright Test — No stealth patches, just raw Playwright"""
import asyncio
from playwright.async_api import async_playwright

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
    print(f"Email: {'*' * len(creds.get('email', ''))}, Username: {creds.get('username')}")
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        page = await browser.new_page()
        
        # Listen for console messages
        page.on('console', lambda msg: print(f'  [CONSOLE] {msg.type}: {msg.text}'))
        
        print("\n=== Navigate to x.com/login ===")
        await page.goto('https://x.com/login')
        await page.wait_for_timeout(5000)
        await page.screenshot(path='/tmp/x-bare-01-login.png')
        
        print(f"URL: {page.url}")
        
        # Type email
        print("\n=== Type email ===")
        await page.fill('input[name="text"]', creds['email'])
        await page.wait_for_timeout(2000)
        await page.screenshot(path='/tmp/x-bare-02-email.png')
        
        # Click Next
        print("=== Click Next ===")
        await page.click('div[role="button"]:has(span:has-text("Next"))')
        await page.wait_for_timeout(5000)
        await page.screenshot(path='/tmp/x-bare-03-after-next.png')
        
        print(f"URL after Next: {page.url}")
        
        # Check for password or username step
        pw_visible = await page.locator('input[type="password"]').is_visible()
        text_visible = await page.locator('input[name="text"]').is_visible()
        print(f"Password visible: {pw_visible}")
        print(f"Text input visible: {text_visible}")
        
        if text_visible and not pw_visible:
            print("=== Username step ===")
            await page.fill('input[name="text"]', creds.get('username', 'qfinhub'))
            await page.wait_for_timeout(1000)
            await page.click('div[role="button"]:has(span:has-text("Next"))')
            await page.wait_for_timeout(5000)
            await page.screenshot(path='/tmp/x-bare-04-after-username.png')
            print(f"URL: {page.url}")
        
        # Check password
        pw_visible = await page.locator('input[type="password"]').is_visible()
        if pw_visible:
            print("=== Enter password ===")
            await page.fill('input[type="password"]', creds['password'])
            await page.wait_for_timeout(1000)
            await page.screenshot(path='/tmp/x-bare-05-password.png')
            
            await page.click('div[role="button"]:has(span:has-text("Log in"))')
            await page.wait_for_timeout(8000)
            await page.screenshot(path='/tmp/x-bare-06-after-login.png')
        
        # Verify
        await page.goto('https://x.com/home')
        await page.wait_for_timeout(4000)
        await page.screenshot(path='/tmp/x-bare-07-home.png')
        
        content = await page.content()
        logged_in = 'Home' in content or 'Timeline' in content or 'Following' in content
        
        print(f"\n=== Result ===")
        print(f"URL: {page.url}")
        print(f"Logged in: {logged_in}")
        
        # Print page text
        text = await page.inner_text('body')
        print(f"Page text: {text[:300]}")
        
        await browser.close()

asyncio.run(test())
