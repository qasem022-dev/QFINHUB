#!/usr/bin/env python3
"""GSC Live Data Extractor v3 — Fix time range + indexed pages"""
import os, json, time, re

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3")
OUTPUT = ".optimizer-data/gsc-live-data-cloak.json"
SITE = "https://www.qfinhub.com"
SITE_ENC = SITE.replace("/", "%2F").replace(":", "%3A")

ctx = launch_persistent_context(user_data_dir=PROFILE, headless=True, humanize=True, viewport={"width": 1400, "height": 900})
page = ctx.new_page()

try:
    # Navigate to performance
    page.goto(f"https://search.google.com/search-console/performance/search-analytics?resource_id={SITE_ENC}", wait_until="domcontentloaded", timeout=30000)
    time.sleep(6)
    
    if "accounts.google.com" in page.url:
        print("Session expired"); exit(1)
    
    # Click the date picker and select "Last 7 days"
    print("Selecting 7-day range...")
    # The date picker is typically a button showing the current date range
    page.evaluate("""(function() {
        // Find and click the date range button (shows something like "May 18 - Jun 3, 2026")
        var btns = document.querySelectorAll('button, div[role="button"], span[role="button"]');
        for (var btn of btns) {
            var t = (btn.textContent || '').trim();
            if (/\\d{1,2}\\s+\\w+\\s+\\d{4}/.test(t) || /\\w+\\s+\\d{1,2}.*\\w+\\s+\\d{1,2}/.test(t)) {
                btn.click();
                return true;
            }
        }
        return false;
    })()""")
    time.sleep(3)
    
    # Now click "Last 7 days" option or "Today" if available
    page.evaluate("""(function() {
        var opts = document.querySelectorAll('span, div, li, button');
        for (var o of opts) {
            var t = (o.textContent || '').trim().toLowerCase();
            if (t === 'last 7 days' || t === '7 days' || t === 'past 7 days') {
                o.click();
                return true;
            }
        }
        // Try clicking a pre-set filter
        var clicks = document.querySelectorAll('[aria-label*="7 day"], [aria-label*="7-day"]');
        for (var c of clicks) { c.click(); return true; }
        return false;
    })()""")
    time.sleep(4)
    
    # Extract metrics from cards using DOM traversal
    metrics = page.evaluate("""(function() {
        var result = {};
        
        // GSC metric cards: look for elements with specific structure
        // Typical structure: div.card > span.label + span.value
        
        // Strategy: find ALL elements, look for the pattern:
        // text="Total clicks" then a sibling/descendant with a pure number
        
        function findMetric(labelPattern, isFloat) {
            var all = document.querySelectorAll('*');
            for (var el of all) {
                var t = (el.textContent || '').trim();
                if (t === labelPattern || t === labelPattern.replace('Total ', '')) {
                    // Found label — now find value in parent/sibling
                    var parent = el.parentElement;
                    if (!parent) continue;
                    // Check all descendants of parent for a number
                    var kids = parent.querySelectorAll('*');
                    for (var k of kids) {
                        var v = (k.textContent || '').trim();
                        if (isFloat) {
                            // Float: position or CTR
                            v = v.replace(',', '.').replace('%', '');
                            if (/^\\d+\\.?\\d*$/.test(v) && v.length < 6 && !/^\\d{4}/.test(v)) {
                                return parseFloat(v);
                            }
                        } else {
                            // Integer: clicks or impressions
                            v = v.replace(/,/g, '');
                            if (/^\\d+$/.test(v) && parseInt(v, 10) > 0) {
                                return parseInt(v, 10);
                            }
                        }
                    }
                }
            }
            return null;
        }
        
        result.clicks = findMetric('Total clicks', false);
        result.impressions = findMetric('Total impressions', false);
        result.ctr = findMetric('Average CTR', true);
        result.position = findMetric('Average position', true);
        
        return result;
    })()""")
    
    print(f"Performance metrics: {json.dumps(metrics)}")
    
    # Indexed pages — use Index coverage page
    page.goto(f"https://search.google.com/search-console/index?resource_id={SITE_ENC}", wait_until="domcontentloaded", timeout=30000)
    time.sleep(6)
    
    indexed = page.evaluate("""(function() {
        // Look for the indexed pages count in the coverage summary
        var rows = document.querySelectorAll('tr, [role="row"], .coverage-row, .index-row');
        for (var r of rows) {
            var cells = r.querySelectorAll('td, [role="cell"], .coverage-cell, span');
            var foundIdx = false;
            for (var i = 0; i < cells.length - 1; i++) {
                var txt = (cells[i].textContent || '').trim().toLowerCase();
                if (txt.includes('indexed') || txt === 'valid' || txt.includes('submitted')) {
                    var next = cells[i + 1];
                    if (next) {
                        var val = (next.textContent || '').trim().replace(/,/g, '');
                        if (/^\\d+$/.test(val)) return parseInt(val, 10);
                    }
                }
            }
        }
        // Try by scanning all text near "indexed"
        var body = document.body.innerText || '';
        var m = body.match(/[Ii]ndexed\\s+(\\d{1,3}(?:,\\d{3})*)/);
        if (m) return parseInt(m[1].replace(/,/g, ''), 10);
        var m2 = body.match(/(\\d{1,3}(?:,\\d{3})*)\\s+indexed/i);
        if (m2) return parseInt(m2[1].replace(/,/g, ''), 10);
        return null;
    })()""")
    
    result = {
        "source": "GSC_UI_CLOAKBROWSER_V3",
        "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "site": SITE,
        "metrics": {
            "impressions_7d": metrics.get("impressions"),
            "clicks_7d": metrics.get("clicks"),
            "ctr_7d_pct": metrics.get("ctr"),
            "avg_position_7d": metrics.get("position"),
            "indexed_pages": indexed
        }
    }
    
    with open(OUTPUT, "w") as f:
        json.dump(result, f, indent=2)
    
    # Compare with user's manual check
    user = {"impressions": 436, "clicks": 0, "ctr": 0, "position": 29.4, "indexed": 238}
    print(f"\n✅ CloakBrowser extraction:")
    for k, v in result["metrics"].items():
        uk = {"impressions_7d": "impressions", "clicks_7d": "clicks", "ctr_7d_pct": "ctr", "avg_position_7d": "position", "indexed_pages": "indexed"}
        uv = user.get(uk[k], "?")
        match = "✅" if v == uv else (f"Δ{abs(v-uv)}" if isinstance(v, (int, float)) and isinstance(uv, (int, float)) else "❓")
        print(f"  {k}: {v} (manual: {uv}) {match}")
    
except Exception as e:
    print(f"Error: {e}")
finally:
    ctx.close()
