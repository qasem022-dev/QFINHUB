#!/usr/bin/env python3
"""Phase 16.12E Task 1: Extract GSC Pages report issue groups via CloakBrowser."""
import os, sys, time, json

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3")
OUTPUT = "/home/admin1/qfinhub/.optimizer-data/gsc-pages-report-summary.json"

print("Launching CloakBrowser with persistent GSC profile...", flush=True)
ctx = launch_persistent_context(
    user_data_dir=PROFILE,
    headless=True,
    humanize=True,
)
page = ctx.new_page()

# Navigate to GSC Pages report
pages_url = "https://search.google.com/search-console/index?resource_id=https%3A%2F%2Fwww.qfinhub.com%2F"
print(f"Navigating to: {pages_url}", flush=True)
page.goto(pages_url, wait_until="domcontentloaded", timeout=30000)
time.sleep(5)

# Check auth
if "accounts.google.com" in page.url:
    print("SESSION EXPIRED — needs re-auth", flush=True)
    ctx.close()
    sys.exit(1)

print(f"Current URL: {page.url[:100]}", flush=True)
if "index" not in page.url:
    print(f"WARNING: Not on Pages report page, URL is: {page.url[:200]}")
    # Try to click into Indexing > Pages
    page.evaluate("""
        (function() {
            var links = document.querySelectorAll('a, [role="link"], span[role="button"]');
            for (var el of links) {
                var t = (el.textContent || '').toLowerCase();
                if (t.includes('index') || t.includes('pages')) {
                    el.click();
                    return;
                }
            }
        })()
    """)
    time.sleep(5)

# Extract issue groups from the page
print("Extracting issue groups...", flush=True)
data = page.evaluate("""
    (function() {
        var result = {url: window.location.href, groups: []};
        
        // Try to find the structured data
        // GSC Pages report has a table or list of issue groups with counts
        var rows = document.querySelectorAll('tr, [role="row"], .issue-row, .coverage-row');
        for (var row of rows) {
            var text = (row.textContent || '').trim();
            if (text.length > 5 && text.length < 500) {
                result.groups.push({text: text});
            }
        }
        
        // Also try cards/sections
        var cards = document.querySelectorAll('.card, [role="listitem"], .indexing-issue');
        for (var card of cards) {
            var text = (card.textContent || '').trim();
            if (text.length > 10 && text.length < 300) {
                result.groups.push({text: text});
            }
        }
        
        // Try to find the main content area
        var main = document.querySelector('main, [role="main"], .main-content, .content');
        if (main) {
            result.mainText = (main.textContent || '').substring(0, 5000);
        }
        
        // Get ALL text from body (first 10K chars)
        result.bodyText = (document.body.innerText || '').substring(0, 10000);
        
        return result;
    })()
""")

print(f"Found {len(data.get('groups', []))} potential groups")
print("Main content preview:", data.get('mainText', '')[:500])
print("Body text preview:", data.get('bodyText', '')[:500])

# Save raw extraction
with open(OUTPUT, 'w') as f:
    json.dump(data, f, indent=2, default=str)
print(f"Saved to {OUTPUT}")

# Also take a screenshot for visual analysis
screenshot_path = "/home/admin1/qfinhub/.optimizer-data/gsc-pages-report-screenshot.png"
page.screenshot(path=screenshot_path)
print(f"Screenshot saved: {screenshot_path}")

ctx.close()
print("Done.")
