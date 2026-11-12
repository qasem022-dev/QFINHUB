# $5,000 from QFINHUB.com in 30 Days — Complete Plan

**Prepared:** Nov 12, 2026
**Starting state:** $0 revenue, ~1 organic session/month, 4,889 impressions/28d, 64 of 405 audited URLs indexed

---

## 1. Reality check (read this first)

$5,000 in 30 days from **attention** (ads, affiliate, leads) is arithmetically impossible
from the current position. Not "hard" — impossible.

| Path | Rate used | Required | Site has |
|---|---|---|---|
| Display ads | $20 RPM | 250,000 pageviews/mo | ~1 session |
| Display ads (best case) | $80 RPM | 62,500 pageviews/mo | ~1 session |
| Affiliate | $3.30 EPC | 1,515 clicks/mo | 1 click/28d |
| Lead gen | $74 CPL | 68 leads ≈ 2,703 high-intent visits | ~0 |

**Why ads specifically cannot work yet:**
- Adsterra native banner pays $2.50–3.60 CPM, popunder $1.00–4.00 CPM (affmaven 2026 benchmarks)
- Premium finance networks pay far more but gate access: Raptive needs 25,000 pageviews/mo, Mediavine "Journey" needs 1,000 Tier-1 sessions
- The site is below every threshold, so even a perfect ad setup earns ~$0

**Search reality:** 4,889 impressions at average position ~40–50 produces ~1 click.
Position 40 is page 4. Pages on page 4 functionally earn nothing regardless of monetization.

**Conclusion:** the $5,000 must come from **selling capability**, not attention.
QFINHUB already owns the capability: 129 production financial calculators in
Next.js 16, embeddable widgets, and a working calc engine. That is a sellable
asset today, with zero traffic dependency.

---

## 2. The two-track architecture

**Track A — Cash in 30 days (services).** Sell custom calculator builds and
white-label licensing to businesses that need lead-generating calculators.
Target: $5,000 from 2–6 clients.

**Track B — Compounding (the asset).** Fix monetization infrastructure and
indexing so the organic traffic that eventually arrives converts. This pays in
month 4–6, not month 1. Do it in parallel because it is cheap, not because it
will hit the 30-day target.

Every hour spent on Track B in week 1 expecting cash is an hour that does not
produce the $5,000. Sequence accordingly.

---

## 3. Track A — Offer, pricing, positioning

### The offer
"Production-grade financial calculators that capture leads."
Not "web development." The buyer is a mortgage broker, credit union, fintech
content site, real-estate agency, or SaaS with a lead-gen calculator gap.

### Packaging (fixed scope beats hourly)

| Package | Price | Deliverable | Turnaround |
|---|---|---|---|
| **Starter** | $500 | 1 calculator, branded, embeddable, 1 revision | 5 days |
| **Professional** | $1,250 | 3-calculator suite, embed widget, lead-capture form, 2 revisions | 10 days |
| **Custom** | $2,500+ | Full white-label suite, API feed, unlimited revisions, 30-day support | 3 weeks |
| **License** | $499 setup + $149/mo | Hosted white-label widget, updates included | 5 days |

Market anchors that justify these prices:
- Fiverr mortgage-calculator gigs: $100–500 (commodity, single calc, no branding)
- Agency bespoke calculators: $13,000–25,000 (rapidevelopers white-label benchmark)
- QFINHUB sits in the gap: agency quality at 5–10% of agency price, delivered fast

### Revenue mixes that hit $5,000
- 4 × Professional ($1,250) — **primary target**
- 2 × Custom ($2,500)
- 10 × Starter ($500)
- Mix: 2 Professional + 1 Custom + 2 Starter = $5,000

### Proof asset (build in days 1–2)
A single landing page — `/services` — containing:
1. Three live embedded calculators (they already work)
2. Before/after: "129 calculators built, 0.3s TTFB, 100 Lighthouse"
3. Fixed price table (above)
4. 3-minute Loom-style screen recording of a calculator being customized
5. Stripe payment link for Starter (removes the "how do I pay" friction)

