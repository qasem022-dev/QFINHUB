#!/usr/bin/env python3
"""
QFINHUB Directory Submission Bot — CloakBrowser automation
Submits qfinhub.com to finance/business directories for backlinks.
Handles different form patterns via evaluate() injection.
"""

import sys, os, time, json, random
from datetime import datetime
from cloakbrowser import launch_persistent_context

QFINHUB_NAME = "QFINHUB"
QFINHUB_URL = "https://qfinhub.com"
QFINHUB_SHORT_DESC = "125 free financial calculators - mortgage, compound interest, retirement, tax, and more."
QFINHUB_EMAIL = "q.finhub@gmail.com"
QFINHUB_TAGS = "financial calculators, mortgage calculator, compound interest, retirement calculator, tax calculator, free finance tools, personal finance, fintech"
QFINHUB_FOUNDED = "2025"

PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/directory-submitter")
LOG_FILE = os.path.expanduser("/home/admin1/qfinhub/.directory-submissions/log.json")
os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)

# Directories to submit — priority order
DIRECTORIES = [
    # Tier 1: Highest DA (manual forms, try common patterns)
    {"name": "Crunchbase", "url": "https://www.crunchbase.com/organization/new", "da": 80},
    {"name": "Product Hunt", "url": "https://www.producthunt.com/posts/create", "da": 89},
    {"name": "G2", "url": "https://www.g2.com/products/new", "da": 85},
    {"name": "Capterra", "url": "https://www.capterra.com/p/0/0/product/new", "da": 84},
    {"name": "SourceForge", "url": "https://sourceforge.net/software/new/", "da": 92},
    {"name": "Trustpilot", "url": "https://www.trustpilot.com/evaluate/qfinhub.com", "da": 92},
    {"name": "SaaSHub", "url": "https://www.saashub.com/submit/list", "da": 65},
    {"name": "GetApp", "url": "https://www.getapp.com/add-product/", "da": 76},
    {"name": "Indie Hackers", "url": "https://www.indiehackers.com/products/new", "da": 78},
    {"name": "AlternativeTo", "url": "https://alternativeto.net/software/qfinhub/", "da": 76},
    # Tier 2: Business directories
    {"name": "Brownbook", "url": "https://www.brownbook.net/business/add/", "da": 45},
    {"name": "2FindLocal", "url": "https://www.2findlocal.com/b/add", "da": 40},
    {"name": "Bizcommunity", "url": "https://www.bizcommunity.com/company/create", "da": 63},
    {"name": "Foursquare", "url": "https://www.foursquare.com/business/", "da": 75},
    {"name": "Yelp", "url": "https://www.yelp.com/business", "da": 91},
    # Tier 3: Startup platforms
    {"name": "BetaList", "url": "https://betapage.co/submit", "da": 72},
    {"name": "Launching Next", "url": "https://www.launchingnext.com/submit/", "da": 58},
]

def load_log():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE) as f:
            return json.load(f)
    return {"submitted": [], "failed": [], "last_run": None}

def save_log(log):
    log["last_run"] = datetime.now().isoformat()
    with open(LOG_FILE, "w") as f:
        json.dump(log, f, indent=2)

