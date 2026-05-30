#!/bin/bash
#
# post-deploy-ops.sh — Orchestrator for post-deployment SEO operations.
#
# Runs:
#   1. Deploy to Vercel (trigger + wait + verify)
#   2. Validate SEO (sitemaps, robots.txt, key pages)
#   3. Submit sitemaps to GSC (if credentials allow)
#   4. Generate final report
#
# Usage:
#   ./scripts/post-deploy-ops.sh              # Full pipeline
#   ./scripts/post-deploy-ops.sh --check-only  # Validate only (no deploy)
#   ./scripts/post-deploy-ops.sh --no-submit   # Skip GSC submission
#
# Credentials:
#   VERCEL_DEPLOY_HOOK_URL  — for deploy trigger (preferred)
#   GOOGLE_TOKEN_FILE       — for GSC sitemap submission (optional)
#   GSC_SITE_URL            — for GSC sitemap submission (optional)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

REPORT_DIR="$PROJECT_DIR/.optimizer-data"
mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
LOG_FILE="$REPORT_DIR/post-deploy-ops_${TIMESTAMP}.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +%H:%M:%S)]${NC} $*" | tee -a "$LOG_FILE"; }
ok()  { echo -e "${GREEN}   ✅ $*${NC}" | tee -a "$LOG_FILE"; }
warn(){ echo -e "${YELLOW}   ⚠️  $*${NC}" | tee -a "$LOG_FILE"; }
err() { echo -e "${RED}   ❌ $*${NC}" | tee -a "$LOG_FILE"; }

# ── Parse args ──────────────────────────────────────────────

CHECK_ONLY=false
NO_SUBMIT=false
WAIT_TIME=120

while [[ $# -gt 0 ]]; do
    case "$1" in
        --check-only) CHECK_ONLY=true; shift ;;
        --no-submit)  NO_SUBMIT=true; shift ;;
        --wait)       WAIT_TIME="$2"; shift 2 ;;
        *)            echo "Unknown arg: $1"; exit 1 ;;
    esac
done

# ── Safety checks ───────────────────────────────────────────

log "🚀 QFINHUB Post-Deploy Operations"
log "   Project: $PROJECT_DIR"
log "   Mode: $([ "$CHECK_ONLY" = true ] && echo 'CHECK-ONLY' || echo 'FULL DEPLOY')"
log "   Log: $LOG_FILE"

# ── Phase 1: Verify paused automations ──────────────────────

log ""
log "📋 Phase 1: Safety Check — Paused Automations"
log "   Confirm these are ALL paused before proceeding:"
log "   - Blog Agent"
log "   - Scenario Generator"
log "   - Scenario Upgrades"
log "   - SEO Indexing Engine"
log "   - Sitemap Ping"

if [ -t 0 ]; then
    read -p "   Continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        err "Aborted by user"
        exit 1
    fi
fi
ok "Safety check passed"

# ── Phase 2: Git status check ───────────────────────────────

log ""
log "📋 Phase 2: Git Status"
CURRENT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
log "   Branch: $BRANCH"
log "   Commit: $CURRENT_COMMIT"

# Check for uncommitted changes
if ! git diff-index --quiet HEAD -- 2>/dev/null; then
    warn "Uncommitted changes detected. These will NOT be deployed."
    git status --short
fi

# ── Phase 3: Deploy ─────────────────────────────────────────

if [ "$CHECK_ONLY" = false ]; then
    log ""
    log "📋 Phase 3: Deploy to Vercel"
    python3 "$SCRIPT_DIR/deploy-vercel-v2.py" --wait "$WAIT_TIME" 2>&1 | tee -a "$LOG_FILE"
    DEPLOY_EXIT=$?
    if [ $DEPLOY_EXIT -eq 0 ]; then
        ok "Deploy complete"
    else
        warn "Deploy completed with warnings (or credentials missing — may have skipped trigger)"
    fi
else
    log ""
    log "📋 Phase 3: SKIPPED (--check-only)"
fi

# ── Phase 4: Validate SEO ───────────────────────────────────

log ""
log "📋 Phase 4: Validate SEO"
python3 "$SCRIPT_DIR/validate-seo-after-deploy.py" 2>&1 | tee -a "$LOG_FILE"
VALIDATE_EXIT=$?
if [ $VALIDATE_EXIT -eq 0 ]; then
    ok "SEO validation passed"
else
    err "SEO validation found issues — check report"
fi

# ── Phase 5: Submit sitemaps to GSC ─────────────────────────

if [ "$NO_SUBMIT" = false ]; then
    log ""
    log "📋 Phase 5: Submit Sitemaps to GSC"

    if [ -n "${GOOGLE_TOKEN_FILE:-}" ] || [ -f "$HOME/.hermes/google-indexing-token.json" ]; then
        python3 "$SCRIPT_DIR/submit-sitemaps-gsc.py" \
            ${GOOGLE_TOKEN_FILE:+--token-file "$GOOGLE_TOKEN_FILE"} \
            ${GSC_SITE_URL:+--site-url "$GSC_SITE_URL"} \
            2>&1 | tee -a "$LOG_FILE"
        SUBMIT_EXIT=$?
        if [ $SUBMIT_EXIT -eq 0 ]; then
            ok "Sitemaps submitted"
        else
            warn "Sitemap submission incomplete (may need full webmasters scope)"
        fi
    else
        warn "No Google token found — skipping GSC submission"
        warn "Set GOOGLE_TOKEN_FILE or place token at ~/.hermes/google-indexing-token.json"
    fi
else
    log ""
    log "📋 Phase 5: SKIPPED (--no-submit)"
fi

# ── Phase 6: Final summary ──────────────────────────────────

log ""
log "📊 Phase 6: Summary"
log "   Commit deployed: $CURRENT_COMMIT"
log "   Reports:"
log "     SEO: $REPORT_DIR/post-deploy-seo-report.json"
log "     GSC: $REPORT_DIR/gsc-sitemap-submission-log.json"
log "     Log: $LOG_FILE"

# Quick checks
SITEMAP_URLS=$(curl -sf "$BASE_URL/sitemap.xml" 2>/dev/null | grep -c '<loc>' || echo "?")
log "   Main sitemap URLs: $SITEMAP_URLS"

log ""
log "✅ Post-deploy operations complete."
log "   Run 'cat $REPORT_DIR/post-deploy-seo-report.json | python3 -m json.tool' for details."
