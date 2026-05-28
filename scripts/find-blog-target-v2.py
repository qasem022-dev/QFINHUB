#!/usr/bin/env python3
"""
QFINHUB V2 — Blog Target Finder
=================================
Finds the highest-priority topic for the next blog post based on:
- GSC queries with impressions but no clicks
- Calculator cluster gaps (WEAK/MEDIUM hubs needing more blog support)
- Decision-intent or comparison-intent queries
- Supporting articles for priority calculator hubs

Output: JSON with recommended topic, target keyword, cluster, and rationale.
"""

import json, os, re
from pathlib import Path
from datetime import datetime

PROJECT = Path("/home/admin1/qfinhub")

# ── 10 priority hubs ──
PRIORITY_HUBS = [
    "mortgage-calculator", "compound-interest", "retirement-planning",
    "loan-calculator", "debt-payoff", "credit-card-payoff",
    "percentage-calculator", "tax-calculator", "401k-calculator", "investment-return"
]

# ── Load GSC data ──
def load_gsc_queries():
    report_file = PROJECT / ".optimizer-data" / "traffic-report.json"
    if not report_file.exists():
        return []
    with open(report_file) as f:
        d = json.load(f)
    return d.get("search_console", {}).get("top_queries", [])

def load_authority_clusters():
    cluster_file = PROJECT / ".optimizer-data" / "authority-clusters.json"
    if not cluster_file.exists():
        return {}
    with open(cluster_file) as f:
        return json.load(f)

def main():
    queries = load_gsc_queries()
    clusters = load_authority_clusters()
    
    targets = []
    
    # ── 1. GSC query opportunities (queries with impressions, 0 clicks) ──
    for q in queries:
        impr = q.get("impressions", 0)
        clicks = q.get("clicks", 0)
        pos = q.get("position", 99)
        query = q.get("query", "")
        
        if impr >= 3 and clicks == 0 and pos <= 50:
            # Determine which cluster this query belongs to
            cluster = identify_cluster(query)
            if cluster and cluster in PRIORITY_HUBS:
                targets.append({
                    "source": "gsc_query",
                    "priority": min(100, impr * 3 + (50 - pos)),
                    "query": query,
                    "impressions": impr,
                    "position": pos,
                    "cluster": cluster,
                    "rationale": f"GSC query '{query}' has {impr} impressions at position {pos:.0f} with 0 clicks — capture with dedicated blog post",
                })
    
    # ── 2. Cluster gaps (WEAK/MEDIUM hubs) ──
    cluster_list = clusters.get("clusters", [])
    for c in cluster_list:
        hub = c.get("hub", "")
        strength = c.get("strength", "WEAK")
        blog_count = c.get("supporting_blog_posts", 0)
        
        if strength in ("WEAK", "MEDIUM") and hub in PRIORITY_HUBS:
            priority = 50 if strength == "WEAK" else 30
            targets.append({
                "source": "cluster_gap",
                "priority": priority,
                "query": f"{hub.replace('-', ' ')} guide",
                "impressions": 0,
                "position": 0,
                "cluster": hub,
                "rationale": f"Hub '{hub}' is {strength} with only {blog_count} blog posts — needs supporting content",
            })
    
    # Sort by priority descending
    targets.sort(key=lambda t: -t["priority"])
    
    # Output top target
    if targets:
        result = {
            "generated_at": datetime.now().isoformat(),
            "candidates_found": len(targets),
            "recommended": targets[0],
            "alternatives": targets[1:4],
        }
    else:
        result = {
            "generated_at": datetime.now().isoformat(),
            "candidates_found": 0,
            "recommended": None,
            "error": "No suitable targets found. Check GSC data and cluster status.",
        }
    
    print(json.dumps(result, indent=2))

def identify_cluster(query):
    """Map a search query to the closest QFINHUB calculator cluster."""
    q = query.lower()
    mappings = {
        "mortgage": "mortgage-calculator",
        "mortgage calculator": "mortgage-calculator",
        "compound interest": "compound-interest",
        "compound": "compound-interest",
        "retirement": "retirement-planning",
        "retire": "retirement-planning",
        "401k": "401k-calculator",
        "401(k)": "401k-calculator",
        "loan": "loan-calculator",
        "debt": "debt-payoff",
        "credit card": "credit-card-payoff",
        "tax": "tax-calculator",
        "investment": "investment-return",
        "investing": "investment-return",
        "budget": "budget-planner",
        "savings": "savings-goal",
        "percentage": "percentage-calculator",
        "afford": "mortgage-affordability",
    }
    for keyword, cluster in mappings.items():
        if keyword in q:
            return cluster
    # Check for financial calculator queries
    if any(w in q for w in ["calculate", "calculator", "payment", "rate", "apr"]):
        return "loan-calculator"
    return None

if __name__ == "__main__":
    main()
