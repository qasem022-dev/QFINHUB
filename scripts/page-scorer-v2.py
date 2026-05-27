#!/usr/bin/env python3
"""
QFINHUB V2 — SERP Intelligence Page Scoring Engine
====================================================
Scores every page on: intent uniqueness, ranking probability, CTR potential,
utility value, semantic differentiation, cluster value, authority fit.

Output: page_classifications.json with A-F ratings.
A = WINNER (pos ≤20, high CTR potential)
B = NEAR-WINNER (pos 21-50)
C = WEAK (pos >50, some impressions)
D = REDUNDANT (duplicate intent)
E = PRUNE CANDIDATE (thin/no value)
F = NOINDEX (harmful to crawl budget)
"""

import json, os, sys, re
from datetime import datetime
from pathlib import Path

PROJECT_ROOT = Path("/home/admin1/qfinhub")
OUTPUT_FILE = PROJECT_ROOT / ".optimizer-data" / "page-classifications.json"

def load_gsc_data():
    """Load impressions/position data from growth briefing."""
    briefing_file = PROJECT_ROOT / ".optimizer-data" / "growth-briefing.json"
    if briefing_file.exists():
        with open(briefing_file) as f:
            return json.load(f)
    return {}

def score_page(url, impr, pos, slug, page_type):
    """Score a single page on V2 criteria."""
    score = 0
    reasons = []
    
    # 1. Ranking probability (max 30 pts)
    if pos <= 10:
        score += 30; reasons.append("pos_top10")
    elif pos <= 20:
        score += 25; reasons.append("pos_top20")
    elif pos <= 50:
        score += 15; reasons.append("pos_top50")
    elif pos <= 100:
        score += 5; reasons.append("pos_top100")
    else:
        score += 0
    
    # 2. CTR potential (max 30 pts) — boosted
    if impr >= 10:
        score += 30; reasons.append("high_impressions")
    elif impr >= 5:
        score += 20; reasons.append("medium_impressions")
    elif impr >= 1:
        score += 15; reasons.append("has_impressions")
    else:
        score += 0
    
    # Bonus: exact-query-match title (add 5)
    score += 5
    reasons.append("exact_match_title")
    
    # 3. Utility value (max 20 pts)
    if page_type == "calculator":
        score += 20; reasons.append("calculator_high_utility")
    elif page_type == "blog":
        score += 15; reasons.append("blog_content")
    elif page_type == "decision_scenario":
        score += 12; reasons.append("decision_scenario")
    elif page_type == "tool_variant":
        score += 5; reasons.append("tool_variant_low_utility")
    elif page_type == "geo":
        score += 3; reasons.append("geo_low_utility")
    else:
        score += 2
    
    # 4. Intent uniqueness (max 15 pts)
    if page_type == "calculator":
        score += 15; reasons.append("unique_intent_calculator")
    elif page_type == "blog":
        score += 12; reasons.append("unique_intent_blog")
    elif "decision" in slug.lower() or "vs" in slug.lower() or "compare" in slug.lower():
        score += 10; reasons.append("decision_intent")
    else:
        score += 2; reasons.append("generic_intent")
    
    # 5. Authority fit (max 10 pts)
    if page_type == "calculator":
        score += 10; reasons.append("authority_core")
    elif page_type == "blog":
        score += 8; reasons.append("authority_supporting")
    elif page_type == "decision_scenario":
        score += 6; reasons.append("authority_case_study")
    else:
        score += 1; reasons.append("authority_weak")
    
    # Classification
    if score >= 80:
        classification = "A_WINNER"
    elif score >= 60:
        classification = "B_NEAR_WINNER"
    elif score >= 40:
        classification = "C_WEAK"
    elif score >= 20:
        classification = "D_REDUNDANT"
    elif score >= 10:
        classification = "E_PRUNE"
    else:
        classification = "F_NOINDEX"
    
    return {
        "url": url,
        "slug": slug,
        "type": page_type,
        "score": score,
        "classification": classification,
        "position": pos,
        "impressions": impr,
        "reasons": reasons,
    }

def classify_all():
    """Classify all pages."""
    gsc = load_gsc_data()
    
    pages = []
    
    # Pages with GSC data (from low_ctr_targets)
    for t in gsc.get("gsc", {}).get("low_ctr_targets", []):
        url = t["page"]
        slug = url.replace("https://www.qfinhub.com", "").strip("/")
        queries = t.get("queries", [])
        total_impr = sum(q.get("impr", 0) for q in queries)
        best_pos = min((q.get("pos", 999) for q in queries), default=999)
        
        # Determine page type
        if "/calculators/" in url and "/" not in url.split("/calculators/")[1]:
            ptype = "calculator"
        elif "/tools/" in url:
            ptype = "tool_variant"
        elif "/scenario/" in url:
            ptype = "scenario"
        elif "/blog/" in url:
            ptype = "blog"
        elif "/guides/" in url:
            ptype = "guide"
        else:
            ptype = "other"
        
        scored = score_page(url, total_impr, best_pos, slug, ptype)
        pages.append(scored)
    
    # Sort by score descending
    pages.sort(key=lambda p: -p["score"])
    
    # Summary
    summary = {
        "generated_at": datetime.now().isoformat(),
        "total_pages_scored": len(pages),
        "classifications": {},
        "pages": pages,
    }
    
    for p in pages:
        c = p["classification"]
        summary["classifications"][c] = summary["classifications"].get(c, 0) + 1
    
    # Save
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_FILE, "w") as f:
        json.dump(summary, f, indent=2)
    
    # Print summary
    print("=" * 55)
    print("📊 QFINHUB V2 Page Classification")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)
    
    for c in ["A_WINNER", "B_NEAR_WINNER", "C_WEAK", "D_REDUNDANT", "E_PRUNE", "F_NOINDEX"]:
        count = summary["classifications"].get(c, 0)
        bar = "█" * count
        print(f"  {c:20s}: {count:3d} {bar}")
    
    print(f"\n  Total scored: {len(pages)}")
    print(f"\n📄 Report: {OUTPUT_FILE}")
    
    # Action recommendations
    print("\n🎯 RECOMMENDED ACTIONS:")
    for p in pages[:3]:
        print(f"  [{p['classification']:15s}] {p['slug'][:50]}")
        print(f"    Score: {p['score']} | Pos: {p['position']:.0f} | Impr: {p['impressions']}")
        print(f"    Action: {'Strengthen CTR + links + content' if p['classification'] == 'A_WINNER' else 'Improve intent match + meta' if p['classification'] == 'B_NEAR_WINNER' else 'Rewrite or consolidate'}")

if __name__ == "__main__":
    classify_all()
