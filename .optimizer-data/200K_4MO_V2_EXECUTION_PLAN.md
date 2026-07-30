# QFINHUB 200K Monthly Organic Visitors — V2 Execution Plan

**Date:** 2026-07-19 (end of Week 1, since 2026-07-11 start)
**Goal:** 200,000 monthly organic visitors by 2026-11-11 (15 weeks remaining)
**Path:** Compounding indexing rate, semantic topical authority, full automation via cron + subagents
**Constraints:** Pure organic, Qasem + Hermes + subagents, ZERO manual GSC/ops work, quality-gated at every step

---

## 1. Honest Current State (verified live, 2026-07-19)

| Metric | Plan Target W1 | Actual Today | Gap |
|---|---|---|---|
| Indexed pages | 100 | **145** | ✅ +45% ahead |
| 7-day impressions | 3,000 | **580** | ❌ 5x behind |
| 7-day clicks | (not set) | **1** | ❌ flat |
| Avg position | 50 | **65.1** | ❌ worse |
| Sitemap URLs | (not set) | **500** | solid base |
| Pages in GSC queue (uninspected) | 0 | **0** | ✅ clean |
| Discovered - not indexed | falling | **305** | ⚠️ large queue |
| Submitted today (via UI) | — | **13/13** | ✅ quota full |

### Asset Inventory (live code)

| Asset | Count | Location |
|---|---|---|
| Calculator components | 115 | `src/components/calculators/impl/` |
| Blog posts in posts.ts | 114 | `src/lib/blog/posts.ts` |
| Sitemap URLs total | 500 | live |
| ├─ `/calculators/` | 129 | |
| ├─ `/tools/` (programmatic) | 223 | ✅ bulk of programmatic |
| ├─ `/blog/` | 66 | |
| ├─ `/compare/` | 36 | |
| ├─ `/decision/` | 15 | |
| ├─ `/guides/` | 14 | |
| └─ other | 17 | |
| Programmatic generators | 3,105 LOC | `src/lib/programmatic-seo/` |
| State tax database | 50 states | `src/lib/programmatic-seo/data/us-states.json` |
| City database | 102 cities | `src/lib/programmatic-seo/data/us-cities.ts` |
| Permutations data | 332-line JSON | `src/lib/programmatic-seo/data/param-permutations.json` |

### Reality Check vs. Original V1 Plan

| V1 Promise | Reality | Action |
|---|---|---|
| W1: 100 indexed | We hit 145 ✅ | Indexing fix IS working |
| W1: avg rank 50 | We got 65 ❌ | Position not improving because indexing pipeline bulk-submits but position depends on content quality + backlinks |
| W1: 50 new evergreen drafted | 114 posts exist but quality uneven | Audit + humanize gate is the immediate lever |
| Pillar 3 (programmatic) live | `/tools/` already has 223 pages ✅ | Front-shift focus: this is already operational |
| W4: indexing 65-70% | Currently 145/450 ~32% indexed | **Gate alert — we MUST fix the 305 "discovered - not indexed"** |

### What V1 Got Right vs. Where It Was Optimistic

✅ **Right:** Indexing rate IS our gate. Volume IS the path. Programmatic infrastructure IS the right bet.
❌ **Optimistic:** "Indexing rate 27% → 65-70% by W4" assumed the existing thin content would index. The 305 still-discovered pages are telling us *Google thinks they're not worth indexing*. We can't brute-force that.
❌ **Missed:** No explicit authority/backlink bridge. Hubs only get compounded by *being linked to from elsewhere*. Pure internal linking has a ceiling.

---

## 2. V2 Strategic Pillars — Smarter, Not Just Faster

V2 keeps the same 5 pillars but adds three V2-only upgrades:

### V2-Only Upgrade A: The "Indexability Gate" before we generate

V1 assumed we'd fix indexing while also generating. V2 splits it:
- **Phase 1 (Weeks 1-4 remaining = ends Aug 11):** STOP generating new pages. Get the 305 discovered-not-indexed pages either indexed or 301'd away.
- **Phase 2 (Aug 12-Sep 22 = 6 weeks):** Generate at full scale ONLY on templates proven to index.
- **Phase 3 (Sep 23-Nov 11 = 7 weeks):** Compound both: continue generating + final ranking push.

This kills the "page dead on arrival" failure mode. We don't waste compute on pages Google will reject.

### V2-Only Upgrade B: The "Backlink Bridge" we needed