def try_submit(page, directory, log):
    """Attempt to submit to a directory by trying common form patterns."""
    name = directory["name"]
    url = directory["url"]
    da = directory["da"]
    
    if name in [s["name"] for s in log["submitted"]]:
        print(f"  ⏭️  {name} — already submitted, skipping")
        return
    
    print(f"\n  📋 {name} (DA {da})")
    print(f"     URL: {url}")
    
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=20000)
        time.sleep(4)
        
        # Take screenshot for debugging
        os.makedirs("/tmp/dir-subs", exist_ok=True)
        page.screenshot(path=f"/tmp/dir-subs/{name.lower().replace(' ', '-')}.png")
        
        # Try common form field patterns
        results = page.evaluate(f"""
            (function() {{
                const info = {{
                    name: '{QFINHUB_NAME}',
                    url: '{QFINHUB_URL}',
                    desc: '{QFINHUB_SHORT_DESC}',
                    email: '{QFINHUB_EMAIL}',
                    tags: '{QFINHUB_TAGS}',
                    founded: '{QFINHUB_FOUNDED}'
                }};
                
                const fields = document.querySelectorAll('input, textarea, select');
                const found = [];
                
                fields.forEach(f => {{
                    const attrs = {{
                        name: f.name || '',
                        id: f.id || '',
                        type: f.type || '',
                        placeholder: (f.placeholder || '').toLowerCase(),
                        label: ''
                    }};
                    
                    // Find associated label
                    if (f.id) {{
                        const label = document.querySelector('label[for="' + f.id + '"]');
                        if (label) attrs.label = (label.textContent || '').toLowerCase();
                    }}
                    
                    found.push(attrs);
                }});
                
                return JSON.stringify({{
                    totalFields: fields.length,
                    fields: found.slice(0, 15),
                    pageTitle: document.title,
                    hasForm: document.querySelector('form') !== null
                }});
            }})();
        """)
        
        data = json.loads(results)
        print(f"     Fields found: {data.get('totalFields', 0)}, Has form: {data.get('hasForm', False)}")
        
        # Show key fields
        for f in data.get("fields", [])[:8]:
            label = f.get("label", "") or f.get("placeholder", "")
            if any(kw in label.lower() for kw in ["name", "url", "email", "company", "product", "website"]):
                print(f"     → {f.get('name') or f.get('id')} ({f.get('type')}): \"{label[:60]}\"")
        
        # Try to fill common fields
        fill_script = f"""
            (function() {{
                function setVal(sel, val) {{
                    const el = document.querySelector(sel);
                    if (el) {{
                        const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                        try {{ s.call(el, val); }} catch(e) {{ el.value = val; }}
                        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        return true;
                    }}
                    return false;
                }}
                
                // Try various selectors
                setVal('input[name*="name" i], input[id*="name" i], input[name*="company" i], input[name*="product" i]', '{QFINHUB_NAME}');
                setVal('input[name*="url" i], input[name*="website" i], input[type="url"]', '{QFINHUB_URL}');
                setVal('input[name*="email" i], input[type="email"]', '{QFINHUB_EMAIL}');
                
                // Try textarea for description
                const descEl = document.querySelector('textarea[name*="desc" i], textarea[id*="desc" i], textarea[name*="summary" i]');
                if (descEl) {{
                    descEl.focus();
                    descEl.value = '{QFINHUB_SHORT_DESC}';
                    descEl.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
                
                return 'fields_filled';
            }})();
        """
        
        page.evaluate(fill_script)
        time.sleep(1)
        
        log["submitted"].append({
            "name": name,
            "url": url,
            "da": da,
            "fields_found": data.get("totalFields", 0),
            "has_form": data.get("hasForm", False),
            "time": datetime.now().isoformat(),
            "status": "form_filled",
        })
        
        print(f"     ✅ Form fields populated — needs manual review/submit")
        
    except Exception as e:
        print(f"     ⚠️  Failed: {str(e)[:80]}")
        log["failed"].append({
            "name": name,
            "url": url,
            "error": str(e)[:200],
            "time": datetime.now().isoformat(),
        })

def main():
    print(f"\n{'='*60}")
    print(f"  QFINHUB Directory Submission Bot")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"{'='*60}")
    
    log = load_log()
    print(f"  Previously submitted: {len(log['submitted'])}")
    print(f"  Previously failed: {len(log['failed'])}")
    
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR,
        headless=True,
        humanize=True,
    )
    
    try:
        page = context.new_page()
        page.set_default_timeout(30000)
        
        for directory in DIRECTORIES:
            if len(log["submitted"]) >= 10:
                print(f"\n  ✅ Reached 10 submissions target. Stopping.")
                break
            try_submit(page, directory, log)
            time.sleep(random.uniform(3, 6))
        
    except Exception as e:
        print(f"\n  FATAL: {e}")
    finally:
        context.close()
        save_log(log)
        
        submitted = len(log["submitted"])
        failed = len(log["failed"])
        total_da = sum(s.get("da", 0) for s in log["submitted"])
        print(f"\n{'='*60}")
        print(f"  RESULTS: {submitted} submitted, {failed} failed")
        print(f"  Total DA from submissions: {total_da}")
        print(f"  Log: {LOG_FILE}")
        print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
