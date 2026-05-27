#!/usr/bin/env python3
"""Insert emergency blog posts before the final '];' in posts.ts"""
import json, re

with open('/home/admin1/qfinhub/src/lib/blog/posts.ts', 'r') as f:
    content = f.read()

with open('/tmp/emergency-blog-posts.json', 'r') as f:
    posts = json.load(f)

# Build entry strings
entries = []
for post in posts:
    title = post['title']
    desc = post['description']
    # Get full content (it's already in the JSON)
    raw_content = post['content']
    # Make it single-line
    single_line = ' '.join(raw_content.split())
    
    related = json.dumps(post['relatedCalculators'])
    slug = title.lower().replace("'", "").replace('"', '')
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')[:80]
    
    cat = "loan" if "loan" in slug else "mortgage"
    rt = post.get('readingTime', 4)
    
    entry = f""",
  {{
    slug: "{slug}",
    title: "{title}",
    description: "{desc}",
    category: "{cat}",
    publishedAt: new Date("2026-05-27"),
    readingTime: {rt},
    relatedCalculators: {related},
    content: `{single_line}`,
  }}
]
"""
    entries.append(entry)

# Replace the final '];' with the first blog post entry
# Then the second entry replaces the final '];' from the first
old_end = content.rstrip()[-2:]  # should be '];'
# Actually, let me just find the last occurrence
last_semicolon_bracket = content.rfind('\n];')
if last_semicolon_bracket == -1:
    last_semicolon_bracket = content.rfind('];')

# Insert first blog post before ]; 
part1 = content[:last_semicolon_bracket]
part2 = content[last_semicolon_bracket:]

# Build the insertion with all posts
insert = ""
for post in posts:
    title = post['title']
    desc = post['description']
    raw_content = post['content']
    single_line = ' '.join(raw_content.split())
    related = json.dumps(post['relatedCalculators'])
    slug = title.lower().replace("'", "").replace('"', '')
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')[:80]
    cat = "loan" if "loan" in slug else "mortgage"
    rt = post.get('readingTime', 4)
    
    insert += f""",
  {{
    slug: "{slug}",
    title: "{title}",
    description: "{desc}",
    category: "{cat}",
    publishedAt: new Date("2026-05-27"),
    readingTime: {rt},
    relatedCalculators: {related},
    content: `{single_line}`,
  }}"""

new_content = part1 + insert + "\n" + part2

with open('/home/admin1/qfinhub/src/lib/blog/posts.ts', 'w') as f:
    f.write(new_content)

print("Blog posts inserted successfully")
print(f"Before: {len(content)} chars, After: {len(new_content)} chars")