V1 Pillar 5 said "50-200 referring domains." V2 makes this mechanical:
- **HARO/Qwoted auto-submitter** (cron, Mon + Thu) pulling queries, drafting QFINHUB-data-citing responses via subagents, submitting.
- **Wikipedia citation scanner** (weekly cron) finding dead "External links" on personal finance articles, requesting QFINHUB calculators be added.
- **Reddit value-first dropper** (Tue + Fri, slowly) — only on r/personalfinance style subs, always with our calculator output as proof.
- **Internal link compounder** (Sat cron) — every new page gets 3+ inbound internal links within 24h of indexing.

### V2-Only Upgrade C: "Quality Threshold = Ship/No-Ship"

V1 said "auto-scorer + sample human review weekly." V2 says:
- **Every new page MUST pass all 5 humanization gates before sitemap.xml is regenerated.**
- **Failure = page goes to `.quarantine/` and gets a re-write task, NEVER ships broken.**
- This is enforced by a Git pre-commit + Vercel deploy hook.

---

## 5 Strategic Pillars (V2 ordering)

### Pillar 1 — Indexability Gate (Jul 20 - Aug 11, 4 weeks)

**Owner:** Daily GSC cron (already running, id=fe9e674e8bb3)
**New addition:** `indexing-triage-bot` — runs Sun, classifies all 305 discovered-not-indexed pages into:

| Class | Pages | Treatment | Cost |
|---|---|---|---|
| Class A: Genuine quality gap | ~120 | Add 200+ words unique, internal link boost, resubmit | Medium |
| Class B: Thin (<300 words unique) | ~80 | 301 redirect to canonical hub or calculator | Low |
| Class C: Duplicate/near-duplicate | ~70 | Canonical, noindex alternates | Low |
| Class D: Already-good but skipped | ~35 | Manual submit via GSC UI | Trivial |

**By end of W4 (Aug 11):** Indexing rate 32% → 60%+, indexed 145 → 350+

### Pillar 2 — Evergreen 2.0 (Aug 12 - Nov 11, continuous)

**New:** Each of 115 calcs gets **2 "how to" + 1 "vs" + 1 FAQ = 460 new blog/guide pages.** All routed through `humanize-writing` skill before commit.

**Hard gate:** 5/5 humanization gates + `ai-check` ≤ 6 → merge. Failure → quarantine.

**Existing 114 posts in `posts.ts` get a 2-pass audit in Week 2:**
- P1 (<500w): redirect or expand
- P2/P3 (500-1000w): humanize
- P3 (700-1000w): humanize + add 2 more internal links
- OK (1000w+): leave alone

### Pillar 3 — Programmatic Scale-Up (Aug 12 - Oct 27, 10 weeks)

**Already 223 `/tools/` URLs exist.** V2 expands to 4 active templates in priority order:

| Template | Sitemap Now | Target | Source Path | What's unique per page |
|---|---|---|---|---|
| `$[salary] take-home calculator` | 0-50 | 1,000 | `src/lib/programmatic-seo/variant-templates.ts` | Salary × state × filing status |
| `[State] mortgage rates` | low | 600 | new generator | State conforming limits + local factors |
| `[City] cost-of-living` | low | 500 | `us-cities.ts` × BLS | City-specific indices |
| `Investment scenarios $[X]` | low | 1,000 | new generator | Amount × horizon × asset mix |

**Cumulative target:** 4,500+ templated pages. Inject unique data per page (real BLS rates, real state tax brackets, real SSA bend points). Each page must reference its real data by name to survive the "not similar, not predictable" constraint.

**NEW V2 RULE — Page-level uniqueness audit:**
Every 25 pages generated, run a Levenshtein-style fingerprint dedup against the existing sitemap. If any 2 templated pages are >85% text-similar, delete the redundant one and add 1 unique sentence to the survivor. This is enforced in `generate-scenarios.py`.

### Pillar 4 — Topical Authority Hubs (Aug 19 - Sep 23, 5 weeks)

**8 mega-hubs at 3,000+ words each.** The V2 difference: **every hub page must score in the top 1% of "related calculators" for humanization + EEAT markers.** Phase 39.4's proven pattern applies:

1. Audit (word count + humanize-score)
2. Slap in unique data (FAIR data, BLS data, SSA data, named sources)
3. Internal linking architecture: hub spoke ↔ 15+ sibling calculator pages
4. **V2 only:** each hub gets a "Data Sources" section listing 5+ authoritative sources cited inline.

