# QFINHUB Backlink Strategy — Phase 41 (revised, reality-based)

**Generated:** 2026-07-28
**Replaces:** Phase 24-27 cold email outreach (proven 0% conversion, 70 emails / 0 replies)
**Status:** Honest assessment — directories are largely dead, broken-link + data-asset are the wins

## What Has Actually Been Tried (audit from .optimizer-data)

| Channel | Volume | Result | Why It Failed |
|---|---|---|---|
| Cold email to finance bloggers (May 14–20) | 70 emails | **0 replies, 0 backlinks** | Wrong targets (NerdWallet, Mint, YNAB never embed), mismatched offers, zero personalization, broken embeds (X-Frame-Options: DENY) |
| HARO automated | Ongoing | Drafts only, **0 sends** since June 12 freeze |
| CloakBrowser contact-form automation | 3 attempts | 0 successful | Cloudflare WAF blocks datacenter IP regardless of browser fingerprint |
| Reddit karma builder | Active | **1 karma total** — non-viable for posting (need 10+ for most subs) |
| Generic widget outreach | N/A | **FROZEN** since June 12 — channel not proven |
| Free AI/tool directories | Tested 20 | **1 with public form** (topaitools.com) | Most block bots (403/308/404) or require login |

## The 4 Channels That Can Actually Work

### Channel 1: Manual Broken-Link Outreach (proven technique, conversion 5-10%)
**Why it works:** The pitch is "your link is broken, here's a working replacement" — a favor, not a sales pitch. This is the highest-converting link-building technique in SEO.

**Action plan:**
- 20 prospects already identified in `.optimizer-data/broken-calculator-replacement-prospects.json`
- For each prospect:
  1. Verify the broken link still 404s (curl + Wayback Machine)
  2. Find the page author's email (page footer, Hunter.io, or About page)
  3. Send a 3-sentence personalized email

**Sample pitch (broken-link replacement):**
```
Subject: Quick heads-up — your mortgage calculator link 404s

Hi [Name],

I noticed your [page title] links to [dinkytown.net/mortgage-calculator], 
which appears to be returning a 404 since their domain restructure.

I'm with QFINHUB (qfinhub.com/calculators/mortgage-calculator) — we built 
a free, no-signup replacement that does the same thing plus responsive 
mobile support.

Either way, you may want to swap the link. No obligation.

— Qasem
```

**Expected yield:** 5-15 backlinks from 50 personalized emails sent over 30-60 days.

**Time per prospect:** 10-15 minutes (verify broken + find email + send). 50 prospects = 12 hours of focused work.

**Important:** This CANNOT be automated. Manual, personalized, one-at-a-time.

### Channel 2: HARO Manual Drafts (high-value when replies land)
**Current state:** Drafts auto-generated daily, sitting in `.optimizer-data/` waiting for manual review.

**Action plan:**
- Review HARO drafts weekly
- Send 2-3 highest-quality responses per week
- Track which topics perform

**Expected yield:** 1-3 backlinks/month from journalist pickups (HARO gets 5-15% reply rate when well-targeted).

**Time per send:** 5-10 minutes. 2-3 sends/week = ~30 min/week.

### Channel 3: Profile/Authority Backlinks (no outreach needed)
Free profile creation on platforms that allow site URLs in profile.

**Targets (free signup, dofollow or whitelisted):**
1. **Gravatar** — link from avatar used on WordPress comments worldwide
2. **About.me** — personal profile page
3. **Crunchbase** — company profile (DR 90+)
4. **AngelList/Wellfound** — startup profile
5. **ProductHunt Maker Profile** — already have profile
6. **GitHub org** — qfinhub/qfinhub or personal account
7. **LinkedIn Company Page** — qfinhub (already exists)
8. **Trustpilot** — company review page
9. **G2 Company Profile** — free tier
10. **Capterra** — free vendor profile

**Expected yield:** 10-20 profile backlinks over 30 days.

**Time per profile:** 5-15 minutes (signup + verify + add URL). 10 profiles = 2-3 hours.

### Channel 4: Original Research Data Asset (exponential channel)
Build ONE citable data asset that journalists/bloggers link to. This is the only channel that can produce 100+ backlinks from a single effort.

**Concept:** "QFINHUB Personal Finance Index 2026"
- Aggregate publicly available data (FRED, BLS, IRS SOI, Census)
- Produce original analysis (savings rates by income quintile, debt-to-income trends, mortgage affordability indices)
- Publish as a research report with downloadable CSV
- Submit to journalists via email (linkable as "according to QFINHUB data...")
- Wikipedia editors can cite it for finance statistics

**Why this works:**
- Journalists need citations
- Wikipedia needs citable sources for finance statistics
- Bloggers need data to back up claims
- Each citation = 1 backlink

**Expected yield:** 20-100+ backlinks over 12 months. ONE good asset can produce more backlinks than 1000 cold emails.

**Time to build:** 8-15 hours of data work + report writing.

## Priority & Sequence (4-month timeline)

| Week | Action | Expected Output |
|---|---|---|
| **Week 1** | Verify 10 broken-link prospects, send 10 personalized emails | 1-3 backlinks |
| **Week 1-2** | Sign up for 10 profile platforms with site URLs | 10-20 backlinks |
| **Week 2-4** | Continue broken-link outreach to next 20 prospects | 3-8 backlinks |
| **Week 4-8** | Build QFINHUB Personal Finance Index data asset | Asset published |
| **Week 8-16** | Submit data asset to journalists + Wikipedia editors | 5-30 backlinks |
| **Ongoing** | Weekly HARO manual review (2-3 sends/week) | 8-12 backlinks/month |

**Conservative 4-month total:** 30-60 new referring domains
**Aggressive (if data asset catches on):** 100-200+ new referring domains

This moves qfinhub from "0 backlinks" to "real site with authority." Combined with the 16 cluster pages + 2 editorial posts already shipped, this puts 200K/month within reach for the *first half* of the goal.

## What NOT To Do (proven dead channels)

- ❌ **Generic widget outreach** — proven 0% conversion, frozen since June 12
- ❌ **Auto directory submissions** — 95%+ of "AI directories" block bots or require login
- ❌ **CloakBrowser contact-form spam** — Cloudflare blocks datacenter IP
- ❌ **HARO auto-send** — manual review required (draft-only policy since June 5)
- ❌ **Mass personalized-but-template email** — filters still catch templated mass mail

## What This Strategy Costs

- **Money:** $0 (all free tools, free platform signups, free broken-link search)
- **Time:** ~30 hours over 4 months (2 hours/week)
- **Tools needed:** Hunter.io free tier (50 email credits), Wayback Machine (free), no paid SEO tools required

## Success Metrics

- Week 1: 10+ profile backlinks created, 10 broken-link emails sent
- Month 1: 20-30 new referring domains
- Month 2: 40-50 new referring domains + data asset published
- Month 3: 50-80 new referring domains
- Month 4: 80-150 new referring domains

If by Month 2 we're below 20 new domains, pivot the approach (more data asset promotion, fewer broken-link outreach).