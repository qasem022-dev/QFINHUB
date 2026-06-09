#!/usr/bin/env python3
"""
Phase 17 — Keyword Classifier
Classifies every keyword by intent, relevance, action fit, and risk.
Rule-based for speed (680 keywords).
"""

import json, re, os
from datetime import datetime
from collections import Counter

INPUT_FILE = '.optimizer-data/search-demand-keyword-mining.json'
OUTPUT_FILE = '.optimizer-data/search-demand-keyword-classification.json'

# ─── INTENT PATTERNS ───
CALCULATOR_PATTERNS = re.compile(r'calculat|compute|estimator|tool|simulator', re.I)
DECISION_PATTERNS = re.compile(r'^should i|^can i|^is it|^when to|^how (much|many)|what if|worth it|vs\b|versus|compare|better|or\b.*\bor\b', re.I)
GUIDE_PATTERNS = re.compile(r'^how to|guide|step|tutorial|explain|learn|beginners|tips|strategy|plan', re.I)
COMPARISON_PATTERNS = re.compile(r'vs\.?\s|versus|compare|difference between|or\s+.*\s+or\s', re.I)
DEFINITION_PATTERNS = re.compile(r'^what is|^meaning of|definition|define', re.I)
RATE_NEWS_PATTERNS = re.compile(r'rate|today|current|2026|2025|news|forecast|prediction|trend', re.I)
OFF_TOPIC_PATTERNS = re.compile(r'celebrity|movie|game|lyrics|song|sport|nfl|nba|weather|recipe|crypto|nft|bitcoin|ethereum|dogecoin|lottery|casino|porn|onlyfans|hack|cheat|crack', re.I)

# ─── FINANCE RELEVANCE ───
CORE_FINANCE = re.compile(r'mortgage|loan|debt|credit|tax|retire|401k|ira|invest|saving|budget|interest|payment|income|afford|refinance|heloc|equity|down.?payment|payoff|amorti|annuity|dividend|capital.?gain|roth|pension|social.?security|compound|inflation|emergency.?fund|snowball|avalanche|paycheck', re.I)
FINANCE_ADJACENT = re.compile(r'house|home|car|auto|rent|buy|lease|college|school|university|medical|health.*insur|life.*insur|real.?estate|property|salary|bonus|raise|severance|inheritance|will|trust|estate', re.I)

# ─── REJECT PATTERNS ───
REJECT_PATTERNS = re.compile(r'celebrity|movie|game|song|lyrics|sport|nfl|nba|mlb|weather|recipe|viral|crypto|nft|bitcoin|ethereum|doge|memecoin|lottery|casino|porn|onlyfans|hack|cheat|crack|free.*download|torrent', re.I)
YMYL_RISK = re.compile(r'guarantee|cure|treatment|therapy|medication|diagnosis|legal.?advice|sue|bankruptcy.*file|divorce|child.?support|alimony', re.I)

# ─── EXISTING PAGE MAPPING ───
QFINHUB_CALCULATORS = {
    'mortgage': ['mortgage-calculator', 'mortgage-affordability', 'refinance-calculator', 'heloc-calculator', 'rent-vs-buy'],
    'debt': ['debt-payoff', 'credit-card-payoff', 'loan-calculator', 'debt-snowball-vs-avalanche', 'personal-loan'],
    'retirement': ['retirement-planning', '401k-calculator', 'ira-calculator', 'roth-vs-traditional', 'pension-calculator', 'social-security'],
    'tax': ['tax-calculator', 'tax-bracket-calculator', 'capital-gains-tax'],
    'savings': ['compound-interest', 'budget-planner', 'savings-goal', 'emergency-fund', 'inflation-calculator', 'cd-calculator'],
    'investing': ['investment-return', 'roi-calculator', 'dividend-calculator', 'dca-calculator', 'stock-return'],
}

QFINHUB_DECISIONS = [
    'can-i-afford-a-400k-home', 'how-much-house-can-i-afford', 'how-much-do-i-need-to-retire',
    'can-i-retire-with-500k-at-55', 'retire-at-45-with-1-million', 'pay-off-debt-or-invest',
    'should-i-refinance-my-mortgage', 'snowball-vs-avalanche-which-wins',
    'roth-vs-traditional-401k-decision', 'what-tax-bracket-am-i-in',
    'how-much-emergency-fund-do-i-need', 'should-i-use-a-heloc-or-personal-loan'
]

def classify_intent(keyword):
    """Classify search intent."""
    kw = keyword.lower()
    if OFF_TOPIC_PATTERNS.search(kw):
        return 'off-topic'
    if COMPARISON_PATTERNS.search(kw) and CALCULATOR_PATTERNS.search(kw):
        return 'comparison'
    if DECISION_PATTERNS.search(kw):
        return 'decision'
    if CALCULATOR_PATTERNS.search(kw):
        return 'calculator'
    if GUIDE_PATTERNS.search(kw):
        return 'guide'
    if DEFINITION_PATTERNS.search(kw):
        return 'definition'
    if RATE_NEWS_PATTERNS.search(kw):
        return 'current-rate/news'
    return 'resource/list'