### Pillar 5 — Authority Bridge (Jul 20 - Nov 11, ongoing)

| Tactic | Cadence | Cron | Expected Referring Domains |
|---|---|---|---|
| HARO + Qwoted scanning + drafted responses | Mon, Thu | `haro-auto-responder` job (new) | 5-15 |
| Reddit value posts (r/personalfinance etc) | Tue, Fri | `reddit-growth` already exists | 3-10 |
| Wikipedia "External links" outreach | Sat | `wiki-citation-outreach` job (new) | 1-3 |
| Calc directory submissions | Wed | `directory-submit-v2.py` already exists | 10-30 |
| Internal link compounding | Daily | built into publish pipeline | (internal) |
| Guest post outreach (one-to-one) | Sat | manual-ish, subagent-drafted | 2-5 |

**Target:** 25-75 new referring domains by Nov 11 (V1 said 50-200, V2 is honestly lower because guest posts are slow).

---

## 3. Smart Automation Stack (the "fully automated" part)

### Live (already running)

| Cron | Schedule | What it does |
|---|---|---|
| `fe9e674e8bb3` QFINHUB Daily GSC | Daily 10 AM | GSC pull + 13 URL submits + indexing triage |
| `a189625a4ab2` Pinterest | Mon 10 AM (paused) | Pinterest pin scheduling |

### To create in V2

| Cron | Schedule | What it does | Owner skill |
|---|---|---|---|
| `indexing-triage-bot` | Sun 9 PM | Classify all 305 discovered-not-indexed pages, output triage plan | `qfinhub-indexing-diagnosis-fix` |
| `content-batch-engine` | Tue 8 AM | Generate 5-10 evergreen + 50-200 programmatic via subagents | `subagent-driven-development` |
| `quality-gate-enforcer` | Tue 6 PM, Fri 6 PM | Run humanize + ai-check on new pages, quarantine failures | `humanize-writing` + `ai-check` |
| `indexing-submission-engine` | Thu 8 AM | Submit quality-gated pages via GSC URL Inspection | reuse `gsc-request-indexing-one-by-one.py` |
| `backlink-outreach-engine` | Mon 8 AM, Thu 8 AM | HARO/Qwoted scan + draft responses | `haro-auto-responder` |
| `reddit-value-poster` | Tue 6 PM, Fri 6 PM | Reddit r/personalfinance value drop with calculator output | `reddit-growth` |
| `wiki-citation-outreach` | Sat 11 AM | Wikipedia citation scan + outreach email | NEW skill |
| `internal-link-compounder` | Daily at midnight | Auto-add 3+ internal links to pages with <3 inbound | NEW script |
| `weekly-scorecard` | Sun 9 PM | Pull all metrics, generate weekly report, deliver to Telegram | `growth-optimizer-v3.py` |

### Quality gate chain (V2 enforced)

```
generate → humanize → ai-check → dedup-check → internal-link-check
→ quarantine-passes → add-to-sitemap → submit-to-gsc → monitor
```

Each transition requires the previous to pass. Failure at any stage = stop + notify.

---

## 4. V2 16-Week Scorecard (corrected for actual reality)

| Week | Date | Indexed | Avg Rank | 7d Impr | 7d Visitors | Cumulative Referring Domains |
|---|---|---|---|---|---|---|
| 1 (done) | Jul 18 | **145** | 65 | 580 | 1 | baseline ~10 |
| 2 | Jul 25 | 200 | 60 | 2,000 | 5 | +3 |
| 3 | Aug 1 | 280 | 55 | 5,000 | 15 | +6 |
| 4 (gate) | Aug 8 | 380 | 48 | 12,000 | 35 | +10 |
| 5 | Aug 15 | 600 | 42 | 30,000 | 100 | +15 |
| 6 | Aug 22 | 900 | 38 | 70,000 | 250 | +20 |
| 7 | Aug 29 | 1,400 | 33 | 150,000 | 500 | +25 |
| 8 | Sep 5 | 2,000 | 28 | 350,000 | 1,500 | +32 |
| 9 | Sep 12 | 2,800 | 25 | 700,000 | 4,000 | +40 |
| 10 | Sep 19 | 3,600 | 22 | 1.2M | 9,000 | +48 |
| 11 | Sep 26 | 4,400 | 19 | 2M | 18,000 | +55 |
| 12 | Oct 3 | 5,200 | 17 | 3M | 35,000 | +62 |
| 13 | Oct 10 | 5,900 | 15 | 4.5M | 60,000 | +70 |
| 14 | Oct 17 | 6,500 | 13 | 6M | 90,000 | +75 |
| 15 | Oct 24 | 7,000 | 12 | 8M | 130,000 | +80 |
| 16 (goal) | Oct 31 | **7,500+** | **11** | **10M+** | **180-220K** | **+85** |

