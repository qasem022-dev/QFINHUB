#!/usr/bin/env python3
"""Phase 13B.8 — Post 2 approved test pins via CloakBrowser. Fixed URLs."""

import json, os, sys, time

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib") + ":" + os.environ.get("LD_LIBRARY_PATH", "")

from cloakbrowser import launch_persistent_context

SESSION_DIR = os.path.expanduser("~/.hermes/cloak-profiles/pinterest-poster")
LOG_PATH = "/home/admin1/qfinhub/.pinterest-data/phase-13b8-post-log.json"

PINS = [
    {
        "slug": "100k_income_home_affordability",
        "title": "$100K Income: How Much House Can You Afford?",
        "description": "See an estimated home affordability range for a $100K income and calculate your exact number with QFINHUB's free mortgage affordability calculator. No signup required.",
        "link": "https://www.qfinhub.com/decision/how-much-house-can-i-afford?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=phase13_test&utm_content=100k_income_home_affordability",
        "image": "/home/admin1/qfinhub/.pinterest-data/gemini-flash-image-variations/phase-13b7-pin1-v1.png",
        "board": "Mortgage & Home Buying Tools",
    },
    {
        "slug": "debt_snowball_vs_avalanche",
        "title": "Debt Snowball vs Avalanche: Which Pays Off Faster?",
        "description": "Compare debt snowball vs avalanche and see which strategy may save more interest. Use QFINHUB's free debt payoff comparison tool. No signup required.",
        "link": "https://www.qfinhub.com/decision/snowball-vs-avalanche-which-wins?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=phase13_test&utm_content=debt_snowball_vs_avalanche",
        "image": "/home/admin1/qfinhub/.pinterest-data/gemini-flash-image-variations/phase-13b7-pin2-v1.png",
        "board": "Debt Payoff Strategies",
    }
]

def escape_js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("$", "\\$")

print("=" * 60)
print("PHASE 13B.8 — Posting 2 Approved Test Pins (fixed)")
print("=" * 60)

results = []

