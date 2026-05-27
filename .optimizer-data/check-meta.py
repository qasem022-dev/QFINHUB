#!/usr/bin/env python3
"""Check remaining generic entries"""
import re

with open('/home/admin1/qfinhub/src/lib/programmatic-seo/variant-templates.ts', 'r') as f:
    content = f.read()

# Count improved vs generic
with_2026 = len(re.findall(r'2026', content))
with_free = len(re.findall(r'Free', content))

# Find entries that have old-style generic "Calculate" descriptions
pattern = r'title: "([^"]+)".*?description: "Calculate [^"]+"'
matches = list(re.finditer(pattern, content))
print(f"Entries with generic 'Calculate' desc: {len(matches)}")
print(f"Entries with '2026': {with_2026}")
print(f"Entries with 'Free': {with_free}")
print(f"Total entries ~893")

# Show first 10
for i, m in enumerate(matches[:10]):
    title = m.group(1)
    print(f"  {i+1}. {title}")
    
# Also find auto loan, debt, student loan, budget pages
for category in [r'auto-loan', r'debt-payoff', r'budget-planner', r'student-loan']:
    c_matches = list(re.finditer(r'title: "([^"]+)"', content))
    cat_count = 0
    for m in c_matches:
        t = m.group(1)
        if category.replace('-', ' ') in t.lower() or any(w in t.lower() for w in category.split('-')):
            cat_count += 1
    if cat_count > 0:
        print(f"  {category}: {cat_count} entries")
