#!/usr/bin/env python3
"""PHASE 35: Debug GSC Removals flow with screenshots at each step.
Uses CloakBrowser with google-gsc-v3 persistent profile.
Saves screenshots so we can see what the DOM looks like at the failure point.
"""
import os, sys, time, json, base64
sys.path.insert(0, os.path.expanduser('~/.local/lib'))
os.environ.setdefault("LD_LIBRARY_PATH", os.path.expanduser("~/.local/lib"))

from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser('~/.hermes/cloak-profiles/google-gsc-v3')
PROPERTY = 'https://www.qfinhub.com/'
OUT_DIR = '/home/admin1/qfinhub/.optimizer-data/phase35'
os.makedirs(OUT_DIR, exist_ok=True)

TEST_URL = "https://www.qfinhub.com/tools/compound-100k-20yr-5pct"

def screenshot(page, name):
    path = os.path.join(OUT_DIR, f'gsc-removals-debug-{name}.png')
    page.screenshot(path=path, full_page=False)
    print(f"  📸 {path}")
    return path

def main():
    print("=== GSC Removals Debug — Screenshot at each step ===\n")
    
    # Try non-headless first so Qasem can see the browser
    try:
        context = launch_persistent_context(
            user_data_dir=PROFILE,
            headless=False,  # SHOW THE BROWSER
            humanize=True,
            viewport={"width": 1400, "height": 900},
        )
        print("✅ Launched VISIBLE browser")
    except Exception as e:
        print(f"⚠ Non-headless failed ({e}), trying headless...")
        context = launch_persistent_context(
            user_data_dir=PROFILE,
            headless=True,
            humanize=True,
            viewport={"width": 1400, "height": 900},
        )
        print("✅ Launched headless browser")
    
    page = context.new_page()
    
    # AUTH CHECK
    print("\n--- STEP 1: Auth Check ---")
    page.goto(f"https://search.google.com/search-console?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    
    if "accounts.google.com" in page.url:
        print("❌ SESSION EXPIRED — need re-auth")
        context.close()
        return
    if "challenge" in page.url.lower():
        print("❌ CAPTCHA — cannot proceed")
        context.close()
        return
    
    print("✅ Authenticated")
    screenshot(page, "01-auth-ok")
    
    # NAVIGATE TO REMOVALS PAGE
    print("\n--- STEP 2: GSC Removals Page ---")
    page.goto(f"https://search.google.com/search-console/removals?resource_id={PROPERTY}",
              wait_until="domcontentloaded", timeout=30000)
    time.sleep(5)
    
    # Dump page text to see what's visible
    body_text = page.evaluate("document.body.innerText")
    print(f"Page text (first 500 chars):\n{body_text[:500]}")
    screenshot(page, "02-removals-page")
    
    # FIND THE NEW REQUEST BUTTON
    print("\n--- STEP 3: Find 'New Request' button ---")
    btns_info = page.evaluate("""(function() {
        var btns = document.querySelectorAll('button, [role="button"], span, div');
        var found = [];
        for (var btn of btns) {
            var t = (btn.textContent || btn.innerText || '').trim();
            if (t.length > 0 && t.length < 50) {
                found.push({
                    tag: btn.tagName,
                    role: btn.getAttribute('role') || '',
                    text: t,
                    classes: (btn.className || '').slice(0, 80)
                });
            }
        }
        return found.slice(0, 30);
    })()""")
    print("Visible buttons/elements on page:")
    for b in btns_info:
        print(f"  [{b['tag']} role={b['role']}] \"{b['text'][:60]}\" classes={b['classes'][:40]}")
    
    # Try to click "New Request"
    clicked = page.evaluate("""(function() {
        var btns = document.querySelectorAll('button, [role="button"], span, div, a');
        for (var btn of btns) {
            var t = (btn.textContent || '').trim().toLowerCase();
            if (t.includes('new request')) {
                btn.scrollIntoView({block: 'center'});
                btn.click();
                return 'CLICKED: ' + btn.tagName + ' text=' + t.slice(0, 30);
            }
        }
        return 'NOT_FOUND';
    })()""")
    print(f"Click result: {clicked}")
    
    if clicked == 'NOT_FOUND':
        print("❌ 'New Request' button not found — listing ALL text elements...")
        all_text = page.evaluate("""(function() {
            var all = document.querySelectorAll('*');
            var texts = [];
            for (var el of all) {
                var t = (el.textContent || '').trim();
                if (t.length > 3 && t.length < 50 && el.children.length === 0) {
                    texts.push(t);
                }
            }
            return texts.slice(0, 50);
        })()""")
        for t in all_text:
            print(f"  \"{t}\"")
        screenshot(page, "03-button-not-found")
        context.close()
        return
    
    time.sleep(4)
    screenshot(page, "03-after-new-request-click")
    
    # DUMP THE MODAL/FORM TEXT
    print("\n--- STEP 4: Dump modal/form after clicking New Request ---")
    modal_text = page.evaluate("document.body.innerText")
    print(f"Full page text after click (first 800):\n{modal_text[:800]}")
    
    # Look for URL input
    inputs_found = page.evaluate("""(function() {
        var inputs = document.querySelectorAll('input, textarea');
        var found = [];
        for (var el of inputs) {
            found.push({
                tag: el.tagName,
                type: el.type || 'text',
                placeholder: el.placeholder || '',
                ariaLabel: el.getAttribute('aria-label') || '',
                name: el.name || '',
                id: el.id || '',
                visible: el.offsetParent !== null
            });
        }
        return found;
    })()""")
    print(f"Input fields found: {json.dumps(inputs_found, indent=2)}")
    
    # Try to find a dropdown/selector for "Temporarily remove URL" vs "Clear cache URL"
    radio_opts = page.evaluate("""(function() {
        var opts = document.querySelectorAll('input[type="radio"], [role="radio"], [role="option"], [role="menuitem"]');
        var found = [];
        for (var el of opts) {
            var label = el.getAttribute('aria-label') || '';
            var text = (el.textContent || '').trim();
            var id = el.id || '';
            found.push({tag: el.tagName, id: id, label: label, text: text.slice(0, 60)});
        }
        return found;
    })()""")
    print(f"Radio/option elements: {json.dumps(radio_opts, indent=2)}")
    
    screenshot(page, "04-modal-form")
    
    # Try to set URL directly using any input
    print("\n--- STEP 5: Try to enter URL ---")
    esc = TEST_URL.replace("\\", "\\\\").replace("'", "\\'")
    entered = page.evaluate(f"""(function() {{
        var inputs = document.querySelectorAll('input');
        for (var el of inputs) {{
            if (el.offsetParent !== null) {{  // visible only
                el.focus();
                var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                ns.call(el, '{esc}');
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                return 'ENTERED into: ' + (el.placeholder || el.getAttribute('aria-label') || el.name || 'unknown');
            }}
        }}
        return 'NO_VISIBLE_INPUT';
    }})()""")
    print(f"URL entry result: {entered}")
    
    time.sleep(2)
    screenshot(page, "05-url-entered")
    
    # Look for submit/next button
    print("\n--- STEP 6: Find submit button ---")
    submit_btns = page.evaluate("""(function() {
        var btns = document.querySelectorAll('button, [role="button"]');
        var found = [];
        for (var btn of btns) {
            var t = (btn.textContent || '').trim();
            if (t.length > 0 && btn.offsetParent !== null) {
                found.push({text: t, disabled: btn.disabled, tag: btn.tagName});
            }
        }
        return found;
    })()""")
    print(f"Visible submit buttons: {json.dumps(submit_btns, indent=2)}")
    
    # Try clicking submit
    submit_clicked = page.evaluate("""(function() {
        var btns = document.querySelectorAll('button, [role="button"]');
        for (var btn of btns) {
            var t = (btn.textContent || '').trim().toLowerCase();
            if ((t === 'next' || t === 'submit' || t.includes('remove') || t.includes('continue')) 
                && btn.offsetParent !== null && !btn.disabled) {
                btn.click();
                return 'CLICKED: ' + t;
            }
        }
        return 'NOT_FOUND';
    })()""")
    print(f"Submit click: {submit_clicked}")
    
    time.sleep(3)
    screenshot(page, "06-after-submit")
    
    print(f"\n✅ Debug complete. Screenshots saved to {OUT_DIR}/")
    print(f"Current URL: {page.url}")
    
    # Keep browser open for 30s if non-headless so Qasem can see it
    if not context.browser_type.name == 'headless':
        print("\n⏰ Browser stays open for 60s — Qasem, inspect and tell me what to fix!")
        time.sleep(60)
    
    context.close()

if __name__ == '__main__':
    main()
