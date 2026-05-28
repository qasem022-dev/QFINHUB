#!/usr/bin/env python3
"""
QFINHUB V2 — Full-Site Page Scoring Engine v3
===============================================
Scores every page on 14 dimensions (0-100). Generates action plans.
Phase 4: Analysis only — does NOT modify site.
"""

import json, os, re, sys, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timedelta
from collections import Counter

PROJECT = Path("/home/admin1/qfinhub")
OUTPUT = PROJECT / ".optimizer-data"

# ═══════════════════════════════════════════════════════════════════
# DATA LOADERS
# ═══════════════════════════════════════════════════════════════════

def load_json(path):
    if not path.exists():
        return {}
    with open(path) as f:
        return json.load(f)

def load_calculator_slugs():
    index_file = PROJECT / "src/lib/calculators/index.ts"
    with open(index_file) as f:
        return set(re.findall(r'slug:\s*"([^"]+)"', f.read()))

def load_blog_posts():
    posts_file = PROJECT / "src/lib/blog/posts.ts"
    with open(posts_file) as f:
        content = f.read()
    slugs = re.findall(r'slug:\s*"([^"]+)"', content)
    titles = re.findall(r'title:\s*"([^"]+)"', content)
    descs = re.findall(r'description:\s*"([^"]+)"', content)
    dates = re.findall(r'publishedAt:\s*new Date\("([^"]+)"\)', content)
    cats = re.findall(r'category:\s*"([^"]+)"', content)
    return [{"slug": s, "title": titles[i] if i<len(titles) else s,
             "desc": descs[i] if i<len(descs) else "",
             "date": dates[i] if i<len(dates) else "",
             "category": cats[i] if i<len(cats) else "unknown"}
            for i, s in enumerate(slugs)]

def load_scenario_index():
    idx = load_json(PROJECT / "public/data/scenarios/index.json")
    return idx  # {slug: {batch, title, calculatorSlug, category}}

def load_gsc_data():
    briefing = load_json(PROJECT / ".optimizer-data/growth-briefing.json")
    report = load_json(PROJECT / ".optimizer-data/traffic-report.json")
    gsc_pages = {}
    # From traffic report
    for p in report.get("search_console", {}).get("top_pages", []):
        gsc_pages[p["page"]] = {
            "impressions": p.get("impressions", 0),
            "clicks": p.get("clicks", 0),
            "position": p.get("position", 99),
        }
    return gsc_pages

def load_sitemap_urls():
    """Fetch current sitemap URLs."""
    sitemaps = load_json(OUTPUT / "authority-clusters.json")
    urls = set()
    try:
        req = urllib.request.Request("https://www.qfinhub.com/sitemap.xml")
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode()
            urls.update(re.findall(r'<loc>(https://www\.qfinhub\.com/[^<]+)</loc>', content))
    except:
        urls = set()
    return urls

# ═══════════════════════════════════════════════════════════════════
# SCORING FUNCTIONS
# ═══════════════════════════════════════════════════════════════════

def classify_page(url, calc_slugs, blog_slugs, scenario_slugs, geo_pattern):
    """Determine page type from URL."""
    path = url.replace("https://www.qfinhub.com", "").rstrip("/")
    
    if path.startswith("/calculators/") and path.count("/") == 3:
        return "geo"
    if path.startswith("/calculators/") and path.count("/") == 2:
        slug = path.split("/calculators/")[-1]
        if slug.endswith("-calculator") or slug in calc_slugs:
            return "calculator"
        return "geo"
    if path.startswith("/tools/"):
        return "tool_variant"
    if path.startswith("/scenario/"):
        return "scenario"
    if path.startswith("/blog/"):
        return "blog"
    if path.startswith("/compare/"):
        return "comparison"
    if path.startswith("/guides/"):
        return "guide"
    return "static"

