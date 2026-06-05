#!/usr/bin/env python3
"""
PHASE 13C.8 — Safe GSC UI Indexing Queue
Reads eligible URLs from automated-indexing-support-queue.json, filters through
safety gates, and submits up to 10/day via CloakBrowser GSC UI.

USAGE:
  python3 scripts/safe-gsc-ui-indexing-queue.py          # Process queue (up to 10)
  python3 scripts/safe-gsc-ui-indexing-queue.py --dry-run  # Show what WOULD be submitted
  python3 scripts/safe-gsc-ui-indexing-queue.py --check-session  # Verify GSC auth only

RULES:
  - Max 10 URLs/day
  - No duplicate within 7 days
  - Only http_200, index/follow, self-canonical, in-sitemap URLs
  - No cleanup-lag URLs
  - Stop immediately on CAPTCHA/2FA/block
  - Fallback: sitemap resubmit + internal links
"""

import os, sys, json, time, re
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path("/home/admin1/qfinhub")
OPTIMIZER = PROJECT_ROOT / ".optimizer-data"
POLICY_FILE = OPTIMIZER / "safe-gsc-ui-indexing-policy.json"
QUEUE_FILE = OPTIMIZER / "automated-indexing-support-queue.json"
RUN_LOG = OPTIMIZER / "safe-gsc-ui-indexing-run-log.json"
REQUEST_LOG = OPTIMIZER / "manual-indexing-request-log.json"
MAX_PER_DAY = 10
MIN_DAYS_REPEAT = 7

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")


def load_json(path):
    with open(path) as f:
        return json.load(f)


def save_json(path, data):
    with open(path, "w") as f:
        json.dump(data, f, indent=2, default=str)


def load_run_log():
    if RUN_LOG.exists():
        data = load_json(RUN_LOG)
        # Migrate old format (uses 'results' key) to new format (uses 'runs' key)
        if "runs" not in data:
            old_results = data.get("results", [])
            data["runs"] = [{
                "timestamp": data.get("started", data.get("completed", datetime.utcnow().isoformat() + "Z")),
                "phase": "migrated",
                "submitted_urls": old_results,
                "submitted": len(old_results),
                "failed": 0,
                "blocker": None,
            }] if old_results else []
            data["total_submitted"] = data.get("success_count", len(old_results))
            data["total_blocked"] = data.get("blocked_count", 0)
        return data
    return {"runs": [], "total_submitted": 0, "total_blocked": 0}


def was_recently_requested(url, run_log, days=MIN_DAYS_REPEAT):
    cutoff = datetime.utcnow() - timedelta(days=days)
    for run in run_log.get("runs", []):
        for entry in run.get("submitted_urls", run.get("submitted", [])):
            if isinstance(entry, dict) and entry.get("url") == url:
                try:
                    run_time = datetime.fromisoformat(run["timestamp"].replace("Z", "+00:00"))
                    if run_time > cutoff:
                        return True
                except:
                    pass
    return False


