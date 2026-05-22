#!/usr/bin/env python3
"""Pinterest login — fills form, pauses for you to solve reCAPTCHA, then saves session."""
import sys, os, glob, time, json
sys.path.insert(0, '/home/admin1/qfinhub/scripts')
from cloakbrowser import launch

creds = {}
with open('/home/admin1/qfinhub/.env.local') as f:
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, _, v = line.partition('=')
            creds[k.strip()] = v.strip().strip('"').strip("'")

pin_email = creds.get('PINTEREST_EMAIL', 'q.finhub@gmail.com')
pin_pw = creds.get('PINTEREST_PASSWORD')
profile_dir = os.path.expanduser('~/.hermes/cloak-profiles/pinterest-traffic')

print('='*60)
print('  PINTEREST LOGIN — ONE-TIME SETUP')
print('='*60)
print()
print('A browser window will open. The login form is pre-filled.')
print('⚠️  SOLVE THE reCAPTCHA in the browser window, then press Enter here.')
print()

browser = launch(headless=False, humanize=True)
page = browser.new_page()

page.goto('https://www.pinterest.com/login/', wait_until='domcontentloaded', timeout=30000)
time.sleep(5)

# Pre-fill form
escaped_email = pin_email.replace("'", "\\'")
page.evaluate(f'''
    (function() {{
        var el = document.querySelector('input[name="id"]');
        if (el) {{
            el.focus();
            var s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
            s.call(el, '{escaped_email}');
            el.dispatchEvent(new Event("input", {{ bubbles: true }}));
        }}
    }})()
''')
time.sleep(1)

escaped_pw = pin_pw.replace("'", "\\'")
page.evaluate(f'''
    (function() {{
        var el = document.querySelector('input[name="password"]');
        if (el) {{
            el.focus();
            var s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
            s.call(el, '{escaped_pw}');
            el.dispatchEvent(new Event("input", {{ bubbles: true }}));
        }}
    }})()
''')
time.sleep(1)
print('✅ Login form pre-filled')
print()
print('👉 NOW: Solve the reCAPTCHA in the browser window')
print('👉 THEN: Click the "Log in" button in the browser')
print('👉 THEN: Come back here and press Enter')

# Pause for user
input('\nPress Enter after you have logged in...')

# Check if logged in
html = page.evaluate('document.body.innerHTML')
current_url = page.evaluate('window.location.href')
logged_in = ('create-menu-button' in html or 'profile' in html.lower()) and 'login' not in current_url

if logged_in:
    print('✅ LOGGED IN!')
    
    # Save cookies
    cookies = page.context.cookies()
    os.makedirs(profile_dir, exist_ok=True)
    with open(f'{profile_dir}/cookies.json', 'w') as f:
        json.dump(cookies, f, indent=2)
    
    # Save meta
    with open(f'{profile_dir}/meta.json', 'w') as f:
        json.dump({
            'created': time.strftime('%Y-%m-%d %H:%M'),
            'last_used': time.strftime('%Y-%m-%d %H:%M'),
            'logged_in': True
        }, f, indent=2)
    
    print(f'💾 Session saved: {profile_dir}')
    print()
    
    # Try uploading a pin
    imgs = sorted(glob.glob('/home/admin1/qfinhub/public/pinterest-images/*.png'), key=os.path.getmtime, reverse=True)
    if imgs:
        img = imgs[0]
        print(f'Uploading pin: {os.path.basename(img)}')
        
        page.goto('https://www.pinterest.com/pin-builder/', wait_until='domcontentloaded', timeout=30000)
        time.sleep(6)
        
        page.locator('input[type="file"]').first.set_input_files(img)
        time.sleep(5)
        print('  Image uploaded')
        
        page.evaluate('''
            (function() {
                var el = document.querySelector('[data-test-id="pin-draft-title"]')
                      || document.querySelector('[id*="title"]');
                if (el) {
                    el.textContent = "QFINHUB Financial Calculators - Free Tools";
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                }
            })()
        ''')
        time.sleep(1)
        
        page.evaluate('''
            (function() {
                var el = document.querySelector('[data-test-id="pin-draft-link"]')
                      || document.querySelector('input[type="url"]');
                if (el) {
                    el.value = "https://www.qfinhub.com";
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                }
            })()
        ''')
        time.sleep(2)
        
        page.evaluate('''
            (function() {
                var btns = [...document.querySelectorAll("button")];
                var save = btns.find(function(b) {
                    return (b.textContent||"").includes("Save") || (b.textContent||"").includes("Publish");
                });
                if (save) save.click();
            })()
        ''')
        time.sleep(6)
        print('  ✅ Pin upload attempted!')
else:
    print('❌ Still not logged in')
    print(f'   URL: {current_url}')
    page.screenshot(path='/tmp/pinterest-final.png')
    print('   Screenshot: /tmp/pinterest-final.png')

browser.close()
print()
print('='*60)
print('  DONE! Session saved for future headless use.')
print(f'  Profile: {profile_dir}')
print('='*60)
