#!/usr/bin/env python3
"""
QFINHUB V2 Scenario Pruner — Removes formula-based parameter scenarios from index.
Keeps only decision-oriented case studies.

Classification:
- FORMULA: mortgage-200k-10dp-15yr-5-5pct → PRUNE (noindex, remove from sitemap)
- HASHED: retirement-planning-abc123 → REVIEW (keep, rewrite as decision case)
- DECISION: can-i-afford-400k-home → KEEP (always)
"""

import json, os, sys, re
from pathlib import Path
from datetime import datetime

PROJECT_ROOT = Path("/home/admin1/qfinhub")
SCENARIO_DIR = PROJECT_ROOT / "public" / "data" / "scenarios"
INDEX_FILE = SCENARIO_DIR / "index.json"
SITEMAP_FILE = SCENARIO_DIR / "sitemap-entries.txt"
PRUNE_LOG = PROJECT_ROOT / ".optimizer-data" / "scenario-prune-log.json"

def is_formula_slug(slug):
    """Detect formula-based parameter pages."""
    parts = slug.split('-')
    num_parts = [p for p in parts if p.replace('.','').replace('k','').replace('dp','').isdigit() 
                 or (p.endswith('pct') and p[:-3].replace('.','').isdigit())
                 or (p.replace('.','').isdigit() and 'yr' in p and p[:-2].isdigit())]
    
    # Has percentage + year term + multiple numbers
    has_pct = any('pct' in p for p in parts)
    has_yr = any(p.endswith('yr') for p in parts)
    
    # Formula pattern: mortgage/loan/compound + numbers + percentages + years
    formula_keywords = ['mortgage', 'loan', 'compound-interest', 'auto-loan', 'car-loan',
                        '401k', 'roth-ira', 'annuity', 'fire-calculator']
    
    if has_pct and has_yr and len(num_parts) >= 2:
        return True
    
    for kw in formula_keywords:
        if slug.startswith(kw) and len(num_parts) >= 3:
            return True
    
    return False

def main():
    print("=" * 55)
    print("QFINHUB V2 Scenario Pruner")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 55)
    
    if not INDEX_FILE.exists():
        print("Error: Scenario index not found")
        return
    
    with open(INDEX_FILE) as f:
        index = json.load(f)
    
    total = len(index)
    formula_slugs = []
    keep_slugs = []
    
    for slug in index:
        if is_formula_slug(slug):
            formula_slugs.append(slug)
        else:
            keep_slugs.append(slug)
    
    print(f"\n📊 Total scenarios: {total}")
    print(f"🔴 FORMULA (prune): {len(formula_slugs)} ({len(formula_slugs)*100//total}%)")
    print(f"🟢 KEEP (review):   {len(keep_slugs)} ({len(keep_slugs)*100//total}%)")
    
    # Remove formula slugs from index
    new_index = {s: index[s] for s in keep_slugs}
    with open(INDEX_FILE, 'w') as f:
        json.dump(new_index, f, indent=2)
    print(f"\n✅ Updated index: {len(new_index)} entries")
    
    # Update sitemap entries
    if SITEMAP_FILE.exists():
        with open(SITEMAP_FILE) as f:
            entries = f.readlines()
        
        formula_urls = set(f"https://www.qfinhub.com/scenario/{s}\n" for s in formula_slugs)
        new_entries = [e for e in entries if e not in formula_urls]
        
        with open(SITEMAP_FILE, 'w') as f:
            f.writelines(new_entries)
        print(f"✅ Updated sitemap: {len(new_entries)} entries (removed {len(entries)-len(new_entries)})")
    
    # Log the prune
    log = {
        "timestamp": datetime.now().isoformat(),
        "total_before": total,
        "formula_removed": len(formula_slugs),
        "kept": len(keep_slugs),
        "formula_samples": formula_slugs[:10],
        "kept_samples": keep_slugs[:10],
    }
    os.makedirs(PRUNE_LOG.parent, exist_ok=True)
    with open(PRUNE_LOG, 'w') as f:
        json.dump(log, f, indent=2)
    
    print(f"\n📋 Prune log saved to {PRUNE_LOG}")
    print(f"\n🔴 PRUNED {len(formula_slugs)} formula-based scenarios")
    print(f"🟢 KEPT {len(keep_slugs)} scenarios for review/rewrite")
    
    # Sample of what was pruned
    print("\n📋 Pruned samples:")
    for s in formula_slugs[:5]:
        print(f"   /scenario/{s}")
    
    print("\n📋 Kept samples:")
    for s in keep_slugs[:5]:
        print(f"   /scenario/{s}")

if __name__ == "__main__":
    main()