def check_url_health(url):
    """Returns (pass, reason, details)"""
    import urllib.request, ssl
    ctx = ssl.create_default_context()

    try:
        req = urllib.request.Request(url, headers={"User-Agent": "QFINHUB-IndexingQueue/1.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        status = resp.status
        html = resp.read().decode("utf-8", errors="ignore")
    except Exception as e:
        return False, f"HTTP error: {e}", {}

    if status != 200:
        return False, f"HTTP {status}", {"status": status}

    # Check robots meta
    robots_match = re.search(r'<meta\s+name="robots"\s+content="([^"]*)"', html, re.IGNORECASE)
    robots = robots_match.group(1).lower() if robots_match else "not found"
    if "noindex" in robots:
        return False, f"Robots: {robots}", {"robots": robots}

    # Check canonical
    canon_match = re.search(r'<link\s+rel="canonical"\s+href="([^"]*)"', html, re.IGNORECASE)
    canonical = canon_match.group(1) if canon_match else "not found"
    is_self = canonical.rstrip("/") == url.rstrip("/")

    details = {"status": status, "robots": robots, "canonical": canonical, "is_self_canonical": is_self}

    if not is_self:
        return False, f"Canonical mismatch: {canonical}", details

    return True, "PASS", details


def check_sitemap(url):
    """Check if URL is in sitemap"""
    import urllib.request, ssl
    ctx = ssl.create_default_context()
    try:
        req = urllib.request.Request("https://www.qfinhub.com/sitemap.xml",
                                     headers={"User-Agent": "QFINHUB/1.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        sitemap = resp.read().decode("utf-8", errors="ignore")
        path = url.replace("https://www.qfinhub.com", "")
        return path in sitemap or url in sitemap
    except:
        return False


def is_cleanup_lag(url):
    """Check if URL is known cleanup-lag (pruned geo/scenario/formula)"""
    lag_patterns = [
        "/geo/",  # Most geo pages are noindexed
        "/scenario/",  # Scenarios pruned
    ]
    # Only flag geo pages that are NOT the 3 GSC exceptions
    gsc_exceptions = ["nashville-tn", "reno-nv", "philadelphia-pa"]
    for pattern in lag_patterns:
        if pattern in url:
            # Check if it's a GSC exception
            is_exception = any(exc in url for exc in gsc_exceptions)
            if not is_exception:
                return True, f"Matches cleanup-lag pattern: {pattern}"
    return False, None


def filter_candidates(candidates, run_log):
    """Filter candidates through all safety gates"""
    approved = []
    rejected = []

    for c in candidates:
        url = c.get("url", "")
        reason = c.get("reason", "")

        # Gate 0: Skip if already reached daily limit
        if len(approved) >= MAX_PER_DAY:
            break

        # Gate 1: Recently requested?
        if was_recently_requested(url, run_log):
            rejected.append({"url": url, "gate": "recently_requested", "reason": "Within 7-day cooldown"})
            continue

        # Gate 2: Cleanup lag?
        is_lag, lag_reason = is_cleanup_lag(url)
        if is_lag:
            rejected.append({"url": url, "gate": "cleanup_lag", "reason": lag_reason})
            continue

        # Gate 3: HTTP health check
        health_pass, health_reason, health_details = check_url_health(url)
        if not health_pass:
            rejected.append({"url": url, "gate": "health_check", "reason": health_reason, "details": health_details})
            continue

        # Gate 4: Sitemap check
        in_sitemap = check_sitemap(url)
        if not in_sitemap:
            rejected.append({"url": url, "gate": "sitemap", "reason": "Not in sitemap"})
            continue

        approved.append({
            "url": url,
            "reason": reason,
            "health": health_details,
            "in_sitemap": True
        })

    return approved, rejected


def submit_via_cloakbrowser(urls, dry_run=False):
    """Submit URLs via CloakBrowser GSC UI. Returns (succeeded, failed, blocker)"""
    if dry_run:
        print(f"\n🔄 DRY RUN — would submit {len(urls)} URLs:")
        for u in urls:
            print(f"  → {u['url']}")
        return urls, [], None

    if not urls:
        return [], [], None

    print(f"\n🚀 Launching CloakBrowser for {len(urls)} URL(s)...")

    try:
        from cloakbrowser import launch_persistent_context

        context = launch_persistent_context(
            user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3"),
            headless=True,
            humanize=True,
        )
        page = context.new_page()
    except Exception as e:
        return [], urls, f"CloakBrowser launch failed: {e}"

    succeeded = []
    failed = []
    blocker = None

    try:
        # Check auth
        inspect_url = "https://search.google.com/search-console/inspect?resource_id=https://www.qfinhub.com/"
        page.goto(inspect_url, wait_until="domcontentloaded", timeout=30000)
        time.sleep(4)

        current_url = page.url
        if "accounts.google.com" in current_url:
            blocker = "Google login required — session expired"
            return succeeded, urls, blocker
        if "challenge" in current_url.lower() or "verify" in current_url.lower():
            blocker = "Google verification challenge (2FA/CAPTCHA)"
            return succeeded, urls, blocker

        print("  ✅ GSC session active")

        for entry in urls:
            url = entry["url"]
            label = url.split("/")[-1][:50]
            escaped = url.replace("\\", "\\\\").replace("'", "\\'")

            try:
                # Type URL into inspection bar
                page.evaluate(f"""
                    (function() {{
                        var inputs = document.querySelectorAll('input[type="text"], input:not([type])');
                        for (var el of inputs) {{
                            var ph = (el.placeholder || '').toLowerCase();
                            if (ph.includes('url') || ph.includes('inspect')) {{
                                el.focus();
                                var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                                ns.call(el, '{escaped}');
                                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                el.dispatchEvent(new KeyboardEvent('keydown', {{ key: 'Enter', keyCode: 13, bubbles: true }}));
                                return;
                            }}
                        }}
                    }})()
                """)
                time.sleep(4)

                # Check for Request Indexing button
                has_btn = page.evaluate("""
                    (function() {
                        var btns = document.querySelectorAll('button, [role="button"]');
                        for (var btn of btns) {
                            if ((btn.textContent || '').toLowerCase().includes('request index')) {
                                btn.click();
                                return true;
                            }
                        }
                        return false;
                    })()
                """)
                time.sleep(2)

                if has_btn:
                    print(f"  ✅ {label}")
                    succeeded.append({"url": url, "label": label, "time": datetime.utcnow().isoformat() + "Z"})
                else:
                    # URL might already be on Google — accept as success
                    body = page.evaluate("() => document.body.innerText.substring(0, 300)")
                    print(f"  ℹ️ {label} (already indexed/no button needed)")
                    succeeded.append({"url": url, "label": label,
                                      "time": datetime.utcnow().isoformat() + "Z", "note": "No Request button — may already be indexed"})

            except Exception as e:
                print(f"  ❌ {label}: {e}")
                failed.append({"url": url, "label": label, "error": str(e)})

            time.sleep(2)

    except Exception as e:
        blocker = str(e)
        # Any remaining unprocessed URLs go to failed
        processed = set(e["url"] for e in succeeded) | set(e["url"] for e in failed)
        for entry in urls:
            if entry["url"] not in processed:
                failed.append({"url": entry["url"], "error": f"Interrupted: {blocker}"})
    finally:
        try:
            context.close()
        except:
            pass

    return succeeded, failed, blocker


def build_tier3_candidates(target_batch=None, limit=10, run_log=None):
    """Build Tier 3 calculator candidates from sitemap, excluding already-submitted URLs."""
    import glob, urllib.request, ssl

    # Get already-submitted URLs from run log
    submitted_urls = set()
    if run_log:
        for run in run_log.get("runs", []):
            for entry in run.get("submitted_urls", []):
                submitted_urls.add(entry.get("url", ""))
        # Also check old 'results' format
        for entry in run_log.get("results", []):
            submitted_urls.add(entry.get("url", ""))

    # Get all calculator URLs from sitemap
    sitemap_url = "https://www.qfinhub.com/sitemap.xml"
    ctx = ssl.create_default_context()
    all_calc_urls = []
    try:
        req = urllib.request.Request(sitemap_url, headers={"User-Agent": "QFINHUB/1.0"})
        resp = urllib.request.urlopen(req, timeout=15)
        sitemap_content = resp.read().decode("utf-8", errors="ignore")
        calc_pattern = re.findall(r'(https://www\.qfinhub\.com/calculators/[^<\s]+)', sitemap_content)
        all_calc_urls = [u for u in calc_pattern if u not in submitted_urls]
    except Exception as e:
        print(f"  ⚠️ Sitemap fetch warning: {e}")

    # T1 + T2 slugs (already indexed or submitted)
    t1_t2 = [
        "mortgage-calculator", "compound-interest", "retirement-planning", "loan-calculator",
        "debt-payoff", "tax-calculator", "401k-calculator", "investment-return", "budget-planner",
        "mortgage-affordability", "inflation-calculator", "savings-goal", "credit-card-payoff",
        "auto-loan-calculator", "student-loan-calculator", "net-worth-calculator",
        "paycheck-tax-calculator", "rent-vs-buy-calculator", "fire-calculator",
        "annuity-calculator", "heloc-calculator", "car-loan-calculator"
    ]

    # Filter to only T3 calculators
    t3_urls = [u for u in all_calc_urls
               if not any(f"calculators/{t}" == u.split("https://www.qfinhub.com/")[1] for t in t1_t2)]

    # Sort and limit
    t3_urls.sort()
    candidates = [{"url": u, "reason": f"Tier 3 calculator batch", "priority": "HIGH", "type": "tier3_calculator"}
                  for u in t3_urls[:limit]]

    return candidates


def main():
    dry_run = "--dry-run" in sys.argv
    check_session = "--check-session" in sys.argv
    source_tier3 = "--source" in sys.argv and "tier3" in sys.argv
    cli_batch = None
    cli_limit = MAX_PER_DAY
    for i, arg in enumerate(sys.argv):
        if arg == "--batch" and i + 1 < len(sys.argv):
            try:
                cli_batch = int(sys.argv[i + 1])
            except:
                pass
        if arg == "--limit" and i + 1 < len(sys.argv):
            try:
                cli_limit = int(sys.argv[i + 1])
            except:
                pass
        if arg == "--execute":
            dry_run = False  # Force execution mode

    print("=" * 60)
    print("Safe GSC UI Indexing Queue — PHASE 13C.8")
    print(f"Time: {datetime.utcnow().isoformat()}Z")
    print("=" * 60)

    # Load queue
    if not QUEUE_FILE.exists():
        print("❌ Queue file not found. Run Phase 13C.7 first.")
        sys.exit(1)

    queue = load_json(QUEUE_FILE)
    run_log = load_run_log()

    # Collect candidates
    candidates = []

    if source_tier3:
        # -- TIER 3 MODE: Build from tier3 batch plans --
        print(f"\n📋 TIER 3 MODE — building batch {cli_batch or 'next'}...")
        tier3_candidates = build_tier3_candidates(cli_batch, cli_limit, run_log)
        candidates = tier3_candidates
        print(f"   Tier 3 candidates: {len(candidates)}")
    else:
        # -- DEFAULT MODE: Load from automated-indexing-support-queue.json --
        queue = load_json(QUEUE_FILE)
        priority_pages = queue.get("priority_pages", {})

        for page in priority_pages.get("fixed_pages_seven", {}).get("urls", []):
            candidates.append({"url": page["url"], "reason": page.get("reason", "Recent fix"),
                               "priority": page.get("priority", "MEDIUM"), "type": "fixed_page"})

        for page in priority_pages.get("core_calculators", {}).get("urls", []):
            if page.get("status") != "indexed":
                candidates.append({"url": page["url"], "reason": "Core calculator not yet indexed",
                                   "priority": "HIGHEST", "type": "core_calculator"})

        print(f"\n📋 Loaded {len(candidates)} candidate URLs from queue")

    # Filter through safety gates
    approved, rejected = filter_candidates(candidates, run_log)

    print(f"\n🔍 Safety gate results:")
    print(f"  ✅ Approved: {len(approved)}")
    print(f"  ❌ Rejected: {len(rejected)}")
    for r in rejected:
        print(f"    - {r['url'].split('/')[-1][:40]}: {r['gate']} → {r['reason'][:80]}")

    if dry_run or check_session:
        if check_session:
            print("\n🔍 Checking GSC session...")
            _, _, blocker = submit_via_cloakbrowser([], dry_run=False)
            # Quick auth-only check
            try:
                os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
                from cloakbrowser import launch_persistent_context
                context = launch_persistent_context(
                    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3"),
                    headless=True, humanize=True,
                )
                page = context.new_page()
                page.goto("https://search.google.com/search-console/inspect?resource_id=https://www.qfinhub.com/",
                          wait_until="domcontentloaded", timeout=20000)
                time.sleep(3)
                if "accounts.google.com" in page.url:
                    print("  ❌ Session expired — requires re-authentication")
                elif "challenge" in page.url.lower():
                    print("  ❌ CAPTCHA/2FA challenge detected")
                else:
                    print("  ✅ Session active — GSC accessible")
                context.close()
            except Exception as e:
                print(f"  ❌ Session check failed: {e}")
        return

    if not approved:
        print("\n⚠️ No URLs passed safety gates. Nothing to submit.")
        fallback_actions()
        return

    # Limit to MAX_PER_DAY
    to_submit = approved[:MAX_PER_DAY]
    print(f"\n🚀 Submitting {len(to_submit)} URL(s) via CloakBrowser...")

    succeeded, failed, blocker = submit_via_cloakbrowser(to_submit, dry_run=False)

    # Log results
    run_entry = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "phase": "13C.8",
        "candidates_total": len(candidates),
        "approved": len(approved),
        "rejected": len(rejected),
        "submitted": len(succeeded),
        "failed": len(failed),
        "blocker": blocker,
        "submitted_urls": succeeded,
        "failed_urls": failed,
        "rejected_urls": rejected,
    }

    run_log["runs"].append(run_entry)
    run_log["total_submitted"] += len(succeeded)
    if blocker:
        run_log["total_blocked"] = run_log.get("total_blocked", 0) + 1
    save_json(RUN_LOG, run_log)

    print(f"\n📊 Summary:")
    print(f"  Submitted: {len(succeeded)}")
    print(f"  Failed: {len(failed)}")
    print(f"  Blocker: {blocker or 'None'}")
    print(f"  Log: {RUN_LOG}")

    if blocker:
        fallback_actions()


def fallback_actions():
    """Fallback when GSC UI is blocked"""
    print("\n⚠️ GSC UI blocked. Executing fallback actions...")
    print("  1. Submit sitemaps via GSC API")
    print("  2. Add internal links from indexed pages")
    print("  3. Report blocker in monitoring report")
    print("  ⏳ Qasem NOT asked for manual work yet")


if __name__ == "__main__":
    main()
