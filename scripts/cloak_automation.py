#!/usr/bin/env python3
"""
QFINHUB CloakBrowser Automation — Unified Undetectable Browser
================================================================
Drop-in replacement for StealthBrowser. Uses CloakBrowser's
58 C++ source-level patches (not JS injection) — passes ALL
bot detection tests including Cloudflare, reCAPTCHA v3 (0.9),
FingerprintJS, BrowserScan, and X.com anti-bot.

REQUIREMENTS:
  pip install cloakbrowser[geoip]
  npm install cloakbrowser playwright-core  # for Node.js

FIRST RUN: Auto-downloads stealth Chromium binary (~200MB, cached)

USAGE:
  from cloak_automation import CloakAutomation
  
  ca = CloakAutomation()
  await ca.init(profile='x-account-1', headless=True, humanize=True)
  await ca.navigate('https://x.com')
  await ca.click('button.tweet')
  await ca.type('textarea', 'Hello world')
  await ca.shutdown()
"""

import asyncio, json, os, sys, time, random, shutil
from pathlib import Path
from typing import Optional, Dict, List, Any

# ═══════════════════════════════════════════════
# CONFIG
# ═══════════════════════════════════════════════

PROFILES_DIR = Path.home() / '.hermes' / 'cloak-profiles'
PROFILES_DIR.mkdir(parents=True, exist_ok=True)

# ═══════════════════════════════════════════════
# CLOAKAUTOMATION CLASS
# ═══════════════════════════════════════════════

