#!/usr/bin/env python3
"""Phase 14B Day 5 — Tier 3 Batch 7 GSC UI Request Indexing"""
import os, sys, time, json, datetime

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

BATCH7_URLS = [
    "https://www.qfinhub.com/calculators/1099-calculator",
    "https://www.qfinhub.com/calculators/age-calculator",
    "https://www.qfinhub.com/calculators/alpha-calculator",
    "https://www.qfinhub.com/calculators/arm-calculator",
    "https://www.qfinhub.com/calculators/asset-correlation",
    "https://www.qfinhub.com/calculators/basic-calculator",
    "https://www.qfinhub.com/calculators/beta-calculator",
    "https://www.qfinhub.com/calculators/bmi-calculator",
    "https://www.qfinhub.com/calculators/bond-price",
    "https://www.qfinhub.com/calculators/calorie-calculator",
]

GSC_INSPECT_URL = "https://search.google.com/search-console/inspect?resource_id=https://www.qfinhub.com/"
PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3")
RUN_LOG = "/home/admin1/qfinhub/.optimizer-data/safe-gsc-ui-indexing-run-log.json"

def escape_js(s):
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("$", "\\$")

log = {"session": "Phase 14B Day 5 — Batch 7", "started": datetime.datetime.utcnow().isoformat(),
       "results": []}

try:
    ctx = launch_persistent_context(user_data_dir=PROFILE_DIR, headless=True, humanize=True)
    page = ctx.pages[0] if ctx.pages else ctx.new_page()
    page.goto(GSC_INSPECT_URL, wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    
    if "accounts.google.com" in page.url:
        print("SESSION_EXPIRED", file=sys.stderr)
        log["session_expired"] = True
    elif "challenge" in page.url.lower():
        print("CAPTCHA_OR_2FA", file=sys.stderr)
        log["blocked"] = True
    else:
        print("Session OK — submitting URLs...")
        for url in BATCH7_URLS:
            try:
                escaped = escape_js(url)
                page.evaluate(f"""(function() {{
                    var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
                    for (var el of inputs) {{
                        if ((el.placeholder || '').toLowerCase().includes('url')) {{
                            el.focus();
                            var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                            ns.call(el, '{escaped}');
                            el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                            el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', keyCode: 13, bubbles: true }}));
                            return;
                        }}
                    }}
                }})()""")
                time.sleep(4)
                
                clicked = page.evaluate("""(function() {
                    var btns = document.querySelectorAll('button, [role="button"]');
                    for (var btn of btns) {
                        if ((btn.textContent || '').toLowerCase().includes('request index')) {
                            btn.click(); return true;
                        }
                    }
                    return false;
                })()""")
                
                result = {"url": url, "clicked": clicked, "success": True}
                print(f"  ✅ {url.split('/')[-1]}")
                log["results"].append(result)
                time.sleep(2)
            except Exception as e:
                result = {"url": url, "error": str(e), "success": False}
                print(f"  ❌ {url.split('/')[-1]}: {e}")
                log["results"].append(result)
        
        ctx.close()
        log["completed"] = datetime.datetime.utcnow().isoformat()
        log["total"] = len(BATCH7_URLS)
        log["success_count"] = sum(1 for r in log["results"] if r.get("success"))
        
        with open(RUN_LOG, "w") as f:
            json.dump(log, f, indent=2)
        
        print(f"\nBatch 7: {log['success_count']}/{log['total']} successful")
        
except Exception as e:
    log["fatal_error"] = str(e)
    print(f"FATAL: {e}", file=sys.stderr)
    with open(RUN_LOG, "w") as f:
        json.dump(log, f, indent=2)
    sys.exit(1)
