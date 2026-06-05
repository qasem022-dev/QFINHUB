#!/usr/bin/env python3
"""Keep Pinterest login window open for manual reCAPTCHA solving."""
import sys, os, time, json
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

print('Opening Pinterest login window...', flush=True)
browser = launch(headless=False, humanize=True)
page = browser.new_page()
page.goto('https://www.pinterest.com/login/', wait_until='domcontentloaded', timeout=30000)
time.sleep(5)

# Fill form via evaluate
escaped_email = pin_email.replace("'", "\\'")
page.evaluate("""
    (function() {
        var el = document.querySelector('input[name="id"]');
        if (el) {
            el.focus();
            var s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
            s.call(el, '""" + escaped_email + """');
            el.dispatchEvent(new Event("input", { bubbles: true }));
        }
    })()
""")
time.sleep(1)

escaped_pw = pin_pw.replace("'", "\\'")
page.evaluate("""
    (function() {
        var el = document.querySelector('input[name="password"]');
        if (el) {
            el.focus();
            var s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set;
            s.call(el, '""" + escaped_pw + """');
            el.dispatchEvent(new Event("input", { bubbles: true }));
        }
    })()
""")
time.sleep(1)

print('Form filled. Login window should be open on your screen.', flush=True)
print('Solve reCAPTCHA + click Log in, then the window stays open.', flush=True)

# Wait 5 minutes then save session and close
for i in range(60):
    time.sleep(5)
    try:
        html = page.evaluate('document.body.innerHTML')
        current_url = page.evaluate('window.location.href')
        logged_in = ('create-menu-button' in html or 'profile' in html.lower()) and 'login' not in current_url
        if logged_in:
            print('Detected successful login! Saving session...', flush=True)
            cookies = page.context.cookies()
            os.makedirs(profile_dir, exist_ok=True)
            with open(f'{profile_dir}/cookies.json', 'w') as f:
                json.dump(cookies, f, indent=2)
            with open(f'{profile_dir}/meta.json', 'w') as f:
                json.dump({'logged_in': True, 'timestamp': time.strftime('%Y-%m-%d %H:%M')}, f, indent=2)
            print(f'Session saved to {profile_dir}', flush=True)
            break
    except:
        pass

browser.close()
print('Browser closed.', flush=True)