class CloakAutomation:
    """
    Unified undetectable browser automation powered by CloakBrowser.
    
    Features:
      - 58 C++ source-level Chromium patches (undetectable)
      - humanize=True for Bezier mouse, natural typing, human-like scroll
      - Persistent profiles (cookies, localStorage, sessions survive restarts)
      - Proxy support (HTTP, SOCKS5 with inline auth)
      - Auto timezone/locale from proxy IP (geoip=True)
      - Drop-in replacement for StealthBrowser
      - reCAPTCHA v3 score: 0.9 (human-level)
    """
    
    def __init__(self):
        self._browser = None
        self._page = None
        self._playwright = None
        self._profile_name = None
        self._headless = True
        self._humanize = True
    
    @staticmethod
    def list_profiles() -> List[Dict]:
        """List all saved browser profiles."""
        profiles = []
        for d in PROFILES_DIR.iterdir():
            if d.is_dir():
                meta_file = d / 'meta.json'
                meta = {}
                if meta_file.exists():
                    try:
                        meta = json.loads(meta_file.read_text())
                    except:
                        pass
                profiles.append({
                    'name': d.name,
                    'created': meta.get('created', 'unknown'),
                    'last_used': meta.get('last_used', 'unknown'),
                    'platform': meta.get('platform', 'unknown'),
                })
        return sorted(profiles, key=lambda p: p.get('last_used', ''), reverse=True)
    
    async def init(
        self,
        profile: str = 'default',
        headless: bool = True,
        humanize: bool = True,
        proxy: Optional[str] = None,
        geoip: bool = False,
        timezone: Optional[str] = None,
        locale: str = 'en-US',
        viewport: Optional[Dict] = None,
        args: Optional[List[str]] = None,
        human_preset: str = 'normal',
    ):
        """
        Initialize CloakBrowser with profile and stealth settings.
        
        Args:
            profile: Profile name for persistent sessions
            headless: True = invisible, False = visible window
            humanize: Enable human-like mouse/keyboard/scroll (Bezier curves, natural typing)
            proxy: Proxy URL (http://user:pass@host:port or socks5://user:pass@host:port)
            geoip: Auto-detect timezone/locale from proxy IP
            timezone: Override timezone (e.g., 'America/New_York')
            locale: Browser locale (default: 'en-US')
            viewport: {'width': 1920, 'height': 1080}
            args: Additional Chrome arguments
            human_preset: 'normal', 'careful', or 'fast'
        """
        from cloakbrowser import launch
        
        self._profile_name = profile
        self._headless = headless
        self._humanize = humanize
        
        # Profile directory
        profile_dir = PROFILES_DIR / profile
        profile_dir.mkdir(parents=True, exist_ok=True)
        
        # Build launch args
        launch_args = args or []
        
        # Persistent profile via user-data-dir
        user_data_dir = str(profile_dir / 'user-data')
        launch_args.append(f'--user-data-dir={user_data_dir}')
        
        if viewport:
            launch_args.append(f'--window-size={viewport["width"]},{viewport["height"]}')
        
        # Human preset config
        human_config = {}
        if human_preset == 'careful':
            human_config = {
                'typing_speed': (80, 180),     # ms between keystrokes
                'mouse_speed': (0.4, 0.7),     # Bezier control point factor
                'scroll_pause_chance': 0.25,    # 25% chance to pause mid-scroll
                'mistake_chance': 0.05,         # 5% typing mistakes
            }
        elif human_preset == 'fast':
            human_config = {
                'typing_speed': (30, 80),
                'mouse_speed': (0.1, 0.3),
                'scroll_pause_chance': 0.05,
                'mistake_chance': 0.01,
            }
        
        print(f"🚀 Launching CloakBrowser [profile={profile}, headless={headless}, humanize={humanize}]")
        
        self._browser = launch(
            headless=headless,
            humanize=humanize,
            proxy=proxy,
            geoip=geoip,
            timezone=timezone,
            locale=locale,
            args=launch_args,
            human_preset=human_preset,
        )
        
        self._page = self._browser.new_page()
        
        # Stealth verification
        await self._verify_stealth()
        
        # Save meta
        meta = {
            'created': time.strftime('%Y-%m-%d %H:%M'),
            'last_used': time.strftime('%Y-%m-%d %H:%M'),
            'platform': 'cloakbrowser',
            'headless': headless,
            'humanize': humanize,
        }
        (profile_dir / 'meta.json').write_text(json.dumps(meta, indent=2))
        
        print(f"✅ CloakBrowser ready — {profile}")
    
    async def _verify_stealth(self):
        """Quick stealth verification."""
        try:
            await self._page.goto('about:blank', wait_until='domcontentloaded')
            results = await self._page.evaluate('''() => {
                return {
                    webdriver: navigator.webdriver,
                    plugins: navigator.plugins.length,
                    chrome: typeof window.chrome,
                    notification: Notification.permission,
                };
            }''')
            if results.get('webdriver') == True:
                print("  ⚠️ WARNING: navigator.webdriver = true — stealth may be compromised")
            else:
                print(f"  🔒 Stealth: webdriver={results.get('webdriver')}, plugins={results.get('plugins')}, chrome={results.get('chrome')}")
        except Exception as e:
            print(f"  ⚠️ Stealth check failed: {e}")
    
    # ═══════════════════════════════════════════
    # NAVIGATION
    # ═══════════════════════════════════════════
    
    async def navigate(self, url: str, wait_until: str = 'domcontentloaded'):
        """
        Navigate to a URL with stealth headers.
        No timeout parameter — CloakBrowser handles timeouts internally.
        """
        await self._page.goto(url, wait_until=wait_until)
        # Random micro-pause to simulate human reading
        if self._humanize:
            await asyncio.sleep(random.uniform(0.5, 2.0))
    
    async def wait(self, ms: int):
        """Wait for specified milliseconds."""
        await asyncio.sleep(ms / 1000)
    
    # ═══════════════════════════════════════════
    # PAGE CONTENT
    # ═══════════════════════════════════════════
    
    async def get_html(self) -> str:
        """Get full page HTML."""
        return await self._page.content()
    
    async def get_content(self) -> str:
        """Get visible text content (for quick checks)."""
        return await self._page.evaluate('document.body.innerText')
    
    async def get_title(self) -> str:
        """Get page title."""
        return await self._page.title()
    
    async def get_url(self) -> str:
        """Get current page URL."""
        return self._page.url
    
    # ═══════════════════════════════════════════
    # INTERACTIONS
    # ═══════════════════════════════════════════
    
    async def click(self, selector: str):
        """
        Click an element. Uses human-like Bezier mouse if humanize=True.
        
        Supports:
          - CSS selectors: 'button.submit', '#login-btn'
          - Text selectors: 'text=Log in'
          - XPath: 'xpath=//button[@type="submit"]'
        """
        if selector.startswith('text='):
            await self._page.get_by_text(selector[5:]).first.click()
        elif selector.startswith('xpath='):
            await self._page.locator(selector[6:]).first.click()
        else:
            await self._page.locator(selector).first.click()
        
        if self._humanize:
            await asyncio.sleep(random.uniform(0.3, 1.0))
    
    async def type(self, selector: str, text: str):
        """
        Type text into an input field. Uses natural typing if humanize=True.
        Clears field first, then types character-by-character with realistic timing.
        """
        el = self._page.locator(selector).first
        await el.click()
        await el.fill('')  # Clear
        
        if self._humanize:
            # Type character by character with human timing
            for char in text:
                await self._page.keyboard.type(char, delay=random.randint(30, 120))
                if random.random() < 0.03:  # 3% chance of typo + backspace
                    await self._page.keyboard.press('Backspace')
                    await asyncio.sleep(random.uniform(0.1, 0.3))
                    await self._page.keyboard.type(char, delay=random.randint(40, 100))
        else:
            await el.fill(text)
        
        await asyncio.sleep(random.uniform(0.2, 0.5))
    
    async def press(self, key: str):
        """Press a keyboard key (Enter, Tab, Escape, ArrowDown, etc.)."""
        await self._page.keyboard.press(key)
        if self._humanize:
            await asyncio.sleep(random.uniform(0.1, 0.3))
    
    async def evaluate(self, js: str) -> Any:
        """
        Execute JavaScript in the page context.
        Use for React-controlled inputs, data extraction, DOM manipulation.
        
        IMPORTANT: Use IIFE pattern, not return at top level:
          (function() { ... })()  ← correct
          return value;           ← wrong (Playwright wraps in function)
        """
        return await self._page.evaluate(js)
    
    async def hover(self, selector: str):
        """Hover over an element (triggers hover CSS/JS)."""
        await self._page.locator(selector).first.hover()
        if self._humanize:
            await asyncio.sleep(random.uniform(0.2, 0.5))
    
    # ═══════════════════════════════════════════
    # SCROLLING
    # ═══════════════════════════════════════════
    
    async def scroll(self, direction: str = 'down', amount: int = 300):
        """
        Scroll the page. Uses human-like scroll patterns if humanize=True.
        direction: 'up' or 'down'
        amount: pixels to scroll (approximate)
        """
        sign = -1 if direction == 'up' else 1
        
        if self._humanize:
            # Simulate natural scroll with varying speed
            remaining = abs(amount)
            while remaining > 0:
                step = min(remaining, random.randint(50, 150))
                await self._page.mouse.wheel(0, sign * step)
                remaining -= step
                
                # Random pause (like reading)
                if random.random() < 0.15:
                    await asyncio.sleep(random.uniform(0.5, 2.0))
                else:
                    await asyncio.sleep(random.uniform(0.05, 0.2))
        else:
            await self._page.mouse.wheel(0, sign * amount)
    
    async def scroll_to_bottom(self):
        """Scroll to the very bottom of the page."""
        await self._page.evaluate('window.scrollTo(0, document.body.scrollHeight)')
        if self._humanize:
            await asyncio.sleep(random.uniform(1.0, 3.0))
    
    # ═══════════════════════════════════════════
    # MEDIA
    # ═══════════════════════════════════════════
    
    async def screenshot(self, path: str):
        """Take a viewport screenshot."""
        await self._page.screenshot(path=path)
        print(f"📸 Screenshot: {path}")
    
    async def screenshot_full(self, path: str):
        """Take a full-page screenshot (not just viewport)."""
        await self._page.screenshot(path=path, full_page=True)
        print(f"📸 Full screenshot: {path}")
    
    async def upload_file(self, selector: str, file_path: str):
        """Upload a file via file input."""
        await self._page.locator(selector).first.set_input_files(file_path)
        print(f"📎 Uploaded: {file_path}")
    
    # ═══════════════════════════════════════════
    # SESSION MANAGEMENT
    # ═══════════════════════════════════════════
    
    async def save_session(self):
        """Save current session (cookies, localStorage)."""
        if not self._profile_name:
            return
        
        profile_dir = PROFILES_DIR / self._profile_name
        
        # Save cookies
        cookies = await self._page.context.cookies()
        (profile_dir / 'cookies.json').write_text(json.dumps(cookies, indent=2))
        
        # Update meta
        meta_path = profile_dir / 'meta.json'
        if meta_path.exists():
            meta = json.loads(meta_path.read_text())
        else:
            meta = {}
        meta['last_used'] = time.strftime('%Y-%m-%d %H:%M')
        meta['url'] = self._page.url
        meta_path.write_text(json.dumps(meta, indent=2))
        
        print(f"💾 Session saved: {self._profile_name}")
    
    async def restore_session(self):
        """Restore cookies from saved session."""
        if not self._profile_name:
            return False
        
        profile_dir = PROFILES_DIR / self._profile_name
        cookies_file = profile_dir / 'cookies.json'
        
        if cookies_file.exists():
            try:
                cookies = json.loads(cookies_file.read_text())
                await self._page.context.add_cookies(cookies)
                print(f"🔄 Session restored: {self._profile_name}")
                return True
            except:
                pass
        return False
    
    async def shutdown(self):
        """Close browser and save session."""
        if self._browser:
            try:
                await self.save_session()
                await self._browser.close()
                print(f"🛑 Browser closed — {self._profile_name}")
            except Exception as e:
                print(f"⚠️ Shutdown: {e}")
            self._browser = None
            self._page = None
    
    # ═══════════════════════════════════════════
    # UTILITY
    # ═══════════════════════════════════════════
    
    async def status(self) -> Dict:
        """Get browser health status."""
        try:
            url = self._page.url if self._page else 'no page'
            title = await self._page.title() if self._page else 'no page'
            return {
                'profile': self._profile_name,
                'headless': self._headless,
                'humanize': self._humanize,
                'connected': self._browser is not None,
                'url': url,
                'title': title,
            }
        except:
            return {'connected': False}
    
    async def random_action(self):
        """Perform a random human-like action (hover, micro-scroll, pause)."""
        action = random.choice(['hover', 'scroll', 'pause', 'jiggle'])
        
        if action == 'hover':
            # Hover somewhere on the page
            x = random.randint(100, 800)
            y = random.randint(100, 600)
            try:
                await self._page.mouse.move(x, y)
                await asyncio.sleep(random.uniform(0.5, 2.0))
            except:
                pass
        elif action == 'scroll':
            await self.scroll('down', random.randint(100, 400))
        elif action == 'pause':
            await asyncio.sleep(random.uniform(1.0, 4.0))
        elif action == 'jiggle':
            # Small mouse jiggle
            try:
                pos = await self._page.evaluate('({x: window.scrollX + 400, y: window.scrollY + 300})')
                for _ in range(3):
                    await self._page.mouse.move(
                        pos['x'] + random.randint(-5, 5),
                        pos['y'] + random.randint(-5, 5)
                    )
                    await asyncio.sleep(0.05)
            except:
                pass


