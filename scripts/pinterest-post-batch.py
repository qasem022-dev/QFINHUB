#!/usr/bin/env python3
"""Post 5 Pinterest pins via CloakBrowser internal API (Phase 36)."""
import os, sys, json, time, datetime

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")

BASE_URL = "https://www.qfinhub.com"
IMG_BASE = f"{BASE_URL}/pinterest-images"

# 5 pins selected from daily queue — different categories, matching images
PINS = [
    {
        "category": "retirement",
        "title": "FIRE at 40  vs  Traditional at 65",
        "description": "FIRE at 40  vs  Traditional at 65\n\nSee which saves you more — one click, instant answer\n\n125 free calculators. No signup. Instant results.\n\n#RetirementPlanning #FIRE #FinancialFreedom #QFINHUB",
        "link": f"{BASE_URL}/calculators/financial-independence?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=retirement-compare",
        "image": "pin-retirement-compare-730043.png",
        "board_id": "1086071335079246635",
        "board_name": "Retirement Planning",
        "slug": "retirement-compare",
    },
    {
        "category": "mortgages",
        "title": "Did You Know? You pay 56% in interest over 30 years",
        "description": "Did You Know? You pay 56% in interest over 30 years\n\nCalculate your own numbers instantly — free, no signup\n\n125 free calculators. No signup. Instant results.\n\n#MortgageCalculator #HomeBuying #PersonalFinance #QFINHUB",
        "link": f"{BASE_URL}/calculators/mortgage-calculator?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=mortgages-did-you-know",
        "image": "pin-mortgages-did_you_know-1af697.png",
        "board_id": "1086071335079246633",
        "board_name": "Mortgage Calculators",
        "slug": "mortgages-did-you-know",
    },
    {
        "category": "debt",
        "title": "Did You Know? Adding $200/month saves $1,800 in interest",
        "description": "Did You Know? Adding $200/month saves $1,800 in interest\n\nCalculate your own numbers instantly — free, no signup\n\n125 free calculators. No signup. Instant results.\n\n#DebtPayoff #CreditCardDebt #PersonalFinance #QFINHUB",
        "link": f"{BASE_URL}/calculators/credit-card-payoff?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=debt-did-you-know",
        "image": "pin-debt-did_you_know-e1820e.png",
        "board_id": "1086071335079246637",
        "board_name": "Debt Payoff Tools",
        "slug": "debt-did-you-know",
    },
    {
        "category": "loans",
        "title": "Did You Know? Total interest on 5yr $30K loan at 8%: $6,500",
        "description": "Did You Know? Total interest on 5yr $30K loan at 8%: $6,500\n\nCalculate your own numbers instantly — free, no signup\n\n125 free calculators. No signup. Instant results.\n\n#LoanCalculator #MonthlyPayment #PersonalFinance #QFINHUB",
        "link": f"{BASE_URL}/calculators/loan-calculator?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=loans-did-you-know",
        "image": "pin-loans-did_you_know-e3323f.png",
        "board_id": "1086071335079246636",
        "board_name": "Loan Calculators",
        "slug": "loans-did-you-know",
    },
    {
        "category": "taxes",
        "title": "Standard Deduction  vs  Itemized Deductions",
        "description": "Standard Deduction  vs  Itemized Deductions\n\nSee which saves you more — one click, instant answer\n\n125 free calculators. No signup. Instant results.\n\n#TaxCalculator #TaxDeductions #PersonalFinance #QFINHUB",
        "link": f"{BASE_URL}/calculators/tax-calculator?utm_source=pinterest&utm_medium=organic_pin&utm_campaign=calculator_growth&utm_content=taxes-compare",
        "image": "pin-taxes-compare-3e1bb9.png",
        "board_id": "1086071335079246638",
        "board_name": "Tax Calculators",
        "slug": "taxes-compare",
    },
]


def escape_js(text: str) -> str:
    """Escape string for safe interpolation into JS single-quoted string."""
    return (text.replace("\\", "\\\\")
                .replace("'", "\\'")
                .replace("\n", "\\n")
                .replace("$", "\\$"))


