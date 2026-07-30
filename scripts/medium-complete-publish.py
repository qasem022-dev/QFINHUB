#!/usr/bin/env python3
"""
Publish a draft on Medium @q.finhub. Used after initial publish-creates-draft,
to complete the publish flow (add tags + click final publish).
"""
import os
import sys
import time
import subprocess

VENV_PYTHON = "/home/admin1/.hermes/hermes-agent/venv/bin/python3"
MEDIUM_PROFILE = "/home/admin1/.hermes/cloak-profiles/medium-qfinhub"
DRAFT_URL = sys.argv[1] if len(sys.argv) > 1 else "https://medium.com/p/6c41654c1323/edit"

INLINE = f"""
import os
os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context
import time

ctx = launch_persistent_context(user_data_dir='/home/admin1/.hermes/cloak-profiles/medium-qfinhub', headless=True)
p = ctx.new_page()
p.goto('{DRAFT_URL}', timeout=60000)
time.sleep(10)

# Click the Publish button (top right)
pub = p.locator("button:has-text('Publish')").first
if pub.count() == 0:
    print('NO_PUBLISH_BUTTON')
    ctx.close()
    sys.exit(1)
pub.click()
print('Clicked Publish, waiting for dialog...')
time.sleep(6)

# Now in publish modal — look for tag input and final Publish button
import re
html = p.content()
print('Modal HTML length:', len(html))

# Find the tag input
tag_input = p.locator("input[placeholder*='tag' i], input[placeholder*='Add tag' i]").first
if tag_input.count() > 0:
    print('Tag input found, adding tags...')
    for tag in ['finance', 'calculator', 'personal-finance', 'money', 'investing']:
        tag_input.click()
        tag_input.fill('')
        tag_input.fill(tag)
        p.keyboard.press('Enter')
        time.sleep(1)
else:
    print('No tag input found, checking if already tagged...')

time.sleep(3)

# Look for the final 'Publish now' button
final_pub = p.locator("button:has-text('Publish now')").first
if final_pub.count() == 0:
    final_pub = p.locator("button:has-text('Publish')").last

if final_pub.count() > 0:
    print('Clicking final Publish...')
    final_pub.click()
    time.sleep(10)
    print('Final URL:', p.url)
else:
    print('No final publish button found')
    print('Buttons in modal:')
    btns = re.findall(r'<button[^>]*>([^<]+)</button>', html)
    for b in btns[:15]:
        if b.strip():
            print(' ', repr(b[:80]))
ctx.close()
"""

# Run via subprocess so the script can be invoked simply
result = subprocess.run([VENV_PYTHON, "-c", INLINE], capture_output=True, text=True, timeout=180)
print("STDOUT:", result.stdout[-3000:])
print("STDERR:", result.stderr[-1500:])