#!/usr/bin/env python3
"""
QFINHUB Directory Submission Script - Phase 38
Submits QFINHUB to free tool directories using CloakBrowser.
Uses page.type() and page.fill() to avoid f-string backslash issues.
"""
import os, time, sys

os.environ['LD_LIBRARY_PATH'] = os.path.expanduser('~/.local/lib')
from cloakbrowser import launch_persistent_context

SITE_DATA = {
    "name": "QFINHUB",
    "url": "https://www.qfinhub.com",
    "description": "126 free financial calculators for mortgages, loans, investments, retirement, taxes, and business finance. No signup required.",
    "short_desc": "126 free financial calculators - instant results, no signup required.",
    "category": "Finance",
    "tags": "finance, calculator, mortgage, investment, retirement, tax, loan",
    "email": "qasem022@gmail.com",
}

def check_page(page, label):
    """Check if page loaded properly and capture form fields"""
    print(f"\n=== {label} ===")
    print(f"URL: {page.url}")
    body = page.evaluate("document.body.innerText.substring(0, 800)")
    print(f"Body: {body[:400]}")
    
    fields = page.evaluate("""
        (function() {
            var inputs = document.querySelectorAll('input, textarea, select');
            var results = [];
            for (var el of inputs) {
                if (el.type && el.type !== 'hidden' && el.type !== 'submit' && el.type !== 'button') {
                    results.push({
                        type: el.type,
                        name: el.name || el.id || '',
                        placeholder: el.placeholder || '',
                        label: el.getAttribute('aria-label') || ''
                    });
                }
            }
            return results;
        })()
    """)
    print(f"Form fields ({len(fields)}):")
    for f in fields[:15]:
        print(f"  type={f['type']} name={f['name']} placeholder={f['placeholder'][:30]}")
    return fields

def try_fill_and_submit(page, fields):
    """Try to fill common form fields and submit"""
    for field in fields:
        name = (field.get('name', '') + ' ' + field.get('placeholder', '') + ' ' + field.get('label', '')).lower()
        
        try:
            if 'name' in name and 'tool' not in name or 'tool name' in name:
                el = page.locator(f'input[name="{field["name"]}"], input[placeholder*="name" i]').first
                if el.count() > 0:
                    el.fill(SITE_DATA["name"])
                    time.sleep(1)
                    
            elif 'url' in name or 'website' in name or 'link' in name:
                el = page.locator('input[placeholder*="url" i], input[placeholder*="website" i], input[name*="url" i]').first
                if el.count() > 0:
                    el.fill(SITE_DATA["url"])
                    time.sleep(1)
                    
            elif 'email' in name:
                el = page.locator('input[type="email"], input[placeholder*="email" i]').first
                if el.count() > 0:
                    el.fill(SITE_DATA["email"])
                    time.sleep(1)
                    
            elif 'description' in name or 'desc' in name:
                el = page.locator('textarea[placeholder*="desc" i], textarea[name*="desc" i]').first
                if el.count() > 0:
                    el.fill(SITE_DATA["description"])
                    time.sleep(1)
                    
        except Exception:
            pass
    
    # Try submit
    time.sleep(2)
    submitted = page.evaluate("""
        (function() {
            var btns = document.querySelectorAll('button, input[type="submit"], [role="button"]');
            for (var btn of btns) {
                var t = (btn.textContent || btn.value || '').toLowerCase();
                if (t.includes('submit') || t.includes('create') || t.includes('add') || t.includes('publish')) {
                    btn.click();
                    return 'CLICKED: ' + t.trim();
                }
            }
            return 'NO_SUBMIT_BUTTON';
        })()
    """)
    print(f"Submit: {submitted}")
    time.sleep(5)
    print(f"Post-submit URL: {page.url}")
    return True

def main():
    print("=== QFINHUB Directory Submission Phase 38 ===")

    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/directory-submitter"),
        headless=True,
        humanize=True,
    )
    page = ctx.pages[0] if ctx.pages else ctx.new_page()

    # 1. Toolify.ai
    try:
        page.goto("https://www.toolify.ai/submit", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        fields = check_page(page, "Toolify.ai")
        if "login" not in page.url.lower():
            try_fill_and_submit(page, fields)
        else:
            print("Toolify: NEEDS LOGIN")
    except Exception as e:
        print(f"Toolify error: {e}")

    # 2. Futurepedia
    try:
        page.goto("https://www.futurepedia.io/submit-tool", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        fields = check_page(page, "Futurepedia.io")
        if "login" not in page.url.lower():
            try_fill_and_submit(page, fields)
        else:
            print("Futurepedia: NEEDS LOGIN")
    except Exception as e:
        print(f"Futurepedia error: {e}")

    # 3. TheresAnAIForThat
    try:
        page.goto("https://theresanaiforthat.com/submit", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        fields = check_page(page, "TheresAnAIForThat.com")
    except Exception as e:
        print(f"TAAFT error: {e}")

    # 4. Aivalley
    try:
        page.goto("https://aivalley.ai/submit-a-tool/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        fields = check_page(page, "AIValley.ai")
        if "login" not in page.url.lower():
            try_fill_and_submit(page, fields)
    except Exception as e:
        print(f"AIValley error: {e}")

    # 5. FindMyAITool
    try:
        page.goto("https://www.findmyaitool.com/submit", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        fields = check_page(page, "FindMyAITool.com")
    except Exception as e:
        print(f"FindMyAITool error: {e}")

    print("\n=== Directory Submission Complete ===")
    ctx.close()

if __name__ == "__main__":
    main()