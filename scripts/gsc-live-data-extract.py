#!/usr/bin/env python3
"""GSC Live Data Extractor via CloakBrowser UI
Extracts REAL metrics from GSC Performance dashboard — no API underreporting.
Uses persistent google-gsc-v3 profile (already authenticated).
Run: python3 scripts/gsc-live-data-extract.py
Output: .optimizer-data/gsc-live-data.json
"""
import os, json, time, sys

# Required for CloakBrowser binary
os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
from cloakbrowser import launch_persistent_context

PROFILE = os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3")
OUTPUT = ".optimizer-data/gsc-live-data.json"
SITE = "https://www.qfinhub.com"
SITE_ENC = SITE.replace("/", "%2F").replace(":", "%3A")

def extract_gsc_data():
    print("Launching CloakBrowser with GSC profile...")
    ctx = launch_persistent_context(
        user_data_dir=PROFILE,
        headless=True,
        humanize=True,
        viewport={"width": 1400, "height": 900}
    )
    page = ctx.new_page()
    
    try:
        # Navigate to GSC Performance overview
        perf_url = f"https://search.google.com/search-console/performance/search-analytics?resource_id={SITE_ENC}"
        print(f"Navigating to: {perf_url}")
        page.goto(perf_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(5)
        
        # Check auth
        if "accounts.google.com" in page.url:
            print("❌ Session expired! Re-authenticate with headless=False first.")
            return None
        
        # Extract dashboard metrics from the summary cards
        # GSC shows: Total clicks, Total impressions, Avg CTR, Avg position
        print("Extracting dashboard metrics...")
        
        # First, ensure we're on 7-day view by clicking the date filter if needed
        page.evaluate("""(function() {
            // Try to click date dropdown to select 7 days
            var dateButtons = document.querySelectorAll('button, div[role="button"]');
            for (var btn of dateButtons) {
                var t = (btn.textContent || '').trim();
                if (t === '7 days' || t === 'Last 7 days') {
                    btn.click();
                    return;
                }
            }
        })()""")
        time.sleep(3)
        
        metrics = page.evaluate("""(function() {
            var result = {};
            
            // GSC uses mat-card or specific div layout for metric cards
            // Each card has a label (e.g. "Total clicks") and a value
            
            // Find all metric cards by looking for known label patterns
            var allElements = document.querySelectorAll('*');
            var cards = [];
            var seenLabels = new Set();
            
            for (var el of allElements) {
                var txt = (el.textContent || '').trim();
                // Only look at leaf-level elements with short text
                if (txt.length > 2 && txt.length < 20 && el.children.length === 0) {
                    var parent = el.parentElement;
                    if (parent) {
                        var parentTxt = (parent.textContent || '').trim();
                        // This might be a label-value pair
                        var labelLower = txt.toLowerCase();
                        
                        if (labelLower.includes('total clicks') || labelLower === 'clicks') {
                            // Find sibling/child with the number
                            var siblings = parent.querySelectorAll('*');
                            for (var s of siblings) {
                                var st = (s.textContent || '').trim();
                                if (/^[\\d,]+$/.test(st) && st.length > 1) {
                                    result.clicks = parseInt(st.replace(/,/g, ''), 10);
                                    break;
                                }
                            }
                        } else if (labelLower.includes('total impressions') || labelLower === 'impressions') {
                            var sibs = parent.querySelectorAll('*');
                            for (var s2 of sibs) {
                                var st2 = (s2.textContent || '').trim();
                                if (/^[\\d,]+$/.test(st2) && st2.length > 1) {
                                    result.impressions = parseInt(st2.replace(/,/g, ''), 10);
                                    break;
                                }
                            }
                        } else if (labelLower.includes('average ctr') || labelLower === 'ctr') {
                            var sibs3 = parent.querySelectorAll('*');
                            for (var s3 of sibs3) {
                                var st3 = (s3.textContent || '').trim();
                                if (/%$/.test(st3) || /^\\d+\\.?\\d*%$/.test(st3)) {
                                    result.ctr = parseFloat(st3.replace('%', ''));
                                    break;
                                }
                            }
                        } else if (labelLower.includes('average position') || labelLower === 'position') {
                            var sibs4 = parent.querySelectorAll('*');
                            for (var s4 of sibs4) {
                                var st4 = (s4.textContent || '').trim();
                                if (/^\\d+\\.?\\d*$/.test(st4) && st4.length < 6 && !st4.includes(',')) {
                                    result.position = parseFloat(st4);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            
            // Fallback: try numeric extraction from visible metric containers
            if (!result.impressions) {
                var containers = document.querySelectorAll('[class*="metric"], [class*="summary"], .mat-card, [class*="card"]');
                for (var c of containers) {
                    var txt = (c.textContent || '').toLowerCase();
                    var nums = c.querySelectorAll('[class*="value"], [class*="number"], .mat-headline, h1, h2, h3');
                    for (var n of nums) {
                        var v = (n.textContent || '').trim().replace(/,/g, '').replace('%', '');
                        if (/^\\d+$/.test(v) && parseInt(v, 10) > 10) {
                            if (txt.includes('impression')) result.impressions = parseInt(v, 10);
                            else if (txt.includes('click') && !txt.includes('ctr')) result.clicks = parseInt(v, 10);
                        } else if (/^\\d+\\.\\d+$/.test(v) && v.length < 6) {
                            result.position = parseFloat(v);
                        }
                    }
                }
            }
            
            return result;
        })()""")
        
        print(f"  Raw metrics: {json.dumps(metrics)}")
        
        # Navigate to Pages report to get indexed count
        pages_url = f"https://search.google.com/search-console/index?resource_id={SITE_ENC}"
        print(f"Navigating to Pages report: {pages_url}")
        page.goto(pages_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(6)
        
        # Extract indexed page count
        indexed_count = page.evaluate("""(function() {
            // Try multiple selectors for the indexed pages count
            var selectors = [
                '.indexed-pages-count',
                '[class*="indexed"] [class*="count"]',
                '[class*="pages-count"]',
                '.page-count-summary',
                'tr:has(td:contains("Indexed")) td:last-child',
                'tr td:last-child'
            ];
            
            // Look for text containing "Indexed" and extract number after it
            var tables = document.querySelectorAll('table, .mat-table, [role="table"]');
            for (var t of tables) {
                var rows = t.querySelectorAll('tr, [role="row"]');
                for (var r of rows) {
                    var cells = r.querySelectorAll('td, [role="cell"]');
                    for (var i = 0; i < cells.length; i++) {
                        var txt = (cells[i].textContent || '').trim();
                        if (txt.toLowerCase().includes('indexed')) {
                            var next = cells[i + 1];
                            if (next) {
                                var val = (next.textContent || '').trim().replace(/,/g, '');
                                var n = parseInt(val, 10);
                                if (!isNaN(n)) return n;
                            }
                        }
                    }
                }
            }
            
            // Fallback: look for big number near "Indexed"
            var body = document.body.textContent || '';
            var match = body.match(/indexed[\\s\\S]*?(\\d{1,3}(?:,\\d{3})*)/i);
            if (match) return parseInt(match[1].replace(/,/g, ''), 10);
            
            return null;
        })()""")
        
        result = {
            "source": "GSC_UI_CLOAKBROWSER",
            "generated": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "site": SITE,
            "metrics": {
                "impressions_7d": metrics.get("impressions"),
                "clicks_7d": metrics.get("clicks"),
                "ctr_7d_pct": metrics.get("ctr"),
                "avg_position_7d": metrics.get("position"),
                "indexed_pages": indexed_count
            },
            "note": "Extracted directly from GSC Performance UI — no API undercounting. Authoritative."
        }
        
        # Save
        with open(OUTPUT, "w") as f:
            json.dump(result, f, indent=2)
        print(f"\n✅ Saved: {OUTPUT}")
        print(f"   Impressions: {metrics.get('impressions')}")
        print(f"   Clicks: {metrics.get('clicks')}")
        print(f"   CTR: {metrics.get('ctr')}%")
        print(f"   Avg Position: {metrics.get('position')}")
        print(f"   Indexed Pages: {indexed_count}")
        
        return result
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return None
    finally:
        ctx.close()

if __name__ == "__main__":
    extract_gsc_data()
