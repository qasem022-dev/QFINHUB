#!/usr/bin/env python3
"""
QFINHUB GSC Request Indexing — V2 Sidebar Navigation (Phase 21.5 proven)
Submits URLs one-by-one via GSC URL Inspection + Request Indexing.
"""

import json, time, os, sys, argparse

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")

QUEUE_FILE = ".optimizer-data/indexing-fix-queue.json"
LOG_FILE = ".optimizer-data/gsc-submission-log.json"
MAX_PER_DAY = 13

def load_queue():
    with open(QUEUE_FILE) as f:
        return json.load(f)

def load_log():
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE) as f:
            return json.load(f)
    return {"submissions": [], "total": 0}

def get_urls(queue, log, max_n=MAX_PER_DAY):
    today = time.strftime("%Y-%m-%d")
    today_count = sum(1 for s in log["submissions"] if s.get("date","").startswith(today))
    if today_count >= MAX_PER_DAY:
        print(f"DAILY LIMIT: {today_count}/{MAX_PER_DAY}")
        return []
    remaining = MAX_PER_DAY - today_count
    submitted = {s["url"] for s in log["submissions"]}
    urls = []
    for url in queue.get("unknown_pages", []):
        if url not in submitted:
            urls.append({"url": url, "category": "UNKNOWN"})
            if len(urls) >= remaining: break
    if len(urls) < remaining:
        for url in queue.get("discovered_pages", []):
            if url not in submitted:
                urls.append({"url": url, "category": "DISCOVERED"})
                if len(urls) >= remaining: break
    return urls

def submit(urls, dry_run=False):
    if dry_run:
        for u in urls:
            print(f"  DRY RUN: {u['url']}")
        return {"dry_run": True}

    from cloakbrowser import launch_persistent_context
    
    ctx = launch_persistent_context(
        user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/google-gsc-v3"),
        headless=True, humanize=True
    )
    page = ctx.new_page()
    results = []

    try:
        # Step 1: Navigate to property page
        print("→ Navigating to GSC...")
        page.goto(
            "https://search.google.com/search-console?resource_id=https://www.qfinhub.com/",
            wait_until="domcontentloaded", timeout=30000
        )
        time.sleep(5)

        if "accounts.google.com" in page.url:
            print("✗ SESSION EXPIRED — re-auth needed")
            ctx.close()
            return {"error": "session_expired"}
        if "challenge" in page.url.lower():
            print("✗ CAPTCHA/2FA CHALLENGE")
            ctx.close()
            return {"error": "challenge_blocked"}

        # Step 2: Click "URL inspection" in sidebar
        # V2: link text is "searchURL inspection" (icon+text merged)
        clicked = page.evaluate("""(function() {
            var links = document.querySelectorAll('a');
            for (var l of links) {
                var t = (l.textContent || '').replace(/\\s+/g, '');
                if (t.toLowerCase().includes('urlinspection')) {
                    l.click();
                    return 'CLICKED';
                }
            }
            return 'NOT_FOUND';
        })()""")
        print(f"→ Sidebar click: {clicked}")
        time.sleep(4)

        # Step 3: Submit each URL
        for i, item in enumerate(urls):
            url = item["url"]
            print(f"\n[{i+1}/{len(urls)}] {item['category']}: ...{url[-50:]}")

            # Enter URL
            escaped = url.replace('\\', '\\\\').replace("'", "\\'")
            entered = page.evaluate(f"""(function() {{
                var inputs = document.querySelectorAll('input[type="text"]');
                for (var el of inputs) {{
                    if (el.offsetParent !== null) {{
                        el.focus();
                        el.value = '';
                        var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                        ns.call(el, '{escaped}');
                        el.dispatchEvent(new Event('input', {{ bubbles: true, composed: true }}));
                        el.dispatchEvent(new Event('change', {{ bubbles: true, composed: true }}));
                        return 'ENTERED';
                    }}
                }}
                return 'NO_INPUT';
            }})()""")
            time.sleep(1)
            page.keyboard.press('Enter')
            print(f"  URL entered: {entered}, waiting for inspection...")

            # Poll for results (up to 45s)
            result = "TIMEOUT_45S"
            for wait_sec in [3, 6, 10, 15, 20, 25, 30, 35, 40, 45]:
                time.sleep(wait_sec if wait_sec <= 6 else 5)
                txt = page.evaluate("document.body.innerText").lower()

                if 'request index' in txt or 'request indexing' in txt:
                    # Check it's not "already indexed" near the button
                    cheats = page.evaluate("""(function() {
                        var btns = document.querySelectorAll('button, [role="button"]');
                        for (var btn of btns) {
                            if ((btn.textContent || '').toLowerCase().includes('request index')) {
                                btn.scrollIntoView({block: 'center'});
                                btn.click();
                                return 'CLICKED';
                            }
                        }
                        return 'NO_BUTTON';
                    })()""")
                    time.sleep(3)
                    conf = page.evaluate("document.body.innerText").lower()
                    if 'indexing requested' in conf or 'crawl requested' in conf:
                        result = "REQUESTED ✓"
                    elif 'already indexed' in conf:
                        result = "ALREADY_INDEXED"
                    else:
                        result = "CLICKED_BUTTON"
                    break

                if 'already indexed' in txt or 'url is on google' in txt:
                    result = "ALREADY_INDEXED"
                    break
                if 'indexing requested' in txt:
                    result = "ALREADY_REQUESTED"
                    break
                if 'url is unknown' in txt and 'test live' in txt:
                    # Click Test Live URL first
                    test_clicked = page.evaluate("""(function() {
                        var btns = document.querySelectorAll('button, [role="button"]');
                        for (var btn of btns) {
                            if ((btn.textContent || '').toLowerCase().includes('test live')) {
                                btn.click(); return 'TESTED';
                            }
                        }
                        return 'NO';
                    })()""")
                    print(f"  Test Live URL: {test_clicked}")

            print(f"  → {result}")

            results.append({
                "url": url, "category": item["category"],
                "result": result,
                "date": time.strftime("%Y-%m-%d %H:%M:%S")
            })

            # Save progress every 3
            if (i+1) % 3 == 0:
                save_results(results, "partial")

            time.sleep(2)

    except Exception as e:
        print(f"✗ ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        ctx.close()

    save_results(results, "final")
    return {"submitted": len(results), "results": results}

def save_results(results, stage=""):
    log = load_log()
    for r in results:
        log["submissions"].append(r)
    log["total"] = len(log["submissions"])
    with open(LOG_FILE, 'w') as f:
        json.dump(log, f, indent=2)
    if stage:
        print(f"  [saved {stage}]")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--max', type=int, default=MAX_PER_DAY)
    parser.add_argument('--url', type=str, help='Submit a single URL (for testing)')
    args = parser.parse_args()

    if args.url:
        urls = [{"url": args.url, "category": "TEST"}]
    else:
        queue = load_queue()
        log = load_log()
        urls = get_urls(queue, log, args.max)

    if not urls:
        print("No URLs to submit.")
        return

    print(f"=== GSC Indexing Submission: {len(urls)} URLs ===\n")
    for u in urls[:5]:
        print(f"  [{u['category']}] ...{u['url'][-50:]}")
    if len(urls) > 5:
        print(f"  ... and {len(urls)-5} more")

    r = submit(urls, dry_run=args.dry_run)
    if not args.dry_run:
        success = sum(1 for s in r.get("results",[]) if "REQUESTED" in s.get("result",""))
        print(f"\n=== DONE: {success}/{len(urls)} requested ===")

if __name__ == '__main__':
    main()
