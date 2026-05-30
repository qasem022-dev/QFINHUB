#!/usr/bin/env python3
"""
deploy-vercel-v2.py — Trigger Vercel deployment and verify it's live.

V2 (May 30, 2026): Replaces the expired `npx vercel deploy` approach.
Supports two methods:
  1. Deploy Hook URL (PREFERRED) — set VERCEL_DEPLOY_HOOK_URL env var
  2. Vercel REST API — set VERCEL_TOKEN + VERCEL_PROJECT_ID env vars

Usage:
  python3 scripts/deploy-vercel-v2.py                    # Trigger + wait
  python3 scripts/deploy-vercel-v2.py --check-only        # Just verify latest deploy
  python3 scripts/deploy-vercel-v2.py --wait 120          # Wait up to 120s

Environment:
  VERCEL_DEPLOY_HOOK_URL   — Deploy hook URL (preferred)
  VERCEL_TOKEN             — Vercel personal access token (fallback)
  VERCEL_PROJECT_ID        — Vercel project ID (fallback)
  VERCEL_TEAM_ID           — Vercel team ID (optional, for team projects)
"""

import os
import sys
import json
import time
import argparse
import subprocess
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

BASE_URL = "https://www.qfinhub.com"
VERCEL_API = "https://api.vercel.com"

# ── Helpers ──────────────────────────────────────────────────

def env(name):
    return os.environ.get(name, "").strip()

def check_url(url, expected_status=200, timeout=15):
    """Check that a URL returns the expected status code."""
    try:
        req = Request(url, headers={"User-Agent": "QFINHUB-DeployBot/2.0"})
        resp = urlopen(req, timeout=timeout)
        return resp.status == expected_status, resp.status, resp.headers.get("x-vercel-id", "unknown")
    except Exception as e:
        return False, 0, str(e)

