#!/usr/bin/env python3
"""Phase 16.12 Task 1: Full Sitemap URL Inventory with Classification"""
import re, json, os, sys

SITEMAP_PATH = ".next/server/app/sitemap.xml.body"
OUTPUT_PATH = ".optimizer-data/full-sitemap-url-inventory.json"

with open(SITEMAP_PATH) as f:
    content = f.read()

# Extract all URLs with lastmod
urls = []
for m in re.finditer(r'<url>\s*<loc>(https://www\.qfinhub\.com/[^<]+)</loc>\s*(?:<lastmod>([^<]+)</lastmod>)?', content):
    urls.append({"url": m.group(1), "lastmod": m.group(2) or ""})

print(f"Extracted {len(urls)} URLs from sitemap")

# Classification rules
T1_CALCS = {
    "mortgage-calculator", "mortgage-affordability", "compound-interest",
    "retirement-planning", "loan-calculator", "debt-payoff",
    "tax-calculator", "401k-calculator", "investment-return", "budget-planner"
}
T2_CALCS = {
    "home-equity", "closing-costs", "mortgage-payoff", "biweekly-mortgage",
    "extra-payment", "loan-term", "reverse-mortgage", "heloc-calculator",
    "balloon-payment", "mortgage-points", "inflation-calculator", "savings-goal"
}

def classify(url):
    """Classify URL by page type and return metadata."""
    path = url.replace("https://www.qfinhub.com", "")
    
    result = {
        "url": url,
        "path": path,
        "page_type": "unknown",
        "priority_tier": "P5",
        "important": False,
        "notes": ""
    }
    
    # Homepage
    if path == "/" or path == "":
        result["page_type"] = "homepage"
        result["priority_tier"] = "P0"
        result["important"] = True
        return result
    
    # Static pages
    static_pages = {
        "/calculators": "calculators-hub",
        "/guides": "guides-hub",
        "/compare": "compare-hub",
        "/disclaimer": "disclaimer",
        "/privacy": "privacy",
        "/cookies": "cookies",
        "/about": "about",
        "/contact": "contact",
        "/terms": "terms",
        "/sitemap.xml": "sitemap",
    }
    if path in static_pages:
        result["page_type"] = static_pages[path]
        result["priority_tier"] = "P2"
        result["important"] = True
        return result
    
    # Widget pages
    if path.startswith("/widgets/"):
        result["page_type"] = "widget"
        result["priority_tier"] = "P2"
        result["important"] = True
        return result
    
    # Decision pages
    if path.startswith("/decision/"):
        result["page_type"] = "decision"
        result["priority_tier"] = "P2"
        result["important"] = True
        return result
    
    # Comparison pages
    if path.startswith("/compare/"):
        result["page_type"] = "compare"
        result["priority_tier"] = "P3"
        return result
    
    # Guide pages
    if path.startswith("/guides/"):
        result["page_type"] = "guide"
        result["priority_tier"] = "P3"
        return result
    
    # Blog pages
    if path.startswith("/blog/"):
        result["page_type"] = "blog"
        result["priority_tier"] = "P3"
        return result
    
    # Calculator pages
    if path.startswith("/calculators/"):
        slug = path.replace("/calculators/", "")
        
        # Check for geo pages
        if "/" in slug:
            result["page_type"] = "calculator-geo"
            result["priority_tier"] = "P4"
            return result
        
        if slug in T1_CALCS:
            result["page_type"] = "calculator-T1"
            result["priority_tier"] = "P0"
            result["important"] = True
        elif slug in T2_CALCS:
            result["page_type"] = "calculator-T2"
            result["priority_tier"] = "P1"
            result["important"] = True
        else:
            result["page_type"] = "calculator-T3"
            result["priority_tier"] = "P2"
        return result
    
    # Tool variant pages
    if path.startswith("/tools/"):
        result["page_type"] = "tool"
        result["priority_tier"] = "P4"
        return result
    
    # Scenario pages
    if path.startswith("/scenario/"):
        result["page_type"] = "scenario"
        result["priority_tier"] = "P5"
        return result
    
    # All pages listing
    if path.startswith("/all-pages"):
        result["page_type"] = "listing"
        result["priority_tier"] = "P5"
        return result
    
    # Widget embed
    if path.startswith("/embed/"):
        result["page_type"] = "embed"
        result["priority_tier"] = "P5"
        return result
    
    return result

# Classify all URLs
inventory = []
type_counts = {}
for entry in urls:
    classified = classify(entry["url"])
    classified["lastmod"] = entry["lastmod"]
    classified["in_sitemap"] = True
    inventory.append(classified)
    t = classified["page_type"]
    type_counts[t] = type_counts.get(t, 0) + 1

# Add impressions/clicks from GSC data if available
gsc_path = ".optimizer-data/gsc-live-data-corrected.json"
gsc_map = {}
if os.path.exists(gsc_path):
    with open(gsc_path) as f:
        gsc_data = json.load(f)
    for row in gsc_data.get("rows", []):
        gsc_map[row["keys"][0]] = {
            "impressions": row.get("impressions", 0),
            "clicks": row.get("clicks", 0),
            "avg_position": row.get("position", 0)
        }

for entry in inventory:
    url = entry["url"]
    if url in gsc_map:
        entry["gsc_impressions"] = gsc_map[url]["impressions"]
        entry["gsc_clicks"] = gsc_map[url]["clicks"]
        entry["gsc_position"] = gsc_map[url]["avg_position"]
    else:
        entry["gsc_impressions"] = 0
        entry["gsc_clicks"] = 0
        entry["gsc_position"] = None

# Build summary
summary = {
    "total_urls": len(inventory),
    "page_type_counts": type_counts,
    "important_pages": len([e for e in inventory if e["important"]]),
    "pages_with_impressions": len([e for e in inventory if e.get("gsc_impressions", 0) > 0]),
    "total_impressions": sum(e.get("gsc_impressions", 0) for e in inventory),
    "total_clicks": sum(e.get("gsc_clicks", 0) for e in inventory),
    "priority_breakdown": {}
}
for tier in ["P0", "P1", "P2", "P3", "P4", "P5"]:
    count = len([e for e in inventory if e["priority_tier"] == tier])
    summary["priority_breakdown"][tier] = count

output = {
    "title": "Phase 16.12 Full Sitemap URL Inventory",
    "generated": "2026-06-07T04:40:00+03:00",
    "source": "Live sitemap.xml.body",
    "summary": summary,
    "urls": inventory
}

with open(OUTPUT_PATH, "w") as f:
    json.dump(output, f, indent=2)

print(f"✅ Inventory saved: {OUTPUT_PATH}")
print(f"Total URLs: {len(inventory)}")
print(f"\nPage type breakdown:")
for t, c in sorted(type_counts.items(), key=lambda x: -x[1]):
    print(f"  {t}: {c}")
print(f"\nPriority breakdown:")
for tier in ["P0", "P1", "P2", "P3", "P4", "P5"]:
    count = len([e for e in inventory if e["priority_tier"] == tier])
    print(f"  {tier}: {count}")
print(f"\nImportant pages: {summary['important_pages']}")
print(f"Pages with GSC impressions: {summary['pages_with_impressions']}")
print(f"Total impressions: {summary['total_impressions']}")
