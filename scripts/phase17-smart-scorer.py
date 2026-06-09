#!/usr/bin/env python3
"""
Phase 17 — Smart Scorer & Action Decider (v2)
Prioritizes: question keywords, zero-click GSC queries, decision intent
Deprioritizes: navigational variants, geo-off-topic, low-relevance
"""

import json, re, os
from datetime import datetime
from collections import defaultdict

CLASSIFIED_FILE = '.optimizer-data/search-demand-keyword-classification.json'
SCOREBOARD_FILE = '.optimizer-data/search-demand-opportunity-scoreboard.json'
ACTIONS_FILE = '.optimizer-data/daily-content-action-decisions.json'

# Low-value query patterns (navigational, not optimization targets)
NAVIGATIONAL = re.compile(r'\b(app|excel|google sheets|spreadsheet|download|pdf|login|sign.?up|free trial|template)\b', re.I)
GEO_OFF = re.compile(r'\b(bc|alberta|ireland|florida|texas|california|dubai|singapore|pakistan|bangladesh|nz|ontario|toronto|vancouver|sydney|melbourne)\b', re.I)
BRAND_NAV = re.compile(r'\b(ramit|dave ramsey|td|rbc|bmo|cibc|scotiabank|chase|wells fargo|bank of america)\b', re.I)
QUESTION_INTENT = re.compile(r'^(how|what|why|when|should|can|is|does|do|are)', re.I)
COMPARISON_KEYWORDS = re.compile(r'\bvs\b|\bversus\b|\bor\b.*\bor\b|\bdifference between\b|\bcompare\b', re.I)

FIXED_MATCHES = {
    'retirement calculator free': ('/calculators/retirement-planning', 'calculator'),
    'how much house can i afford': ('/decision/how-much-house-can-i-afford', 'decision'),
    'should i refinance my mortgage calculator': ('/decision/should-i-refinance-my-mortgage', 'decision'),
    'how much do i need to retire': ('/decision/how-much-do-i-need-to-retire', 'decision'),
    'can i retire with 500k at 55': ('/decision/can-i-retire-with-500k-at-55', 'decision'),
    'pay off debt or invest': ('/decision/pay-off-debt-or-invest', 'decision'),
    'snowball vs avalanche': ('/decision/snowball-vs-avalanche-which-wins', 'decision'),
    'roth vs traditional 401k decision': ('/decision/roth-vs-traditional-401k-decision', 'decision'),
    'what tax bracket am i in': ('/decision/what-tax-bracket-am-i-in', 'decision'),
    'how much emergency fund do i need': ('/decision/how-much-emergency-fund-do-i-need', 'decision'),
    'heloc or personal loan': ('/decision/should-i-use-a-heloc-or-personal-loan', 'decision'),
}

