# Week 1 Action Checklist — 200K/4mo Plan

**Week:** 2026-07-11 to 2026-07-17
**Theme:** Foundation + Indexing Acceleration
**Goal:** Reach 100 indexed pages (27% → 37% indexing rate) + start first content batch

---

## Daily Actions

### Monday (Jul 11) — Setup
- [x] Generate 16-week execution plan (DONE — see ~/.optimizer-data/200K_4MO_EXECUTION_PLAN.md)
- [x] Save plan as persistent skill (DONE — ~/.hermes/skills/qfinhub-200k-4mo-plan/)
- [x] Update memory with plan status (DONE)
- [ ] Pull live indexing state via GSC URL Inspection API
- [ ] Generate priority queue (139 discovered + 58 unknown = 197 pages to action)
- [ ] Set up weekly metrics tracking spreadsheet

### Tuesday (Jul 12) — Content Generation Kickoff
- [ ] Launch subagent swarm to draft 50 evergreen "how to" guides
  - Each guide: 1,500+ words, hits 5 quality gates
  - Targets high-rank-fast queries from Phase 39 snapshot
- [ ] First batch: top 10 highest-impression calculators × 1 "how to" = 10 guides

### Wednesday (Jul 13) — Quality Gate
- [ ] Run auto-scorer on all 10 guides (must all pass 5 gates)
- [ ] Patch files with corrections for any failures
- [ ] Sample human review on 2 guides

### Thursday (Jul 14) — Indexing Submission
- [ ] Submit first 10 guides to GSC URL Inspection API
- [ ] Also re-submit top 50 indexed PASS pages (refresh crawl signal)
- [ ] Verify sitemap includes all new URLs

### Friday (Jul 15) — Backlink Kickoff
- [ ] Identify 5 finance subreddits where calculators add value
- [ ] Draft 5 helpful calculator-share posts (value-first, not spammy)
- [ ] Identify 20 Wikipedia pages with broken/dead calculator links → outreach

### Saturday (Jul 16) — Internal Linking
- [ ] Update homepage with new top calculators + new "how to" guides
- [ ] Cross-link all 10 new guides to existing calculator pages
- [ ] Update HTML sitemap with new URLs

### Sunday (Jul 17) — Weekly Review
- [ ] Pull GSC data for Week 1 metrics
- [ ] Compare actual vs target scorecard
- [ ] Adjust Week 2 plan based on results
- [ ] Update ~/.optimizer-data/200K_4_WEEKLY_LOG.md

---

## Success Metrics for Week 1

| Metric | Target | Source |
|---|---|---|
| New pages published | 10+ | content batch |
| Quality gate pass rate | 100% | auto-scorer |
| Indexed pages (start → end) | 74 → 100+ | GSC URL Inspection |
| Indexing rate | 27% → 37%+ | derived |
| GSC daily impressions | 65 → 150+ | GSC pipeline |
| Backlinks started | 5 outreach + 5 Reddit posts | manual |

## Risk Flags for Week 1

- IF indexing rate doesn't improve 5%+ by Friday → escalate (look at quality issues)
- IF guides fail quality gate → retry with stricter prompt
- IF GSC pipeline fails → fall back to manual URL Inspection
