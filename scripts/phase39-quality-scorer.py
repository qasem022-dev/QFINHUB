#!/usr/bin/env python3
"""
QFINHUB Phase 39.2 Automated Quality Scorer
============================================

Enforces all 5 quality gates per PHASE39_2_QUALITY_STANDARD.md on rewritten
calculator content. Returns pass/fail with detailed diagnostics.

Usage:
    python3 scripts/phase39-quality-scorer.py <slug>
    python3 scripts/phase39-quality-scor.py --all   # score all 10 priority slugs
    python3 scripts/phase39-quality-scor.py --stdin  # read content from stdin

Gates:
    1. AI-CHECK heuristic score ≤ 6
    2. EEAT structural completeness (first-person, 2026 $, named source, caveat)
    3. Banned-pattern count = 0
    4. Burstiness (range ≥ 20, ≥ 3 short, ≥ 2 long sentences)
    5. Read-aloud proxy (no numbered "Key Takeaways 1/2/3/4" blocks in prose)
"""

import json
import re
import sys
from pathlib import Path

# ---------- Gate 3 banned patterns ----------
BANNED_PATTERNS = {
    'em_dash': '—',
    'semicolon_in_prose': r';',
    'tier1_vocab': [
        'delve', 'leverage', 'harness', 'realm', 'embark', 'tapestry',
        'multifaceted', 'groundbreaking', 'revolutionize', 'synergy',
        'resonate', 'streamline', 'foster', 'bolster',
    ],
    'copula_avoidance': ['serves as', 'stands as', 'represents a', 'functions as', 'boasts'],
    'filler': [
        'in order to', 'due to the fact that', 'at this point in time',
        'it is important to note', 'has the ability to', 'it is essential',
        'it is an essential', 'is a testament', 'pivotal moment',
    ],
    'inflation': [
        'pivotal', 'testament', 'evolving landscape', 'vital role',
        'key turning point', 'indelible mark', 'golden years',
        'unprecedented', 'profound', 'breathtaking', 'nestled',
    ],
    'parallelism': [
        "it's not just", 'not only', 'in conclusion', 'furthermore',
        'moreover', 'additionally,',
    ],
    'salutation': [
        'great question', 'i hope this helps', 'let me know if',
        'of course!', 'certainly!', "you're absolutely right",
    ],
}

# ---------- Gate 2 EEAT requirements ----------
EEAT_SOURCES = [
    'IRS', 'Federal Reserve', 'FRED', 'CFPB', 'BLS', 'SECURE',
    'Survey of Consumer Finances', 'FDIC', 'FHA', 'HUD',
    'Treasury', 'Bureau of Labor Statistics', 'IRS Publication',
    'IRS Notice', 'IRS Pub', 'CSCMP', 'Census', 'OpenView',
    'Shopify', 'FHFA', 'Freddie Mac', 'Fannie Mae',
    'Social Security Administration', 'SSA',
]

EEAT_CAVEATS = [
    'actual results vary', 'depends', 'depends on', 'assume', 'assumes',
    'this is not guaranteed', 'not a guarantee', 'results vary',
    'no guarantee', 'swing wildly', 'can change', 'may vary',
    'in reality', 'real returns', 'fluctuate', 'subject to',
]


