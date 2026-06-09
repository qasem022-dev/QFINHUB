#!/usr/bin/env python3
"""
Phase 18 — Programmatic SEO Quality Upgrade Engine
TASKS 1-4: Inventory + Quality Scoring + Demand Matching + Upgrade Decisions

Core rule: IMPROVE_EXISTING_PAGE > CREATE_NEW_PAGE
Goal: Make existing pages indexable, not create more pages.
"""

import json, os, re
from datetime import datetime
from collections import defaultdict

PROJECT_ROOT = '/home/admin1/qfinhub'
INVENTORY_FILE = '.optimizer-data/programmatic-page-inventory.json'
SCORES_FILE = '.optimizer-data/programmatic-page-quality-scores.json'
DEMAND_MATCH_FILE = '.optimizer-data/programmatic-demand-to-page-match.json'
DECISIONS_FILE = '.optimizer-data/programmatic-upgrade-decisions.json'

# ─── Load existing data sources ───

def load_sitemap_urls():
    """Parse sitemap for all URLs."""
    urls = []
    sitemap_path = os.path.join(PROJECT_ROOT, 'public', 'sitemap.xml')
    if os.path.exists(sitemap_path):
        with open(sitemap_path) as f:
            content = f.read()
        matches = re.findall(r'<loc>(https://www\.qfinhub\.com/[^<]+)</loc>', content)
        urls = matches
    return urls

def load_calculator_data():
    """Load calculator configurations."""
    calcs = []
    calc_path = os.path.join(PROJECT_ROOT, 'src/lib/calculators/index.ts')
    if os.path.exists(calc_path):
        with open(calc_path) as f:
            content = f.read()
        # Extract slug + title pairs
        pairs = re.findall(r"slug:\s*['\"]([^'\"]+)['\"].*?title:\s*['\"]([^'\"]+)['\"]", content, re.DOTALL)
        calcs = [{'slug': p[0], 'title': p[1], 'path': f'/calculators/{p[0]}'} for p in pairs]
    return calcs

def load_decision_pages():
    """Load decision page data."""
    decisions = []
    dec_path = os.path.join(PROJECT_ROOT, 'src/lib/decision-pages/index.ts')
    if os.path.exists(dec_path):
        with open(dec_path) as f:
            content = f.read()
        slugs = re.findall(r"slug:\s*['\"]([^'\"]+)['\"]", content)
        decisions = [{'slug': s, 'path': f'/decision/{s}'} for s in slugs]
    return decisions

def load_programmatic_guides():
    """Load guide data."""
    guides = []
    guide_path = os.path.join(PROJECT_ROOT, 'src/lib/programmatic-seo/guides.ts')
    if os.path.exists(guide_path):
        with open(guide_path) as f:
            content = f.read()
        # Find calculator references
        calc_refs = re.findall(r"generateGuideSlug\(['\"]([^'\"]+)['\"]", content)
        guides = [{'slug': f'how-to-use-{c}', 'calculator_id': c, 'path': f'/guides/how-to-use-{c}'} for c in calc_refs]
    return guides

def load_gsc_data():
    """Load GSC URL inspection data if available."""
    gsc = {}
    insp_path = os.path.join(PROJECT_ROOT, '.optimizer-data/full-url-inspection-results.json')
    if os.path.exists(insp_path):
        try:
            with open(insp_path) as f:
                data = json.load(f)
            for url, info in data.items():
                if isinstance(info, dict):
                    gsc[url] = {
                        'verdict': info.get('verdict', '?'),
                        'coverageState': info.get('coverageState', ''),
                        'indexingState': info.get('indexingState', ''),
                        'lastCrawlTime': info.get('lastCrawlTime', '')
                    }
        except:
            pass
    return gsc

# ─── Page classification ───

def classify_page_type(url):
    """Classify page type from URL."""
    path = url.replace('https://www.qfinhub.com', '')
    
    if path == '/': return 'homepage', 1
    if path.startswith('/calculators/'): return 'calculator', 1
    if path.startswith('/tools/'): return 'tool', 3
    if path.startswith('/decision/'): return 'decision', 1
    if path.startswith('/guides/'): return 'guide', 2
    if path.startswith('/compare/'): return 'compare', 2
    if path.startswith('/blog/'): return 'blog', 2
    if path.startswith('/scenario/'): return 'scenario', 3
    if path.startswith('/widgets/'): return 'widget', 2
    if path.startswith('/embed/'): return 'embed', 3
    return 'static', 1

def is_programmatic(url):
    """Check if page is programmatic/template-driven."""
    path = url.replace('https://www.qfinhub.com', '')
    programmatic_prefixes = ['/tools/', '/compare/', '/guides/', '/scenario/', '/blog/']
    return any(path.startswith(p) for p in programmatic_prefixes)

# ─── Quality scoring ───

