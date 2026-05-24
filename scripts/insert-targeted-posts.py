#!/usr/bin/env python3
"""Generate 5 targeted blog posts as SINGLE-LINE backtick strings for Turbopack compatibility."""
import json, os, re, urllib.request, urllib.error, time, sys

PROJECT = "/home/admin1/qfinhub"
POSTS_FILE = PROJECT + "/src/lib/blog/posts.ts"
ENV_FILE = PROJECT + "/.env.local"

api_key = None
with open(ENV_FILE) as f:
    for line in f:
        if 'DEEPSEEK_API_KEY' in line:
            api_key = line.strip().split('=', 1)[1].strip().strip('"').strip("'")
            break
if not api_key:
    print("No API key")
    sys.exit(1)

targets = [
    {"slug": "20000-loan-5-years-8-percent-monthly-payment", "cat": "loans", "rt": 6,
     "calcs": '["loan-calculator", "amortization-schedule", "debt-snowball"]'},
    {"slug": "200k-mortgage-payment-30-years", "cat": "mortgage", "rt": 7,
     "calcs": '["mortgage-calculator", "amortization-schedule", "mortgage-affordability"]'},
    {"slug": "retire-by-40-calculator-how-much-needed", "cat": "retirement", "rt": 7,
     "calcs": '["financial-independence", "retirement-planning", "compound-interest"]'},
    {"slug": "monthly-mortgage-payment-formula-tax-insurance", "cat": "mortgage", "rt": 8,
     "calcs": '["mortgage-calculator", "amortization-schedule", "property-tax-calculator"]'},
    {"slug": "how-much-mortgage-afford-100k-salary", "cat": "mortgage", "rt": 7,
     "calcs": '["mortgage-affordability", "mortgage-calculator", "debt-to-income"]'},
]

sys_prompt = (
    "You create SEO blog posts matching exact search queries. "
    "Return ONLY a valid TypeScript object. "
    "The content field MUST be a SINGLE-LINE backtick template literal with all HTML on one line. "
    "Example: content: `<h2>Title</h2><p>Text with <a href=\"https://example.com\" target=\"_blank\">link</a>.</p>` "
    "NO newlines in content. NO double quotes inside HTML href attributes (use single quotes or none). "
    "COMPUTE real numbers for loan/mortgage/retirement calculations."
)

entries = []

for t in targets:
    slug = t["slug"]
    cat = t["cat"]
    rt = t["rt"]
    calcs = t["calcs"]

    user_prompt = (
        "Write an SEO blog post as a SINGLE-LINE HTML string inside a backtick template literal. "
        "CRITICAL: The content field MUST be ONE LINE of HTML with no newlines at all.\n\n"
        "SLUG: " + slug + "\n"
        "CATEGORY: " + cat + "\n"
        "READING TIME: " + str(rt) + " min\n"
        "RELATED CALCULATORS: " + calcs + "\n\n"
        "Requirements:\n"
        "- Title: 50-70 chars, include the computed answer number, target the search query\n"
        "- Meta description: 140-155 chars with keywords and CTA\n"
        "- FIRST sentence of content: Answer the query directly with the EXACT computed number\n"
        "- Format: content: `<h2>Section</h2><p>All text on one line...</p><h2>FAQ</h2><p><strong>Q:</strong>...</p>`\n"
        "- 700-900 words, single-line HTML only\n"
        "- Use <a href=\"https://www.qfinhub.com/calculators/X\" target=\"_blank\"> for calculator links\n"
        "- NO double quotes inside href='...' attributes\n"
        "- Include computed numbers: loan payments, mortgage payments, retirement savings needed\n"
        "- Escape any internal double quotes with backslash\n\n"
        "Return ONLY the TypeScript object. No markdown wrappers, no explanation."
    )

    payload = json.dumps({
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": sys_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.3,
        "max_tokens": 4000,
    }).encode()

    print(f"Generating: {slug[:50]}...")
    try:
        req = urllib.request.Request(
            "https://api.deepseek.com/v1/chat/completions",
            data=payload,
            headers={"Authorization": "Bearer " + api_key, "Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=90) as resp:
            result = json.loads(resp.read())
        text = result["choices"][0]["message"]["content"]
        text = text.strip()
        text = re.sub(r'^```\w*\n?', '', text)
        text = re.sub(r'\n?```$', '', text)

        # Collapse newlines in content field ONLY
        m = re.search(r'content:\s*`([^`]*)`', text, re.DOTALL)
        if m:
            raw = m.group(1)
            collapsed = re.sub(r'\s+', ' ', raw).strip()
            text = text.replace(raw, collapsed)

        has_nl = '\n' in text
        has_content_nl = False
        if m:
            has_content_nl = '\n' in m.group(1)

        entries.append(text)
        print(f"  OK {len(text)} chars | content single-line: {not has_content_nl}")
    except Exception as e:
        print(f"  FAIL: {e}")

    time.sleep(1.5)

# Insert into posts.ts
with open(POSTS_FILE) as f:
    posts = f.read()

old_count = posts.count('slug:')
insertion = "\n  " + ",\n  ".join(entries) + ",\n];"
new_posts = posts.replace("\n];", insertion)
new_count = new_posts.count('slug:')

if new_count > old_count:
    with open(POSTS_FILE, "w") as f:
        f.write(new_posts)
    print(f"\nInserted {len(entries)} posts ({old_count} -> {new_count} slugs)")
else:
    print(f"\nFAILED: slug count unchanged ({old_count})")