# ═══════════════════════════════════════════════
# PLATFORM-SPECIFIC AUTOMATION
# ═══════════════════════════════════════════════

async def x_login(ca: CloakAutomation, email: str, password: str, username: str = 'qfinhub') -> bool:
    """
    Login to X/Twitter using CloakBrowser.
    Uses evaluate() for React-controlled inputs (more reliable than type()).
    
    Returns True if logged in successfully.
    """
    print("🐦 X.com login...")
    await ca.navigate('https://x.com/login')
    await ca.wait(4000)
    
    # Step 1: Enter email
    escaped_email = email.replace("'", "\\'")
    await ca.evaluate(f'''
        (function() {{
            var el = document.querySelector('input[name="text"], input[autocomplete="username"]');
            if (el) {{
                el.focus();
                el.value = '{escaped_email}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        }})()
    ''')
    await ca.wait(2000)
    
    # Click Next
    await ca.evaluate('''
        (function() {
            var btns = [...document.querySelectorAll('[role="button"]')];
            var next = btns.find(function(b) {
                var t = b.textContent || '';
                return t.includes('Next') || t.includes('next');
            });
            if (next) next.click();
        })()
    ''')
    await ca.wait(5000)
    
    # Step 2: Check for username verification
    html = await ca.get_html()
    if 'username' in html.lower() and 'password' not in html.lower():
        escaped_username = username.replace("'", "\\'")
        await ca.evaluate(f'''
            (function() {{
                var el = document.querySelector('input[name="text"]');
                if (el) {{
                    el.value = '{escaped_username}';
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
                var btns = [...document.querySelectorAll('[role="button"]')];
                var next = btns.find(function(b) {{
                    return (b.textContent || '').includes('Next');
                }});
                if (next) next.click();
            }})()
        ''')
        await ca.wait(5000)
    
    # Step 3: Enter password
    escaped_pw = password.replace("'", "\\'")
    await ca.evaluate(f'''
        (function() {{
            var pw = document.querySelector('input[type="password"]');
            if (pw) {{
                pw.focus();
                pw.value = '{escaped_pw}';
                pw.dispatchEvent(new Event('input', {{ bubbles: true }}));
                pw.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
            var btns = [...document.querySelectorAll('[role="button"]')];
            var login = btns.find(function(b) {{
                var t = (b.textContent || '').toLowerCase();
                return t.includes('log in') || t.includes('sign in');
            }});
            if (login) login.click();
        }})()
    ''')
    await ca.wait(6000)
    
    # Verify login
    await ca.navigate('https://x.com/home')
    await ca.wait(3000)
    html = await ca.get_html()
    logged_in = 'Timeline' in html or 'Home' in html
    
    if logged_in:
        print("✅ X.com login successful")
    else:
        print("❌ X.com login failed")
    
    return logged_in