def score_smart(entry):
    """Smart scoring that prioritizes real opportunities."""
    kw = entry['query'].lower()
    source = entry.get('source', '')
    intent = entry.get('intent', '')
    match_quality = entry.get('match_quality', '')
    
    if entry.get('rejected'):
        return 0, 'REJECT_OFF_TOPIC'
    
    # Fix known matches
    if kw in FIXED_MATCHES:
        entry['match_page'] = FIXED_MATCHES[kw][0]
        entry['match_type'] = FIXED_MATCHES[kw][1]
        entry['match_quality'] = 'perfect-match'
        match_quality = 'perfect-match'
    
    # ─── IMMEDIATE REJECTIONS ───
    if GEO_OFF.search(kw):
        return max(0, 30 - 25), 'HOLD_FOR_DATA'  # Geo-off-topic, heavily penalized
    if BRAND_NAV.search(kw):
        return max(0, 40 - 20), 'HOLD_FOR_DATA'  # Brand navigational
    if NAVIGATIONAL.search(kw):
        return max(0, 40 - 15), 'HOLD_FOR_DATA'  # Navigational intent
    
    score = 0
    
    # ─── DEMAND SIGNAL (0-35) ───
    if source == 'google_suggest':
        score += 20
        # Question keywords from Suggest = high intent
        if QUESTION_INTENT.search(kw):
            score += 10
    elif source == 'gsc_api':
        score += 25
        imps = entry.get('impressions', 0) or 0
        if imps >= 100:
            score += 5
        if imps >= 10 and entry.get('clicks', 0) == 0:
            score += 10  # Zero-click = CTR opportunity
    elif source == 'question_variation':
        score += 18
    elif source == 'comparison_variation':
        score += 15
    elif source == 'year_variation':
        score += 12
    
    # ─── INTENT VALUE (0-25) ───
    if intent == 'calculator':
        score += 18
    elif intent == 'decision':
        score += 22  # Decision = highest conversion intent
    elif intent == 'comparison':
        score += 17
    elif intent == 'guide':
        score += 14
    elif intent == 'definition':
        score += 10
    
    # ─── MATCH QUALITY (0-20) ───
    if match_quality == 'perfect-match':
        score += 18
    elif match_quality == 'partial-match':
        score += 14
    elif match_quality == 'weak-match':
        score += 7
    else:
        score += 3
    
    # ─── TOPIC VALUE (0-10) ───
    core_finance = ['mortgage', 'debt', 'tax', 'retirement', '401k', 'ira', 'roth', 'social security']
    if any(t in kw for t in core_finance):
        score += 8
    elif entry.get('relevance') == 'core-finance':
        score += 5
    
    # ─── EXECUTION EASE (0-10) ───
    if match_quality in ('perfect-match', 'partial-match'):
        score += 8
    
    # ─── PENALTIES ───
    if entry.get('relevance') == 'weak-relevance':
        score -= 10
    
    score = max(0, min(100, score))
    
    # ─── DECIDE ACTION ───
    if score >= 85:
        action = 'IMPROVE_EXISTING_PAGE'
    elif score >= 75:
        if intent in ('decision', 'comparison'):
            action = 'ADD_FAQ_SECTION'
        elif 'calculator' in kw.lower():
            action = 'TITLE_META_CTR_FIX'
        else:
            action = 'IMPROVE_EXISTING_PAGE'
    elif score >= 65:
        action = 'INTERNAL_LINK_PUSH'
    elif score >= 50:
        action = 'HOLD_FOR_DATA'
    else:
        action = 'HOLD_FOR_DATA'
    
    return score, action

def run():
    with open(CLASSIFIED_FILE) as f:
        data = json.load(f)
    
    scored = []
    for entry in data['classified']:
        if entry.get('rejected'):
            continue
        
        score, action = score_smart(entry)
        if score > 0:
            scored.append({**entry, 'score': score, 'action': action})
    
    scored.sort(key=lambda x: -x['score'])
    
    # Distribution
    dist = {'85+': 0, '75-84': 0, '65-74': 0, '50-64': 0, '<50': 0}
    for s in scored:
        sc = s['score']
        if sc >= 85: dist['85+'] += 1
        elif sc >= 75: dist['75-84'] += 1
        elif sc >= 65: dist['65-74'] += 1
        elif sc >= 50: dist['50-64'] += 1
        else: dist['<50'] += 1
    
    print("=== SMART SCORE DISTRIBUTION ===")
    for k, v in dist.items():
        print(f"  {k}: {v}")
    
    print(f"\n=== TOP 20 OPPORTUNITIES ===")
    for i, s in enumerate(scored[:20]):
        print(f"  {i+1:2d}. [{s['score']:3d}] [{s.get('intent','')}] {s['query'][:60]}")
        print(f"       → {s['action']} | {s.get('match_page', 'N/A')}")
    
    # Save scoreboard
    scoreboard = {
        'report': 'Search Demand Opportunity Scoreboard',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'total_scored': len(scored),
        'distribution': dist,
        'top_20': scored[:20],
        'top_50': scored[:50],
        'full': scored
    }
    with open(SCOREBOARD_FILE, 'w') as f:
        json.dump(scoreboard, f, indent=2)
    
    # Save action decisions
    actions = [{'query': s['query'], 'score': s['score'], 'action': s['action'],
                'match_page': s.get('match_page', ''), 'intent': s.get('intent', ''),
                'source': s.get('source', '')} for s in scored[:50]]
    
    action_output = {
        'report': 'Daily Content Action Decisions',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'top_actions': actions,
        'action_counts': {a: len([x for x in actions if x['action'] == a]) for a in set(x['action'] for x in actions)}
    }
    with open(ACTIONS_FILE, 'w') as f:
        json.dump(action_output, f, indent=2)
    
    print(f"\n=== TOP ACTIONS ===")
    for a, c in action_output['action_counts'].items():
        print(f"  {a}: {c}")
    
    return scored

if __name__ == "__main__":
    run()
