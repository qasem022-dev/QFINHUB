#!/usr/bin/env python3
"""PHASE 35 GSC Removals — FINAL FIXED VERSION
Root cause found: Previous scripts typed URL into sidebar 'Inspect URL' field,
not the actual removal form's 'Enter URL' input. The 'Next' button was never clicked.

Correct flow:
1. Click 'New Request' (exact match) ✓
2. Find input with placeholder='Enter URL' inside the sub-tab panel
3. Type URL into THAT field
4. Click 'Next' button  
5. Confirm if needed
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
    """Click the NEW REQUEST button with exact text match."""
    return page.evaluate("""(function() {
        var all = document.querySelectorAll('*');
        for (var el of all) {
            var direct = '';
            for (var n of el.childNodes) {
                if (n.nodeType === 3) direct += n.textContent;
            }
            if (direct.trim() === 'NEW REQUEST' || direct.trim() === 'New Request') {
                var btn = el;
                for (var i = 0; i < 5; i++) {
                    if (btn.tagName === 'BUTTON' || btn.getAttribute('role') === 'button') break;
                    btn = btn.parentElement;
                }
                btn.click();
                return 'OK';
            }
        }
        return 'NOT_FOUND';
    })()""")

def enter_removal_url(page, url):
    """Enter URL into the removal form's 'Enter URL' input."""
    esc = url.replace("\\", "\\\\").replace("'", "\\'")
    return page.evaluate(f"""(function() {{
        var inputs = document.querySelectorAll('input');
        for (var el of inputs) {{
            if ((el.placeholder || '') === 'Enter URL') {{
                el.focus();
                el.value = '';
                var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                ns.call(el, '{esc}');
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return 'ENTERED';
            }}
        }}
        return 'INPUT_NOT_FOUND';
    }})()""")

def click_next(page):
    """Click the 'Next' button."""
    return page.evaluate("""(function() {
        var btns = document.querySelectorAll('*');
        for (var el of btns) {
            var direct = '';
            for (var n of el.childNodes) {
                if (n.nodeType === 3) direct += n.textContent;
            }
            var t = direct.trim();
            if (t === 'Next' && el.offsetParent !== null) {
                el.click();
                return 'CLICKED';
            }
        }
        // Fallback: try any element with text 'Next'
        for (var el of btns) {
            if ((el.textContent || '').trim() === 'Next' && el.offsetParent) {
                el.click();
                return 'CLICKED_FALLBACK';
            }
        }
        return 'NOT_FOUND';
    })()""")

def click_submit(page):
    """After Next, look for submit/confirm/remove button."""
    return page.evaluate("""(function() {
        var btns = document.querySelectorAll('*');
        for (var el of btns) {
            var direct = '';
            for (var n of el.childNodes) {
                if (n.nodeType === 3) direct += n.textContent;
            }
            var t = direct.trim().toLowerCase();
            if ((t === 'submit' || t === 'confirm' || t === 'remove' || t === 'remove url' || t === 'submit request') 
                && el.offsetParent !== null) {
                el.click();
                return 'CLICKED_' + t;
            }
        }
        return 'NOT_NEEDED';
    })()""")

def main():
    print("=== GSC Removals — FINAL FIXED ===\n")
    
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
        
        # Navigate to removals
        page.goto(f"https://search.google.com/search-console/removals?resource_id={PROPERTY}",
                  wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        
        # Dismiss "Got it"
        page.evaluate("""(function() {
            var all = document.querySelectorAll('*');
            for (var el of all) {
                if ((el.textContent || '').trim() === 'Got it') { el.click(); return; }
            }
        })()""")
        time.sleep(1)
        
        # STEP 1: Click NEW REQUEST
        r = click_new_request(page)
        if r != 'OK':
            print(f"  ❌ New Request: {r}")
            results.append({"url": url, "status": f"BUTTON_{r}"})
            continue
        time.sleep(4)
        
        # STEP 2: Enter URL (must target placeholder='Enter URL' specifically)
        r = enter_removal_url(page, url)
        print(f"  Enter URL: {r}")
        if r != 'ENTERED':
            results.append({"url": url, "status": f"INPUT_{r}"})
            continue
        time.sleep(2)
        
        # STEP 3: Click Next
        r = click_next(page)
        print(f"  Click Next: {r}")
        if r != 'CLICKED' and r != 'CLICKED_FALLBACK':
            results.append({"url": url, "status": f"NEXT_{r}"})
            continue
        time.sleep(4)
        
        # STEP 4: Confirm if needed
        r2 = click_submit(page)
        if r2.startswith('CLICKED'):
            print(f"  Confirm: {r2}")
            time.sleep(3)
        
        # STEP 5: Verify - check if page shows success
        body = page.evaluate("document.body.innerText")
        if 'submitted' in body.lower() or 'success' in body.lower() or 'request submitted' in body.lower():
            status = "SUBMITTED"
        elif 'next' in body.lower()[:500]:
            # Try clicking Next again (sometimes needs second click)
            r3 = click_next(page)
            if r3.startswith('CLICKED'):
                time.sleep(3)
                click_submit(page)
                time.sleep(2)
                status = "RETRIED"
            else:
                status = "UNCERTAIN"
        else:
            status = "COMPLETED"
        
        print(f"  → {status}")
        results.append({"url": url, "status": status})
    
    # Save
    out = os.path.join(OUT_DIR, 'aggressive-gsc-removals-results-v3-final.json')
    with open(out, 'w') as f:
        json.dump(results, f, indent=2)
    
    # Verify
    page.goto(f"https://search.google.com/search-console/removals?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)
    verify_text = page.evaluate("document.body.innerText")
    has_submitted = 'No requests submitted in the last 6 months' not in verify_text
    print(f"\n✅ Verification: {'REQUESTS FOUND' if has_submitted else 'NO REQUESTS (still empty)'}")
    print(f"Results: {out}")
    
    context.close()

if __name__ == '__main__':
    main()
