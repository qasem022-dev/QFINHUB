# QFINHUB Indexing Acceleration Audit — Task 2A (Jul 16, 2026)

**Status:** All available acceleration methods identified. Most are already automated by the daily cron (`fe9e674e8bb3`). One critical bug was fixed in this audit (sitemap-redirect drift, commit `9445778`).

## Current Acceleration Stack (already running)

| Method | Mechanism | Limit | Where |
|---|---|---|---|
| URL Inspection API refresh | Service-account JWT, signals Google to re-crawl | 200/day effective | `scripts/gsc-daily-pipeline.py` → 10AM cron |
| GSC "Request Indexing" via CloakBrowser | Manual UI click, queues for indexing | 13/day | `scripts/gsc-request-indexing-one-by-one.py` → 11AM submission slot in daily cron |
| Sitemap submission | PUT to GSC sitemap endpoint | Once per sitemap | `scripts/gsc-daily-pipeline.py` (only on changes) |
| robots.txt + sitemap declaration | `src/app/robots.ts` | Permanent | Always live |
| Internal linking (cross-tool hub) | Phase 39 added cross-links | Per-page | `src/lib/calculator-blog-links.ts` |

## What Was Broken (fixed in this audit)

**Bug:** Sitemap advertised 1 URL that was 301-redirected in `next.config.ts`:
- `/blog/kevin-warsh-fed-rate-decision-how-rising-rates-impact-your-mortgage-affordabilit`
- The slug in `REDIRECTED_BLOG_SLUGS` was the WRONG slug (`inflation` instead of `rates`)
- Result: GSC would discover it but the 308 redirect confused Google's indexer → "Discovered" status with no resolution

**Also fixed:** 36 redirected blog slugs were missing from `REDIRECTED_SLUGS` filter in `src/app/blog/page.tsx` — those posts were still rendering on `/blog` index with broken internal links.

**Fix:** Both lists now auto-mirror `next.config.ts` (verified by `scripts/sitemap-redirect-drift-detector.py`).

## Why We Can't Use Other Acceleration Methods

| Method | Why not |
|---|---|
| Google Indexing API (`urlNotifications:publish`) | **Disabled per QFINHUB V2 correction** — only supports `JobPosting` and `BroadcastEvent` schemas, not general pages. Misusing it = spam signal. Also explicitly listed as a "rollback trigger" in `.optimizer-data/phase30/cron-backup-before-phase30.json`. |
| CloakBrowser > 13/day UI submissions | GSC hard cap; flagged as abuse above 13 |
| sitemap ping (HTTP GET to Google) | Deprecated (returns 404); removed from pipeline |
| Manual internal-link spam | Algorithmically demoted; only natural links pass quality gates |

## Effective Per-Page Acceleration Path (the actual fast path)

For each URL, this is what moves it from "Discovered" → "Indexed":

1. **Crawl signal** — Sitemap advertises URL with fresh `lastModified` date
2. **Inspection refresh** — URL Inspection API call (counts as fresh crawl signal for Google)
3. **Manual request** — CloakBrowser "Request Indexing" (the final-mile trigger for stuck pages)
4. **Content quality** — DISCOVERED pages need humanization (5-gate pipeline) before Google will index them

## Bug Class Fixed By This Audit

The "179 Not found (404) pages" the user saw in GSC is **stale reporting**. Live HTTP audit (498/499 URLs return 200, 1 returns 308, 0 return 404). The sitemap-redirect-drift bug caused Google to repeatedly discover the 308, then de-prioritize. With the fix, the next GSC crawl will resolve that 308 and (assuming `next.config.ts` redirects to an indexed target) Google will follow it correctly.

## Next Steps (Tasks 2B-2E)

The user wants to go through GSC's "Why pages aren't indexed" report reason-by-reason. The breakdown is:

- **DISCOVERED (236)** — content quality issue. Humanize per 5-gate pipeline. Already running daily.
- **UNKNOWN (152)** — discovery gap. URL Inspection API refresh + sitemap = auto-resolution.
- **EMPTY (128)** — out-of-sitemap ghost URLs. Drop from inspection file (already cleaned Jul 13 + Jul 14).

These three categories don't have a "reason" like 404 in GSC — they're API states, not UI states. The 179 "Not found (404)" the user saw is GSC's sitemap report which is historically lagged.