def score_intent_uniqueness(url, page_type):
    """Score 0-15: How unique is the search intent this page answers?"""
    path = url.replace("https://www.qfinhub.com", "").rstrip("/")
    
    if page_type == "calculator":
        return 15  # Each calculator answers a distinct financial question
    if page_type == "blog":
        slug = path.split("/blog/")[-1]
        # Blogs with specific numbers in slug = very targeted
        if re.search(r'\d', slug):
            return 14
        return 10
    if page_type == "tool_variant":
        slug = path.split("/tools/")[-1]
        # Clean, human-readable variants
        if not re.search(r'[a-z]+-\d', slug):
            return 10
        # Investment amount scenarios are reasonable
        if slug.startswith("investment-") or slug.startswith("fire-") or slug.startswith("fi-"):
            return 7
        # Tax bracket variants
        if slug.startswith("tax-"):
            return 6
        # Pure formula variants (pct+yr/mo)
        return 3
    if page_type == "scenario":
        return 4  # Hash-ID pages are inherently generic
    if page_type == "geo":
        return 3  # City-swap pages
    if page_type == "comparison":
        return 12  # Comparison pages have clear intent
    if page_type == "guide":
        return 8
    return 5

def score_content_depth(url, page_type, blogs=None, scenarios=None):
    """Score 0-15: Content depth estimation."""
    if page_type == "calculator":
        return 12  # Core calculators generally have decent content
    if page_type == "blog":
        path = url.replace("https://www.qfinhub.com", "").rstrip("/")
        slug = path.split("/blog/")[-1]
        # Estimate from slug length/clarity
        if len(slug) > 50:
            return 13
        return 10
    if page_type == "tool_variant":
        return 5  # Template content with swapped numbers
    if page_type == "scenario":
        return 8  # Scenario pages have moderate content
    if page_type == "geo":
        return 4  # City-swap template
    if page_type == "comparison":
        return 10
    if page_type == "guide":
        return 8
    if page_type == "static":
        return 6
    return 5

def score_slug_risk(url, page_type):
    """Score 0-10: Higher = less risky slug. Lower = doorway-risk slug."""
    path = url.replace("https://www.qfinhub.com", "").rstrip("/")
    slug = path.rsplit("/", 1)[-1]
    
    if page_type == "calculator":
        return 10
    if page_type == "blog":
        return 9
    if page_type == "static":
        return 10
    if page_type == "comparison":
        return 8
    if page_type == "guide":
        return 7
    
    # Tool variants: check formula patterns
    if page_type == "tool_variant":
        parts = slug.split("-")
        has_pct = any(p.endswith("pct") for p in parts)
        has_yr = any(p.endswith("yr") for p in parts)
        has_mo = any(p.endswith("mo") for p in parts)
        num_parts = len([p for p in parts if re.search(r'\d', p)])
        
        if has_pct and (has_yr or has_mo):
            return 1  # Pure formula variant
        if num_parts >= 3 and re.search(r'\d', slug):
            return 2  # Multi-parameter
        if re.search(r'\d', slug):
            return 4  # Single numeric parameter
        return 7  # Clean variant
    
    if page_type == "scenario":
        return 1  # Hash-ID = maximum risk
    
    if page_type == "geo":
        return 1  # City-swap = high risk
    
    return 5

def score_page_type_risk(page_type):
    """Score 0-10: Higher = lower risk page type."""
    risks = {
        "calculator": 10,
        "blog": 9,
        "comparison": 8,
        "guide": 7,
        "static": 8,
        "tool_variant": 3,
        "scenario": 1,
        "geo": 2,
    }
    return risks.get(page_type, 5)

def score_tool_usefulness(page_type, url):
    """Score 0-10: Does this page provide a useful interactive tool?"""
    if page_type == "calculator":
        return 10
    if page_type == "tool_variant":
        return 8  # Has embedded calculator
    if page_type == "scenario":
        return 6  # Has pre-filled calculator
    if page_type == "geo":
        return 7  # Has calculator
    if page_type == "comparison":
        return 5
    return 3  # Content-only pages

def score_gsc_bonus(url, gsc_data):
    """Score 0-10: Bonus for pages with Google traffic."""
    if url not in gsc_data:
        return 0
    g = gsc_data[url]
    impr = g.get("impressions", 0)
    clicks = g.get("clicks", 0)
    pos = g.get("position", 99)
    
    score = 0
    if impr > 20: score += 5
    elif impr > 5: score += 3
    elif impr > 0: score += 2
    
    if clicks > 0: score += 3
    
    if pos <= 10: score += 2
    
    return min(score, 10)

