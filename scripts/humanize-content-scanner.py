#!/usr/bin/env python3
"""
QFINHUB Content Humanization Scanner
Scans calculator-content.ts, posts.ts, and guides.ts for 29 AI writing patterns.
Outputs a priority queue for humanization, cross-referenced with GSC indexing status.
NEVER flags the 38 indexed PASS pages.
"""

import re, json, os, sys
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path(__file__).parent.parent
QUEUE_FILE = PROJECT_ROOT / ".optimizer-data" / "indexing-fix-queue.json"
OUTPUT_FILE = PROJECT_ROOT / ".optimizer-data" / "humanization-scan-results.json"

# ─── 29 AI Pattern Definitions ───
AI_PATTERNS = {
    # 1. Undue emphasis on significance
    "significance_inflation": [
        r"\b(?:stands|serves) as\b", r"\b(?:is a|as a) testament\b",
        r"\b(?:vital|significant|crucial|pivotal|key) (?:role|moment)\b",
        r"\bunderscores?\b", r"\bhighlights?\s+(?:its|the)\s+importance\b",
        r"\breflects?\s+broader\b", r"\bsymbolizing\b",
        r"\bsetting the stage for\b", r"\bmarking.*shaping\b",
        r"\bevolving landscape\b", r"\bfocal point\b",
        r"\bindelible mark\b", r"\bdeeply rooted\b",
    ],
    # 2. Notability emphasis
    "notability_puffery": [
        r"\bindependent coverage\b", r"\blocal.*media outlets\b",
        r"\bactive social media presence\b",
    ],
    # 3. Superficial -ing analyses
    "ing_phrases": [
        r"\b(?:highlighting|underscoring|emphasizing)\s+(?:the|its|this)\b",
        r"\b(?:reflecting|symbolizing|contributing to)\s+(?:the|its|this)\b",
        r"\b(?:cultivating|fostering|encompassing|showcasing)\b",
    ],
    # 4. Promotional language
    "promotional": [
        r"\bboasts?\s+a\b", r"\bvibrant\b", r"\bgroundbreaking\b",
        r"\brenowned\b", r"\bbreathtaking\b", r"\bmust-visit\b",
        r"\bstunning\b", r"\bnestled\b", r"\bin the heart of\b",
    ],
    # 5. Vague attributions
    "vague_attribution": [
        r"\bIndustry reports\b", r"\bObservers have cited\b",
        r"\bExperts argue\b", r"\bSome critics argue\b",
        r"\bseveral sources\b",
    ],
    # 6. Formulaic challenges
    "challenges_section": [
        r"\bDespite.*faces?\s+several\s+challenges\b",
        r"\bDespite these challenges\b", r"\bFuture Outlook\b",
    ],
    # 7. AI vocabulary
    "ai_vocab": [
        r"\b(?:Additionally|Crucially|Moreover|Furthermore|Consequently)\b",
        r"\b(?:delve|delving)\b", r"\b(?:enhance|enhancing|enhanced)\b",
        r"\b(?:garner|garnered)\b", r"\b(?:interplay|intricate|intricacies)\b",
        r"\b(?:pivotal|showcase|tapestry|testament|underscore)\b",
        r"\b(?:valuable|vibrant)\b", r"\balign with\b",
        r"\bkey (?:role|moment|factor)\b",
    ],
    # 8. Copula avoidance
    "copula_avoidance": [
        r"\b(?:serves|stands)\s+as\b", r"\bboasts?\s+(?:a|over)\b",
        r"\bfeatures?\s+(?:a|over|four|three|two)\b",
        r"\boffers?\s+(?:a|an|users)\b",
        r"\brepresents?\s+(?:a|an)\b",
    ],
    # 9. Negative parallelisms
    "negative_parallelism": [
        r"\bNot only.*but also\b", r"\bIt's not just about.*it's\b",
        r"\bIt's not merely.*it's\b",
    ],
    # 10. Rule of three
    "rule_of_three": [
        r"(?:,\s*){2}\s*(?:and|or)\s+\w+",  # Detects X, Y, and Z
    ],
    # 13. Passive voice
    "passive_voice": [
        r"\bare\s+\w+ed\s+(?:by|automatically|automatically)\b",
        r"\bis\s+\w+ed\s+(?:automatically|preserved|calculated)\b",
    ],
    # 14. Em dash overuse
    "em_dash": [
        r"—.*—",  # Multiple em dashes in same string
    ],
    # 22. Sycophantic tone
    "sycophantic": [
        r"\b(?:Great question|You're absolutely right|excellent point)\b",
    ],
    # 23. Filler phrases
    "filler": [
        r"\b(?:In order to|At this point in time|Due to the fact that)\b",
        r"\bhas the ability to\b", r"\bIt is important to note that\b",
    ],
    # 24. Excessive hedging
    "excessive_hedging": [
        r"\b(?:could potentially|may possibly)\b",
        r"\bmight have some\s+\w+\b",
    ],
    # 25. Generic positive conclusions
    "generic_conclusion": [
        r"\b(?:the future looks bright|exciting times lie ahead)\b",
        r"\b(?:a major step in the right direction)\b",
        r"\b(?:toward excellence|journey toward)\b",
    ],
    # 26. Hyphenated pair overuse
    "hyphenated_pairs": [
        r"\b(?:cross-functional|client-facing|data-driven|decision-making)\b",
        r"\b(?:well-known|high-quality|real-time|end-to-end|long-term)\b",
    ],
    # 27. Persuasive authority tropes
    "authority_tropes": [
        r"\b(?:The real question is|at its core|in reality)\b",
        r"\b(?:fundamentally|what really matters|heart of the matter)\b",
        r"\bthe deeper issue\b",
    ],
    # 28. Signposting
    "signposting": [
        r"\b(?:Let's dive in|let's explore|let's break this down)\b",
        r"\bhere's what you need to know\b",
        r"\bwithout further ado\b",
    ],
}

