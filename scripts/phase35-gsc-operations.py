#!/usr/bin/env python3
"""Phase 35: GSC Operations — Temporary Removals + URL Inspection + Sitemap.
Uses CloakBrowser with google-gsc-v3 persistent profile.
"""
import os, sys, time, json
sys.path.insert(0, os.path.expanduser('~/.local/lib'))
os.environ.setdefault("LD_LIBRARY_PATH", os.path.expanduser("~/.local/lib"))

from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser('~/.hermes/cloak-profiles/google-gsc-v3')
PROPERTY = 'https://www.qfinhub.com/'
OUT_DIR = '/home/admin1/qfinhub/.optimizer-data/phase35'

# ---- REMOVAL TARGETS ----
REMOVAL_URLS = [
    "https://www.qfinhub.com/tools/compound-100k-20yr-5pct",
    "https://www.qfinhub.com/tools/compound-500k-15yr-5pct",
    "https://www.qfinhub.com/tools/mortgage-200k-15yr-5-5pct",
    "https://www.qfinhub.com/tools/compound-150k-10yr-5pct",
    "https://www.qfinhub.com/tools/mortgage-900k-30yr-7pct",
    "https://www.qfinhub.com/tools/mortgage-200k-30yr-6pct",
    "https://www.qfinhub.com/all-pages",
]

# ---- PRIORITY INDEXING TARGETS ----
INDEXING_URLS = [
    "https://www.qfinhub.com/calculators/compound-interest",
    "https://www.qfinhub.com/calculators/mortgage-calculator",
    "https://www.qfinhub.com/calculators/loan-calculator",
    "https://www.qfinhub.com/blog/20000-loan-5-years-8-percent-monthly-payment",
    "https://www.qfinhub.com/loan-payment-table",
    "https://www.qfinhub.com/data",
    "https://www.qfinhub.com/loan-scenarios/good-credit-loan-20000-8-percent",
    "https://www.qfinhub.com/loan-scenarios/small-emergency-loan-5000-15-percent",
    "https://www.qfinhub.com/loan-scenarios/debt-consolidation-loan-25000-10-percent",
    "https://www.qfinhub.com/loan-scenarios/fair-credit-loan-20000-20-percent",
]

results = {"removals": [], "url_inspection": [], "sitemap": None}

