#!/usr/bin/env python3
"""PHASE 35 GSC Removals — FIXED version with precise selectors.
BUG FOUND: First selector matched a Material icon component (feedback/e8fd)
instead of the actual 'New Request' button. Fix: exact text match.
"""
import os, sys, time, json
sys.path.insert(0, os.path.expanduser('~/.local/lib'))
os.environ.setdefault("LD_LIBRARY_PATH", os.path.expanduser("~/.local/lib"))

from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser('~/.hermes/cloak-profiles/google-gsc-v3')
PROPERTY = 'https://www.qfinhub.com/'
OUT_DIR = '/home/admin1/qfinhub/.optimizer-data/phase35'

URLS = [
    "https://www.qfinhub.com/tools/compound-100k-20yr-5pct",
    "https://www.qfinhub.com/tools/compound-500k-15yr-5pct",
    "https://www.qfinhub.com/tools/mortgage-200k-15yr-5-5pct",
    "https://www.qfinhub.com/tools/compound-150k-10yr-5pct",
    "https://www.qfinhub.com/tools/mortgage-900k-30yr-7pct",
    "https://www.qfinhub.com/tools/mortgage-200k-30yr-6pct",
    "https://www.qfinhub.com/all-pages",
]

def click_new_request(page):
    """Click the 'NEW REQUEST' button with EXACT text match."""
    return page.evaluate("""(function() {
        // Strategy 1: Find ALL elements, check for EXACT text 'NEW REQUEST'
        var all = document.querySelectorAll('*');
        for (var el of all) {
            // Get direct text (only child text nodes, not Material icon unicode)
            var directText = '';
            for (var node of el.childNodes) {
                if (node.nodeType === 3) directText += node.textContent;
            }
            var t = directText.trim();
            if (t === 'NEW REQUEST' || t === 'New Request') {
                el.scrollIntoView({block: 'center'});
                // Try to click a parent that's actually clickable
                var clickable = el;
                for (var i = 0; i < 3; i++) {
                    if (clickable.tagName === 'BUTTON' || clickable.tagName === 'A') break;
                    var role = clickable.getAttribute('role') || '';
                    if (role === 'button') break;
                    clickable = clickable.parentElement;
                }
                clickable.click();
                return 'CLICKED_EXACT_MATCH';
            }
        }
        
        // Strategy 2: Find mat-menu-item or similar Angular Material component
        var matItems = document.querySelectorAll('[role="menuitem"], [role="option"], .mat-mdc-menu-item');
        for (var item of matItems) {
            if ((item.textContent || '').trim().toLowerCase() === 'new request') {
                item.click();
                return 'CLICKED_MAT_MENU_ITEM';
            }
        }
        
        // Strategy 3: Find by visible text span
        var spans = document.querySelectorAll('span');
        for (var s of spans) {
            if ((s.textContent || '').trim() === 'New Request' && s.offsetParent !== null) {
                var p = s.closest('button, [role="button"], div[tabindex]') || s;
                p.click();
                return 'CLICKED_SPAN_PARENT';
            }
        }
        
        return 'NOT_FOUND';
    })()""")

def find_url_input(page):
    """Find the URL input field in the removal form."""
    return page.evaluate("""(function() {
        var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
        for (var el of inputs) {
            // Look for inputs that appeared after clicking New Request
            // GSC removal form typically has a label/placeholder with 'URL' or 'Enter'
            var ph = (el.placeholder || '').toLowerCase();
            var label = (el.getAttribute('aria-label') || '').toLowerCase();
            var nearby = '';
            var parent = el.closest('div, form');
            if (parent) nearby = (parent.textContent || '').toLowerCase().slice(0, 100);
            
            if (ph.includes('url') || label.includes('url') || 
                nearby.includes('temporarily remove') || nearby.includes('enter url')) {
                return {found: true, placeholder: el.placeholder, ariaLabel: el.getAttribute('aria-label'),
                        tag: el.tagName, nearby: nearby.slice(0, 80)};
            }
        }
        // Fallback: return ALL visible text inputs
        var allVisible = [];
        for (var el of inputs) {
            if (el.offsetParent !== null) {
                allVisible.push({
                    placeholder: el.placeholder || '(none)',
                    ariaLabel: el.getAttribute('aria-label') || '(none)',
                    nearby: (el.closest('div, form')?.textContent || '').slice(0, 60)
                });
            }
        }
        return {found: false, allInputs: allVisible.slice(0, 5)};
    })()""")

