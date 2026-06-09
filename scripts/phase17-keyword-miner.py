#!/usr/bin/env python3
"""
Phase 17 Search Demand Capture Engine
Keyword Miner — Google Suggest + GSC Query Data + Variation Generation

Sources:
1. Google Suggest autocomplete (reliable, free, real user queries)
2. GSC Search Analytics API (actual queries that led to QFINHUB impressions)
3. Question/comparison/year variations (coverage)
"""

import json, time, re, urllib.request, urllib.parse, os
from datetime import datetime, timedelta
from collections import defaultdict

OUTPUT_FILE = '.optimizer-data/search-demand-keyword-mining.json'
GSC_TOKEN_FILE = os.path.expanduser('~/.hermes/google-indexing-token.json')
PROJECT_ROOT = '/home/admin1/qfinhub'

SEED_CATEGORIES = {
    "general": ["finance calculator", "financial calculator", "money calculator", "personal finance calculator"],
    "mortgage": ["mortgage calculator", "mortgage affordability", "how much house can I afford", "refinance calculator", "HELOC calculator", "home equity calculator", "down payment calculator"],
    "debt": ["debt payoff calculator", "credit card payoff", "debt snowball", "loan payoff calculator", "personal loan calculator", "student loan calculator"],
    "retirement": ["retirement calculator", "401k calculator", "IRA calculator", "Roth vs traditional", "pension calculator", "FIRE calculator", "social security calculator", "retirement income"],
    "tax": ["tax calculator", "income tax calculator", "paycheck calculator", "tax bracket calculator", "capital gains tax calculator"],
    "savings": ["emergency fund calculator", "budget calculator", "savings goal calculator", "compound interest calculator", "inflation calculator", "high yield savings"],
    "investing": ["investment return calculator", "ROI calculator", "stock return calculator", "dividend calculator", "dollar cost averaging", "portfolio calculator"]
}

QUESTION_MODIFIERS = ["how to", "how much", "what is", "how do i", "should i", "can i", "when to", "is it worth", "best way to"]
COMPARISON_MODIFIERS = ["vs", "versus", "compared to"]
YEAR_TAGS = ["2026", "2025"]

def google_suggest(keyword, country="us", language="en"):
    """Fetch Google Suggest autocomplete suggestions."""
    url = "https://suggestqueries.google.com/complete/search"
    params = urllib.parse.urlencode({"client": "firefox", "q": keyword, "hl": language, "gl": country})
    try:
        req = urllib.request.Request(f"{url}?{params}", headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/120.0"
        })
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
            return data[1] if len(data) > 1 else []
    except Exception as e:
        return []

def get_gsc_queries():
    """Pull actual search queries from GSC API (last 28 days)."""
    queries = []
    try:
        if not os.path.exists(GSC_TOKEN_FILE):
            print("  No GSC token — skipping API pull")
            return queries
        
        with open(GSC_TOKEN_FILE) as f:
            token_data = json.load(f)
        
        access_token = token_data.get('access_token', '')
        if not access_token:
            return queries
        
        site_url = "https://www.qfinhub.com/"
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=28)).strftime("%Y-%m-%d")
        
        body = json.dumps({
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["query"],
            "rowLimit": 250,
            "startRow": 0
        }).encode()
        
        url = "https://www.googleapis.com/webmasters/v3/sites/" + urllib.parse.quote(site_url, safe='') + "/searchAnalytics/query"
        req = urllib.request.Request(url, data=body, headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json"
        })
        
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode())
            for row in data.get('rows', []):
                q = row.get('keys', [''])[0].strip().lower()
                imps = row.get('impressions', 0)
                clicks = row.get('clicks', 0)
                if q and len(q) > 3:
                    queries.append({"query": q, "impressions": imps, "clicks": clicks, "source": "gsc_api"})
        
        print(f"  GSC API: {len(queries)} queries pulled (28 days)")
    except Exception as e:
        print(f"  GSC API error: {e}")
    
    return queries

def generate_variations(keyword):
    """Generate question, comparison, and year variations."""
    variations = []
    base = keyword.lower()
    
    for mod in QUESTION_MODIFIERS:
        v = f"{mod} {base}"
        if len(v) < 120:
            variations.append({"query": v, "source": "question_variation", "seed": keyword})
    
    words = base.split()
    if len(words) >= 2:
        for i in range(len(words)-1):
            v = f"{' '.join(words[:i+1])} vs {' '.join(words[i+1:])}"
            if len(v) > 3:
                variations.append({"query": v, "source": "comparison_variation", "seed": keyword})
    
    for year in YEAR_TAGS:
        variations.append({"query": f"{base} {year}", "source": "year_variation", "seed": keyword})
    
    return variations[:15]