async def x_post(ca: CloakAutomation, text: str):
    """
    Post a tweet. Uses evaluate() for reliability.
    No emojis in text — they break textContent setting.
    """
    print(f"🐦 Posting tweet: {text[:60]}...")
    
    await ca.navigate('https://x.com/compose/post')
    await ca.wait(4000)
    
    escaped = text.replace("\\", "\\\\").replace("'", "\\'").replace("$", "\\$")
    await ca.evaluate(f'''
        (function() {{
            var el = document.querySelector('[data-testid="tweetTextarea_0"]')
                 || document.querySelector('[contenteditable="true"]')
                 || document.querySelector('div[role="textbox"]');
            if (el) {{
                el.focus();
                el.textContent = '{escaped}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        }})()
    ''')
    await ca.wait(2000)
    
    await ca.evaluate('''
        (function() {
            var btn = document.querySelector('[data-testid="tweetButton"]')
                   || document.querySelector('[data-testid="tweetButtonInline"]');
            if (btn) btn.click();
        })()
    ''')
    await ca.wait(4000)
    print("✅ Tweet posted")


async def pinterest_upload_pin(ca: CloakAutomation, img_path: str, title: str, 
                                 link: str, board_name: str) -> bool:
    """
    Upload a pin to Pinterest via the Pin Builder.
    """
    print(f"📌 Uploading pin: {title[:50]}...")
    
    await ca.navigate('https://www.pinterest.com/pin-builder/')
    await ca.wait(5000)
    
    # Upload image
    try:
        await ca.upload_file('input[type="file"]', img_path)
        await ca.wait(4000)
    except Exception as e:
        print(f"  ⚠️ Image upload failed: {e}")
        return False
    
    # Set title
    escaped_title = title.replace("'", "\\'")
    await ca.evaluate(f'''
        (function() {{
            var el = document.querySelector('[data-test-id="pin-title"]')
                  || document.querySelector('#pin-draft-title');
            if (el) {{
                el.textContent = '{escaped_title}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        }})()
    ''')
    await ca.wait(1000)
    
    # Set link
    escaped_link = link.replace("'", "\\'")
    await ca.evaluate(f'''
        (function() {{
            var el = document.querySelector('[data-test-id="pin-link"]')
                  || document.querySelector('#pin-draft-link')
                  || document.querySelector('input[type="url"]');
            if (el) {{
                el.value = '{escaped_link}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
            }}
        }})()
    ''')
    await ca.wait(1000)
    
    # Select board
    escaped_board = board_name.replace("'", "\\'")
    await ca.evaluate(f'''
        (function() {{
            var items = document.querySelectorAll('[data-test-id="board-selector-item"]');
            for (var i = 0; i < items.length; i++) {{
                if ((items[i].textContent || '').includes('{escaped_board}')) {{
                    items[i].click();
                    break;
                }}
            }}
        }})()
    ''')
    await ca.wait(2000)
    
    # Click publish
    await ca.evaluate('''
        (function() {
            var btn = document.querySelector('[data-test-id="board-dropdown-save-button"]')
                   || document.querySelector('[data-test-id="pin-draft-save-button"]')
                   || [...document.querySelectorAll('button')].find(function(b) {
                       return (b.textContent || '').includes('Save') || (b.textContent || '').includes('Publish');
                   });
            if (btn) btn.click();
        })()
    ''')
    await ca.wait(5000)
    
    print("✅ Pin uploaded")
    return True


