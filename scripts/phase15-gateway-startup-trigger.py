#!/usr/bin/env python3
"""
Phase 15 Gateway Startup Trigger — PHASE 15.3B CORRECTED
========================================================
Runs on Hermes Gateway startup/restart.
Checks daily run lock and decides whether to execute Phase 15 now.

CRITICAL RULE: Only actionable_daily_run qualifies as "completed today."
Planning-only, dry-run, and status-only runs do NOT block the real daily run.

Decision outcomes:
- SKIP: Actionable daily run already completed today
- EXECUTE_ACTIONABLE_RUN: No actionable run completed today (exec full workflow)
- RECOVERY_MODE: Previous run failed, retry available
"""

import json
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LOCK_FILE = PROJECT_ROOT / ".optimizer-data" / "phase15-daily-run-lock.json"
DECISION_FILE = PROJECT_ROOT / ".optimizer-data" / "phase15-startup-decision.json"

def load_lock():
    if LOCK_FILE.exists():
        with open(LOCK_FILE) as f:
            return json.load(f)
    return None

def check_and_decide():
    now = datetime.now()
    today = now.strftime("%Y-%m-%d")
    now_iso = now.isoformat()

    lock = load_lock()
    if not lock:
        decision = {
            "timestamp": now_iso, "decision": "EXECUTE_ACTIONABLE_RUN",
            "reason": "No lock file — first run",
            "run_type": "actionable_daily_run", "trigger_type": "gateway_start"
        }
        with open(DECISION_FILE, "w") as f:
            json.dump(decision, f, indent=2)
        print(json.dumps(decision))
        return decision

    runs = lock.get("runs", [])
    today_runs = [r for r in runs if r.get("date") == today]
    
    # Check if today has an ACTIONABLE completed run
    actionable_completed = [r for r in today_runs 
                           if r.get("run_type") == "actionable_daily_run" 
                           and r.get("status") == "completed"
                           and r.get("qualifies_as_daily_completion", False)]
    
    # Check for only planning/dry/status runs
    non_actionable_runs = [r for r in today_runs 
                          if r.get("run_type") in ("planning_only", "dry_run", "status_only")]
    
    running_now = [r for r in today_runs if r.get("status") == "running"]
    failed_today = [r for r in today_runs if r.get("status") == "failed"]

    # RULE 1: Actionable run completed → SKIP
    if actionable_completed:
        decision = {
            "timestamp": now_iso, "decision": "SKIP",
            "reason": f"Actionable daily run completed at {actionable_completed[-1].get('completed_at','?')}",
            "run_type": None, "trigger_type": "gateway_start"
        }
        with open(DECISION_FILE, "w") as f:
            json.dump(decision, f, indent=2)
        print(json.dumps(decision))
        return decision

    # RULE 2: Running (not stale) → SKIP
    if running_now:
        started = running_now[-1].get("started_at", "")
        if started:
            try:
                start_time = datetime.fromisoformat(started)
                if (now - start_time) < timedelta(hours=2):
                    decision = {
                        "timestamp": now_iso, "decision": "SKIP",
                        "reason": f"Run in progress (started {started})",
                        "run_type": None, "trigger_type": "gateway_start"
                    }
                    with open(DECISION_FILE, "w") as f:
                        json.dump(decision, f, indent=2)
                    print(json.dumps(decision))
                    return decision
            except:
                pass

    # RULE 3: Failed → RECOVERY_MODE
    if failed_today:
        retries = len(failed_today)
        max_retries = lock.get("rules", {}).get("max_retries_per_day", 2)
        if retries < max_retries:
            decision = {
                "timestamp": now_iso, "decision": "RECOVERY_MODE",
                "reason": f"Previous run failed ({retries}/{max_retries} retries)",
                "run_type": "recovery_run", "trigger_type": "gateway_start",
                "failed_run_ids": [r.get("run_id") for r in failed_today]
            }
            with open(DECISION_FILE, "w") as f:
                json.dump(decision, f, indent=2)
            print(json.dumps(decision))
            return decision
        else:
            decision = {
                "timestamp": now_iso, "decision": "SKIP",
                "reason": f"Max retries ({max_retries}) reached",
                "run_type": None, "trigger_type": "gateway_start"
            }
            with open(DECISION_FILE, "w") as f:
                json.dump(decision, f, indent=2)
            print(json.dumps(decision))
            return decision

    # RULE 4: No actionable run today → EXECUTE (even if planning runs exist)
    reason = "No actionable daily run completed today"
    if non_actionable_runs:
        reason += f" (only {len(non_actionable_runs)} non-actionable run(s): {[r['run_type'] for r in non_actionable_runs]})"
    else:
        reason += " (no runs at all today)"
    
    decision = {
        "timestamp": now_iso, "decision": "EXECUTE_ACTIONABLE_RUN",
        "reason": reason,
        "run_type": "actionable_daily_run", "trigger_type": "gateway_start"
    }
    with open(DECISION_FILE, "w") as f:
        json.dump(decision, f, indent=2)
    print(json.dumps(decision))
    return decision

if __name__ == "__main__":
    check_and_decide()
