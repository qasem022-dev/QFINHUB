# Week 1 Priority Indexing Queue — Refreshed 2026-07-11

## Current State (Live GSC, 7-day window Jul 2-8)

| Metric | Jul 4 | Jul 11 | Trend |
|---|---|---|---|
| Pages w/ impressions | 74 | **42** | ⬇️ -43% |
| Impressions (7d) | 1,828/28d | **439** | ⬇️ -76% |
| Clicks | 2 | **0** | ⬇️ -100% |
| Avg position | 59.4 | **63.2** | ⬇️ worse |
| Sitemap URLs | 526 | **534** | ⬆️ +8 |

## Indexing Bottleneck (Diagnosis)

- **Indexed (verified by GSC):** 74 URLs
- **Discovered by Google, not yet indexed:** 139 URLs  ← **THIS IS THE OPPORTUNITY**
- **Unknown to Google:** 58 URLs (not in crawl queue)
- **Uninspected:** 33 URLs

## Refreshed Priority Queue

| Tier | Count | Submit Order | Method |
|---|---|---|---|
| Tier 1 — Parent calculators (DNI) | 64 | Days 1-3 | Indexing API |
| Tier 2 — Phase 39 fresh content (DNI) | 0 | Days 1-2 (priority!) | Indexing API |
| Tier 3 — Tool variants restored Jul 4 | 0 | Days 4-7 | Natural crawl |
| Tier 4 — Other blog/static | 75 | Week 2 | Natural crawl |

**Total priority for direct submission: 64 URLs**

## Why Tier 2 First

Phase 39.2 (10 humanized calculators, commit ad70295) + Phase 39.3 (8 evergreen hubs, commit 40dfbdb) just deployed. These are:
- **Highest quality** on the site (passed all 5 humanization gates)
- **Fresh crawl signals** (new deploys trigger re-crawl)
- **Strongest internal linking** (each hub links to multiple calcs)
- **Best chance of fast indexing**

If we get Phase 39 content indexed + ranking in 2-3 weeks, those 18 pages could drive the next 1,000-5,000 impressions/mo — which is the floor of what's needed to reach 200K.

## Submission Strategy

1. **Tier 2 first** (18 URLs) — Indexing API notify
2. **Tier 1 calculator batch** (50/day over 1 days)
3. **Tier 3 tool variants** — let Jul 4 sitemap fix work, only push if not recovered in 14 days
4. **Tier 4** — Week 2 batch

## Blockers

- OAuth indexing token (~/.hermes/google-indexing-token.json) likely expired → need refresh
- Service Account works for GSC Search Analytics, but Indexing API requires user OAuth
- Workaround: use CloakBrowser automation via `safe-gsc-ui-indexing-queue.py` (already exists)