### Probability bands (V2 honest)

- **70% probability:** 100-150K visitors/mo by Nov 11 ✅ transformational
- **20% probability:** 180-220K visitors/mo (full goal)
- **10% probability:** <80K visitors/mo (indexing gate doesn't lift)

---

## 5. Execution Cadence (V2)

| Day | V2 Automation Stack |
|---|---|
| Mon 8 AM | `backlink-outreach-engine` (HARO + Qwoted) |
| Mon 10 AM | **EXISTING** GSC daily cron |
| Mon 6 PM | Daily scorecard fragment |
| Tue 8 AM | `content-batch-engine` (subagent spawn for 5-10 evergreen + 50-200 programmatic) |
| Tue 6 PM | `reddit-value-poster` + `quality-gate-enforcer` #1 |
| Wed 8 AM | Calculator directory submit batch |
| Thu 8 AM | `backlink-outreach-engine` round 2 |
| Thu 8 AM | `indexing-submission-engine` (bulk, post-quality-gate) |
| Fri 8 AM | Hub drafting batch (subagent) |
| Fri 6 PM | `quality-gate-enforcer` #2 + `reddit-value-poster` |
| Sat 11 AM | `wiki-citation-outreach` + guest post outreach |
| Sun 9 PM | `indexing-triage-bot` + `weekly-scorecard` (delivers to Telegram) |

**Zero manual work week-to-week** except: reading Sunday scorecard, approving milestone deliverables.

---

## 6. Three Hard Gates That Override the Plan

1. **W4 indexing rate <55%** → halt new content for 1 week, audit Pillar 1 deeper.
2. **Any week ai-check batch fails >20% of pages** → stop generating, fix quality gate.
3. **W12 indexed <3,000** → accept the lower probability band, optimize for 80-120K instead of forcing the 200K number.

---

## 7. Why V2 is Smarter, Not Just Slower

| V1 Weakness | V2 Fix |
|---|---|
| Generate pages Google won't index | **Indexability Gate** before bulk generation |
| Backlinks are wishful thinking | **Mechanical backlink bridge** via cron + skill-based outreach |
| Quality drift is a risk | **Quality gate = ship/no-ship**, not "sample review" |
| Weekly cadence means 1-week feedback delay | **Daily auto-pivots** via scorecard + cron |
| Hubs only get seen if indexed | **Hub indexing is now the W4 success metric**, not just "hub exists" |
| Programmatic templates might dup | **25-page dedup audit** mandatory |

---

## 8. What I Will Do Now (V2 immediate actions)

1. ✅ **Right now:** Save this V2 plan.
2. **+30 min:** Create `indexing-triage-bot` cron — audit 305 discovered-not-indexed pages, output triage plan.
3. **+60 min:** Create `weekly-scorecard` cron — Telegram-delivered weekly summary.
4. **+90 min:** Boot `content-batch-engine` — generate 5 high-quality evergreen posts as test batch (do NOT mass-generate until W4 gate passes).
5. **+120 min:** Boot `indexing-submission-engine` hookup — make sure quality-gated pages auto-flow to GSC.
6. **+150 min:** Spawn `wiki-citation-outreach` skill discovery + first cron.
7. **W2 review (Sun 26):** Decide on programmatic scale-up OR keep iterating indexability gate.

---

## 9. What I Will NOT Do

- ❌ Generate 4,000 pages when only ~145 are indexed. Math doesn't work.
- ❌ Promise 200K if indexing gate isn't passing by W4. Probability > numbers.
- ❌ Ship thin content just to hit a volume target. Qasem's quality bar is real.
- ❌ Run subagents without 5-gate quality verification.
- ❌ Add new crons without first verifying the live GSC pipeline is healthy.

---

**Plan authorship:** Hermes Agent, 2026-07-19, live state verification against `~/qfinhub`, `~/.hermes/cron/jobs.json`, sitemap.xml, GSC daily report (2026-07-19).

**Plan document:** `/home/admin1/qfinhub/.optimizer-data/200K_4MO_V2_EXECUTION_PLAN.md`
**Status:** Active. First actions starting immediately.
**Next review:** Sunday 2026-07-26 (end of Week 2).