def extract_prose(content_obj: dict) -> str:
    """Concatenate all prose fields for analysis.

    Strips HTML tags and inserts period boundaries at paragraph breaks so
    sentence-length analysis works correctly on HTML-embedded blog content.
    """
    fields = ['explanation', 'formulaDescription', 'realWorldUse',
              'example', 'definition', 'keyFactors', 'tips',
              'keyTakeaways', 'citations', 'relatedCalculators']
    parts = []
    for f in fields:
        v = content_obj.get(f, '')
        if isinstance(v, list):
            v = ', '.join(str(x) for x in v)
        if v:
            parts.append(v)
    text = '\n'.join(parts)
    # Strip HTML tags
    text = re.sub(r'<[^>]+>', ' ', text)
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def gate_1_ai_score(text: str) -> dict:
    """Heuristic AI-check score (0-27). Lower = more human."""
    text_lower = text.lower()
    scores = {}

    # A. Perplexity (banned vocab + generic verbs)
    generic_verbs = ['designed to help', 'allows you to', 'enables you to',
                     'is designed to', 'helps you', 'shows you how',
                     'indispensable resource', 'essentially free money',
                     'essentially', 'significantly', 'substantially']
    generic_hits = sum(1 for g in generic_verbs if g in text_lower)
    scores['A_perplexity'] = min(3, generic_hits)

    # B. Burstiness (variance in sentence length)
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if s.strip() and len(s.split()) >= 2]
    if len(sentences) >= 3:
        lengths = [len(s.split()) for s in sentences]
        rng = max(lengths) - min(lengths)
        # 27 = uniform, 0 = high variance
        scores['B_burstiness'] = max(0, min(3, 3 - (rng // 10)))
    else:
        scores['B_burstiness'] = 3

    # C. Hedge density
    hedges = ['can be significantly', 'typically show', 'effectively manage',
              'could potentially', 'might have some', 'is generally',
              'tends to', 'often can', 'may potentially']
    hedge_hits = sum(1 for h in hedges if h in text_lower)
    scores['C_hedge_density'] = min(3, hedge_hits)

    # D. Structural tells (numbered takeaways, formula-block isolation)
    has_numbered_takeaway = bool(re.search(r'(?:key\s*takeaway|step\s*\d|^\s*\d+\.\s+\w+)',
                                           text, re.MULTILINE | re.IGNORECASE))
    has_parallel_nouns = len(re.findall(r'\b\w+\s+\w+\s+(?:and|or)\s+\w+', text)) > 8
    structural_hits = sum([has_numbered_takeaway, has_parallel_nouns])
    scores['D_structural_tells'] = min(3, structural_hits * 2)

    # E. Specificity (presence of numbers, years, dollar amounts)
    has_numbers = bool(re.search(r'\$[\d,.]+[KMB]?', text))
    has_year = bool(re.search(r'\b20(2[4-7])\b', text))
    has_percent = bool(re.search(r'\d+\.?\d*\s*%', text))
    specificity_hits = sum([has_numbers, has_year, has_percent])
    scores['E_specificity'] = max(0, 2 - specificity_hits) if specificity_hits else 3

    # F. Transitions (announcement openers)
    openers = ['it is an essential', 'designed to help you determine',
               'designed to help', 'this guide will',
               'let\'s dive in', 'let\'s explore', 'whether you are']
    opener_hits = sum(1 for o in openers if o in text_lower)
    scores['F_transitions'] = min(3, opener_hits)

    # G. Punctuation (em dashes, semicolons)
    em_count = text.count('—')
    semi_count = text.count(';')
    scores['G_punctuation'] = min(3, (em_count + semi_count) // 2)

    # H. Voice / register (first-person count)
    first_person = len(re.findall(r"\bI\s+(?:built|talk|see|hit|saw|am|use|find|get|notice|find|prefer|use|built|tend|don't|do)\w*",
                                  text))
    scores['H_voice'] = 0 if first_person >= 2 else (1 if first_person == 1 else 2)

    # I. Rhetorical scaffolding
    scaffolds = ['helps you project', 'by factoring in', 'is a testament',
                 'is essential for', 'in today\'s', 'in the heart of']
    scaffold_hits = sum(1 for s in scaffolds if s in text_lower)
    scores['I_scaffolding'] = min(3, scaffold_hits)

    total = sum(scores.values())
    return {
        'total': total,
        'signal_breakdown': scores,
        'verdict': 'Human' if total <= 6 else ('Borderline' if total <= 12 else 'Likely AI'),
    }


def gate_2_eeat(text: str) -> dict:
    """Structural EEAT completeness."""
    text_lower = text.lower()

    sources_found = [s for s in EEAT_SOURCES if s in text]
    first_person = re.findall(r"\bI\s+\w+", text)
    year_2026_count = len(re.findall(r'\b202[4-7]\b', text))
    dollar_count = len(re.findall(r'\$[\d,.]+[KMB]?', text, re.IGNORECASE))
    caveat_found = any(c in text_lower for c in EEAT_CAVEATS)

    checks = {
        'first_person_sentence': len(first_person) >= 1,
        'has_2026_year': year_2026_count >= 1,
        'named_real_source': len(sources_found) >= 1,
        'specific_dollar_amount': dollar_count >= 2,
        'has_caveat': caveat_found,
    }

    passed = sum(1 for v in checks.values() if v)
    return {
        'passed': passed,
        'total_checks': len(checks),
        'checks': checks,
        'sources_found': sources_found,
        'first_person_count': len(first_person),
        'year_2026_count': year_2026_count,
        'dollar_count': dollar_count,
        'pass': passed >= 4,  # At least 4 of 5 EEAT elements
    }


def gate_3_banned(text: str) -> dict:
    """Banned pattern scan."""
    violations = {}
    for category, patterns in BANNED_PATTERNS.items():
        if isinstance(patterns, list):
            hits = []
            for p in patterns:
                # Word-boundary search for words, substring for punctuation
                if category == 'em_dash':
                    if p in text:
                        hits.append({'pattern': p, 'count': text.count(p)})
                elif category == 'semicolon_in_prose':
                    # Only count semicolons not inside lists/code
                    if p in text:
                        hits.append({'pattern': p, 'count': text.count(p)})
                else:
                    if re.search(rf'\b{re.escape(p)}\b', text, re.IGNORECASE):
                        hits.append({'pattern': p, 'count': len(re.findall(rf'\b{re.escape(p)}\b', text, re.IGNORECASE))})
            if hits:
                violations[category] = hits
        else:
            if patterns in text:
                violations[category] = {'pattern': patterns, 'count': text.count(patterns)}

    return {
        'violations': violations,
        'count': sum(1 for v in violations.values() if v),
        'pass': len(violations) == 0,
    }


def gate_4_burstiness(text: str) -> dict:
    """Sentence length variance."""
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s.strip() for s in sentences if s.strip() and len(s.split()) >= 2]

    if len(sentences) < 5:
        return {
            'pass': False,
            'reason': f'only {len(sentences)} sentences (need ≥ 5)',
            'sentence_count': len(sentences),
        }

    lengths = [len(s.split()) for s in sentences]
    short = sum(1 for l in lengths if l < 8)
    long_count = sum(1 for l in lengths if l >= 25)
    rng = max(lengths) - min(lengths)

    checks = {
        'range_ge_20': rng >= 20,
        'short_sentences_ge_3': short >= 3,
        'long_sentences_ge_2': long_count >= 2,
    }

    return {
        'pass': all(checks.values()),
        'checks': checks,
        'sentence_count': len(sentences),
        'min_length': min(lengths),
        'max_length': max(lengths),
        'range': rng,
        'short_count': short,
        'long_count': long_count,
    }


def gate_5_read_aloud(text: str) -> dict:
    """Press-release / templated ending detection."""
    issues = []

    # Multiple consecutive numbered takeaways
    numbered = re.findall(r'^\s*\d+\.\s+\w+', text, re.MULTILINE)
    if len(numbered) >= 4:
        issues.append(f'{len(numbered)} numbered list items — likely "Key Takeaways 1-2-3-4" pattern')

    # "Bottom line" / "takeaway" callout patterns
    callouts = re.findall(r'\b(bottom line|key takeaway|why it matters|what this means for you|the takeaway:)\b',
                          text, re.IGNORECASE)
    if len(callouts) >= 2:
        issues.append(f'{len(callouts)} press-release callouts found')

    # Every sentence same length
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    sentences = [s for s in sentences if s.strip()]
    if sentences:
        lengths = [len(s.split()) for s in sentences]
        if len(set(lengths)) <= 3 and len(sentences) >= 5:
            issues.append('all sentences within 3 word-lengths — templated rhythm')

    return {
        'pass': len(issues) == 0,
        'issues': issues,
    }


def score_content(content_obj: dict, slug: str = '<unknown>') -> dict:
    """Run all 5 gates on a single content object."""
    prose = extract_prose(content_obj)

    g1 = gate_1_ai_score(prose)
    g2 = gate_2_eeat(prose)
    g3 = gate_3_banned(prose)
    g4 = gate_4_burstiness(prose)
    g5 = gate_5_read_aloud(prose)

    all_pass = g1['total'] <= 6 and g2['pass'] and g3['pass'] and g4['pass'] and g5['pass']

    return {
        'slug': slug,
        'word_count': len(prose.split()),
        'all_gates_pass': all_pass,
        'gate_1_ai_check': g1,
        'gate_2_eeat': g2,
        'gate_3_banned': g3,
        'gate_4_burstiness': g4,
        'gate_5_read_aloud': g5,
    }


def main():
    import argparse

    parser = argparse.ArgumentParser(description='QFINHUB Phase 39.2 Quality Scorer')
    parser.add_argument('slug', nargs='?', help='Calculator slug to score')
    parser.add_argument('--all', action='store_true', help='Score all 10 priority slugs')
    parser.add_argument('--stdin', action='store_true', help='Read JSON content from stdin')
    parser.add_argument('--json', action='store_true', help='Output raw JSON')
    args = parser.parse_args()

    PRIORITY_SLUGS = [
        '401k-calculator', 'investment-return', 'tax-calculator',
        'mortgage-affordability', 'debt-payoff', 'loan-calculator',
        'lifetime-value', 'inventory-turnover', 'mortgage-calculator',
        'compound-interest',
    ]

    if args.stdin:
        content = json.load(sys.stdin)
        result = score_content(content, slug=content.get('slug', 'stdin'))
        if args.json:
            print(json.dumps(result, indent=2))
        else:
            print_report(result)
        sys.exit(0 if result['all_gates_pass'] else 1)

    if not args.slug and not args.all:
        parser.error('provide a slug or --all')

    content_path = Path('/home/admin1/qfinhub/src/lib/calculators/calculator-content.ts')
    if not content_path.exists():
        print(f'ERROR: {content_path} not found', file=sys.stderr)
        sys.exit(2)

    # Parse the TypeScript file (basic regex extraction)
    text = content_path.read_text()

    slugs_to_check = PRIORITY_SLUGS if args.all else [args.slug]

    results = []
    for slug in slugs_to_check:
        # Find the slug's content block
        pattern = rf'"{re.escape(slug)}":\s*\{{(.*?)\n  \}},'
        match = re.search(pattern, text, re.DOTALL)
        if not match:
            results.append({'slug': slug, 'error': 'slug not found in calculator-content.ts'})
            continue

        block = match.group(1)
        # Extract field values — support both backtick template literals and quoted strings
        fields = {}
        for field_name in ['explanation', 'formula', 'formulaDescription', 'realWorldUse',
                           'example', 'definition']:
            # Try backtick template literal first
            fm = re.search(rf'{field_name}:\s*`(.*?)`', block, re.DOTALL)
            if not fm:
                # Fall back to quoted string (single-line)
                fm = re.search(rf'{field_name}:\s*"((?:[^"\\]|\\.)*)"', block, re.DOTALL)
            if fm:
                fields[field_name] = fm.group(1)

        for list_field in ['keyFactors', 'tips', 'keyTakeaways']:
            fm = re.search(rf'{list_field}:\s*\[(.*?)\]', block, re.DOTALL)
            if fm:
                items = re.findall(r'"([^"]+)"', fm.group(1))
                fields[list_field] = items

        result = score_content(fields, slug=slug)
        results.append(result)

    if args.json:
        print(json.dumps(results, indent=2))
    else:
        for r in results:
            print_report(r)
            print()

    # Exit 0 only if all pass
    all_pass = all(r.get('all_gates_pass', False) for r in results)
    sys.exit(0 if all_pass else 1)


def print_report(result):
    if 'error' in result:
        print(f'❌ {result["slug"]}: {result["error"]}')
        return

    status = '✅ PASS' if result['all_gates_pass'] else '❌ FAIL'
    print(f'{status} {result["slug"]} ({result["word_count"]} words)')
    print(f'  Gate 1 (ai-check): {result["gate_1_ai_check"]["total"]}/27 — {result["gate_1_ai_check"]["verdict"]}')
    print(f'    Signals: {result["gate_1_ai_check"]["signal_breakdown"]}')
    g2 = result['gate_2_eeat']
    print(f'  Gate 2 (EEAT): {g2["passed"]}/{g2["total_checks"]} checks — {"PASS" if g2["pass"] else "FAIL"}')
    print(f'    Sources: {g2["sources_found"]}')
    print(f'    First-person: {g2["first_person_count"]} sentences')
    print(f'    2026 mentions: {g2["year_2026_count"]}')
    print(f'    Dollar amounts: {g2["dollar_count"]}')
    g3 = result['gate_3_banned']
    print(f'  Gate 3 (banned): {g3["count"]} categories violated — {"PASS" if g3["pass"] else "FAIL"}')
    if not g3['pass']:
        for cat, hits in g3['violations'].items():
            print(f'    {cat}: {hits}')
    g4 = result['gate_4_burstiness']
    print(f'  Gate 4 (burstiness): {"PASS" if g4["pass"] else "FAIL"}')
    if 'checks' in g4:
        print(f'    {g4["sentence_count"]} sentences, range {g4["min_length"]}-{g4["max_length"]} (Δ{g4["range"]}), {g4["short_count"]} short, {g4["long_count"]} long')
    g5 = result['gate_5_read_aloud']
    print(f'  Gate 5 (read-aloud): {"PASS" if g5["pass"] else "FAIL"}')
    if not g5['pass']:
        for issue in g5['issues']:
            print(f'    - {issue}')


if __name__ == '__main__':
    main()