def find_submit_button(page):
    """Find the submit/next/remove button."""
    return page.evaluate("""(function() {
        var btns = document.querySelectorAll('button, [role="button"], input[type="submit"]');
        for (var btn of btns) {
            if (!btn.offsetParent) continue;
            var t = (btn.textContent || btn.value || '').trim().toLowerCase();
            if (t === 'next' || t === 'submit' || t === 'remove' || 
                t.includes('next') || t.includes('submit') || t.includes('remove') ||
                t.includes('add request')) {
                if (!btn.disabled) {
                    btn.click();
                    return 'CLICKED: ' + t.slice(0, 40);
                }
                return 'DISABLED: ' + t.slice(0, 40);
            }
        }
        // Try form submit
        var forms = document.querySelectorAll('form');
        for (var f of forms) {
            if (f.offsetParent) {
                f.submit();
                return 'FORM_SUBMITTED';
            }
        }
        return 'NOT_FOUND';
    })()""")

def main():
    print("=== GSC Removals — FIXED VERSION ===\n")
    
    context = launch_persistent_context(
        user_data_dir=PROFILE, headless=True, humanize=True,
        viewport={"width": 1400, "height": 900},
    )
    page = context.new_page()
    
    # Auth
    page.goto(f"https://search.google.com/search-console?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    if "accounts.google.com" in page.url:
        print("❌ SESSION EXPIRED"); context.close(); return
    
    print("✅ Auth OK\n")
    
    results = []
    
    for i, url in enumerate(URLS):
        short = url.split('/')[-1]
        print(f"[{i+1}/{len(URLS)}] {short}")
        
        # Navigate to removals page
        page.goto(f"https://search.google.com/search-console/removals?resource_id={PROPERTY}",
                  wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)
        
        # Dismiss "Got it" banner if present
        page.evaluate("""(function() {
            var btns = document.querySelectorAll('*');
            for (var el of btns) {
                if ((el.textContent || '').trim() === 'Got it' && el.offsetParent) {
                    el.click(); return 'DISMISSED';
                }
            }
            return 'NO_BANNER';
        })()""")
        time.sleep(1)
        
        # Click NEW REQUEST
        clicked = click_new_request(page)
        print(f"  Click New Request: {clicked}")
        
        if clicked == 'NOT_FOUND':
            results.append({"url": url, "status": "BUTTON_NOT_FOUND"})
            continue
        
        time.sleep(4)
        
        # Enter URL
        esc = url.replace("\\", "\\\\").replace("'", "\\'")
        entered = page.evaluate(f"""(function() {{
            var inputs = document.querySelectorAll('input[type="text"], input:not([type]), textarea');
            for (var el of inputs) {{
                if (!el.offsetParent) continue;
                var ph = (el.placeholder || '').toLowerCase();
                var label = (el.getAttribute('aria-label') || '').toLowerCase();
                var parent = (el.closest('div, form, [role="dialog"]')?.textContent || '').toLowerCase();
                
                // Match: input inside removal form
                if (parent.includes('remov') || parent.includes('temporarily') ||
                    label.includes('url') || ph.includes('url') ||
                    parent.includes('enter the url') || parent.includes('enter url')) {{
                    
                    el.focus();
                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    ns.call(el, '{esc}');
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', bubbles: true }}));
                    return 'ENTERED';
                }}
            }}
            
            // FALLBACK: just pick the first visible input in a form/dialog
            for (var el of inputs) {{
                if (!el.offsetParent) continue;
                var dialog = el.closest('[role="dialog"], form, mat-dialog-container');
                if (dialog) {{
                    el.focus();
                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    ns.call(el, '{esc}');
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    return 'ENTERED_FALLBACK';
                }}
            }}
            return 'NO_INPUT';
        }})()""")
        print(f"  Enter URL: {entered}")
        
        if entered == 'NO_INPUT':
            # Debug: dump what inputs are visible
            inputs_debug = find_url_input(page)
            print(f"  Input debug: {json.dumps(inputs_debug, indent=4)[:300]}")
            results.append({"url": url, "status": "INPUT_NOT_FOUND"})
            continue
        
        time.sleep(3)
        
        # Press Enter to confirm / move to next step
        page.keyboard.press('Enter')
        time.sleep(2)
        
        # Click submit
        submitted = find_submit_button(page)
        print(f"  Submit: {submitted}")
        
        time.sleep(2)
        
        # Check for confirmation/second screen
        submitted2 = find_submit_button(page)
        if submitted2.startswith('CLICKED'):
            print(f"  Submit (confirm): {submitted2}")
            time.sleep(2)
        
        status = "SUCCESS" if submitted.startswith('CLICKED') or submitted.startswith('FORM') else submitted
        print(f"  → {status}")
        results.append({"url": url, "status": status})
    
    # Save
    out = os.path.join(OUT_DIR, 'aggressive-gsc-removals-results-v2.json')
    with open(out, 'w') as f:
        json.dump(results, f, indent=2)
    
    success = sum(1 for r in results if r['status'] == 'SUCCESS')
    print(f"\n✅ {success}/{len(URLS)} submitted. Results: {out}")
    
    context.close()

if __name__ == '__main__':
    main()