def main():
    print("=== Phase 35 GSC Operations ===")
    print(f"Profile: {PROFILE}")
    
    context = launch_persistent_context(
        user_data_dir=PROFILE,
        headless=True,
        humanize=True,
    )
    page = context.new_page()
    
    # Auth check
    print("\n--- AUTH CHECK ---")
    page.goto(f"https://search.google.com/search-console?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    
    if "accounts.google.com" in page.url:
        print("SESSION EXPIRED — Google login required. Qasem must re-auth.")
        context.close()
        return
    
    if "challenge" in page.url.lower():
        print("CAPTCHA/2FA CHALLENGE — cannot proceed. Ask Qasem.")
        context.close()
        return
    
    print("AUTH OK — session active")
    
    # ================================================================
    # TASK 1: GSC TEMPORARY REMOVALS
    # ================================================================
    print("\n=== TASK 1: GSC Temporary Removals ===")
    print(f"Targets: {len(REMOVAL_URLS)} URLs")
    
    page.goto(
        f"https://search.google.com/search-console/removals?resource_id={PROPERTY}",
        wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)
    
    for i, url in enumerate(REMOVAL_URLS):
        print(f"  [{i+1}/{len(REMOVAL_URLS)}] {url.split('/')[-1]}")
        
        # Click "New Request" button
        clicked = page.evaluate("""(function() {
            var btns = document.querySelectorAll('button, [role="button"], span');
            for (var btn of btns) {
                if ((btn.textContent || '').trim().toLowerCase().includes('new request')) {
                    btn.click();
                    return 'clicked';
                }
            }
            return 'not_found';
        })()""")
        time.sleep(3)
        
        if clicked == 'not_found':
            print(f"    ⚠ 'New Request' button not found")
            results["removals"].append({"url": url, "status": "BUTTON_NOT_FOUND"})
            continue
        
        # Select "Temporarily remove URL"
        page.evaluate("""(function() {
            var items = document.querySelectorAll('span, div, li, [role="option"]');
            for (var el of items) {
                if ((el.textContent || '').toLowerCase().includes('temporarily remove')) {
                    el.closest('[role="option"], li, div').click();
                    return;
                }
            }
        })()""")
        time.sleep(2)
        
        # Enter URL
        esc = url.replace("\\", "\\\\").replace("'", "\\'")
        entered = page.evaluate(f"""(function() {{
            var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
            for (var el of inputs) {{
                var ph = (el.placeholder || '').toLowerCase();
                var label = (el.getAttribute('aria-label') || '').toLowerCase();
                if (ph.includes('url') || label.includes('url') || ph.includes('enter')) {{
                    el.focus();
                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    ns.call(el, '{esc}');
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    return 'entered';
                }}
            }}
            return 'not_found';
        }})()""")
        time.sleep(2)
        
        if entered == 'not_found':
            print(f"    ⚠ URL input not found")
            results["removals"].append({"url": url, "status": "INPUT_NOT_FOUND"})
            continue
        
        # Click submit/next
        submitted = page.evaluate("""(function() {
            var btns = document.querySelectorAll('button, [role="button"]');
            for (var btn of btns) {
                var t = (btn.textContent || '').trim().toLowerCase();
                if (t === 'next' || t === 'submit' || t.includes('remove')) {
                    btn.click();
                    return 'clicked_' + t;
                }
            }
            return 'not_found';
        })()""")
        time.sleep(3)
        
        # Confirm if needed
        page.evaluate("""(function() {
            var btns = document.querySelectorAll('button, [role="button"]');
            for (var btn of btns) {
                var t = (btn.textContent || '').trim().toLowerCase();
                if (t === 'submit' || t === 'confirm' || t === 'remove') {
                    btn.click();
                    return;
                }
            }
        })()""")
        time.sleep(3)
        
        status = "SUBMITTED" if submitted != 'not_found' else "SUBMIT_FAILED"
        print(f"    → {status}")
        results["removals"].append({"url": url, "status": status})
        
        # Go back to removals page for next URL
        page.goto(
            f"https://search.google.com/search-console/removals?resource_id={PROPERTY}",
            wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
    
    # ================================================================
    # TASK 2: URL INSPECTION + REQUEST INDEXING
    # ================================================================
    print(f"\n=== TASK 2: URL Inspection + Request Indexing ===")
    print(f"Targets: {len(INDEXING_URLS)} URLs")
    
    # V2: Sidebar navigation to URL Inspection
    page.goto(f"https://search.google.com/search-console?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)
    
    # Click "URL inspection" in sidebar
    page.evaluate("""(function() {
        var links = document.querySelectorAll('a, [role="link"], span');
        for (var el of links) {
            var t = (el.textContent || '').trim().toLowerCase();
            if (t.includes('url inspection') || t.includes('inspect')) {
                el.click();
                return 'clicked';
            }
        }
        return 'not_found';
    })()""")
    time.sleep(5)
    
    for i, url in enumerate(INDEXING_URLS):
        print(f"  [{i+1}/{len(INDEXING_URLS)}] {url.split('/')[-1]}")
        
        # Enter URL in inspection field
        esc = url.replace("\\", "\\\\").replace("'", "\\'")
        entered = page.evaluate(f"""(function() {{
            var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
            for (var el of inputs) {{
                var ph = (el.placeholder || '').toLowerCase();
                var label = (el.getAttribute('aria-label') || '').toLowerCase();
                if (ph.includes('url') || label.includes('url') || ph.includes('inspect')) {{
                    el.focus();
                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    ns.call(el, '{esc}');
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', keyCode: 13, bubbles: true }}));
                    return 'entered';
                }}
            }}
            return 'not_found';
        }})()""")
        
        if entered == 'not_found':
            print(f"    ⚠ URL input not found")
            results["url_inspection"].append({"url": url, "status": "INPUT_NOT_FOUND"})
            continue
        
        # Wait for Google to complete inspection (8-10 seconds)
        time.sleep(8)
        
        # Click "Request Indexing" if available
        requested = page.evaluate("""(function() {
            var btns = document.querySelectorAll('button, [role="button"], span');
            for (var btn of btns) {
                var t = (btn.textContent || '').trim().toLowerCase();
                if (t.includes('request index')) {
                    btn.click();
                    return 'clicked';
                }
            }
            // Retry: check again after finding the button
            for (var btn of btns) {
                if ((btn.textContent || '').includes('Request Indexing')) {
                    btn.closest('button, [role="button"]').click();
                    return 'clicked_deep';
                }
            }
            return 'not_found';
        })()""")
        time.sleep(3)
        
        status = "INDEXING_REQUESTED" if requested.startswith('clicked') else f"BUTTON_{requested.upper()}"
        print(f"    → {status}")
        results["url_inspection"].append({"url": url, "status": status})
    
    # ================================================================
    # TASK 3: SITEMAP RESUBMISSION
    # ================================================================
    print("\n=== TASK 3: Sitemap Resubmission ===")
    
    page.goto(f"https://search.google.com/search-console/sitemaps?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)
    
    # Find sitemap input and submit
    sm_url = "https://www.qfinhub.com/sitemap.xml"
    esc_sm = sm_url.replace("\\", "\\\\").replace("'", "\\'")
    
    submitted = page.evaluate(f"""(function() {{
        var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (var el of inputs) {{
            var ph = (el.placeholder || '').toLowerCase();
            if (ph.includes('sitemap') || ph.includes('enter')) {{
                el.focus();
                var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                ns.call(el, '{esc_sm}');
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                // Click submit button
                var submit = el.closest('form')?.querySelector('button[type="submit"]') 
                    || document.querySelector('button[type="submit"]');
                if (submit) submit.click();
                return 'submitted';
            }}
        }}
        return 'not_found';
    }})()""")
    time.sleep(4)
    
    results["sitemap"] = {"status": "SUBMITTED" if submitted == 'submitted' else "NOT_SUBMITTED", "url": sm_url}
    print(f"  Sitemap: {results['sitemap']['status']}")
    
    # Save results
    output_path = os.path.join(OUT_DIR, 'aggressive-gsc-operations-results.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    print(f"\nResults saved to {output_path}")
    
    context.close()
    return results

if __name__ == '__main__':
    main()