def score_eeat_signals(page_type):
    """Score 0-5: E-E-A-T signals."""
    if page_type == "calculator":
        return 4  # Has disclaimer, author, methodology links
    if page_type == "blog":
        return 3  # Has author, category
    if page_type == "scenario":
        return 2
    if page_type == "tool_variant":
        return 2
    if page_type == "geo":
        return 2
    if page_type == "static":
        return 3
    return 2

def compute_total_score(url, page_type, gsc_data, calc_slugs, blog_data, scenario_data):
    """Compute 0-100 score across all dimensions."""
    scores = {}
    
    scores["intent"] = score_intent_uniqueness(url, page_type)
    scores["depth"] = score_content_depth(url, page_type)
    scores["slug_risk"] = score_slug_risk(url, page_type)
    scores["type_risk"] = score_page_type_risk(page_type)
    scores["usefulness"] = score_tool_usefulness(page_type, url)
    scores["gsc"] = score_gsc_bonus(url, gsc_data)
    scores["eeat"] = score_eeat_signals(page_type)
    
    # Title uniqueness (0-10): simplified — based on slug uniqueness
    path = url.replace("https://www.qfinhub.com", "").rstrip("/")
    slug = path.rsplit("/", 1)[-1]
    if page_type in ("calculator", "blog", "comparison", "static"):
        scores["title_unique"] = 9
    elif page_type == "tool_variant":
        parts = slug.split("-")
        has_unique_words = any(not p.replace("pct","").replace("yr","").replace("mo","").replace("k","").isdigit() 
                              for p in parts if len(p) > 2)
        scores["title_unique"] = 6 if has_unique_words else 3
    elif page_type == "scenario":
        scores["title_unique"] = 2  # Hash-ID = generic
    elif page_type == "geo":
        scores["title_unique"] = 2  # Template titles
    else:
        scores["title_unique"] = 5
    
    # Internal links (0-10): rough estimate
    if page_type == "calculator":
        scores["internal_links"] = 8  # Linked from blogs
    elif page_type == "blog":
        scores["internal_links"] = 6
    elif page_type == "tool_variant":
        scores["internal_links"] = 3
    elif page_type == "scenario":
        scores["internal_links"] = 4
    elif page_type == "geo":
        scores["internal_links"] = 2
    elif page_type == "static":
        scores["internal_links"] = 7
    else:
        scores["internal_links"] = 3
    
    # Duplicate penalty (-10 max)
    dup_penalty = 0
    if page_type == "tool_variant" and scores["slug_risk"] <= 2:
        dup_penalty = -5
    if page_type == "scenario":
        dup_penalty = -5
    if page_type == "geo":
        dup_penalty = -5
    scores["dup_penalty"] = dup_penalty
    
    total = sum(scores.values())
    return min(max(total, 0), 100), scores

def classify(score):
    """A-F classification."""
    if score >= 75: return "A_WINNER"
    if score >= 55: return "B_NEAR_WINNER"
    if score >= 35: return "C_WEAK"
    if score >= 20: return "D_REDUNDANT"
    if score >= 10: return "E_PRUNE"
    return "F_DELETE"

def recommended_action(classification, page_type, gsc_data, url):
    """Generate recommended action."""
    actions = {
        "A_WINNER": "Keep indexable. Strengthen CTR, internal links, and content depth.",
        "B_NEAR_WINNER": "Keep indexable. Improve content, metadata, and internal links.",
        "C_WEAK": "Review for improvement. Consider content expansion or canonicalization.",
        "D_REDUNDANT": "Candidate for noindex or canonicalization to parent page.",
        "E_PRUNE": "Candidate for noindex + removal from sitemap.",
        "F_DELETE": "Candidate for deletion/410 after human review.",
    }
    return actions.get(classification, "Review manually.")

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