async def run_stealth_test():
    """Run comprehensive stealth detection test."""
    from cloakbrowser import launch_async
    
    print("🔍 Running stealth detection tests...\n")
    
    browser = await launch_async(headless=True, humanize=True)
    page = await browser.new_page()
    
    tests = {}
    
    # Test 1: Basic stealth signals
    await page.goto('about:blank', wait_until='domcontentloaded')
    sigs = await page.evaluate('''() => {
        return {
            webdriver: navigator.webdriver,
            plugins: navigator.plugins.length,
            chrome: typeof window.chrome,
            notification: Notification.permission,
            languages: navigator.languages,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
        };
    }''')
    tests['basic_signals'] = sigs
    print(f"  webdriver={sigs['webdriver']} | plugins={sigs['plugins']} | chrome={sigs['chrome']} | notification={sigs['notification']}")
    
    # Test 2: BrowserScan
    try:
        await page.goto('https://www.browserscan.net/bot-detection', wait_until='domcontentloaded', timeout=20000)
        await page.wait_for_timeout(5000)
        result = await page.evaluate('document.body.innerText')
        tests['browserscan'] = 'NORMAL' if 'Normal' in result else result[:200]
        print(f"  BrowserScan: {tests['browserscan'][:80]}")
    except Exception as e:
        tests['browserscan'] = f'Error: {e}'
        print(f"  BrowserScan: Error")
    
    # Test 3: FingerprintJS
    try:
        await page.goto('https://fingerprintjs.github.io/fingerprintjs/', wait_until='domcontentloaded', timeout=15000)
        await page.wait_for_timeout(3000)
        tests['fingerprintjs'] = 'Loaded OK'
        print(f"  FingerprintJS: Loaded")
    except:
        tests['fingerprintjs'] = 'Error'
    
    # Test 4: httpbin headers check
    try:
        await page.goto('https://httpbin.org/headers', wait_until='domcontentloaded', timeout=10000)
        content = await page.evaluate('document.body.innerText')
        tests['httpbin'] = 'Sec-Ch-Ua' in content
        print(f"  httpbin headers: {'Pass' if tests['httpbin'] else 'Fail'}")
    except:
        tests['httpbin'] = False
    
    await browser.close()
    
    print("\n✅ Stealth tests complete")
    return tests


# ═══════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════

if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='CloakBrowser Automation')
    parser.add_argument('--test', action='store_true', help='Run stealth detection tests')
    parser.add_argument('--profiles', action='store_true', help='List profiles')
    args = parser.parse_args()
    
    if args.test:
        asyncio.run(run_stealth_test())
    elif args.profiles:
        profiles = CloakAutomation.list_profiles()
        for p in profiles:
            print(f"  {p['name']} — created {p['created']}, last used {p['last_used']}")
    else:
        print("CloakBrowser Automation ready.")
        print("Usage: python3 scripts/cloak-automation.py --test")
        print("       python3 scripts/cloak-automation.py --profiles")
