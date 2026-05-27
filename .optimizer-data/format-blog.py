#!/usr/bin/env python3
"""Insert emergency blog posts into posts.ts"""
import json, re

with open('/tmp/emergency-blog-posts.json', 'r') as f:
    posts = json.load(f)

# Create the entries in single-line HTML format
entries = []
for i, post in enumerate(posts):
    title = post['title'].replace("'", "\\'")
    desc = post['description'].replace("'", "\\'")
    # Content is single-line HTML - need to collapse to one line
    content = post['content'].replace('\n', ' ').replace("'", "\\'")
    # Collapse multiple spaces
    content = re.sub(r' +', ' ', content).strip()
    slug = title.lower().replace("'", "").replace('"', '')
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')
    # Truncate slug to 80 chars max
    slug = slug[:80]
    
    related = json.dumps(post['relatedCalculators'])
    cat = "loan" if "loan" in title.lower() else "mortgage"
    reading_time = post.get('readingTime', 4)
    
    entry = f"""  {{
    slug: "{slug}",
    title: "{title}",
    description: "{desc}",
    category: "{cat}",
    publishedAt: new Date("2026-05-27"),
    readingTime: {reading_time},
    relatedCalculators: {related},
    content: `<h2>TL;DR</h2><p>{content[content.find('<h2>TL;DR</h2><p>')+18:content.find('</p>', content.find('<h2>TL;DR</h2>'))]}</p>`,
  }},"""
    entries.append(entry)

for e in entries:
    print(e)
    print()
