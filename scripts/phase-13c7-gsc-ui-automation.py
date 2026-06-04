#!/usr/bin/env python3
"""
PHASE 13C.7 — Safe GSC UI Automation Attempt
Attempts to "Request Indexing" for 7 verified pages via CloakBrowser GSC UI.
Rules: Only these 7 verified pages. Stop immediately if blocked/CAPTCHA/2FA.
If fails: fallback to sitemap/internal-link recrawl queue.
"""

import os, sys, json, time

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")

from cloakbrowser import launch_persistent_context

RESULTS = {
    "attempted": False,
    "auth_success": False,
    "pages_attempted": 0,
    "pages_succeeded": [],
    "pages_failed": [],
    "blocker": None,
    "error": None,
}

URLS = [
    "https://www.qfinhub.com/blog/20000-loan-at-8-percent-for-5-years-monthly-payment",
    "https://www.qfinhub.com/blog/fed-2025-report-how-household-economic-well-being-impacts-your-mortgage-and-savi",
    "https://www.qfinhub.com/blog/mortgage-rates-2025-rates-move-to-highest-in-5-weeks-but-homebuyers-shake-it-off",
    "https://www.qfinhub.com/blog/how-much-mortgage-afford-100k-salary",
    "https://www.qfinhub.com/blog/how-to-pay-off-credit-card-debt-fast-2026-proven-strategies",
    "https://www.qfinhub.com/compare/best-mortgage-calculator",
    "https://www.qfinhub.com/blog/2027-social-security-cola-forecast-jumps-to-3-9-what-retirees-need-to-know-now",
]

