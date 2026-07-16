#!/usr/bin/env python3
"""
sitemap-redirect-drift-detector.py

Detects drift between next.config.ts redirects and:
  - src/app/sitemap.ts REDIRECTED_BLOG_SLUGS
  - src/app/blog/page.tsx REDIRECTED_SLUGS

Run before any commit that touches next.config.ts, sitemap.ts, or blog/page.tsx.

Usage:
  cd /home/admin1/qfinhub
  python3 scripts/sitemap-redirect-drift-detector.py

Exit codes:
  0 = no drift
  1 = drift detected (prints exact fixes needed)
"""

import re
import sys
from pathlib import Path

ROOT = Path('/home/admin1/qfinhub')

def extract_blog_redirects(config_text: str) -> set[str]:
    """Extract blog slug redirects from next.config.ts."""
    return set(re.findall(r'source:\s*"/blog/([^"]+)"', config_text))

def extract_set_block(text: str, var_name: str) -> set[str]:
    """Extract slugs from `const VAR_NAME = new Set([...])`."""
    pattern = rf'{var_name}\s*=\s*new\s+Set\(\[(.*?)\]\)'
    m = re.search(pattern, text, re.DOTALL)
    if not m:
        return set()
    return set(re.findall(r'"([^"]+)"', m.group(1)))

def main():
    config_text = (ROOT / 'next.config.ts').read_text()
    sitemap_text = (ROOT / 'src/app/sitemap.ts').read_text()
    blog_page_text = (ROOT / 'src/app/blog/page.tsx').read_text()

    blog_redirects = extract_blog_redirects(config_text)
    sitemap_slugs = extract_set_block(sitemap_text, 'REDIRECTED_BLOG_SLUGS')
    blog_page_slugs = extract_set_block(blog_page_text, 'REDIRECTED_SLUGS')

    print(f'Blog redirects in next.config.ts: {len(blog_redirects)}')
    print(f'Sitemap REDIRECTED_BLOG_SLUGS:    {len(sitemap_slugs)}')
    print(f'Blog page REDIRECTED_SLUGS:       {len(blog_page_slugs)}')
    print()

    # Drift = redirects in next.config.ts not in the filter
    sitemap_missing = blog_redirects - sitemap_slugs
    blog_page_missing = blog_redirects - blog_page_slugs

    # Orphans = filter entries that aren't actually redirected
    sitemap_orphans = sitemap_slugs - blog_redirects
    blog_page_orphans = blog_page_slugs - blog_redirects

    drift = False

    if sitemap_missing:
        drift = True
        print(f'❌ Sitemap MISSING {len(sitemap_missing)} redirected slug(s):')
        for s in sorted(sitemap_missing):
            print(f'   + "{s}"')
        print()

    if blog_page_missing:
        drift = True
        print(f'❌ Blog page MISSING {len(blog_page_missing)} redirected slug(s):')
        for s in sorted(blog_page_missing):
            print(f'   + "{s}"')
        print()

    if sitemap_orphans:
        drift = True
        print(f'⚠️  Sitemap has {len(sitemap_orphans)} orphan slug(s) not in next.config.ts:')
        for s in sorted(sitemap_orphans):
            print(f'   - "{s}"')
        print()

    if blog_page_orphans:
        drift = True
        print(f'⚠️  Blog page has {len(blog_page_orphans)} orphan slug(s) not in next.config.ts:')
        for s in sorted(blog_page_orphans):
            print(f'   - "{s}"')
        print()

    if drift:
        print('=== FIX ===')
        if sitemap_missing:
            print('Add to src/app/sitemap.ts REDIRECTED_BLOG_SLUGS:')
            for s in sorted(sitemap_missing):
                print(f'   "{s}",')
        if blog_page_missing:
            print('Add to src/app/blog/page.tsx REDIRECTED_SLUGS:')
            for s in sorted(blog_page_missing):
                print(f'   "{s}",')
        if sitemap_orphans:
            print('Remove from src/app/sitemap.ts REDIRECTED_BLOG_SLUGS:')
            for s in sorted(sitemap_orphans):
                print(f'   "{s}",')
        if blog_page_orphans:
            print('Remove from src/app/blog/page.tsx REDIRECTED_SLUGS:')
            for s in sorted(blog_page_orphans):
                print(f'   "{s}",')
        sys.exit(1)

    print('✅ No drift detected — sitemap, blog page, and redirects are in sync.')
    sys.exit(0)

if __name__ == '__main__':
    main()