def main():
    print("=" * 60)
    print("🔍 QFINHUB V2 — Full-Site Page Scoring Engine v3")
    print(f"   {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Load data
    print("\n📂 Loading data...")
    calc_slugs = load_calculator_slugs()
    blog_data = load_blog_posts()
    blog_slugs = {b["slug"] for b in blog_data}
    scenario_index = load_scenario_index()
    scenario_slugs = set(scenario_index.keys()) if scenario_index else set()
    gsc_data = load_gsc_data()
    sitemap_urls = load_sitemap_urls()
    
    print(f"   Calculators: {len(calc_slugs)}")
    print(f"   Blog posts: {len(blog_data)}")
    print(f"   Scenarios in index.json: {len(scenario_slugs)}")
    print(f"   GSC pages with data: {len(gsc_data)}")
    print(f"   Sitemap URLs (live): {len(sitemap_urls)}")
    
    # Collect all URLs
    all_pages = []
    BASE = "https://www.qfinhub.com"
    
    # Calculators
    for slug in calc_slugs:
        all_pages.append(f"{BASE}/calculators/{slug}")
    
    # Blogs
    for b in blog_data:
        all_pages.append(f"{BASE}/blog/{b['slug']}")
    
    # Scenarios
    for slug in scenario_slugs:
        all_pages.append(f"{BASE}/scenario/{slug}")
    
    # Tool variants — from sitemap
    tool_urls = {u for u in sitemap_urls if "/tools/" in u}
    geo_urls = {u for u in sitemap_urls if "/calculators/" in u and u.count("/") >= 5}
    compare_urls = {u for u in sitemap_urls if "/compare/" in u}
    guide_urls = {u for u in sitemap_urls if "/guides/" in u}
    static_urls = {u for u in sitemap_urls if "/tools/" not in u and "/calculators/" not in u
                   and "/blog/" not in u and "/compare/" not in u and "/guides/" not in u
                   and "/scenario/" not in u}
    
    all_pages.extend(tool_urls - set(all_pages))
    all_pages.extend(geo_urls - set(all_pages))
    all_pages.extend(compare_urls - set(all_pages))
    all_pages.extend(guide_urls - set(all_pages))
    all_pages.extend(static_urls - set(all_pages))
    
    # Also include ALL geo pages (even those not in sitemap)
    geo_pattern = re.compile(r'/calculators/[^/]+/[a-z]+-[a-z]{2}$')
    all_geo = [u for u in all_pages if geo_pattern.search(u)]
    
    all_pages = list(set(all_pages))
    
    print(f"\n📊 Total pages to score: {len(all_pages)}")
    
    # Score all pages
    print("\n🔢 Scoring pages...")
    scored = []
    
    for i, url in enumerate(all_pages):
        page_type = classify_page(url, calc_slugs, blog_slugs, scenario_slugs, geo_pattern)
        score, dimensions = compute_total_score(url, page_type, gsc_data, calc_slugs, blog_data, scenario_index)
        classification = classify(score)
        action = recommended_action(classification, page_type, gsc_data, url)
        
        # Get GSC data if available
        gsc_info = gsc_data.get(url, {})
        
        # Get title/desc from blog data if applicable
        title = ""
        desc = ""
        if page_type == "blog":
            path = url.replace(BASE, "").rstrip("/")
            slug = path.split("/blog/")[-1]
            for b in blog_data:
                if b["slug"] == slug:
                    title = b["title"]
                    desc = b["desc"]
                    break
        
        scored.append({
            "url": url,
            "page_type": page_type,
            "score": score,
            "classification": classification,
            "recommended_action": action,
            "dimensions": dimensions,
            "title": title,
            "description": desc,
            "in_sitemap": url in sitemap_urls,
            "gsc_impressions": gsc_info.get("impressions", 0),
            "gsc_clicks": gsc_info.get("clicks", 0),
            "gsc_position": gsc_info.get("position", 999),
        })
        
        if (i + 1) % 500 == 0:
            print(f"   Scored {i+1}/{len(all_pages)}...")
    
    print(f"   ✅ Scored {len(scored)} pages")
    
    # Sort by score descending
    scored.sort(key=lambda p: -p["score"])
    
    # Classification counts
    class_counts = Counter(p["classification"] for p in scored)
    type_counts = Counter(p["page_type"] for p in scored)
    
    print("\n📊 CLASSIFICATION SUMMARY:")
    for c in ["A_WINNER", "B_NEAR_WINNER", "C_WEAK", "D_REDUNDANT", "E_PRUNE", "F_DELETE"]:
        count = class_counts.get(c, 0)
        bar = "█" * min(count, 60)
        print(f"  {c:20s}: {count:4d} {bar}")
    
    print("\n📊 BY PAGE TYPE:")
    for t, c in sorted(type_counts.items()):
        print(f"  {t:20s}: {c:4d}")
    
    # Generate output files
    OUTPUT.mkdir(parents=True, exist_ok=True)
    
    # 1. Full scores
    with open(OUTPUT / "full-site-scores.json", "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_scored": len(scored),
            "classifications": dict(class_counts),
            "by_type": dict(type_counts),
            "pages": scored,
        }, f, indent=2)
    print(f"\n📄 full-site-scores.json — {len(scored)} pages")
    
    # 2. Noindex plan
    noindex = [p for p in scored if p["classification"] in ("D_REDUNDANT", "E_PRUNE", "F_DELETE")]
    with open(OUTPUT / "noindex-plan.json", "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_candidates": len(noindex),
            "candidates": [
                {"url": p["url"], "type": p["page_type"], "score": p["score"],
                 "classification": p["classification"], "reason": p["recommended_action"]}
                for p in noindex
            ],
        }, f, indent=2)
    print(f"📄 noindex-plan.json — {len(noindex)} candidates")
    
    # 3. Canonical plan
    canonical = [p for p in scored if p["classification"] == "D_REDUNDANT"]
    with open(OUTPUT / "canonical-plan.json", "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_candidates": len(canonical),
            "candidates": [
                {"url": p["url"], "type": p["page_type"], "score": p["score"],
                 "suggested_target": "Parent calculator or nearest unique page — determine manually"}
                for p in canonical
            ],
        }, f, indent=2)
    print(f"📄 canonical-plan.json — {len(canonical)} candidates")
    
    # 4. Prune plan
    prune = [p for p in scored if p["classification"] in ("E_PRUNE", "F_DELETE")]
    with open(OUTPUT / "prune-plan.json", "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "warning": "DO NOT execute automatically. Human review required before any deletion.",
            "total_candidates": len(prune),
            "candidates": [
                {"url": p["url"], "type": p["page_type"], "score": p["score"],
                 "classification": p["classification"]}
                for p in prune
            ],
        }, f, indent=2)
    print(f"📄 prune-plan.json — {len(prune)} candidates")
    
    # 5. Winners plan
    winners = [p for p in scored if p["classification"] in ("A_WINNER", "B_NEAR_WINNER")]
    with open(OUTPUT / "winners-plan.json", "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_winners": len(winners),
            "winners": [
                {"url": p["url"], "type": p["page_type"], "score": p["score"],
                 "classification": p["classification"], "gsc_impressions": p["gsc_impressions"],
                 "gsc_clicks": p["gsc_clicks"], "action": p["recommended_action"]}
                for p in winners
            ],
        }, f, indent=2)
    print(f"📄 winners-plan.json — {len(winners)} pages")
    
    # 6. Uncertain review list
    uncertain = [p for p in scored if p["classification"] == "C_WEAK"]
    with open(OUTPUT / "uncertain-review-list.json", "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_uncertain": len(uncertain),
            "pages": [
                {"url": p["url"], "type": p["page_type"], "score": p["score"],
                 "dimensions": p["dimensions"], "gsc_data": {
                     "impressions": p["gsc_impressions"],
                     "clicks": p["gsc_clicks"],
                     "position": p["gsc_position"],
                 }}
                for p in uncertain
            ],
        }, f, indent=2)
    print(f"📄 uncertain-review-list.json — {len(uncertain)} pages")
    
    # Top 10 winners
    print("\n🏆 TOP 10 WINNERS:")
    for p in scored[:10]:
        gsc = f" | GSC: {p['gsc_impressions']}impr/{p['gsc_clicks']}clk/pos{p['gsc_position']:.0f}" if p['gsc_impressions'] > 0 else ""
        print(f"  [{p['classification']:15s}] {p['page_type']:15s} | Score: {p['score']:3d}{gsc}")
        print(f"    {p['url']}")
    
    # Bottom 10 (highest risk)
    print("\n⚠️  TOP 10 PRUNE/DELETE CANDIDATES:")
    bottom = [p for p in scored if p["classification"] in ("E_PRUNE", "F_DELETE")][:10]
    for p in bottom:
        print(f"  [{p['classification']:15s}] {p['page_type']:15s} | Score: {p['score']:3d}")
        print(f"    {p['url']}")
    
    print(f"\n{'='*60}")
    print("✅ Phase 4 complete. All output files in .optimizer-data/")
    print("   No pages were modified, deleted, or changed.")
    print(f"{'='*60}")

if __name__ == "__main__":
    main()