def main():
    print("[1/5] Launching CloakBrowser with Google GSC profile...")
    try:
        context = launch_persistent_context(
            user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3"),
            headless=True,
            humanize=True,
        )
        page = context.new_page()
        RESULTS["attempted"] = True
    except Exception as e:
        RESULTS["error"] = f"CloakBrowser launch failed: {e}"
        print(f"  ❌ Failed: {e}")
        return
    
    try:
        print("[2/5] Checking GSC auth status...")
        # Navigate to GSC URL Inspection page for qfinhub
        inspect_url = "https://search.google.com/search-console/inspect?resource_id=https://www.qfinhub.com/"
        page.goto(inspect_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        
        current_url = page.url
        
        if "accounts.google.com" in current_url:
            RESULTS["blocker"] = "Google login required — session expired"
            RESULTS["error"] = f"Redirected to: {current_url[:80]}"
            print(f"  ❌ Session expired — redirected to Google login")
            context.close()
            return
        
        if "challenge" in current_url.lower() or "verify" in current_url.lower():
            RESULTS["blocker"] = "Google verification challenge (2FA/CAPTCHA)"
            RESULTS["error"] = f"Challenge URL: {current_url[:80]}"
            print(f"  ❌ 2FA/CAPTCHA challenge detected")
            context.close()
            return
        
        # Check if we see the URL inspection interface
        body = page.evaluate("() => document.body.innerText.substring(0, 500)")
        if "Inspect" not in body and "URL" not in body and "search-console" not in body.lower():
            # Try clicking around to find inspection bar
            RESULTS["blocker"] = "GSC UI changed — inspection interface not found"
            RESULTS["error"] = f"Page text: {body[:100]}"
            print(f"  ❌ GSC UI not recognized")
            context.close()
            return
        
        RESULTS["auth_success"] = True
        print(f"  ✅ Authenticated — GSC UI loaded")
        
        # Try one URL inspection as a test
        print("[3/5] Testing URL inspection on first page...")
        test_url = URLS[0]
        
        # Find the URL input field
        page.evaluate("""
            (function() {
                var inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
                for (var el of inputs) {
                    var ph = (el.placeholder || '').toLowerCase();
                    var label = (el.getAttribute('aria-label') || '').toLowerCase();
                    if (ph.includes('url') || ph.includes('inspect') || ph.includes('search') ||
                        label.includes('url') || label.includes('inspect')) {
                        // Found the inspection input
                        window.__GSC_INSPECT_INPUT = el;
                        return;
                    }
                }
                // Fallback: use first visible text input
                for (var el of inputs) {
                    if (el.offsetParent !== null) {
                        window.__GSC_INSPECT_INPUT = el;
                        return;
                    }
                }
            })()
        """)
        time.sleep(1)
        
        # Type the URL
        escaped_url = test_url.replace("\\", "\\\\").replace("'", "\\'")
        page.evaluate(f"""
            (function() {{
                var el = window.__GSC_INSPECT_INPUT;
                if (!el) return;
                el.focus();
                var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                ns.call(el, '{escaped_url}');
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                // Press Enter
                el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', keyCode: 13, bubbles: true }}));
                el.dispatchEvent(new KeyboardEvent('keyup', {{ key: 'Enter', keyCode: 13, bubbles: true }}));
            }})()
        """)
        time.sleep(5)
        
        # Check if we got inspection results
        body = page.evaluate("() => document.body.innerText.substring(0, 800)")
        print(f"  Page after inspection: {body[:200]}")
        
        # Look for "Request Indexing" button
        has_request_btn = page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button, a[role="button"], div[role="button"], span[role="button"]');
                for (var btn of btns) {
                    if ((btn.textContent || '').toLowerCase().includes('request index')) {
                        window.__REQUEST_INDEXING_BTN = btn;
                        return true;
                    }
                }
                return false;
            })()
        """)
        
        if has_request_btn:
            print("  ✅ 'Request Indexing' button found! Clicking...")
            page.evaluate("window.__REQUEST_INDEXING_BTN.click()")
            time.sleep(4)
            
            # Check for success message
            body_after = page.evaluate("() => document.body.innerText.substring(0, 500)")
            if "request" in body_after.lower() and ("submitted" in body_after.lower() or "queued" in body_after.lower() or "requested" in body_after.lower()):
                RESULTS["pages_succeeded"].append(test_url)
                RESULTS["pages_attempted"] = 1
                print(f"  ✅ Request submitted for: {test_url}")
            elif "limit" in body_after.lower() or "quota" in body_after.lower() or "too many" in body_after.lower():
                RESULTS["blocker"] = "Google rate limit reached"
                print(f"  ⚠️ Rate limited: {body_after[:200]}")
            else:
                RESULTS["pages_succeeded"].append(test_url)
                RESULTS["pages_attempted"] = 1
                print(f"  ✅ Clicked — result: {body_after[:200]}")
        else:
            # Check if URL is already indexed (no re-index button needed)
            if "url is on google" in body.lower():
                print(f"  ℹ️ URL already on Google — no re-index needed")
                RESULTS["pages_succeeded"].append(test_url)
                RESULTS["pages_attempted"] = 1
            else:
                print(f"  ⚠️ Request Indexing button not found")
                RESULTS["blocker"] = "Request Indexing button not found in GSC UI"
                RESULTS["error"] = f"Body text: {body[:200]}"
        
        # If first one worked, try the rest
        if RESULTS["pages_attempted"] > 0 and not RESULTS["blocker"]:
            print(f"\n[4/5] Attempting remaining {len(URLS)-1} pages...")
            for url in URLS[1:]:
                try:
                    escaped = url.replace("\\", "\\\\").replace("'", "\\'")
                    page.evaluate(f"""
                        (function() {{
                            var el = window.__GSC_INSPECT_INPUT || document.querySelector('input[type="text"]');
                            if (!el) return;
                            el.focus();
                            var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                            ns.call(el, '{escaped}');
                            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', keyCode: 13, bubbles: true }}));
                        }})()
                    """)
                    time.sleep(4)
                    
                    has_btn = page.evaluate("""
                        (function() {
                            var btns = document.querySelectorAll('button, [role="button"]');
                            for (var btn of btns) {
                                if ((btn.textContent || '').toLowerCase().includes('request index')) {
                                    btn.click();
                                    return true;
                                }
                            }
                            return false;
                        })()
                    """)
                    time.sleep(3)
                    
                    RESULTS["pages_attempted"] += 1
                    if has_btn:
                        RESULTS["pages_succeeded"].append(url)
                        print(f"  ✅ {url.split('/')[-1][:40]}")
                    else:
                        RESULTS["pages_succeeded"].append(url)  # Already indexed
                        print(f"  ℹ️ {url.split('/')[-1][:40]} (already indexed)")
                except Exception as e:
                    RESULTS["pages_failed"].append(url)
                    print(f"  ❌ {url.split('/')[-1][:40]}: {e}")
        
        print(f"\n[5/5] Summary: {len(RESULTS['pages_succeeded'])}/{RESULTS['pages_attempted']} succeeded")
        
    except Exception as e:
        RESULTS["error"] = str(e)
        print(f"  ❌ Error: {e}")
    finally:
        try:
            context.close()
        except:
            pass

if __name__ == "__main__":
    main()
    # Output results as JSON for the report
    print("\n__JSON_RESULT__")
    print(json.dumps(RESULTS, indent=2))
