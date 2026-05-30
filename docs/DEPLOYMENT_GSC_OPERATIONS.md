# QFINHUB Deployment + GSC Operations

> **Last updated:** May 30, 2026  
> **Skill:** `qfinhub-deploy-gsc` — load with Hermes for automated ops

## Overview

This system automates the post-push workflow that Qasem currently does manually:

1. Trigger Vercel redeploy after `git push`
2. Wait for deployment to go live
3. Validate sitemaps, robots.txt, and key pages
4. Submit sitemaps to Google Search Console
5. Generate a post-deploy SEO verification report

## Scripts

| Script | Purpose |
|---|---|
| `scripts/deploy-vercel-v2.py` | Trigger Vercel deploy (hook or API) + wait + verify URLs |
| `scripts/validate-seo-after-deploy.py` | Validate sitemaps, robots.txt, key pages, risky automations |
| `scripts/submit-sitemaps-gsc.py` | Submit `/sitemap.xml` and `/news-sitemap.xml` to GSC |
| `scripts/post-deploy-ops.sh` | Orchestrator — runs all 3 scripts in order |

## Quick Start

### Full pipeline (after `git push`):

```bash
cd /home/admin1/qfinhub
./scripts/post-deploy-ops.sh
```

### Check-only (no deploy, no GSC submit):

```bash
./scripts/post-deploy-ops.sh --check-only
```

### Skip GSC submission:

```bash
./scripts/post-deploy-ops.sh --no-submit
```

---

## Required Credentials

### 1. Vercel Deploy (choose one method)

**Method A — Deploy Hook (PREFERRED, simplest):**

```
VERCEL_DEPLOY_HOOK_URL="https://api.vercel.com/v1/integrations/deploy/..."
```

- One URL. Anyone with it can trigger a redeploy.
- Create in Vercel dashboard: Project → Settings → Git → Deploy Hooks → Create Hook
- Set name: "Hermes Automated Deploy"
- Copy the generated URL → paste into `.env.local`

**Method B — Vercel API Token (more control):**

```
VERCEL_TOKEN="vercel_personal_access_token"
VERCEL_PROJECT_ID="prj_xxxxxxxxxxxxx"
```

- Allows checking deploy status programmatically
- Create token: Vercel Dashboard → Settings → Tokens → Create Token
- Find project ID: `npx vercel project ls` or from `.vercel/project.json`
- Paste into `.env.local`

### 2. Google Search Console Sitemap Submission

**Current token status:** Has `webmasters.readonly` scope — can READ but NOT submit. Need full `webmasters` scope.

**Two ways to get the full scope:**

**Option A — Re-authorize the existing OAuth client (recommended):**

If you have the Google Cloud Console project with the OAuth 2.0 client, re-run the authorization flow with the `webmasters` scope (not `webmasters.readonly`):

```
https://www.googleapis.com/auth/webmasters
```

**Option B — Create new credentials if the project is unknown:**

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Desktop application type)
3. Download the client secret JSON
4. Run an OAuth flow requesting scope: `https://www.googleapis.com/auth/webmasters`
5. Save the resulting token to `~/.hermes/google-indexing-token.json`

**Env vars to set:**

```
GSC_SITE_URL="https://www.qfinhub.com/"
GOOGLE_TOKEN_FILE="~/.hermes/google-indexing-token.json"
```

---

## What Gets Submitted (and what doesn't)

### ✅ Submitted to GSC:

- `https://www.qfinhub.com/sitemap.xml`
- `https://www.qfinhub.com/news-sitemap.xml`

### ❌ NEVER submitted:

- `https://www.qfinhub.com/scenario/sitemap.xml` — hardcoded block in script

The `submit-sitemaps-gsc.py` script has a safety check that refuses to run if the scenario sitemap ever appears in the submit list.

---

## Post-Deploy Verification

After each deploy, the system checks:

### Sitemaps
- `/sitemap.xml` — valid XML, ~649 URLs, no scenario/formula/geo URLs, includes decisions + widget
- `/news-sitemap.xml` — valid XML, normal sitemap format (NOT Google News), has blog URLs
- `/scenario/sitemap.xml` — 0 URLs, valid empty sitemap

### Robots.txt
- Only declares main + news sitemap
- Does NOT declare scenario sitemap
- Allow: / for all agents

### Key Pages
- Widget landing: `index,follow`, self-canonical, in sitemap
- Embed route: `noindex,follow`, NOT in sitemap
- 5 decision pages: `index,follow`, in sitemap
- 4 calculator hubs: `index,follow`, in sitemap

### Safety
- All risky automations confirmed paused
- No Indexing API usage for normal pages

### Report
- Saved to `.optimizer-data/post-deploy-seo-report.json`

---

## How Hermes Uses This

When the skill `qfinhub-deploy-gsc` is loaded, Hermes can:

1. After a `git push`, run the full pipeline automatically
2. Report any failures with specific error details
3. Tell Qasem only when manual intervention is needed (missing credentials, failed deploy, GSC errors)

**Example Hermes command:**

> "Deploy the latest commit and verify everything"

Hermes will:
- Run `post-deploy-ops.sh`
- Parse the SEO report
- Report pass/fail with details

---

## Safety Rules

1. **Never commit credentials to GitHub** — `.env.local` is in `.gitignore`
2. **Never submit scenario sitemap to GSC** — hardcoded block
3. **Never restart risky automations** — manual confirmation required
4. **Never use Indexing API** — only Search Console API for sitemap submission
5. **Always validate before submitting** — SEO check runs before GSC submit