def score_page_quality(page, demand_data, gsc_data):
    """Score a programmatic page 0-100."""
    score = 0
    url = page['url']
    page_type = page.get('page_type', '')
    
    gsc_info = gsc_data.get(url, {})
    coverage = gsc_info.get('coverageState', '')
    
    # ─── SEARCH DEMAND (0-30) ───
    demand = demand_data.get(url, {})
    if demand.get('impressions', 0) > 0:
        score += 20
    if demand.get('keyword_matches', 0) > 0:
        score += 10
    
    # ─── INDEXATION (0-15) ───
    if coverage == 'Submitted and indexed':
        score += 15
    elif 'Discovered' in coverage or 'Crawled' in coverage:
        score += 5
    
    # ─── CONTENT QUALITY (0-35) ───
    # Base scores from page type (known structure)
    if page_type in ('calculator', 'decision'):
        score += 30  # Known good structure
    elif page_type in ('guide', 'compare', 'blog'):
        score += 25  # Decent template
    elif page_type in ('tool',):
        score += 15  # Variable quality
    else:
        score += 10
    
    # ─── INTERNAL AUTHORITY (0-10) ───
    if page_type in ('calculator', 'decision', 'homepage'):
        score += 10  # Well-linked
    elif page_type in ('guide', 'blog'):
        score += 7
    else:
        score += 3
    
    # ─── RISK DEDUCTIONS ───
    tier = page.get('tier', 2)
    if tier == 3:
        score -= 15  # Tier 3 = low value
    if page_type == 'scenario':
        score -= 25  # Noindexed bulk pages
    if page_type == 'tool' and not demand.get('impressions', 0):
        score -= 20  # Tool without demand
    if '/scenario/' in url:
        score -= 30  # Noindexed scenario
    
    return max(0, min(100, score))

# ─── Upgrade decision ───

def decide_upgrade(page):
    """Decide what to do with a programmatic page."""
    score = page.get('quality_score', 0)
    page_type = page.get('page_type', '')
    impressions = page.get('impressions', 0)
    clicks = page.get('clicks', 0)
    url = page.get('url', '')
    
    # Reject off-topic
    if page_type == 'scenario' or '/scenario/' in url:
        return 'NOINDEX_REVIEW', 0
    if page_type == 'embed':
        return 'HOLD_FOR_DATA', 7
    
    # CTR opportunity
    if impressions > 0 and clicks == 0:
        return 'CTR_FIX', 1
    
    # Upgrade candidates
    if score >= 75 and page_type in ('calculator', 'decision', 'guide', 'blog'):
        return 'UPGRADE_NOW', 2
    if score >= 60 and page_type in ('compare', 'tool'):
        return 'UPGRADE_NOW', 3
    
    # Internal link push
    if score >= 60:
        return 'INTERNAL_LINK_PUSH', 4
    
    # Hold
    if score >= 40:
        return 'HOLD_FOR_DATA', 5
    
    # Review for consolidation/noindex
    if page_type == 'tool':
        return 'CONSOLIDATE_REVIEW', 6
    
    return 'HOLD_FOR_DATA', 7

# ─── MAIN PIPELINE ───