def mine_all():
    """Main mining function."""
    all_entries = []
    keyword_set = set()
    source_counts = defaultdict(int)
    category_data = {}
    
    print("🔍 Phase 17 Keyword Miner — Starting...")
    
    # Source 1: Google Suggest
    print("\n📡 Source 1: Google Suggest autocomplete")
    suggest_count = 0
    for category, seeds in SEED_CATEGORIES.items():
        cat_suggests = []
        for seed in seeds:
            suggestions = google_suggest(seed)
            for s in suggestions:
                s_clean = s.strip()
                if s_clean and s_clean.lower() not in keyword_set and len(s_clean) > 3:
                    keyword_set.add(s_clean.lower())
                    entry = {"query": s_clean, "source": "google_suggest", "seed": seed, "category": category}
                    cat_suggests.append(entry)
                    all_entries.append(entry)
                    source_counts["google_suggest"] += 1
                    suggest_count += 1
            time.sleep(0.15)
        category_data[category] = {"suggest_terms": cat_suggests}
        print(f"  {category}: {len(cat_suggests)} suggests from {len(seeds)} seeds")
    print(f"  Total suggests: {suggest_count}")
    
    # Source 2: GSC API queries
    print("\n📊 Source 2: GSC Search Analytics (actual queries)")
    gsc_queries = get_gsc_queries()
    gsc_added = 0
    for gq in gsc_queries:
        q = gq['query'].lower()
        if q not in keyword_set:
            keyword_set.add(q)
            entry = {"query": gq['query'], "source": "gsc_api", "impressions": gq['impressions'], "clicks": gq['clicks']}
            all_entries.append(entry)
            source_counts["gsc_api"] += 1
            gsc_added += 1
    print(f"  New unique GSC queries: {gsc_added}")
    
    # Source 3: Variation generation
    print("\n🔧 Source 3: Variation generation")
    var_count = 0
    for category, seeds in SEED_CATEGORIES.items():
        for seed in seeds[:3]:  # Top 3 per category
            variations = generate_variations(seed)
            for v in variations:
                q = v['query'].lower()
                if q not in keyword_set:
                    keyword_set.add(q)
                    entry = {"query": v['query'], "source": v['source'], "seed": seed, "category": category}
                    all_entries.append(entry)
                    source_counts[v['source']] += 1
                    var_count += 1
    print(f"  Total variations: {var_count}")
    
    # Source 4: Existing QFINHUB page inventory
    print("\n📋 Source 4: QFINHUB page inventory")
    inventory_terms = get_page_inventory_keywords()
    inv_added = 0
    for term in inventory_terms:
        if term.lower() not in keyword_set:
            keyword_set.add(term.lower())
            entry = {"query": term, "source": "page_inventory"}
            all_entries.append(entry)
            source_counts["page_inventory"] += 1
            inv_added += 1
    print(f"  Inventory terms: {inv_added}")
    
    # Build output
    output = {
        "report": "Search Demand Keyword Mining",
        "generated": datetime.utcnow().isoformat() + "Z",
        "phase": "17",
        "total_keywords": len(keyword_set),
        "source_counts": dict(source_counts),
        "entries": sorted(all_entries, key=lambda x: source_counts.get(x.get('source', ''), 0), reverse=True)
    }
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n{'='*60}")
    print(f"✅ MINING COMPLETE")
    print(f"   Total unique keywords: {len(keyword_set)}")
    for src, cnt in sorted(source_counts.items(), key=lambda x: -x[1]):
        print(f"   {src}: {cnt}")
    print(f"   Saved: {OUTPUT_FILE}")
    
    return output

def get_page_inventory_keywords():
    """Extract search-relevant terms from existing page inventory."""
    terms = []
    try:
        import pathlib
        # Read sitemap for page slugs
        sitemap_path = os.path.join(PROJECT_ROOT, 'public', 'sitemap.xml')
        if os.path.exists(sitemap_path):
            with open(sitemap_path) as f:
                content = f.read()
            urls = re.findall(r'<loc>https://www\.qfinhub\.com/([^<]+)</loc>', content)
            for url_path in urls:
                slug = url_path.rstrip('/').split('/')[-1]
                slug = slug.replace('-', ' ')
                if len(slug) > 3 and not slug.startswith('.'):
                    terms.append(slug)
        print(f"  Sitemap slugs: {len(terms)}")
    except Exception as e:
        print(f"  Sitemap parse error: {e}")
    return terms

if __name__ == "__main__":
    mine_all()
