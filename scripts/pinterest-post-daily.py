#!/usr/bin/env python3
"""Pinterest internal API posting via CloakBrowser."""
import os, sys, json, time

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")

from cloakbrowser import launch_persistent_context

PINS_TO_POST = [
    {
        "slug": "retirement-compare",
        "board_id": "1086071335079246635",
        "title": "FIRE at 40 vs Traditional at 65 \u2014 Which Saves More?",
        "description": "Compare FIRE vs traditional retirement. Free calculator, no signup, instant results.",
        "image_url": "https://www.qfinhub.com/pinterest-images/pin-retirement-compare-730043.png",
        "link": "https://www.qfinhub.com/calculators/financial-independence?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=retirement-compare"
    },
    {
        "slug": "mortgages-did_you_know",
        "board_id": "1086071335079246633",
        "title": "Did You Know? A 1% Rate Drop Could Save You $200/Month",
        "description": "Calculate YOUR monthly payment with our free mortgage calculator. No signup needed.",
        "image_url": "https://www.qfinhub.com/pinterest-images/pin-mortgages-did_you_know-1af697.png",
        "link": "https://www.qfinhub.com/calculators/mortgage-calculator?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=mortgages-did_you_know"
    }
]


def post_pin(page, csrf, pin):
    """Post a single pin via Pinterest internal API."""
    import json as _json
    options = {
        "board_id": pin["board_id"],
        "title": pin["title"],
        "description": pin["description"],
        "image_url": pin["image_url"],
        "link": pin["link"]
    }
    data_str = _json.dumps({"options": options, "context": {}})
    # URL-encode using JavaScript encodeURIComponent
    js_code = """
    (async function() {
        try {
            var data = __DATA__;
            var csrf = '__CSRF__';
            var resp = await fetch('/resource/PinResource/create/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                },
                body: 'source_url=/pin-builder/&data=' + encodeURIComponent(data)
            });
            var text = await resp.text();
            return {status: resp.status, body: text.substring(0, 500)};
        } catch(e) {
            return {error: e.message};
        }
    })()
    """
    js_code = js_code.replace("__DATA__", _json.dumps(data_str))
    js_code = js_code.replace("__CSRF__", csrf)
    result = page.evaluate(js_code)
    return result


def main():
    results = []
    try:
        context = launch_persistent_context(
            user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/pinterest-poster"),
            headless=True,
            humanize=True
        )
        page = context.new_page()
        
        page.goto("https://www.pinterest.com/", wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        
        if "login" in page.url.lower() or "signup" in page.url.lower():
            print("SESSION_EXPIRED: Pinterest session not authenticated")
            results = [{"slug": p["slug"], "status": "SESSION_EXPIRED"} for p in PINS_TO_POST]
        else:
            csrf = page.evaluate("""
            (function() {
                var cookies = document.cookie.split(';');
                for (var c of cookies) {
                    c = c.trim();
                    if (c.startsWith('csrftoken=')) return c.split('=')[1];
                }
                return null;
            })()
            """)
            
            if not csrf:
                print("NO_CSRF: Could not get CSRF token")
                results = [{"slug": p["slug"], "status": "NO_CSRF"} for p in PINS_TO_POST]
            else:
                print(f"CSRF acquired: {csrf[:20]}...")
                for pin in PINS_TO_POST:
                    try:
                        result = post_pin(page, csrf, pin)
                        status_ok = isinstance(result, dict) and result.get("status") == 200
                        status = "POSTED" if status_ok else "FAILED"
                        print(f"Pin {pin['slug']}: status={status} | {str(result)[:300]}")
                        results.append({"slug": pin["slug"], "status": status, "response": result})
                        time.sleep(3)
                    except Exception as e:
                        print(f"Pin {pin['slug']} ERROR: {e}")
                        results.append({"slug": pin["slug"], "status": "ERROR", "error": str(e)})
        
        context.close()
    except Exception as e:
        print(f"FATAL: {e}")
        results = [{"slug": p["slug"], "status": "FATAL", "error": str(e)} for p in PINS_TO_POST]
    
    print(json.dumps(results, indent=2))
    return results


if __name__ == "__main__":
    main()