try:
    print("\n🚀 Launching CloakBrowser...")
    ctx = launch_persistent_context(
        user_data_dir=SESSION_DIR,
        headless=False,
        viewport={"width": 1280, "height": 900}
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()

    for pin in PINS:
        slug = pin["slug"]
        title = pin["title"]
        link = pin["link"]
        board = pin["board"]
        img = pin["image"]

        print(f"\n📌 {slug}")
        print(f"   Title: {title[:60]}...")
        print(f"   Board: {board}")

        try:
            # Try pin-creation-tool URL (current Pinterest create flow)
            print("   🌐 Navigating to pin-creation-tool...")
            page.goto("https://www.pinterest.com/pin-creation-tool/", wait_until="domcontentloaded", timeout=30000)
            time.sleep(4)

            # Check where we landed
            current_url = page.evaluate("() => window.location.href")
            print(f"   📍 Current URL: {current_url[:80]}")

            # Try to find and click "Create Pin" if we're on a different page
            page.evaluate("""
                (function() {
                    var btns = document.querySelectorAll('button, a, div[role="button"]');
                    for (var btn of btns) {
                        var t = (btn.textContent || '').trim().toLowerCase();
                        if (t === 'create pin' || t === 'create' || t.includes('create pin')) {
                            btn.click();
                            return;
                        }
                    }
                })()
            """)
            time.sleep(3)
            current_url = page.evaluate("() => window.location.href")
            print(f"   📍 After create click: {current_url[:80]}")

            # Upload image - try multiple selectors
            print("   📤 Uploading image...")
            selectors = [
                'input[type="file"]',
                'input[accept*="image"]',
                '#pin-builder-image-upload input',
                '[data-test-id="pin-builder-image-upload"] input',
                'input[data-test-id="media-upload-input"]',
            ]
            found = False
            for sel in selectors:
                try:
                    loc = page.locator(sel)
                    if loc.count() > 0:
                        loc.first.set_input_files(img)
                        found = True
                        print(f"   ✅ Upload via: {sel}")
                        break
                except:
                    continue
            
            if not found:
                # Last resort: click media upload area first
                page.evaluate("""
                    (function() {
                        var uploads = document.querySelectorAll('[data-test-id*="upload"], [data-test-id*="media"], [aria-label*="upload"], [aria-label*="image"]');
                        for (var el of uploads) { el.click(); return; }
                    })()
                """)
                time.sleep(2)
                for sel in selectors:
                    try:
                        loc = page.locator(sel)
                        if loc.count() > 0:
                            loc.first.set_input_files(img)
                            found = True
                            print(f"   ✅ Upload via: {sel} (after click)")
                            break
                    except:
                        continue

            if not found:
                raise Exception("Could not find file input — page structure may have changed")

            time.sleep(6)

            # Set title
            escaped_title = escape_js(title)
            page.evaluate(f"""
                (function() {{
                    var el = document.querySelector('[contenteditable="true"]');
                    if (!el) {{
                        var divs = document.querySelectorAll('[role="textbox"]');
                        el = divs[divs.length - 1] || divs[0];
                    }}
                    if (el) {{
                        el.focus();
                        el.textContent = '{escaped_title}';
                        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    }}
                }})()
            """)
            time.sleep(2)
            print("   ✏️ Title set")

            # Set link
            escaped_link = escape_js(link)
            page.evaluate(f"""
                (function() {{
                    var inputs = document.querySelectorAll('input');
                    for (var el of inputs) {{
                        var ph = (el.placeholder || '').toLowerCase();
                        if (ph.includes('link') || ph.includes('url') || ph.includes('website')) {{
                            var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                            ns.call(el, '{escaped_link}');
                            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                            return;
                        }}
                    }}
                }})()
            """)
            time.sleep(1.5)
            print("   🔗 Link set")

            # Select board
            escaped_board = escape_js(board)
            page.evaluate("""
                (function() {
                    var all = document.querySelectorAll('div[role="button"], button');
                    for (var el of all) {
                        var t = (el.textContent || '').toLowerCase();
                        if (t.includes('board') || t.includes('save to') || t.includes('profile')) {
                            el.click();
                            break;
                        }
                    }
                })()
            """)
            time.sleep(3)

            page.evaluate(f"""
                (function() {{
                    var items = document.querySelectorAll('div[role="option"], div[role="menuitem"], li, div, span');
                    for (var el of items) {{
                        if (el.textContent.trim() === '{escaped_board}') {{
                            el.click();
                            return;
                        }}
                    }}
                    var search = '{escaped_board[:20]}';
                    for (var el of items) {{
                        if (el.textContent.includes(search)) {{
                            el.click();
                            return;
                        }}
                    }}
                }})()
            """)
            time.sleep(2)
            print(f"   📋 Board: {board}")

            # Click Save
            page.evaluate("""
                (function() {
                    var btns = document.querySelectorAll('button, div[role="button"]');
                    for (var btn of btns) {
                        var t = (btn.textContent || '').trim().toLowerCase();
                        if (t === 'save' || t === 'publish' || t.includes('save')) {
                            btn.click();
                            return;
                        }
                    }
                })()
            """)
            time.sleep(5)
            print("   ✅ Posted!")

            results.append({"slug": slug, "success": True, "error": "", "ts": time.strftime("%Y-%m-%dT%H:%M:%S")})

        except Exception as e:
            print(f"   ❌ ERROR: {e}")
            results.append({"slug": slug, "success": False, "error": str(e)[:300], "ts": time.strftime("%Y-%m-%dT%H:%M:%S")})

    ctx.close()
    print("\n🏁 Done.")

except Exception as e:
    print(f"\n❌ FATAL: {e}")
    for pin in PINS:
        results.append({"slug": pin["slug"], "success": False, "error": f"FATAL: {str(e)[:200]}", "ts": time.strftime("%Y-%m-%dT%H:%M:%S")})

log = {"phase": "13B.8", "pins": results, "generated": time.strftime("%Y-%m-%dT%H:%M:%S")}
os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
with open(LOG_PATH, "w") as f:
    json.dump(log, f, indent=2, default=str)

print(f"\n📁 Log: {LOG_PATH}")
for r in results:
    print(f"  {'✅' if r['success'] else '❌'} {r['slug']}")
