#!/usr/bin/env python3
"""Quick stealth test — check navigator.webdriver and key fingerprint props"""
import sys, os, asyncio, json

sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

async def test():
    browser = StealthBrowser()
    try:
        await browser.init(profile='fingerprint-test', headless=True)
        
        # Navigate to a simple page
        await browser.navigate('https://httpbin.org/headers')
        await browser.wait(2000)
        
        # Run fingerprint checks
        results = await browser.evaluate("""
            var r = {};
            
            // CRITICAL: webdriver
            r.hasWebdriver = 'webdriver' in navigator;
            r.webdriverValue = navigator.webdriver;
            
            // Platform
            r.platform = navigator.platform;
            
            // Hardware
            r.hardwareConcurrency = navigator.hardwareConcurrency;
            r.deviceMemory = navigator.deviceMemory;
            
            // Chrome runtime
            r.hasChrome = typeof chrome !== 'undefined';
            r.chromeRuntimeId = (typeof chrome !== 'undefined' && chrome.runtime) ? chrome.runtime.id : 'none';
            
            // Notifications
            r.notificationPermission = (typeof Notification !== 'undefined') ? Notification.permission : 'none';
            
            // Window dimensions
            r.outerWidth = window.outerWidth;
            r.outerHeight = window.outerHeight;
            r.innerWidth = window.innerWidth;
            
            // Timezone
            var d = new Date();
            r.timezoneOffset = d.getTimezoneOffset();
            
            // Plugins
            r.pluginsLength = navigator.plugins.length;
            
            // Languages
            r.languages = navigator.languages;
            
            // User agent
            r.userAgent = navigator.userAgent;
            
            // Stealth patched
            r.stealthPatched = window.__stealthPatched;
            
            JSON.stringify(r, null, 2);
        """)
        
        print("=== FINGERPRINT TEST RESULTS ===")
        print(results)
        
        # Parse and check
        data = json.loads(results)
        
        print("\n=== VERDICT ===")
        checks = []
        
        if data.get('hasWebdriver') == False:
            checks.append(('webdriver absent', True))
        elif data.get('webdriverValue') is None or data.get('webdriverValue') == False:
            checks.append(('webdriver falsy', True))
        else:
            checks.append(('webdriver present!', False))
        
        checks.append(('platform = Win32', data.get('platform') == 'Win32'))
        checks.append(('hardwareConcurrency > 0', data.get('hardwareConcurrency', 0) > 1))
        checks.append(('plugins > 0', data.get('pluginsLength', 0) > 0))
        checks.append(('chrome exists', data.get('hasChrome') == True))
        checks.append(('chrome.runtime.id exists', data.get('chromeRuntimeId') != 'none'))
        checks.append(('Notification = default', data.get('notificationPermission') == 'default'))
        checks.append(('outerWidth matches inner', data.get('outerWidth') == data.get('innerWidth')))
        checks.append(('timezone offset set', data.get('timezoneOffset') in [240, 300]))
        checks.append(('stealthPatched', data.get('stealthPatched') == True))
        checks.append(('languages = en-US', 'en-US' in str(data.get('languages', []))))
        
        all_pass = True
        for name, result in checks:
            status = '✅' if result else '❌'
            if not result: all_pass = False
            print(f"  {status} {name}")
        
        print(f"\n{'🎉 ALL CHECKS PASSED' if all_pass else '❌ SOME CHECKS FAILED'}")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()

asyncio.run(test())