No portfolio theatre. Buyers want to see a working calculator and a price.

---

## 4. Track A — Channels (compliant with stated constraints)

**Excluded by standing policy:** cold mass-email (freeze since 2026-06-12),
Reddit, HARO, PR, sponsorships, paid ads.

Available and inbound in nature:

1. **Upwork** (primary) — search "mortgage calculator", "financial calculator
   development", "calculator widget". These are posted by buyers with budget.
   Proposal = link to a live comparable calculator + fixed price. Bid 5–8/day.
2. **Fiverr** (secondary) — list Starter, Professional, License as three gigs.
   Fiverr demand exists at $100–500; position at $500 with "129 calculators built"
   as differentiator.
3. **LinkedIn** — not cold email. Post the calculator work publicly; respond in
   mortgage/fintech groups. Direct messages only to inbound interest.
4. **Existing calculator pages as inbound** — add a footer line on the top
   calculators: "Need this calculator on your site? →" to `/services`.
   Self-serve, no outreach.
5. **Job-board replies** — Indeed/Upwork "calculator" contract postings.

**Expected funnel:** 150 proposals → 15 replies → 6 calls → 4 closes.
That is the 4 × $1,250.

---

## 5. Track B — Infrastructure fixes (parallel, low effort)

### B1. Fix the ad stack (currently earns $0 and is misconfigured)
- `src/components/ads/adsterra-banner.tsx` points at dead publisher **pl29448163**.
  Real publisher is **pl3293366** with zones: Native Banner 29347664,
  Popunder 31017074, Smartlink 31017075.
- Needs correct zone invoke keys from the Adsterra dashboard (ad-unit level), then
  redeploy. Expected revenue at current traffic: **$0**. This is a prerequisite for
  month 4+, not a 30-day earner.
- Verify `/ads.txt` lists the correct publisher line.

### B2. Affiliate layer (only where intent is transactional)
Attach offers only to high-intent calculators, and only where the calculator's
output naturally leads to a product:

| Page | Impressions/28d | Appropriate offer class |
|---|---|---|
| /calculators/tax-calculator | 2,860 | tax software |
| /calculators/debt-payoff | 576 | debt consolidation / personal loan |
| /calculators/investment-return | 360 | brokerage account |
| /calculators/mortgage-affordability | 99 | mortgage rate quote |
| /calculators/loan-calculator | 90 | personal loan |

Finance CPL benchmark: $74.44 median (search, finance & insurance); mortgage and
wealth leads run $80–300. Even at 1 click/month this earns ~$0 now — build it so
it is ready when indexing recovers.

Network choice, in order: CJ/Impact (Chase, card issuers), MaxBounty (loans,
insurance), Perform[cb] (insurance pay-per-call). Apply when there is traffic to
show; most require site review.

### B3. Indexing recovery (already in motion)
Sitemap now serves 311 clean URLs; Google was force-resubmitted. Expect
"Discovered – not indexed" to fall over 2–6 weeks. Do not spend 30-day cash
effort here.

---

## 6. The 30-day schedule

### Week 1 — Productize and open channels (days 1–7)
| Day | Action | Output |
|---|---|---|
| 1 | Write `/services` page: 3 packages, prices, live embeds | Landing page live |
| 1 | Stripe payment links for Starter + Professional | Checkout works |
| 2 | Record 3-min customization demo | Proof asset |
| 2 | Fiverr: create 3 gigs | Listings live |
| 3 | Upwork profile + 8 proposals/day begins | 8 bids sent |
| 3 | Add "Need this on your site?" CTA to top 20 calculators by impressions | Inbound path |
| 4 | Direct LinkedIn presence; join 5 mortgage/fintech groups | Distribution |
| 5 | First 2 discovery calls booked | Pipeline |
| 6–7 | Deliver first Starter if sold; continue 8 bids/day | $0–500 |

**Week 1 target: $0–500, 40+ proposals sent, 2+ calls booked.**

### Week 2 — Convert (days 8–14)
- 8 proposals/day (56/week)
- Close 1–2 Professional ($1,250–2,500)
- Deliver Starter within 5 days to earn reviews
- Systematize delivery: reuse the 129 calc engine, brand + skin + embed

