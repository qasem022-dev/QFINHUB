#!/usr/bin/env python3
"""Check if @qfinhub tweets are visible (logged-in view)"""
from cloakbrowser import launch_persistent_context
import time, re

context = launch_persistent_context(
    user_data_dir="/home/admin1/.hermes/cloak-profiles/x-account-1",
    headless=True,
    humanize=True
)
page = context.new_page()
page.set_default_timeout(30000)

# Go to our profile
page.goto("https://x.com/qfinhub", wait_until="domcontentloaded", timeout=20000)
time.sleep(5)

body = page.evaluate("document.body.innerText")
print("=== PAGE BODY (first 4000 chars) ===")
print(body[:4000])

if "hasn't posted" in body:
    print("\n*** SHADOWBAN: No tweets visible even when logged in ***")
else:
    print("\n*** Tweets ARE visible when logged in ***")

# Check for tweet dates
dates = re.findall(r"(May\s+\d{1,2}|Jun\s+\d{1,2}|\d{1,2}h|\d+m ago)", body)
print(f"\nDates/timestamps found: {dates[:15]}")

# Check for tweet content
if "Mortgage" in body or "calculator" in body.lower() or "FIRE" in body:
    print("Tweet content FOUND in page")
else:
    print("No tweet content found")

context.close()
