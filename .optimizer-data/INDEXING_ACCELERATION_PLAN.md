# Indexing Acceleration Plan — 427 URLs
**Date:** 2026-07-12 (Day 2 of 200K plan)
**Owner:** Hermes
**Goal:** Move 427 "Discovered/Unknown" URLs → "Indexed" within 14 days

## Current State (post-cleanup)

| GSC Coverage State | Count | Meaning |
|---|---|---|
| Submitted and indexed | ~92 | Live in Google ✅ |
| Indexed, not submitted in sitemap | ~12 | Need to add to sitemap ✅ (done) |
| **Discovered - currently not indexed** | **189** | Google found URL but won't crawl yet |
| **UNKNOWN** | **127** | Data unclear, usually also crawl-pending |
| **URL is unknown to Google** | **119** | Google hasn't seen this URL yet |
| Duplicate, Google chose different canonical | 1 | Fixed in last commit |

**Total not-indexed in sitemap: 437** → **427 actionable** (rest are top-level pages that need natural crawl)

## Why These Aren't Indexed

Three reasons Google hasn't indexed these URLs (in order of likelihood):

### 1. 🔴 Google's crawl budget is exhausted (most likely)
- QFINHUB is a 6-month-old domain with limited crawl budget
- Google allocates crawl budget based on perceived quality + link signals
- 437 unindexed URLs × Google's crawl rate = multi-week backlog
- **Fix:** Active URL Inspection API submissions bypass crawl budget

### 2. 🟡 Low internal link equity (likely)
- Tools parametric variants (`/tools/investment-1k-5yr` etc.) have FEW internal links pointing to them
- Google treats pages with few internal links as lower priority
- **Fix:** Add internal links from indexed T1 calc pages

### 3. 🟢 Quality gate (less likely, already mostly addressed)
- Google may be evaluating content quality before indexing
- Most pages already pass quality bar (Phase 39.2-39.4)
- **Fix:** Continue humanization, ensure no thin content

## The 4-Step Acceleration Plan

### Step 1 — Submit via URL Inspection API (Service Account)
**Why:** Service Account JWT auth verified working. URL Inspection API gives Google a "request to crawl this URL" signal that bypasses crawl budget limits.

**Approach:**
- Batch submit 100 URLs/day (within API limits)
- Prioritize pages with highest traffic potential first
- Track submissions in proof-ledger (avoid duplicate submissions)

**Priority order (P1 first):**

| Priority | URL Type | Count | Reasoning |
|---|---|---|---|
| P1 | Core calculators (basic-calculator, simple-interest, etc.) | ~30 | High search volume, monetize via AdSense |
| P1 | High-intent blog posts (retirement, mortgage, tax) | ~30 | Long-tail traffic |
| P2 | Compare pages | ~32 | Long-tail comparison queries |
| P2 | Decision pages | ~13 | YMYL financial decisions |
| P2 | Tools parametric (investment-Xk-Yyr) | ~50 | Many long-tail variants |
| P3 | Guides, loan-scenarios | ~8 | Lower traffic, still valuable |
| P3 | Static pages (privacy, about, terms) | ~10 | Always-needed trust signals |

**Total: 173 P1+P2 URLs** to submit in Week 1, then P3 in Week 2.

### Step 2 — Internal Link Boost
**Why:** Pages with many internal links from indexed pages get crawled faster (Google follows links).

**Approach:**
- For each unindexed URL, add 2-3 internal links from:
  - Homepage (if high-value calculator)
  - Same-category T1 indexed calculators
  - Hub pages (Phase 39.3)
  - Related blog posts

**Example:**
- `/calculators/markup-calculator` (unindexed)
- Add link from `/calculators/margin-calculator` (indexed) "Related Calculators" section
- Add link from `/calculators/operating-margin` (indexed)
- Add link from `/calculators/cost-of-goods-sold` if it exists

### Step 3 — Sitemap Priority Bump
**Why:** Higher priority values in sitemap.xml signal Google to crawl these first.

**Approach:**
- Change priority from `0.6` → `0.8` for P1+P2 unindexed URLs
- Change changeFrequency from `monthly` → `weekly` for unindexed URLs (signals freshness)
- Update lastmod to current date (signals "fresh content")

### Step 4 — Daily Indexing Cron
**Why:** Submitting 100 URLs/day vs 13 = 7x faster indexing

**Approach:**
- Create new cron `qfinhub-indexing-accelerator`
- Runs at 11 AM daily (after GSC daily pipeline at 10 AM)
- Submits top 100 unindexed URLs via Service Account JWT
- Skips URLs already submitted in last 7 days
- Logs to `.optimizer-data/indexing-acceleration-log.json`

## Expected Outcomes

| Time | Indexed Count | Status |
|---|---|---|
| Now (Day 2) | 92 | Baseline |
| Day 9 (W1 end) | 150-200 | +60-100 from acceleration |
| Day 16 (W2 end) | 250-350 | +100-150 more |
| Day 23 (W3 end) | 400-500 | Most sitemap URLs indexed |

## Why This Will Work

1. **Service Account is permanent** — no OAuth refresh death, runs forever
2. **URL Inspection API is faster than UI** — bypasses 13/day UI limit
3. **Combined with sitemap cleanup** — cleaner signals = better Google trust
4. **Combined with internal linking** — link equity = priority
5. **Aligned with crawl recovery window** — Jul 4 fix is in Google's 7-14 day cycle

## What Could Go Wrong

| Risk | Mitigation |
|---|---|
| Google rate-limits API submissions | 100/day max, distributed over 24 hours |
| API returns 429 (too many requests) | Reduce to 50/day, retry next day |
| URLs already submitted get re-submitted | Track in proof-ledger, skip if submitted in last 7 days |
| Quality gate issues block indexing | Already addressed in Phase 39.2-39.4 |

## Files to Create/Modify

1. `scripts/indexing-accelerator.py` — Daily URL submission script
2. `scripts/internal-link-audit.py` — Find internal link opportunities
3. `src/app/sitemap.ts` — Priority bumps for unindexed URLs
4. `scripts/internal-link-injector.py` — Add links from indexed T1 to unindexed URLs
5. Cron job: `qfinhub-indexing-accelerator` — Daily at 11 AM

## Workflow

```
Day 2 (today, Jul 12):
  1. Build scripts/indexing-accelerator.py
  2. Submit top 50 priority URLs via Service Account
  3. Run internal link audit
  4. Add internal links to unindexed URLs from indexed T1 calcs

Day 3-9 (Jul 13-19, W1 remainder):
  - Submit 50 URLs/day via Service Account
  - Monitor indexing progress daily
  - Add internal links as new unindexed URLs are discovered

Day 10-14 (W2):
  - Continue daily submissions
  - Bump sitemap priorities for any still-not-indexed URLs
  - Re-audit internal links
```