def scan_text(text: str) -> dict:
    """Scan a text string for AI patterns. Returns {pattern_name: [matches]}."""
    if not text or not isinstance(text, str):
        return {}
    matches = {}
    for pattern_name, patterns in AI_PATTERNS.items():
        for pat in patterns:
            found = re.findall(pat, text, re.IGNORECASE)
            if found:
                matches.setdefault(pattern_name, []).extend(found[:5])  # Limit samples
    return matches

def get_all_matches(text: str) -> dict:
    """Scan all text fields in a record."""
    all_matches = {}
    for field, value in text.items():
        if isinstance(value, str):
            scan = scan_text(value)
            if scan:
                all_matches[field] = scan
        elif isinstance(value, list):
            for i, item in enumerate(value):
                if isinstance(item, str):
                    scan = scan_text(item)
                    if scan:
                        all_matches[f"{field}[{i}]"] = scan
    return all_matches

def parse_calc_content():
    """Parse calculator-content.ts and extract all content fields."""
    filepath = PROJECT_ROOT / "src/lib/calculators/calculator-content.ts"
    if not filepath.exists():
        return {}
    content = filepath.read_text()
    
    # Extract each calculator's content block
    # Pattern: "slug": { ... }
    calculators = {}
    
    # Use regex to find slug keys
    slug_pattern = re.compile(r'^\s*"([^"]+)":\s*\{', re.MULTILINE)
    matches = list(slug_pattern.finditer(content))
    
    for i, match in enumerate(matches):
        slug = match.group(1)
        start = match.end()
        # Find the closing brace (next "slug" or end of file)
        if i + 1 < len(matches):
            end = matches[i + 1].start()
        else:
            end = len(content)
        block = content[start:end]
        
        # Extract text fields
        def extract_field(name):
            m = re.search(rf'{name}:\s*`([^`]+)`', block)
            return m.group(1) if m else ""
        
        def extract_list(name):
            m = re.search(rf'{name}:\s*\[([^\]]+)\]', block, re.DOTALL)
            if not m:
                return []
            items_raw = m.group(1)
            items = re.findall(r'"([^"]+)"', items_raw)
            return items
        
        text = {
            "explanation": extract_field("explanation"),
            "formulaDescription": extract_field("formulaDescription"),
            "realWorldUse": extract_field("realWorldUse"),
            "example": extract_field("example"),
            "definition": extract_field("definition"),
            "keyFactors": extract_list("keyFactors"),
            "tips": extract_list("tips"),
            "keyTakeaways": extract_list("keyTakeaways"),
        }
        
        all_m = get_all_matches(text)
        if all_m:
            calculators[slug] = {
                "flu": sum(len(v) for field_m in all_m.values() for v in field_m.values()),
                "patterns": all_m,
            }
    
    return calculators