def run_pipeline():
    print("🔍 Phase 18 — Programmatic SEO Quality Upgrade Engine")
    print("=" * 60)
    
    # Load sources
    print("\n📋 Loading data sources...")
    sitemap_urls = load_sitemap_urls()
    calculators = load_calculator_data()
    decisions = load_decision_pages()
    guides = load_programmatic_guides()
    gsc_data = load_gsc_data()
    
    # Load Phase 17 keyword demand data
    demand_data = {}
    kw_file = os.path.join(PROJECT_ROOT, '.optimizer-data/search-demand-opportunity-scoreboard.json')
    if os.path.exists(kw_file):
        with open(kw_file) as f:
            kw_data = json.load(f)
        for entry in kw_data.get('full', [])[:200]:
            match_page = entry.get('match_page', '')
            if match_page:
                full_url = f'https://www.qfinhub.com{match_page}' if match_page.startswith('/') else match_page
                demand_data[full_url] = {
                    'impressions': entry.get('impressions', 0),
                    'keyword_matches': 1,
                    'score': entry.get('score', 0)
                }
    
    print(f"  Sitemap URLs: {len(sitemap_urls)}")
    print(f"  Calculators: {len(calculators)}")
    print(f"  Decisions: {len(decisions)}")
    print(f"  Guides: {len(guides)}")
    print(f"  GSC inspection data: {len(gsc_data)} URLs")
    print(f"  Keyword demand matches: {len(demand_data)} pages")
    
    # Build inventory
    print("\n📊 Building inventory...")
    inventory = []
    
    # Process sitemap URLs
    for url in sitemap_urls:
        page_type, tier = classify_page_type(url)
        is_prog = is_programmatic(url)
        
        gsc_info = gsc_data.get(url, {})
        demand = demand_data.get(url, {})
        
        page = {
            'url': url,
            'page_type': page_type,
            'tier': tier,
            'programmatic': is_prog,
            'coverage_state': gsc_info.get('coverageState', 'unknown'),
            'indexing_state': gsc_info.get('indexingState', ''),
            'impressions': demand.get('impressions', 0),
            'clicks': demand.get('clicks', 0),
            'keyword_score': demand.get('score', 0),
            'in_sitemap': True
        }
        
        if is_prog:
            page['quality_score'] = score_page_quality(page, demand_data, gsc_data)
            decision, priority = decide_upgrade(page)
            page['decision'] = decision
            page['priority'] = priority
        else:
            page['quality_score'] = 85  # Static/core pages are well-built
            page['decision'] = 'HOLD_CORE_PAGE'
            page['priority'] = 0
        
        inventory.append(page)
    
    # Sort by priority
    inventory.sort(key=lambda x: (x.get('priority', 99), -x.get('quality_score', 0)))
    
    # Save inventory
    inv_output = {
        'report': 'Programmatic Page Inventory',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'total': len(inventory),
        'programmatic_count': sum(1 for p in inventory if p['programmatic']),
        'by_type': {t: len([p for p in inventory if p['page_type'] == t]) 
                    for t in set(p['page_type'] for p in inventory)},
        'pages': inventory
    }
    with open(INVENTORY_FILE, 'w') as f:
        json.dump(inv_output, f, indent=2)
    
    # Save scores
    scored = [p for p in inventory if p.get('quality_score') is not None]
    scores_output = {
        'report': 'Programmatic Page Quality Scores',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'distribution': {
            '90+': len([s for s in scored if s['quality_score'] >= 90]),
            '75-89': len([s for s in scored if 75 <= s['quality_score'] < 90]),
            '60-74': len([s for s in scored if 60 <= s['quality_score'] < 75]),
            '40-59': len([s for s in scored if 40 <= s['quality_score'] < 60]),
            '<40': len([s for s in scored if s['quality_score'] < 40]),
        },
        'scored': sorted(scored, key=lambda x: -x['quality_score'])
    }
    with open(SCORES_FILE, 'w') as f:
        json.dump(scores_output, f, indent=2)
    
    # Save demand match
    demand_match = {
        'report': 'Programmatic Demand-to-Page Match',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'match_distribution': {
            'existing_page_can_satisfy': len([p for p in inventory if p.get('keyword_score', 0) > 0]),
            'no_demand_data': len([p for p in inventory if p.get('keyword_score', 0) == 0])
        },
        'matched': [p for p in inventory if p.get('keyword_score', 0) > 0]
    }
    with open(DEMAND_MATCH_FILE, 'w') as f:
        json.dump(demand_match, f, indent=2)
    
    # Save decisions
    decisions_output = {
        'report': 'Programmatic Upgrade Decisions',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'decision_counts': {d: len([p for p in inventory if p.get('decision') == d]) 
                           for d in set(p.get('decision', '?') for p in inventory)},
        'top_upgrade_targets': [p for p in inventory if p.get('decision') == 'UPGRADE_NOW'][:20],
        'ctr_fix_targets': [p for p in inventory if p.get('decision') == 'CTR_FIX'][:10],
        'link_push_targets': [p for p in inventory if p.get('decision') == 'INTERNAL_LINK_PUSH'][:20],
        'consolidation_review': [p for p in inventory if p.get('decision') == 'CONSOLIDATE_REVIEW'][:10],
        'noindex_review': [p for p in inventory if p.get('decision') == 'NOINDEX_REVIEW'][:10],
        'all': inventory
    }
    with open(DECISIONS_FILE, 'w') as f:
        json.dump(decisions_output, f, indent=2)
    
    # Report
    dc = decisions_output['decision_counts']
    print(f"\n{'='*60}")
    print(f"✅ INVENTORY + SCORING + MATCHING + DECISIONS COMPLETE")
    print(f"\n📊 Page Inventory: {len(inventory)} total, {inv_output['programmatic_count']} programmatic")
    print(f"\n📈 Quality Score Distribution:")
    for k, v in scores_output['distribution'].items():
        print(f"   {k}: {v}")
    print(f"\n🎯 Upgrade Decisions:")
    for d, c in sorted(dc.items(), key=lambda x: -x[1]):
        print(f"   {d}: {c}")
    print(f"\n🔝 Top Upgrade Targets:")
    for p in decisions_output['top_upgrade_targets'][:10]:
        print(f"   [{p['quality_score']}] {p['page_type']}: {p['url'].replace('https://www.qfinhub.com', '')}")

if __name__ == "__main__":
    run_pipeline()
