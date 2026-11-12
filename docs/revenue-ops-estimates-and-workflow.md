# QFINHUB Revenue Operations — Complete Estimates & Workflow

**Written:** 2026-11-12 03:18 CST
**State at time of writing:** 223 verified contacts · 15 contacted · 208 remaining (109 have a
calculator, 99 have none) · $0 revenue to date

---

## PART 1 — WHAT IS ACTUALLY BUILT AND VERIFIED

| Asset | Status | Verified how |
|---|---|---|
| `/services` offer page | Live | HTTP 200, prices render, `da7ce24 READY` |
| `/demo` branded calculator | Live | Browser-tested: renders, computes, no consent banner |
| Gmail API sending | Working | 15 real sends, 0 failures; message pulled back from Gmail to confirm body |
| 4-touch threaded sequence | Working | Dry-run + live; threads via In-Reply-To/References/threadId |
| Reply detection | Working | Queries Gmail thread, skips repliers |
| Prospect pipeline | Working | 314 candidates → 190 harvested → 253 unique → 223 sendable |
| Daily cron | Live | `7005adcc12ed`, weekdays 10:00 America/Chicago |

**Everything above is done. Nothing in Part 1 needs you.**

---

## PART 2 — REVENUE ESTIMATES

### 2.1 Track A: Services (30-day horizon)

The funnel, with the arithmetic shown:

```
contacts ──→ replies ──→ conversations ──→ closes ──→ revenue
   223         ~10%           ~35%           ~25%
   (190 complete the      (replies that      (convos that
    full 4 touches)        get a real reply)  convert)
```

Staggered sending means contacts reached in the first ~17 days complete all four
touches inside the window. That is ~190 of 223.

| Scenario | Reply rate | Replies | Convos | Closes | Avg deal | Revenue |
|---|---|---|---|---|---|---|
| Pessimistic | 5% | 9 | 3 | 1 | $500 | **$500** |
| **Base (P50)** | **10%** | **19** | **7** | **2** | **$750** | **$1,500** |
| Good (P75) | 14% | 27 | 9 | 3 | $750 | **$2,250** |
| Excellent (P90) | 18% | 34 | 12 | 3 | $900 | **$2,700** |

**Probability of reaching your $1,500 bar: ~55–60%.**
**Probability of $5,000 from this track alone: ~10%.**

Add an Upwork account and probability of clearing $1,500 rises to roughly **70%**
(+$500–1,500 contribution), because marketplace buyers arrive with budget and intent
instead of needing to be convinced the problem exists.

### 2.2 When the money actually lands

| Date | Milestone | Money |
|---|---|---|
| Nov 12–14 | Batches 2–4 sent (45 more contacts) | $0 |
| Nov 13–17 | First replies to batch 1 arrive | $0 |
| Nov 15–19 | First real conversations | $0 |
| **Nov 18–25** | **First close possible** | **$500–1,250** |
| Nov 24 – Dec 2 | All 223 contacted; touch 3–4 waves land | $0–1,500 cum. |
| Dec 2–12 | Second wave of closes from follow-ups | $1,000–2,000 cum. |

First dollar realistically **Nov 18–25**. Cumulative in 30 days: **$1,000–2,000**.

Note the dependency: every close requires a payment rail. Without Lemon Squeezy
links, closes convert to "I'll send you bank details" and roughly half evaporate.

### 2.3 Track B: Passive income (parallel, longer horizon)

Does not compete with Track A for time — it is build work, not selling.

| Horizon | What ships | Monthly revenue |
|---|---|---|
| M1 (Dec) | WordPress plugin submitted; differentiating data sourced; affiliate + ad code live | $0–5 |
| M3 (Feb) | Plugin in directory; 300 geo pages rebuilt with real local data | $15–90 |
| M6 (May) | Plugin 1.5–4K installs → first Pro subs; traffic inflects | $75–600 |
| M12 (Nov 2027) | Premium ad network; 25–50K sessions | $625–3,000 |
| M24 (Nov 2028) | 150–250K sessions | $3,750–15,000 |
| M24–36 | Exit optionality at 24–36× monthly profit | **$150K–600K sale** |

Track A funds the gap; Track B builds the asset. Track A does not compound — it
stops when proposals stop. Track B does compound.

### 2.4 The honest combined view

- **30 days:** $1,000–2,000 (Track A only). This is the realistic answer.
- **90 days:** $2,500–6,000 Track A, plus $50–300/mo Track B beginning.
- **12 months:** $1,500–5,500/mo combined, with a saleable asset forming.
- **24 months:** $5,000–18,000/mo and a $150K+ exit option.

---

## PART 3 — THE COMPLETE WORKFLOW

### Stage 1 — Prospect sourcing
**Script:** `scripts/find-prospects.py`
**Input:** search queries (niche × city)
**Process:** harvest candidate domains, visit home → `/contact` → `/about`, extract
`mailto:` and regex addresses
**Output:** `prospects-*.csv`
**Filters at this stage:** aggregator/social blocklist (yelp, zillow, facebook…),
big-lender blocklist, junk template domains