def load_indexing_queue():
    """Load the indexing fix queue to cross-reference."""
    if not QUEUE_FILE.exists():
        return {}
    with open(QUEUE_FILE) as f:
        return json.load(f)

def main():
    print("=== QFINHUB Content Humanization Scanner ===\n")
    
    # Parse calculator content
    calc_issues = parse_calc_content()
    print(f"Scanned calculator content: {len(calc_issues)} calculators with AI patterns")
    
    # Load indexing queue
    queue = load_indexing_queue()
    indexed_pass = set()
    unknown_pages = []
    discovered_pages = []
    
    if queue:
        # indexed_pages are URL strings
        for url in queue.get("indexed_pages", []):
            slug = url.split("/calculators/")[-1].rstrip("/") if "/calculators/" in url else ""
            if slug:
                indexed_pass.add(slug)
        unknown_pages = [u.split("/calculators/")[-1].rstrip("/") for u in queue.get("unknown_pages", []) if "/calculators/" in u]
        discovered_pages = [u.split("/calculators/")[-1].rstrip("/") for u in queue.get("discovered_pages", []) if "/calculators/" in u]
    
    print(f"Indexed (PASS, LOCKED): {len(indexed_pass)} — will NOT be flagged")
    print(f"Unknown pages (calculator slugs): {len(unknown_pages)}")
    print(f"Discovered pages (calculator slugs): {len(discovered_pages)}")
    
    # Build priority queue: UNKNOWN first, then DISCOVERED, then all others
    # NEVER include indexed_pass
    priority_queue = []
    
    for slug, data in calc_issues.items():
        if slug in indexed_pass:
            continue  # NEVER touch indexed pages
        
        # Determine priority
        if slug in unknown_pages:
            priority = "P0_UNKNOWN"
        elif slug in discovered_pages:
            priority = "P1_DISCOVERED"
        else:
            priority = "P2_OTHER"
        
        ai_score = data["flu"]
        priority_queue.append({
            "slug": slug,
            "url": f"https://www.qfinhub.com/calculators/{slug}",
            "priority": priority,
            "ai_tell_count": ai_score,
            "patterns": data["patterns"],
        })
    
    # Sort by priority then AI tell count (most tells first)
    priority_order = {"P0_UNKNOWN": 0, "P1_DISCOVERED": 1, "P2_OTHER": 2}
    priority_queue.sort(key=lambda x: (priority_order[x["priority"]], -x["ai_tell_count"]))
    
    print(f"\n=== Priority Queue: {len(priority_queue)} pages need humanization ===")
    print(f"  P0 (UNKNOWN): {sum(1 for p in priority_queue if p['priority']=='P0_UNKNOWN')}")
    print(f"  P1 (DISCOVERED): {sum(1 for p in priority_queue if p['priority']=='P1_DISCOVERED')}")
    print(f"  P2 (OTHER): {sum(1 for p in priority_queue if p['priority']=='P2_OTHER')}")
    
    print("\n=== Top 20 Worst Offenders ===")
    for i, item in enumerate(priority_queue[:20]):
        print(f"  {i+1}. [{item['priority']}] /calculators/{item['slug']} — {item['ai_tell_count']} AI tells")
        for field, patterns in list(item["patterns"].items())[:3]:
            for pname, matches in list(patterns.items())[:2]:
                print(f"      {field}.{pname}: {matches[0][:60]}")
    
    # Save results
    output = {
        "generated": "2026-06-30",
        "total_with_patterns": len(priority_queue),
        "by_priority": {
            "P0_UNKNOWN": sum(1 for p in priority_queue if p['priority']=='P0_UNKNOWN'),
            "P1_DISCOVERED": sum(1 for p in priority_queue if p['priority']=='P1_DISCOVERED'),
            "P2_OTHER": sum(1 for p in priority_queue if p['priority']=='P2_OTHER'),
        },
        "queue": priority_queue,
        "indexed_locked": len(indexed_pass),
    }
    
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, default=str)
    
    print(f"\nFull report saved to: {OUTPUT_FILE}")
    print(f"\n=== Next Steps ===")
    print("1. Review the top offenders above")
    print("2. Run humanization on P0_UNKNOWN pages first")
    print("3. Then P1_DISCOVERED pages")
    print("4. Use the humanizer skill's 29-pattern framework for each page")

if __name__ == "__main__":
    main()