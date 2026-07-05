# GSC Indexing Regression Analysis — Jul 4, 2026

## Problem
- User reports: 286 indexed → fell to 207 (-79 pages)
- Not indexed count increasing
- Sitemap pages reduced

## Root Causes (3 commits)

### 1. Commit bb016a5 (Jun 28) — Phase 36: Authority Consolidation
**BIGGEST IMPACT — removed ~200+ tool variant pages from sitemap**

Changes:
- Removed ALL `/tools/*` variant pages from sitemap (getAllVariantPages import removed)
- 301 redirected ALL tools formula variants to parent calculators
- Added noindex to duplicate blog post
- Removed guides hub from sitemap

Pages removed from sitemap: ~200+ tool variant URLs (investment-1k-5yr, investment-25k-10yr, etc.)
These pages were getting impressions/clicks in GSC (see /tools/investment-25k-10yr had a click!)

### 2. Commit 70f3069 (Jun 29) — Phase 37: Blog noindex
- Added noindex to blog posts (meta tag 'noindex, follow')
- Changed tools/* redirects from 307 to 301 (permanent)

### 3. Commit c0dd4e7 (Jul 2) — Phase 38: Sitemap cleanup
- Removed /ai-specialist from sitemap
- Added noindex to /ai-specialist

## Impact Assessment
- Before these changes: sitemap had 527 URLs (includes tool variants, guides, etc.)
- After: sitemap has 303 URLs
- The 200+ removed tool variant pages were INDEXED by Google and some had impressions/clicks
- Removing them from sitemap + 301 redirecting them = Google de-indexed them
- Blog noindex may have also de-indexed some blog posts

## What Went Wrong
The "authority consolidation" strategy assumed tool variant pages were low quality and should redirect to parent calculators. But many of these pages were ACTUALLY INDEXED and getting search traffic. Redirecting them 301 told Google "this page no longer exists, permanently moved" → Google dropped them from index.

## Immediate Actions Needed
1. REVERT the 301 redirects on tool variant pages — restore them as 200 status
2. RE-ADD tool variant URLs to sitemap
3. REVERT blog noindex (if applied to ALL blog posts, not just duplicates)
4. Request re-indexing of de-indexed pages via GSC
5. Wait 7-14 days for Google to re-crawl and re-index

## Risk Assessment
- HIGH RISK: Reverting changes may cause temporary duplicate content issues
- HIGHER RISK: NOT reverting means 79+ pages stay de-indexed permanently
- The 4 pages that LOST indexing (tools/investment-1k-5yr, 100k-7yr, 5k-20yr, guides/how-to-use-child-care-cost) were directly caused by Phase 36 redirects