def git_latest_commit():
    """Get the latest commit hash from the local repo."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--short", "HEAD"],
            capture_output=True, text=True, cwd=os.path.join(os.path.dirname(__file__), "..")
        )
        return result.stdout.strip()
    except Exception:
        return "unknown"

# ── Deploy Hook Method (Preferred) ──────────────────────────

def trigger_deploy_hook():
    """Trigger a deploy via Vercel Deploy Hook URL."""
    hook_url = env("VERCEL_DEPLOY_HOOK_URL")
    if not hook_url:
        print("❌ VERCEL_DEPLOY_HOOK_URL not set")
        return False, None

    print(f"🚀 Triggering deploy via Deploy Hook...")
    try:
        req = Request(hook_url, method="POST")
        resp = urlopen(req, timeout=30)
        body = resp.read().decode()
        print(f"   Response: {resp.status} — {body[:200]}")
        # Deploy hooks return a JSON with job info
        try:
            data = json.loads(body)
            deploy_id = data.get("job", {}).get("id") or data.get("id", "unknown")
            print(f"   Deploy ID: {deploy_id}")
        except json.JSONDecodeError:
            deploy_id = "unknown"
        return True, deploy_id
    except Exception as e:
        print(f"❌ Deploy hook failed: {e}")
        return False, None

# ── Vercel REST API Method (Fallback) ───────────────────────

def trigger_deploy_api():
    """Trigger a deploy via Vercel REST API."""
    token = env("VERCEL_TOKEN")
    project_id = env("VERCEL_PROJECT_ID")
    team_id = env("VERCEL_TEAM_ID")

    if not token or not project_id:
        print("❌ VERCEL_TOKEN and VERCEL_PROJECT_ID required for API deploy")
        return False, None

    url = f"{VERCEL_API}/v13/deployments"
    if team_id:
        url += f"?teamId={team_id}"

    payload = json.dumps({
        "name": "qfinhub",
        "project": project_id,
        "target": "production",
        "gitSource": {
            "type": "github",
            "repo": "qasem022-dev/QFINHUB",
            "ref": "main",
        }
    }).encode()

    print(f"🚀 Triggering deploy via Vercel API...")
    try:
        req = Request(url, data=payload, method="POST")
        req.add_header("Authorization", f"Bearer {token}")
        req.add_header("Content-Type", "application/json")
        resp = urlopen(req, timeout=30)
        data = json.loads(resp.read().decode())
        deploy_id = data.get("id", "unknown")
        deploy_url = data.get("url", "unknown")
        print(f"   Deploy ID: {deploy_id}")
        print(f"   Deploy URL: {deploy_url}")
        return True, deploy_id
    except HTTPError as e:
        body = e.read().decode()[:300]
        print(f"❌ Vercel API error {e.code}: {body}")
        return False, None
    except Exception as e:
        print(f"❌ Vercel API failed: {e}")
        return False, None

# ── Wait for deployment ─────────────────────────────────────

def wait_for_deploy(timeout=120):
    """Wait for the deployment to be live by polling the homepage."""
    print(f"⏳ Waiting for deployment (up to {timeout}s)...")
    start = time.time()
    prev_etag = None
    attempts = 0

    while time.time() - start < timeout:
        attempts += 1
        try:
            req = Request(BASE_URL, headers={"User-Agent": "QFINHUB-DeployBot/2.0"})
            resp = urlopen(req, timeout=10)
            etag = resp.headers.get("etag", "")
            vercel_id = resp.headers.get("x-vercel-id", "")

            # If ETag changed, deployment is live
            if prev_etag and etag != prev_etag:
                print(f"   ✅ Deployment detected! ETag: {etag[:16]}... (attempt {attempts})")
                return True, etag, vercel_id

            if not prev_etag:
                prev_etag = etag
                print(f"   Baseline ETag: {etag[:16]}... (attempt {attempts})")

            time.sleep(5)
        except Exception as e:
            print(f"   ⚠️ Poll attempt {attempts} failed: {e}")
            time.sleep(5)

    print(f"   ⚠️ Timed out after {timeout}s. Deployment may still be in progress.")
    return False, prev_etag or "unknown", "unknown"

# ── Verify deployment ───────────────────────────────────────

KEY_URLS = [
    ("Homepage", "/"),
    ("Sitemap", "/sitemap.xml"),
    ("News Sitemap", "/news-sitemap.xml"),
    ("Robots.txt", "/robots.txt"),
    ("Widget Landing", "/widgets/mortgage-affordability-embed"),
    ("Embed Route", "/embed/mortgage-affordability"),
    ("Decision — 400k Home", "/decision/can-i-afford-a-400k-home"),
    ("Decision — Retire at 45", "/decision/retire-at-45-with-1-million"),
    ("Decision — Emergency Fund", "/decision/how-much-emergency-fund-do-i-need"),
    ("Calc — Mortgage", "/calculators/mortgage-calculator"),
    ("Calc — Compound Interest", "/calculators/compound-interest"),
    ("Calc — 401k", "/calculators/401k-calculator"),
]

def verify_urls():
    """Verify key URLs return 200 after deployment."""
    print("\n🔍 Verifying key URLs...")
    all_ok = True
    for name, path in KEY_URLS:
        url = f"{BASE_URL}{path}"
        ok, status, detail = check_url(url)
        icon = "✅" if ok else "❌"
        print(f"   {icon} {name}: {url} → {status}")
        if not ok:
            all_ok = False
    return all_ok

# ── Main ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Trigger and verify Vercel deployment")
    parser.add_argument("--check-only", action="store_true", help="Only verify, don't trigger deploy")
    parser.add_argument("--wait", type=int, default=120, help="Seconds to wait for deployment (default: 120)")
    parser.add_argument("--no-wait", action="store_true", help="Trigger only, don't wait")
    args = parser.parse_args()

    commit = git_latest_commit()
    print(f"📦 Deploy Verifier v2 — commit: {commit}")
    print(f"   Base URL: {BASE_URL}")

    deploy_ok = True

    if not args.check_only:
        # Try deploy hook first, fall back to API
        success, deploy_id = trigger_deploy_hook()
        if not success:
            print("\n   Falling back to Vercel API...")
            success, deploy_id = trigger_deploy_api()

        if not success:
            print("\n❌ Cannot trigger deployment. Check credentials.")
            print("   Set VERCEL_DEPLOY_HOOK_URL (preferred) or VERCEL_TOKEN + VERCEL_PROJECT_ID")
            deploy_ok = False

        if deploy_ok and not args.no_wait:
            ready, etag, vercel_id = wait_for_deploy(args.wait)
            if ready:
                print(f"   ETag: {etag[:32]}")
                print(f"   Vercel ID: {vercel_id}")

    # Always verify
    all_ok = verify_urls()

    print(f"\n{'✅ All checks passed' if (deploy_ok and all_ok) else '❌ Some checks failed'}")
    return 0 if (deploy_ok and all_ok) else 1

if __name__ == "__main__":
    sys.exit(main())
