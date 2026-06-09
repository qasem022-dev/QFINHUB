#!/usr/bin/env python3
"""
Phase 17 — Page Matcher + Opportunity Scorer + Action Decider
TASKS 3-5: Match keywords to existing pages, score opportunities, decide actions.
"""

import json, os, re, urllib.request, urllib.parse
from datetime import datetime, timedelta
from collections import defaultdict

CLASSIFIED_FILE = '.optimizer-data/search-demand-keyword-classification.json'
MATCH_FILE = '.optimizer-data/search-demand-existing-page-match.json'
SCOREBOARD_FILE = '.optimizer-data/search-demand-opportunity-scoreboard.json'
ACTIONS_FILE = '.optimizer-data/daily-content-action-decisions.json'
GSC_TOKEN_FILE = os.path.expanduser('~/.hermes/google-indexing-token.json')

# ─── SKIP PATTERNS ───
SKIP_PATTERNS = re.compile(r'uk\b|canada\b|ontario\b|australia\b|india\b|nz\b|philippines|singapore|pakistan|bangladesh|south.?africa|nigeria|kenya|ghana|europe|germany|france|spain', re.I)

def load_gsc_data():
    """Pull GSC query+page data for performance scoring."""
    results = {}
    try:
        if not os.path.exists(GSC_TOKEN_FILE):
            return results
        
        with open(GSC_TOKEN_FILE) as f:
            token_data = json.load(f)
        
        access_token = token_data.get('access_token', '')
        if not access_token:
            return results
        
        site_url = "https://www.qfinhub.com/"
        end_date = datetime.utcnow().strftime("%Y-%m-%d")
        start_date = (datetime.utcnow() - timedelta(days=28)).strftime("%Y-%m-%d")
        
        body = json.dumps({
            "startDate": start_date,
            "endDate": end_date,
            "dimensions": ["query", "page"],
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
                query = row['keys'][0].lower()
                page = row['keys'][1] if len(row['keys']) > 1 else ''
                imps = row.get('impressions', 0)
                clicks = row.get('clicks', 0)
                pos = row.get('position', 100)
                
                if query not in results:
                    results[query] = {'total_impressions': 0, 'total_clicks': 0, 'pages': []}
                
                results[query]['total_impressions'] += imps
                results[query]['total_clicks'] += clicks
                results[query]['pages'].append({
                    'page': page,
                    'impressions': imps,
                    'clicks': clicks,
                    'position': round(pos, 1)
                })
        
        print(f"  GSC data: {len(results)} queries with page data")
    except Exception as e:
        print(f"  GSC data error: {e}")
    
    return results

def score_opportunity(entry, gsc_data):
    """Score an opportunity 0-100."""
    score = 0
    kw = entry['query'].lower()
    source = entry.get('source', '')
    intent = entry.get('intent', '')
    relevance = entry.get('relevance', '')
    match_quality = entry.get('match_quality', '')
    
    # ─── DEMAND SCORE (0-45) ───
    if source == 'google_suggest':
        score += 15  # Google Suggest = real user demand
    if source == 'gsc_api':
        score += 25  # Actual GSC impressions = proven demand
    
    gsc_entry = gsc_data.get(kw.lower(), {})
    if gsc_entry.get('total_impressions', 0) > 0:
        score += 20  # Has impressions
        if gsc_entry.get('total_clicks', 0) == 0:
            score += 15  # Impressions but 0 clicks = CTR opportunity
    
    # ─── RANKING SCORE (0-25) ───
    if gsc_entry.get('pages'):
        best_pos = min(p['position'] for p in gsc_entry['pages'])
        if best_pos <= 10:
            score += 25
        elif best_pos <= 20:
            score += 20
        elif best_pos <= 30:
            score += 15
    elif match_quality in ('perfect-match', 'partial-match'):
        score += 10  # Existing indexed page but no ranking data
    
    # ─── BUSINESS VALUE (0-25) ───
    if intent == 'calculator':
        score += 20
    elif intent == 'decision':
        score += 18
    elif intent == 'comparison':
        score += 15
    elif intent == 'guide':
        score += 12
    
    core_topics = ['mortgage', 'debt', 'tax', 'retirement']
    if any(t in kw for t in core_topics):
        score += 10  # High-RPM finance topic
    elif relevance == 'core-finance':
        score += 8
    
    # ─── EXECUTION EASE (0-15) ───
    if match_quality in ('perfect-match', 'partial-match'):
        score += 15  # Improve existing page = easy
    elif match_quality == 'weak-match':
        score += 5
    
    # ─── RISK DEDUCTIONS ───
    risk_penalty = entry.get('risk_penalty', 0)
    score += risk_penalty
    
    # Extra: geo-off-topic (country-specific terms)
    if SKIP_PATTERNS.search(kw):
        score -= 20
    
    return max(0, min(100, score))

def classify_match(entry, gsc_data):
    """Classify how well a keyword matches existing pages."""
    kw = entry['query'].lower()
    match_page = entry.get('match_page', '')
    match_quality = entry.get('match_quality', '')
    gsc_entry = gsc_data.get(kw.lower(), {})
    
    if entry.get('rejected'):
        return 'F', 'reject-off-topic'
    
    if match_quality == 'perfect-match':
        if gsc_entry.get('total_clicks', 0) > 0:
            return 'A', 'page-already-satisfies-well'
        else:
            return 'B', 'page-partially-satisfies-needs-improvement'
    elif match_quality == 'partial-match':
        if gsc_entry.get('pages'):
            best_pos = min(p['position'] for p in gsc_entry['pages'])
            if best_pos > 20:
                return 'C', 'wrong-page-ranking-internal-links-needed'
            else:
                return 'B', 'page-partially-satisfies-needs-improvement'
        return 'D', 'existing-page-weak-for-keyword'
    elif match_quality == 'weak-match':
        return 'D', 'existing-page-weak-for-keyword'
    else:
        return 'E', 'no-existing-page-satisfies-keyword'

def decide_action(entry, score, match_class):
    """Decide what action to take."""
    if match_class == 'F':
        return {'action': 'REJECT_OFF_TOPIC', 'priority': 0}
    
    if score >= 90:
        return {'action': 'IMPROVE_EXISTING_PAGE', 'priority': 1}
    elif score >= 80:
        kw = entry['query'].lower()
        if any(q in kw for q in ['how to', 'what is', 'should i']):
            return {'action': 'ADD_FAQ_SECTION', 'priority': 2}
        elif 'calculator' in kw:
            return {'action': 'TITLE_META_CTR_FIX', 'priority': 2}
        elif match_class in ('C',):
            return {'action': 'INTERNAL_LINK_PUSH', 'priority': 2}
        else:
            return {'action': 'IMPROVE_EXISTING_PAGE', 'priority': 3}
    elif score >= 70:
        return {'action': 'HOLD_FOR_DATA', 'priority': 4}
    else:
        return {'action': 'HOLD_FOR_DATA', 'priority': 5}

def run_pipeline():
    """Main pipeline: match + score + decide."""
    print("🔍 Phase 17 — Page Matcher + Scorer + Action Decider\n")
    
    # Load classified keywords
    with open(CLASSIFIED_FILE) as f:
        classified = json.load(f)
    
    entries = classified['classified']
    
    # Load GSC performance data
    print("📊 Pulling GSC performance data...")
    gsc_data = load_gsc_data()
    
    # Process all entries
    matches = []
    scored = []
    actions = []
    
    for entry in entries:
        kw = entry.get('query', '')
        
        # Match class
        match_class, match_reason = classify_match(entry, gsc_data)
        match_entry = {**entry, 'match_class': match_class, 'match_reason': match_reason}
        matches.append(match_entry)
        
        # Score
        score = score_opportunity(entry, gsc_data)
        scored_entry = {**entry, 'score': score, 'match_class': match_class}
        scored.append(scored_entry)
        
        # Decide action
        action = decide_action(entry, score, match_class)
        action_entry = {
            'query': kw,
            'score': score,
            'match_class': match_class,
            'action': action['action'],
            'priority': action['priority'],
            'match_page': entry.get('match_page', ''),
            'match_type': entry.get('match_type', ''),
            'intent': entry.get('intent', ''),
            'source': entry.get('source', ''),
            'impressions': entry.get('impressions', 0),
            'clicks': entry.get('clicks', 0)
        }
        actions.append(action_entry)
    
    # Sort scored by score descending
    scored_sorted = sorted(scored, key=lambda x: -x['score'])
    actions_sorted = sorted(actions, key=lambda x: (-x['score'], x['priority']))
    
    # Save match results
    match_output = {
        'report': 'Search Demand Existing Page Match',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'total_matched': len(matches),
        'match_distribution': {k: len([m for m in matches if m['match_class'] == k]) for k in 'ABCDEF'},
        'matched': matches
    }
    with open(MATCH_FILE, 'w') as f:
        json.dump(match_output, f, indent=2)
    
    # Save scoreboard
    scoreboard_output = {
        'report': 'Search Demand Opportunity Scoreboard',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'total_scored': len(scored),
        'thresholds': {'execute_today': '90+', 'execute_low_risk': '80-89', 'hold': '70-79', 'reject': '<70'},
        'score_distribution': {
            '90+': len([s for s in scored if s['score'] >= 90]),
            '80-89': len([s for s in scored if 80 <= s['score'] < 90]),
            '70-79': len([s for s in scored if 70 <= s['score'] < 80]),
            '<70': len([s for s in scored if s['score'] < 70])
        },
        'top_20': scored_sorted[:20],
        'full': scored_sorted
    }
    with open(SCOREBOARD_FILE, 'w') as f:
        json.dump(scoreboard_output, f, indent=2)
    
    # Save action decisions
    actions_output = {
        'report': 'Daily Content Action Decisions',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'total_decisions': len(actions),
        'action_counts': {a: len([x for x in actions if x['action'] == a]) for a in set(x['action'] for x in actions)},
        'top_actions': actions_sorted[:30],
        'full': actions_sorted
    }
    with open(ACTIONS_FILE, 'w') as f:
        json.dump(actions_output, f, indent=2)
    
    # Report
    print(f"\n{'='*60}")
    print(f"✅ MATCH + SCORE + DECIDE COMPLETE")
    print(f"\n📊 Score Distribution:")
    for level, count in scoreboard_output['score_distribution'].items():
        print(f"   {level}: {count}")
    
    print(f"\n🎯 Top 10 Opportunities:")
    for i, s in enumerate(scored_sorted[:10]):
        action = next((a for a in actions if a['query'] == s['query']), {})
        print(f"   {i+1}. [{s['score']}] {s['query'][:60]}")
        print(f"       → {action.get('action', '?')} | {s.get('match_page', 'N/A')}")
    
    print(f"\n📋 Top Actions: {dict(actions_output['action_counts'])}")
    
    return scored_sorted, actions_sorted

if __name__ == "__main__":
    run_pipeline()
