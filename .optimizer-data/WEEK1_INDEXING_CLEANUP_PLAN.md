# Week 1 Indexing Cleanup Plan
**Generated:** 2026-07-12 (Day 2 of 200K plan)
**Owner:** Hermes
**Trigger:** Qasem reported 765 not indexed vs 207 indexed, with 539 in main sitemap + 8 in news sitemap (547 total)

## Live State (verified today)

| Bucket | Count | Action |
|---|---|---|
| Indexed & in sitemap | 91 | DO NOTHING — keep as-is |
| Indexed & NOT in sitemap (orphans) | 12 | KEEP INDEXED — add to sitemap (organic boost) |
| Sitemap URLs returning 308 (redirects) | 49 | **REMOVE from sitemap** — they're being redirected, sitemap should not advertise them |
| Indexed but Google sees different canonical | 1 | FIX canonical (pmi-calculator) |
| Sitemap URLs returning 200 OK but "Discovered/Unknown" to Google | ~437 | NO ACTION — Google's natural crawl lag, will catch up in 7-14 days |

## Root Causes Identified

1. **49 stale blog redirects in sitemap** — Phase 39.3 redirected 51 thin Fed-news posts to 8 hubs, but `blogPosts` source data still includes them. Sitemap.ts renders them all → 308 in sitemap → GSC confused.
2. **12 orphan indexed URLs** — Pages indexed by Google but not in sitemap (tools/afford-*, guides/how-to-use-*). Should be added to sitemap to preserve indexing.
3. **1 canonical mismatch** — `/calculators/pmi-calculator` has self-canonical but Google chose different. Need to investigate.
4. **~437 "not crawled yet"** — All HTTP 200, all in sitemap, but GSC says "Discovered - currently not indexed" or "URL is unknown to Google". This is **Google's natural crawl lag** (sitemap fix Jul 4 + recovery window Jul 12-18). DO NOT FIX — wait for Google.

## Action Plan (in order)

### Step 1 — Filter redirected slugs from sitemap.ts (PRIMARY FIX)
- Add `REDIRECTED_BLOG_SLUGS` Set from `next.config.ts` to `sitemap.ts`
- Filter `blogPages` array by `!REDIRECTED_BLOG_SLUGS.has(post.slug)`
- Verify count drops from ~114 blog entries to ~63 (114 - 51 = 63)

### Step 2 — Add orphan-indexed URLs to sitemap
- 12 URLs: tools/afford-* + guides/how-to-use-*
- They're already indexed, just need to be advertised via sitemap

### Step 3 — Investigate PMI canonical mismatch
- Check what Google considers canonical vs what's set in the page
- Fix self-canonical if needed

### Step 4 — Wait for natural crawl recovery (no action)
- 437 URLs in sitemap returning 200 OK but not yet crawled by Google
- Will be picked up in next 7-14 days (Jul 12-18 recovery window)
- DO NOT remove from sitemap

### Step 5 — Verify all fixes
- curl sitemap.xml → count drops from 547 to ~498
- curl each redirect URL → confirm 308 status
- spot-check key pages still return 200
- After deploy, click "Validate Fix" on relevant GSC categories

## Expected Outcomes

| Before | After |
|---|---|
| 547 sitemap URLs | ~498 sitemap URLs (49 redirects removed) |
| 207 indexed | ~211 indexed (+4 from orphan inclusion) |
| 765 not indexed | ~716 not indexed (49 redirect-spam removed) |
| 7 confusing reasons | 6 cleaner reasons (redirect "reason" eliminated) |
| GSC confusion: high | GSC confusion: low |

After Jul 18 (recovery window end):
- Indexed: ~300-400 (natural crawl catches up)
- Impressions: start rising from 486/7d baseline
