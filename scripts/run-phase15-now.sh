#!/bin/bash
# Phase 15 Safe Manual Trigger — PHASE 15.3B CORRECTED
# Usage: ./scripts/run-phase15-now.sh [--status-only]
# 
# Only an actionable_daily_run qualifies as "completed today."
# Planning/dry/status runs do NOT block real execution.

cd "$(dirname "$0")/.."

DECISION=$(python3 scripts/phase15-gateway-startup-trigger.py 2>/dev/null)
echo "$DECISION" | python3 -c "
import json, sys
d = json.load(sys.stdin)
print(f'Decision: {d[\"decision\"]}')
print(f'Reason: {d[\"reason\"]}')
print(f'Run type: {d.get(\"run_type\", \"N/A\")}')
"

MODE="$1"
if [ "$MODE" = "--status-only" ]; then
    echo ""
    echo "=== PHASE 15 STATUS ==="
    python3 -c "
import json
try:
    with open('.optimizer-data/phase15-daily-run-lock.json') as f:
        lock = json.load(f)
    state = lock.get('current_state', {})
    print(f'Date: {state.get(\"date\", \"?\")}')
    print(f'Actionable run today: {state.get(\"has_actionable_run_today\", False)}')
    print(f'Ready to run: {state.get(\"ready_to_run\", False)}')
    print(f'Last run: {state.get(\"last_run_id\", \"?\")} ({state.get(\"last_run_status\", \"?\")})')
    runs = lock.get('runs', [])
    if runs:
        for r in runs:
            rt = r.get('run_type', 'unknown')
            st = r.get('status', '?')
            q = '✅ QUALIFIES' if r.get('qualifies_as_daily_completion') else '❌ PLANNING'
            print(f'  {r[\"run_id\"]}: {rt} / {st} — {q}')
except Exception as e:
    print(f'Error: {e}')
"
    exit 0
fi

DECISION_TYPE=$(echo "$DECISION" | python3 -c "import json,sys; print(json.load(sys.stdin)['decision'])")

if [ "$DECISION_TYPE" = "EXECUTE_ACTIONABLE_RUN" ]; then
    echo ""
    echo "✅ ACTIONABLE Phase 15 run is needed."
    echo "   The last run was planning-only and does NOT count."
    echo ""
    echo "   Hermes agent must execute the FULL actionable workflow:"
    echo "   - Tier 3 GSC UI indexing (10/day)"
    echo "   - Internal links (10-15/day)"
    echo "   - Follow-up outreach (up to 5/day)"
    echo "   - Content (1/day if Auditor approves)"
    echo "   - Deploy if files changed"
elif [ "$DECISION_TYPE" = "RECOVERY_MODE" ]; then
    echo ""
    echo "🔧 RECOVERY MODE — previous run failed."
    echo "   Execute only unfinished steps from the failed run."
elif [ "$DECISION_TYPE" = "SKIP" ]; then
    echo ""
    echo "⏭️  SKIP — actionable daily run already completed today."
    echo "   Use --status-only for current status."
fi