**Cumulative target: $1,250–2,500.**

### Week 3 — Scale the motion (days 15–21)
- 8 proposals/day
- Close 2 more Professional; upsell License ($499 + $149/mo)
- Ask every delivered client for a testimonial + referral
- Add second Fiverr gig tier to capture lower budgets

**Cumulative target: $3,500–4,500.**

### Week 4 — Close the gap (days 22–30)
- 8 proposals/day
- One Custom ($2,500) or two Professional to clear $5,000
- Offer "rush delivery" premium (+30%) to week-4 buyers
- Convert one client to License for recurring revenue

**Cumulative target: $5,000+.**

---

## 7. Delivery system (must be defined before selling)

Do not sell capacity that does not exist. The delivery loop:

1. **Day 1** — Brand tokens: colors, logo, font from client
2. **Day 2–3** — Clone closest existing calculator from `src/components/calculators/impl/`,
   re-theme, adjust formulas to their product terms
3. **Day 4** — Embed build (`/widgets/embed/[slug]` pattern already exists), responsive test
4. **Day 5** — Hand off: iframe snippet + Next.js component + 1 revision round
5. **Day 6–10** — Professional tier adds 2 more calculators + lead-capture POST

Reusable assets that make this fast: 129 calculators, `CalculatorLayout`,
`CalculatorInput`, `CalculatorChart`, embed route, Vercel deploy pipeline.
A Starter build is 4–6 hours of real work. Margin is the point.

---

## 8. Risks and mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Upwork proposals ignored (no reviews yet) | High | Lead with live calculator link + fixed price; start at $500 to buy first 3 reviews |
| Client wants scope beyond fixed package | Medium | Written scope in proposal; revisions capped; overage billed hourly |
| Cash arrives late (net-30 clients) | Medium | Stripe upfront for Starter/Professional; milestones for Custom |
| 30-day target missed | Medium | Fallback ladder below |
| Cannibalizing focus from SEO | Medium | Track B capped at 2 hours/week |

### Fallback ladder if week 2 closes nothing
1. Drop Starter to $299 to buy 3 reviews fast (units, not margin)
2. List on Fiverr with "Express 48h delivery" — the one lever marketplaces reward
3. Sell the calculator source pack ($299 × 17 = $5,000) on Gumroad as a
   stopgap product; the codebase already exists
4. Licensing pitch to 20 fintech blogs with a free 14-day hosted trial

---

## 9. Metrics and decision gates

Track daily: proposals sent, replies, calls, closes, cash collected.

**Gate 1 (day 7):** if <25 proposals sent → channel problem, fix volume.
**Gate 2 (day 14):** if 0 closes from 80+ proposals → offer/price problem,
drop Starter to $299 and re-test.
**Gate 3 (day 21):** if <$2,500 collected → activate fallback ladder and focus
on the single highest-converting channel only.

---

## 10. What this means for the 200K-visitor goal

The $5,000 plan and the 200K plan are different engines and must not be conflated.

- **Services revenue scales with proposals sent**, not traffic. It is labor-bound
  and does not compound.
- **The site scales with indexed pages × position × RPM.** At 200,000 monthly
  visitors and a $25 RPM, display + affiliate revenue is ~$5,000/month —
  recurring, and requiring no proposals.

So: use Track A to fund the next 6 months of the site, and keep Track B running
because that is where the durable $5,000/month lives. If only one can be
prioritized after day 30, prioritize whatever converts fastest now and protect
the indexing work from being neglected.

---

## 11. Immediate 72-hour checklist

- [ ] `/services` page written and deployed with 3 packages and prices
- [ ] Stripe payment links live
- [ ] 3 Fiverr gigs published
- [ ] Upwork profile complete, 24 proposals sent
- [ ] "Need this calculator?" CTA on top 20 calculator pages
- [ ] Adsterra publisher ID corrected (pl29448163 → pl3293366) pending zone keys
- [ ] Top 5 impression pages audited for position-40 → position-10 opportunities