def main():
    img_dir = "/home/admin1/qfinhub/public/pinterest-images"
    
    # Verify all images exist
    for pin in PINS:
        path = os.path.join(img_dir, pin["image"])
        if not os.path.exists(path):
            print(f"❌ IMAGE MISSING: {pin['image']}")
            return 1
        print(f"✅ {pin['slug']}: {pin['image']} ({os.path.getsize(path)/1024:.0f} KB)")
    
    print(f"\n🚀 Posting {len(PINS)} pins via CloakBrowser internal API...\n")
    
    from cloakbrowser import launch_persistent_context
    
    context = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/pinterest-poster"),
        headless=True,
        humanize=True,
    )
    page = context.pages[0] if context.pages else context.new_page()
    
    # Auth check
    page.goto("https://www.pinterest.com/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)
    if "login" in page.url.lower():
        print("❌ SESSION EXPIRED — need re-login")
        context.close()
        return 1
    
    # Get CSRF token
    csrf = page.evaluate("""(function() {
        var match = document.cookie.match(/csrftoken=([^;]+)/);
        return match ? match[1] : null;
    })()""")
    if not csrf:
        print("❌ No CSRF token found")
        context.close()
        return 1
    print(f"✅ CSRF token: {csrf[:25]}...")
    
    results = []
    for i, pin in enumerate(PINS):
        image_url = f"{IMG_BASE}/{pin['image']}"
        print(f"\n--- Pin {i+1}/5: {pin['slug']} ---")
        print(f"  Title: {pin['title']}")
        print(f"  Board: {pin['board_name']}")
        print(f"  Image: {image_url}")
        
        esc_title = escape_js(pin["title"])
        esc_desc = escape_js(pin["description"])
        esc_link = escape_js(pin["link"])
        esc_image = escape_js(image_url)
        
        js_code = f"""(async function() {{
            var data = JSON.stringify({{"options": {{
                "board_id": "{pin['board_id']}",
                "title": "{esc_title}",
                "description": "{esc_desc}",
                "image_url": "{esc_image}",
                "link": "{esc_link}"
            }}, "context": {{}}}});
            var resp = await fetch('/resource/PinResource/create/', {{
                method: 'POST',
                headers: {{
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': '{csrf}',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }},
                body: 'source_url=/pin-builder/&data=' + encodeURIComponent(data)
            }});
            return await resp.text();
        }})()"""
        
        result = page.evaluate(js_code)
        print(f"  Response: {result[:300]}")
        
        success = "resource_response" in result.lower() and "error" not in result.lower()
        results.append({
            "pin": i + 1,
            "slug": pin["slug"],
            "category": pin["category"],
            "board": pin["board_name"],
            "title": pin["title"],
            "image": pin["image"],
            "success": success,
            "response": result[:500],
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        })
        
        if success:
            print(f"  ✅ POSTED SUCCESSFULLY")
        else:
            print(f"  ❌ FAILED — check response")
        
        time.sleep(3)  # rate limit between pins
    
    context.close()
    
    # Save post log
    log_path = "/home/admin1/qfinhub/.pinterest-data/daily-post-log.json"
    log = []
    if os.path.exists(log_path):
        with open(log_path) as f:
            try:
                log = json.load(f)
            except:
                log = []
    
    log.extend(results)
    with open(log_path, "w") as f:
        json.dump(log, f, indent=2)
    
    # Update generator state
    gen_path = "/home/admin1/qfinhub/.pinterest-data/generator-state.json"
    if os.path.exists(gen_path):
        with open(gen_path) as f:
            gs = json.load(f)
    else:
        gs = {"postedSlugs": [], "board_counts": {}, "total_pins": 0, "last_run": None}
    
    gs["last_run"] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    gs["total_pins"] = gs.get("total_pins", 0) + sum(1 for r in results if r["success"])
    for r in results:
        if r["success"] and r["slug"] not in gs.get("postedSlugs", []):
            gs["postedSlugs"].append(r["slug"])
            cat_key = r["category"]
            gs.setdefault("board_counts", {})
            gs["board_counts"][cat_key] = gs["board_counts"].get(cat_key, 0) + 1
    
    with open(gen_path, "w") as f:
        json.dump(gs, f, indent=2)
    
    # Print summary
    succeeded = sum(1 for r in results if r["success"])
    print(f"\n{'='*50}")
    print(f"SUMMARY: {succeeded}/{len(PINS)} pins posted successfully")
    for r in results:
        icon = "✅" if r["success"] else "❌"
        print(f"  {icon} {r['slug']} → {r['board']}")
    
    return 0 if succeeded > 0 else 1


if __name__ == "__main__":
    sys.exit(main())