def classify_relevance(keyword):
    """Classify finance relevance."""
    kw = keyword.lower()
    if OFF_TOPIC_PATTERNS.search(kw):
        return 'off-topic'
    if CORE_FINANCE.search(kw):
        return 'core-finance'
    if FINANCE_ADJACENT.search(kw):
        return 'finance-adjacent'
    return 'weak-relevance'

def classify_risk(keyword, intent, relevance):
    """Classify execution risk."""
    kw = keyword.lower()
    if REJECT_PATTERNS.search(kw):
        return ('off-topic', -60)
    if YMYL_RISK.search(kw):
        return ('ymyl-unsupported-claim', -25)
    if relevance == 'off-topic':
        return ('off-topic', -60)
    if relevance == 'weak-relevance':
        return ('thin-page-risk', -20)
    if intent in ('current-rate/news',):
        return ('newsjacking-risk', -40)
    if intent == 'resource/list':
        return ('low-value', -15)
    return ('low', 0)

def find_best_page_match(keyword):
    """Find best existing QFINHUB page for a keyword."""
    kw = keyword.lower()
    best_score = 0
    best_page = None
    best_type = None
    
    # Check calculators
    for category, calcs in QFINHUB_CALCULATORS.items():
        for calc in calcs:
            calc_terms = calc.replace('-', ' ').split()
            matches = sum(1 for t in calc_terms if t in kw)
            score = matches / len(calc_terms) if calc_terms else 0
            if score > best_score:
                best_score = score
                best_page = f'/calculators/{calc}'
                best_type = 'calculator'
    
    # Check decisions
    for dec in QFINHUB_DECISIONS:
        dec_terms = dec.replace('-', ' ').split()
        matches = sum(1 for t in dec_terms if t in kw and len(t) > 2)
        score = matches / max(len(dec_terms), 1)
        if score > best_score:
            best_score = score
            best_page = f'/decision/{dec}'
            best_type = 'decision'
    
    # Check blog (simple keyword match)
    blog_keywords = {'mortgage': '/blog/mortgage-rates-june-2026-current-rates-home-affordability-calculator',
                     'retirement': '/blog/complete-guide-to-retirement-planning-2026',
                     'debt': '/blog/crush-your-credit-card-debt-in-2026',
                     'tax': '/blog/tax-tips-007-first-light-metacritic-smart-financial-planning'}
    if best_score < 0.3:
        for bk, bp in blog_keywords.items():
            if bk in kw:
                best_page = bp
                best_type = 'blog'
                best_score = 0.3
    
    if best_page is None:
        return ('no-existing-page', 'new-page-needed')
    
    if best_score >= 0.8:
        return ('perfect-match', best_type, best_page)
    elif best_score >= 0.4:
        return ('partial-match', best_type, best_page)
    else:
        return ('weak-match', best_type, best_page)

def classify_all():
    """Main classifier."""
    with open(INPUT_FILE) as f:
        data = json.load(f)
    
    entries = data['entries']
    classified = []
    stats = Counter()
    
    for entry in entries:
        kw = entry['query']
        
        intent = classify_intent(kw)
        relevance = classify_relevance(kw)
        risk_label, risk_penalty = classify_risk(kw, intent, relevance)
        
        # Should we reject?
        rejected = relevance == 'off-topic' or intent == 'off-topic'
        
        # Find matching page
        match_result = find_best_page_match(kw)
        match_quality = match_result[0]
        match_type = match_result[1] if len(match_result) > 1 else None
        match_page = match_result[2] if len(match_result) > 2 else None
        
        # Determine action fit
        if rejected:
            action_fit = 'reject'
        elif match_quality == 'perfect-match':
            action_fit = 'existing-page-satisfies'
        elif match_quality == 'partial-match':
            action_fit = 'improve-existing-page'
        elif match_quality == 'weak-match':
            action_fit = 'improve-or-new-page'
        else:
            action_fit = 'new-page-needed'
        
        classified.append({
            'query': kw,
            'source': entry.get('source', ''),
            'seed': entry.get('seed', ''),
            'category': entry.get('category', ''),
            'impressions': entry.get('impressions', 0),
            'clicks': entry.get('clicks', 0),
            'intent': intent,
            'relevance': relevance,
            'risk_label': risk_label,
            'risk_penalty': risk_penalty,
            'match_quality': match_quality,
            'match_type': match_type,
            'match_page': match_page,
            'action_fit': action_fit,
            'rejected': rejected
        })
        
        stats[action_fit] += 1
        stats[f'intent_{intent}'] += 1
        stats[f'relevance_{relevance}'] += 1
    
    output = {
        'report': 'Keyword Classification',
        'generated': datetime.utcnow().isoformat() + 'Z',
        'phase': '17',
        'total_classified': len(classified),
        'stats': dict(stats),
        'classified': sorted(classified, key=lambda x: (x['rejected'], x['action_fit'], x['intent']))
    }
    
    with open(OUTPUT_FILE, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"✅ CLASSIFICATION COMPLETE")
    print(f"   Total: {len(classified)} keywords")
    for action, count in sorted(stats.items()):
        if not action.startswith('intent_') and not action.startswith('relevance_'):
            print(f"   {action}: {count}")
    for intent, count in sorted(stats.items()):
        if intent.startswith('intent_'):
            print(f"   {intent}: {count}")
    
    return output

if __name__ == "__main__":
    classify_all()
