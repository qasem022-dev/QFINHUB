#!/usr/bin/env python3
"""
QFINHUB V2 — Blog Quality Gate
================================
Validates a generated blog post against all 8 V2 quality gates.
Returns exit code 0 if ALL gates pass, 1 if any gate fails.
Prints detailed pass/fail report.
"""

import json, re, sys, os
from pathlib import Path

PROJECT = Path("/home/admin1/qfinhub")

# ── Load existing blog posts for title comparison ──
def load_existing_titles():
    posts_file = PROJECT / "src/lib/blog/posts.ts"
    if not posts_file.exists():
        return []
    with open(posts_file) as f:
        content = f.read()
    return re.findall(r'title:\s*"([^"]+)"', content)

# ── Load calculator slugs for link validation ──
def load_calculator_slugs():
    calc_file = PROJECT / "src/lib/calculators/index.ts"
    if not calc_file.exists():
        return set()
    with open(calc_file) as f:
        content = f.read()
    return set(re.findall(r'slug:\s*"([^"]+)"', content))

# ── Similarity check ──
def title_similarity(t1, t2):
    """Simple word-overlap similarity."""
    w1 = set(t1.lower().split())
    w2 = set(t2.lower().split())
    if not w1 or not w2:
        return 0
    return len(w1 & w2) / len(w1 | w2)

# ═══════════════════════════════════════════════════════════════════
# GATES
# ═══════════════════════════════════════════════════════════════════

VALID_CLUSTERS = [
    "mortgage", "loan", "investment", "retirement", "tax",
    "personal", "debt", "credit card", "compound interest",
    "401k", "budget", "savings"
]

def normalize_cluster(name):
    """Normalize cluster name: replace hyphens with spaces for comparison."""
    return name.replace("-", " ").strip().lower()

def gate1_topic_source(post_data):
    """Post must target GSC query OR cluster gap OR decision intent."""
    target = post_data.get("target_query", "")
    cluster = post_data.get("cluster", "")
    if target or cluster:
        return True, f"Topic targets: query='{target}', cluster='{cluster}'"
    return False, "No target query or cluster specified"

def gate2_calculator_support(post_data):
    """Post must link to at least 2 calculator pages."""
    calc_links = post_data.get("calculator_links", [])
    if len(calc_links) >= 2:
        return True, f"Links to {len(calc_links)} calculators"
    return False, f"Only {len(calc_links)} calculator links (minimum 2 required)"

def gate3_real_calculation(post_data):
    """Post must include at least 3 specific calculated numbers."""
    calc_values = post_data.get("calculated_values", [])
    if len(calc_values) >= 3:
        return True, f"Contains {len(calc_values)} calculated values"
    return False, f"Only {len(calc_values)} calculated values (minimum 3 required)"

def gate4_unique_title(post_data):
    """Title must not be too similar to existing blog titles."""
    title = post_data.get("title", "")
    existing = load_existing_titles()
    for et in existing:
        sim = title_similarity(title, et)
        if sim > 0.6:
            return False, f"Title too similar to existing: '{et}' (similarity: {sim:.0%})"
    return True, "Title is unique"

def gate5_content_depth(post_data):
    """Post must have 1500+ words, H2/H3 structure, and 1+ table."""
    word_count = post_data.get("word_count", 0)
    has_headings = post_data.get("has_headings", False)
    has_table = post_data.get("has_table", False)
    
    failures = []
    if word_count < 1500:
        failures.append(f"Only {word_count} words (minimum 1500)")
    if not has_headings:
        failures.append("Missing H2/H3 structure")
    if not has_table:
        failures.append("Missing table or structured comparison")
    
    if not failures:
        return True, f"{word_count} words, structured headings, includes table"
    return False, "; ".join(failures)

def gate6_eeat_signals(post_data):
    """Post must include author, methodology, citations, or disclaimer."""
    signals = post_data.get("eeat_signals", [])
    if len(signals) >= 2:
        return True, f"E-E-A-T signals: {', '.join(signals)}"
    return False, f"Only {len(signals)} E-E-A-T signals (minimum 2 required)"

def gate7_non_generic(post_data):
    """Post must not be generic finance advice without calculator support."""
    is_generic = post_data.get("is_generic", True)
    if not is_generic:
        return True, "Post contains specific, non-generic financial content"
    return False, "Post is generic finance advice without unique calculator support"

def gate8_cluster_relevance(post_data):
    """Post must strengthen one of the main clusters."""
    cluster = post_data.get("cluster", "")
    normalized = normalize_cluster(cluster)
    if normalized and any(c in normalized for c in VALID_CLUSTERS):
        return True, f"Strengthens cluster: {cluster}"
    return False, f"Cluster '{cluster}' not in valid clusters: {VALID_CLUSTERS}"

# ═══════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════

GATES = [
    ("G1 Topic Source", gate1_topic_source),
    ("G2 Calculator Support", gate2_calculator_support),
    ("G3 Real Calculations", gate3_real_calculation),
    ("G4 Unique Title", gate4_unique_title),
    ("G5 Content Depth", gate5_content_depth),
    ("G6 E-E-A-T Signals", gate6_eeat_signals),
    ("G7 Non-Generic", gate7_non_generic),
    ("G8 Cluster Relevance", gate8_cluster_relevance),
]

def run_gates(post_data):
    print("=" * 55)
    print("🔍 QFINHUB V2 — Blog Quality Gate")
    print(f"   Post: {post_data.get('title', 'Untitled')[:80]}")
    print("=" * 55)
    
    passed = 0
    failed = 0
    
    for name, gate_fn in GATES:
        ok, msg = gate_fn(post_data)
        status = "✅" if ok else "❌"
        if ok:
            passed += 1
        else:
            failed += 1
        print(f"  {status} {name}: {msg}")
    
    print("-" * 55)
    total = passed + failed
    print(f"  Result: {passed}/{total} gates passed")
    
    if failed > 0:
        print(f"  ❌ BLOG REJECTED — {failed} gate(s) failed")
        return 1
    else:
        print(f"  ✅ BLOG APPROVED — all gates passed")
        return 0

if __name__ == "__main__":
    # Accept JSON from stdin
    try:
        data = json.load(sys.stdin)
    except:
        data = {}
    
    exit_code = run_gates(data)
    sys.exit(exit_code)
