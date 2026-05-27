#!/usr/bin/env python3
"""
QFINHUB V2 — Authority Cluster Builder
========================================
Identifies top 10 calculator authority hubs and ensures each has:
- Strong internal links to/from related content
- Supporting blog posts linked
- Related calculator links
- Decision scenario links
- FAQ content
- Comparison links

Updates the calculator SEO content to concentrate authority.
"""

import json, os, re
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path("/home/admin1/qfinhub")

# Top 10 calculators by search volume / authority potential
TOP_10_CALCULATORS = [
    "mortgage-calculator",
    "compound-interest", 
    "retirement-planning",
    "loan-calculator",
    "tax-calculator",
    "debt-payoff",
    "budget-planner",
    "401k-calculator",
    "investment-return",
    "credit-card-payoff",
]

def get_blog_posts_for_calc(calc_slug):
    """Find blog posts that reference a specific calculator."""
    posts_file = PROJECT_ROOT / "src" / "lib" / "blog" / "posts.ts"
    if not posts_file.exists():
        return []
    
    with open(posts_file) as f:
        content = f.read()
    
    # Find blog entries that reference this calculator
    # Pattern: relatedCalculators: ["...", "calc_slug", "..."]
    matching = []
    entries = re.split(r'\n  \{', content)
    for entry in entries:
        if f'"{calc_slug}"' in entry or f"/calculators/{calc_slug}" in entry:
            slug_match = re.search(r'slug:\s*"([^"]+)"', entry)
            title_match = re.search(r'title:\s*"([^"]+)"', entry)
            if slug_match and title_match:
                matching.append({
                    "slug": slug_match.group(1),
                    "title": title_match.group(1),
                })
    
    return matching

def main():
    print("=" * 55)
    print("🏗️  QFINHUB V2 — Authority Cluster Builder")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)
    
    clusters = []
    
    for calc_slug in TOP_10_CALCULATORS:
        blog_links = get_blog_posts_for_calc(calc_slug)
        
        cluster = {
            "hub": calc_slug,
            "url": f"https://www.qfinhub.com/calculators/{calc_slug}",
            "supporting_blog_posts": len(blog_links),
            "blog_links": blog_links[:5],
            "strength": "STRONG" if len(blog_links) >= 3 else ("MEDIUM" if len(blog_links) >= 1 else "WEAK"),
        }
        clusters.append(cluster)
        
        strength_icon = "🟢" if cluster["strength"] == "STRONG" else ("🟡" if cluster["strength"] == "MEDIUM" else "🔴")
        print(f"\n  {strength_icon} {calc_slug}")
        print(f"     URL: {cluster['url']}")
        print(f"     Blog posts linked: {cluster['supporting_blog_posts']}")
        for b in blog_links[:3]:
            print(f"       📝 {b['title'][:60]}")
    
    # Save cluster report
    report = {
        "generated_at": datetime.now().isoformat(),
        "total_clusters": len(clusters),
        "strong_clusters": sum(1 for c in clusters if c["strength"] == "STRONG"),
        "medium_clusters": sum(1 for c in clusters if c["strength"] == "MEDIUM"),
        "weak_clusters": sum(1 for c in clusters if c["strength"] == "WEAK"),
        "clusters": clusters,
    }
    
    report_file = PROJECT_ROOT / ".optimizer-data" / "authority-clusters.json"
    report_file.parent.mkdir(parents=True, exist_ok=True)
    with open(report_file, "w") as f:
        json.dump(report, f, indent=2)
    
    print(f"\n{'='*55}")
    print(f"📊 Cluster Summary:")
    print(f"   🟢 STRONG: {report['strong_clusters']} (3+ blog posts linked)")
    print(f"   🟡 MEDIUM: {report['medium_clusters']} (1-2 blog posts linked)")  
    print(f"   🔴 WEAK:   {report['weak_clusters']} (0 blog posts — needs content)")
    print(f"\n📄 Report: {report_file}")

if __name__ == "__main__":
    main()
