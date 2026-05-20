"""
Merges augmented content (citations, definition, keyTakeaways) into
the existing calculator-content.ts TypeScript data file.
"""
import json, re

# Read augmented data
with open('/tmp/calculator-augment-output.json') as f:
    augmented = json.load(f)

print(f"Loaded {len(augmented)} augmented entries")

# Read existing TypeScript file
with open('/home/admin1/qfinhub/src/lib/calculators/calculator-content.ts') as f:
    content = f.read()

# Merge each entry
merged = 0
for slug, aug in augmented.items():
    # Find the calculator entry by slug
    pattern = rf'  "{re.escape(slug)}": \{{'
    match = re.search(pattern, content)
    if not match:
        print(f"  ✗ {slug} not found in content file")
        continue
    
    # Find the closing of this entry (before '},')
    start = match.start()
    # Find the relatedCalculators line and insert after it
    # Look for: relatedCalculators: [...],
    rc_pattern = r'(    relatedCalculators: \[.*?\],)'
    rc_match = re.search(rc_pattern, content[start:start+3000])
    if not rc_match:
        print(f"  ✗ {slug} — no relatedCalculators found")
        continue
    
    insert_pos = start + rc_match.end()
    
    # Build the new fields as TypeScript
    citations_str = json.dumps(aug.get('citations', []))
    key_takeaways_str = json.dumps(aug.get('keyTakeaways', []))
    definition = aug.get('definition', '').replace('`', '\\`').replace('${', '\\${')
    
    new_fields = f'\n    citations: {citations_str},\n    definition: `{definition}`,\n    keyTakeaways: {key_takeaways_str},'
    
    # Check if citations already exist (don't double-merge)
    if 'citations:' in content[insert_pos:insert_pos+200]:
        print(f"  → {slug} already has citations, skipping")
        continue
    
    # Insert
    content = content[:insert_pos] + new_fields + content[insert_pos:]
    merged += 1
    print(f"  ✓ {slug}")

# Write back
with open('/home/admin1/qfinhub/src/lib/calculators/calculator-content.ts', 'w') as f:
    f.write(content)

print(f"\nMerged {merged}/{len(augmented)} entries")
print(f"File size: {len(content)} bytes")

# Count words
total = 0
for slug, aug in augmented.items():
    total += len(aug.get('definition', '').split())
    total += sum(len(t.split()) for t in aug.get('keyTakeaways', []))
    total += sum(len(c.split()) for c in aug.get('citations', []))
print(f"New content: ~{total} words across all calculators")