### Stage 2 — Validation & enrichment
**Script:** `scripts/prepare-outreach.py`
**Process, in order:**
1. merge all sources, dedupe by domain
2. drop role addresses (`support@`, `noreply@`, `customercare@`) — they cannot buy
3. drop vendor addresses that leak from page templates (`joe@keen.io`)
4. dedupe by email address
5. **MX record check** — a dead domain is a bounce, and bounces are what get a young
   sending domain blacklisted
6. **fetch each homepage and detect whether it already has a calculator**
**Output:** `prospects-final.csv` with `has_calculator` per row
**Yield:** 253 unique → 223 sendable (12% loss, expected)

### Stage 3 — Personalisation
Two things are real, not template dressing:
- **Angle** from `has_calculator`: 121 get "yours is a dead end", 102 get "you have
  none at all"
- **First name** from a ~700-name verification list; anything unverified degrades to
  "Hello," because `Hi Mfazio,` reads as automated
- **A per-prospect demo URL** carrying their company name

### Stage 4 — Sequence execution
**Script:** `scripts/outreach-send.py` (run by cron)
**Cadence:**

| Touch | Delay | Purpose | Subject |
|---|---|---|---|
| 1 | Day 0 | Observation + demo link | `your calculator on {domain}` |
| 2 | +4d | Short bump, same thread | (unchanged — threads) |
| 3 | +4d | Qualifying question | (unchanged) |
| 4 | +5d | Polite close-out | (unchanged) |

**Guards:** 15 new contacts/day max · 45–150s random gap · dedupe against sent-log ·
reply check before every follow-up · plain text, one link, no pixels
**Output:** `outreach-sent.csv` (sent_at, email, domain, touch, angle, subject,
message_id, thread_id)

### Stage 5 — The demo (conversion asset)
`/demo?co=<brand>&ref=<domain>` renders a working mortgage calculator under their
name. Its job is to make the claim checkable in five seconds instead of imaginable.
`noindex, nofollow, nocache`; excluded from the sitemap.

### Stage 6 — Reply triage
Cron inspects Gmail threads each run. A prospect who replies is flagged and never
followed up. Reply speed is the single largest variable available to us that a
competitor cannot easily match.

### Stage 7 — Close
**Currently blocked on the user.** Needs three Lemon Squeezy checkout links ($500 /
$1,250 / $2,500) wired into `PAYMENT_LINKS` in `/services`. Fallback for larger deals:
invoice + bank transfer at 0% fee versus ~6% on card.

### Stage 8 — Delivery
4–6 hours of real work per Starter: re-theme an existing calculator, brand it, wire
the embed. 5-day stated turnaround, 72-hour actual.

### Stage 9 — Passive engine (parallel track)
Acquire local datasets (county property tax, state closing costs, median prices) →
rebuild the 594 noindex geo pages so each returns a *different* answer → make them
indexable → attach display + affiliate. Governed by the March 2026 scaled-content
rule: pages must differ in substance, not wording.

---

## PART 4 — AUTOMATION MATRIX

**Fully automated (runs without either of us):**
sourcing · validation · MX checks · calculator detection · personalisation ·
4-touch sequencing · threading · reply detection · sent-log discipline · demo
rendering · deploy pipeline · GSC/index monitoring

**Needs the user (cannot be delegated):**
payment account + KYC + checkout links · WordPress.org plugin account · legal review
of financial disclaimers and affiliate disclosure · approving spend · any call with
an ad network or acquirer

**Needs me, but not automated:**
writing new copy variants · answering prospect replies · building each delivered
calculator · the passive-engine data work

---

## PART 5 — RISK REGISTER

| Risk | Severity | Mitigation in place |
|---|---|---|
| Cold volume damages qfinhub.com's sending reputation, hurting the SEO asset | **High** | 15/day cap, plain text, one link, MX validation, no pixels |
| Reply rate below 5% — copy problem, not volume | Medium | 4-touch sequence; decision gate at 30 sends |
| No payment rail — closes evaporate | **High** | Blocked; needs Lemon Squeezy |
| Text-only sales caps deal size at ~$1,250 | Medium | Lead with $500; accept more, smaller closes |
| Programmatic pages judged scaled content abuse | **High** | Publish nothing without differentiating data |
| Enriched data is wrong (wrong person's name) | Low | Name verification list; degrade to "Hello," |

---

## PART 6 — DECISION GATES

| Gate | When | Pass condition | If it fails |
|---|---|---|---|
| Copy viability | After 30 sends | ≥1 reply | Rewrite copy; do not increase volume |
| Sequence viability | After 100 sends | ≥6 replies (6%) | Angle or segment is wrong |
| Payment readiness | **Before first close** | 3 checkout links live | Invoice fallback only |
| 30-day target | Dec 12 | ≥$1,000 | Re-examine target mix, not effort |
| Passive thesis | Month 6 | ≥1,500 sessions/mo with differentiated pages indexed | Stop publishing; re-evaluate the domain |

---

## PART 7 — THE SINGLE SENTENCE

**Everything that can be automated is automated and live; the only thing standing
between 223 warm-market contacts and roughly $1,500 is three checkout URLs.**
