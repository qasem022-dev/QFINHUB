#!/usr/bin/env python3
"""
QFINHUB V2 — Decision Page GSC Tracker
========================================
Tracks impressions, clicks, CTR, position for the 5 pilot decision pages.
Reads from GSC traffic report. Does NOT use Indexing API.
Output: .optimizer-data/decision-page-tracker.json
"""

import json, os, re
from pathlib import Path
from datetime import datetime

PROJECT = Path("/home/admin1/qfinhub")
OUTPUT = PROJECT / ".optimizer-data"

DECISION_PAGES = [
    "/decision/can-i-afford-a-400k-home",
    "/decision/pay-off-debt-or-invest",
    "/decision/retire-at-45-with-1-million",
    "/decision/rent-vs-buy-with-100k-income",
    "/decision/401k-vs-taxable-investing",
]

def load_gsc_data():
    report = OUTPUT / "traffic-report.json"
    if not report.exists():
        return {}, {}
    
    with open(report) as f:
        d = json.load(f)
    
    sc = d.get("search_console", {})
    
    # Build page→data
    pages = {}
    for p in sc.get("top_pages", []):
        pages[p.get("page", "")] = {
            "impressions": p.get("impressions", 0),
            "clicks": p.get("clicks", 0),
            "position": p.get("position", 99),
        }
    
    # Build query→data
    queries = {}
    for q in sc.get("top_queries", []):
        queries[q.get("query", "")] = {
            "impressions": q.get("impressions", 0),
            "clicks": q.get("clicks", 0),
            "position": q.get("position", 99),
        }
    
    return pages, queries

def main():
    pages, queries = load_gsc_data()
    
    now = datetime.now().isoformat()
    
    tracking = []
    total_impr = 0
    total_clicks = 0
    
    for path in DECISION_PAGES:
        full_url = f"https://www.qfinhub.com{path}"
        data = pages.get(full_url, {})
        
        impr = data.get("impressions", 0)
        clicks = data.get("clicks", 0)
        pos = data.get("position", 999)
        
        total_impr += impr
        total_clicks += clicks
        
        # Find matching queries
        matching_queries = []
        slug = path.split("/")[-1].replace("-", " ")
        for q, qd in queries.items():
            if any(word in q.lower() for word in slug.split()[:3]):
                matching_queries.append({
                    "query": q,
                    "impressions": qd["impressions"],
                    "clicks": qd["clicks"],
                    "position": qd["position"],
                })
        
        status = "indexed" if impr > 0 else ("unknown" if clicks > 0 else "no_data")
        
        tracking.append({
            "path": path,
            "url": full_url,
            "impressions": impr,
            "clicks": clicks,
            "position": pos if pos < 999 else None,
            "index_status": status,
            "queries": sorted(matching_queries, key=lambda q: -q["impressions"])[:5],
        })
    
    # Calculate overall metrics
    ctr = (total_clicks / total_impr * 100) if total_impr > 0 else 0
    
    report = {
        "generated_at": now,
        "data_source": "traffic-report.json (GSC 7-day)",
        "summary": {
            "total_decision_pages": len(DECISION_PAGES),
            "pages_with_data": sum(1 for t in tracking if t["impressions"] > 0),
            "total_impressions": total_impr,
            "total_clicks": total_clicks,
            "overall_ctr": round(ctr, 2),
        },
        "pages": tracking,
    }
    
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT / "decision-page-tracker.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"📊 Decision Page Tracker — {now}")
    print(f"   Pages tracked: {len(DECISION_PAGES)}")
    print(f"   Pages with GSC data: {report['summary']['pages_with_data']}")
    print(f"   Total impressions: {total_impr}")
    print(f"   Total clicks: {total_clicks}")
    print(f"   Overall CTR: {ctr:.2f}%")
    print(f"   Output: {OUTPUT / 'decision-page-tracker.json'}")

if __name__ == "__main__":
    main()
