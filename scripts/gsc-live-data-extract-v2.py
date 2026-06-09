#!/usr/bin/env python3
"""GSC Live Data Extractor v2 — raw text parsing approach
Dumps entire page text and parses metric patterns.
"""
import os, json, time, re, sys

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3")
OUTPUT = ".optimizer-data/gsc-live-data.json"
SITE = "https://www.qfinhub.com"
SITE_ENC = SITE.replace("/", "%2F").replace(":", "%3A")

print("Launching CloakBrowser...")
ctx = launch_persistent_context(
    user_data_dir=PROFILE,
    headless=True, humanize=True,
    viewport={"width": 1400, "height": 900}
)
page = ctx.new_page()

try:
    # Performance page
    perf_url = f"https://search.google.com/search-console/performance/search-analytics?resource_id={SITE_ENC}"
    page.goto(perf_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(8)  # Let Angular render
    
    if "accounts.google.com" in page.url:
        print("Session expired")
        sys.exit(1)
    
    # DUMP ALL TEXT
    raw = page.evaluate("document.body.innerText")
    # Save for debugging
    with open(".optimizer-data/gsc-raw-text-dump.txt", "w") as f:
        f.write(raw)
    
    lines = [l.strip() for l in raw.split('\n') if l.strip()]
    print(f"Extracted {len(lines)} text lines")
    
    # Parse metrics using regex patterns
    result = {"impressions": None, "clicks": None, "ctr": None, "position": None}
    
    full_text = ' '.join(lines)
    
    # Pattern: "Total clicks X" or "Clicks X" followed by a number
    m = re.search(r'(?:Total\s+)?[Cc]licks?\s+([\d,]+)', full_text)
    if m: result["clicks"] = int(m.group(1).replace(',', ''))
    
    m = re.search(r'(?:Total\s+)?[Ii]mpressions?\s+([\d,]+)', full_text)
    if m: result["impressions"] = int(m.group(1).replace(',', ''))
    
    m = re.search(r'(?:Average\s+)?CTR\s+([\d.]+)%', full_text)
    if m: result["ctr"] = float(m.group(1))
    
    m = re.search(r'(?:Average\s+)?[Pp]osition\s+([\d.]+)', full_text)
    if m: result["position"] = float(m.group(1))
    
    # Indexed pages
    pages_url = f"https://search.google.com/search-console/index?resource_id={SITE_ENC}"
    page.goto(pages_url, wait_until="domcontentloaded", timeout=30000)
    time.sleep(8)
    raw2 = page.evaluate("document.body.innerText")
    indexed_match = re.search(r'(\d+)\s*indexed', raw2, re.IGNORECASE)
    if not indexed_match:
        indexed_match = re.search(r'[Ii]ndexed[\s\S]*?(\d{1,3}(?:,\d{3})*)', raw2[:5000])
    indexed = int(indexed_match.group(1).replace(',', '')) if indexed_match else None
    
    result["indexed_pages"] = indexed
    
    # Save
    output = {
        "source": "GSC_UI_CLOAKBROWSER_V2",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "site": SITE,
        "metrics": {
            "impressions_7d": result["impressions"],
            "clicks_7d": result["clicks"],
            "ctr_7d_pct": result["ctr"],
            "avg_position_7d": result["position"],
            "indexed_pages": result["indexed"]
        }
    }
    with open(OUTPUT, "w") as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Extracted:")
    print(f"   Impressions: {result['impressions']}")
    print(f"   Clicks: {result['clicks']}")
    print(f"   CTR: {result['ctr']}%")
    print(f"   Position: {result['position']}")
    print(f"   Indexed: {result['indexed']}")
    
except Exception as e:
    print(f"❌ {e}")
finally:
    ctx.close()
