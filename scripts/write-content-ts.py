import json

with open('/tmp/calculator-content-output.json') as f:
    data = json.load(f)

lines = []
lines.append('import { CalculatorContent } from "@/types/calculator-content";')
lines.append('')
lines.append('/**')
lines.append(' * SEO-optimized educational content for all 124 calculators.')
lines.append(' * Generated via Google Gemini API.')
lines.append(' */')
lines.append('export const calculatorContent: Record<string, CalculatorContent> = {')
lines.append('')

for slug, content in sorted(data.items()):
    def esc(s):
        return s.replace('\\', '\\\\').replace('`', '\\`').replace('${', '\\${')
    
    lines.append(f'  "{slug}": {{')
    lines.append(f'    explanation: `{esc(content["explanation"])}`,')
    lines.append(f'    formula: `{esc(content["formula"])}`,')
    lines.append(f'    formulaDescription: `{esc(content["formulaDescription"])}`,')
    lines.append(f'    realWorldUse: `{esc(content["realWorldUse"])}`,')
    lines.append(f'    example: `{esc(content["example"])}`,')
    
    kf = content.get('keyFactors', [])
    tips = content.get('tips', [])
    rc = content.get('relatedCalculators', [])
    
    lines.append(f'    keyFactors: {json.dumps(kf)},')
    lines.append(f'    tips: {json.dumps(tips)},')
    lines.append(f'    relatedCalculators: {json.dumps(rc)},')
    lines.append(f'  }},')
    lines.append('')

lines.append('};')
lines.append('')

with open('/home/admin1/qfinhub/src/lib/calculators/calculator-content.ts', 'w') as f:
    f.write('\n'.join(lines))

# Count total words
total_words = 0
for slug, content in data.items():
    for field in ['explanation', 'formulaDescription', 'realWorldUse', 'example']:
        total_words += len(content.get(field, '').split())
    for arr_field in ['keyFactors', 'tips']:
        for item in content.get(arr_field, []):
            total_words += len(item.split())

print(f'File written to src/lib/calculators/calculator-content.ts')
print(f'Total entries: {len(data)}')
print(f'Total words across all content: {total_words}')
print(f'Avg words per calculator: {total_words // 124}')
