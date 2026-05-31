#!/usr/bin/env python3
"""Delete ALL visible tweets from @qfinhub - clean approach"""
import os, sys, time
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

def del_tweet(page, tid):
    page.goto(f"https://x.com/QFinhub/status/{tid}", wait_until="domcontentloaded", timeout=20000)
    time.sleep(3)
    page.evaluate('document.querySelector(\'[aria-label="More"]\').click()')
    time.sleep(1.5)
    page.evaluate("""[...document.querySelectorAll('[role="menuitem"]')]
        .find(el => el.textContent.trim() === 'Delete')?.click()""")
    time.sleep(1.5)
    page.evaluate('document.querySelector(\'[data-testid="confirmationSheetConfirm"]\').click()')
    time.sleep(2)
    return True

def get_our_ids(page):
    return page.evaluate("""[...document.querySelectorAll('article')]
        .filter(a => /qfinhub/i.test(a.textContent))
        .flatMap(a => [...a.querySelectorAll('a[href*="/status/"]')]
            .map(l => l.href.match(/\\/status\\/(\\d+)/)?.[1])
            .filter(Boolean))""")

context = launch_persistent_context(
    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/x-account-1"),
    headless=True, humanize=True)
page = context.new_page()

# Login check
page.goto("https://x.com/home", wait_until="domcontentloaded", timeout=30000)
time.sleep(2)
if "Log in" in page.content():
    print("NOT LOGGED IN"); sys.exit(1)

# Keep deleting until profile is clean
for round_num in range(5):
    page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=30000)
    time.sleep(3)
    for _ in range(6):
        page.keyboard.press("End"); time.sleep(1.5)
    time.sleep(2)
    
    ids = get_our_ids(page)
    if not ids:
        print(f"Round {round_num}: CLEAN - no tweets found")
        break
    
    print(f"Round {round_num}: {len(ids)} tweets to delete")
    for i, tid in enumerate(ids):
        print(f"  [{i+1}/{len(ids)}] {tid}...", end=" ", flush=True)
        try:
            del_tweet(page, tid)
            print("OK")
        except Exception as e:
            print(f"ERR: {e}")
        time.sleep(2 + i * 0.3)

# Final check
page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
time.sleep(3)
st = page.evaluate('document.body.innerText')
for l in st.split("\n"):
    if "post" in l.lower(): print(f"\nStatus: {l}")
remaining = len(get_our_ids(page))
print(f"Visible tweets remaining: {remaining}")
page.screenshot(path="/tmp/x-profile-done.png", full_page=True)
context.close()
