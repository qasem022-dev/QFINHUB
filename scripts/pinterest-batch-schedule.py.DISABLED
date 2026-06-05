#!/usr/bin/env python3
"""
QFINHUB Pinterest Batch Scheduler
Posts pins via CloakBrowser with Pinterest native scheduling.
Spread 10 pins/day across 5 days = 50 pins in one browser session.

Usage:
  python3 scripts/pinterest-batch-schedule.py              # Post all queued pins with scheduling
  python3 scripts/pinterest-batch-schedule.py --now        # Post immediately (no scheduling)
  python3 scripts/pinterest-batch-schedule.py --days 5     # Schedule across 5 days (default)
  python3 scripts/pinterest-batch-schedule.py --dry-run    # Validate queue without posting
"""

import sys, os, json, asyncio, time, random
from datetime import datetime, timedelta
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / ".pinterest-data"
QUEUE_PATH = DATA_DIR / "daily-queue.json"
POST_LOG = DATA_DIR / "post-log.json"
SESSION_DIR = Path.home() / ".hermes" / "cloak-profiles" / "pinterest-traffic"

SESSION_DIR.mkdir(parents=True, exist_ok=True)

# ─── Pin time slots (spread across the day, EST-friendly) ───
TIME_SLOTS = [
    (8, 0),   # 8:00 AM
    (9, 30),  # 9:30 AM
    (11, 0),  # 11:00 AM
    (12, 30), # 12:30 PM
    (14, 0),  # 2:00 PM
    (15, 30), # 3:30 PM
    (17, 0),  # 5:00 PM
    (18, 30), # 6:30 PM
    (20, 0),  # 8:00 PM
    (21, 30), # 9:30 PM
]

def load_queue():
    with open(QUEUE_PATH) as f:
        data = json.load(f)
    return data.get("pins", [])

def load_post_log():
    if POST_LOG.exists():
        with open(POST_LOG) as f:
            try:
                data = json.load(f)
                return data if isinstance(data, list) else data.get("posts", [])
            except:
                return []
    return []

def save_post_log(entries):
    with open(POST_LOG, "w") as f:
        json.dump({"posts": entries}, f, indent=2)

def compute_schedule(pins, days=5):
    """Assign publish dates/times to pins, spreading across 'days' days."""
    slots_per_day = len(TIME_SLOTS)
    pins_per_day = len(pins) // days
    remainder = len(pins) % days

    scheduled = []
    pin_idx = 0
    today = datetime.now()

    for day_offset in range(days):
        day = today + timedelta(days=day_offset + 1)  # Start tomorrow
        count_today = pins_per_day + (1 if day_offset < remainder else 0)

        # Pick random time slots for variety
        day_slots = random.sample(TIME_SLOTS, min(count_today, slots_per_day))
        day_slots.sort()

        for slot_idx, (hour, minute) in enumerate(day_slots):
            if pin_idx >= len(pins):
                break
            publish_time = day.replace(hour=hour, minute=minute, second=0, microsecond=0)
            scheduled.append((pins[pin_idx], publish_time))
            pin_idx += 1

    # Any remaining pins go to the next day
    while pin_idx < len(pins):
        day = today + timedelta(days=days + 1)
        h, m = random.choice(TIME_SLOTS)
        publish_time = day.replace(hour=h, minute=m, second=0, microsecond=0)
        scheduled.append((pins[pin_idx], publish_time))
        pin_idx += 1

    return scheduled


async def login_check(context):
    """Verify we're logged in to Pinterest."""
    page = await context.new_page()
    try:
        await page.goto("https://www.pinterest.com/", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(4)

        html = await page.content()
        url = page.url

        # Check for logged-in indicators
        logged_in = ("create-menu-button" in html or "app-shell" in html) and "login" not in url
        return logged_in, page
    except Exception:
        return False, page


async def post_pin_with_scheduling(context, pin, publish_time, now_mode=False):
    """Post a single pin via Pinterest pin builder with optional scheduling."""
    title = pin["title"]
    link = pin["link"]
    board = pin["boardName"]
    img = pin["imagePath"]
    slug = pin["slug"]

    time_str = publish_time.strftime("%b %d, %Y at %I:%M %p") if not now_mode else "NOW"
    print(f"\n📌 [{time_str}] {title[:55]}...")

    page = await context.new_page()

    try:
        # 1. Navigate to pin builder
        await page.goto("https://www.pinterest.com/pin-builder/", wait_until="domcontentloaded", timeout=30000)
        await asyncio.sleep(5)

        # 2. Upload image
        print("  📤 Uploading image...")
        file_input = page.locator('input[type="file"]')
        await file_input.set_input_files(img)
        await asyncio.sleep(6)

        # 3. Set title using contenteditable div
        escaped_title = title.replace("\\", "\\\\").replace("'", "\\'")
        await page.evaluate(f"""
            (function() {{
                var el = document.querySelector('[contenteditable="true"]');
                if (!el) {{
                    var divs = document.querySelectorAll('div[role="textbox"]');
                    el = divs[divs.length - 1] || divs[0];
                }}
                if (el) {{
                    el.focus();
                    el.textContent = '{escaped_title}';
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                }}
            }})()
        """)
        await asyncio.sleep(2)
        print("  ✏️ Title set")

        # 4. Add link
        escaped_link = link.replace("\\", "\\\\").replace("'", "\\'")
        await page.evaluate(f"""
            (function() {{
                var inputs = document.querySelectorAll('input');
                for (var el of inputs) {{
                    var ph = (el.placeholder || '').toLowerCase();
                    if (ph.includes('link') || ph.includes('url') || ph.includes('website')) {{
                        var nativeSetter = Object.getOwnPropertyDescriptor(
                            HTMLInputElement.prototype, 'value').set;
                        nativeSetter.call(el, '{escaped_link}');
                        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                        return;
                    }}
                }}
            }})()
        """)
        await asyncio.sleep(1.5)
        print("  🔗 Link set")

        # 5. Select board
        escaped_board = board.replace("\\", "\\\\").replace("'", "\\'")
        # Click board dropdown trigger
        await page.evaluate("""
            (function() {
                var all = document.querySelectorAll('div[role="button"], button, div, span');
                for (var el of all) {
                    var t = (el.textContent || '').toLowerCase();
                    if (t.includes('board') || t.includes('save to') || t.includes('profile')) {
                        el.click();
                        break;
                    }
                }
            })()
        """)
        await asyncio.sleep(2.5)

        # Click the specific board name
        await page.evaluate(f"""
            (function() {{
                var items = document.querySelectorAll('div[role="option"], div[role="menuitem"], li, div, span');
                for (var el of items) {{
                    if (el.textContent.trim() === '{escaped_board}') {{
                        el.click();
                        return;
                    }}
                }}
                // Partial match fallback
                var search = '{escaped_board[:20]}';
                for (var el of items) {{
                    if (el.textContent.includes(search)) {{
                        el.click();
                        return;
                    }}
                }}
            }})()
        """)
        await asyncio.sleep(2)
        print(f"  📋 Board: {board}")

        # 6. Scheduling — try to find "Publish later" option
        schedule_set = False
        if not now_mode:
            try:
                # Look for scheduling toggle/button
                await page.evaluate("""
                    (function() {
                        var all = document.querySelectorAll('div, span, button, label');
                        for (var el of all) {
                            var t = (el.textContent || '').toLowerCase();
                            if (t.includes('publish later') || t.includes('schedule') ||
                                t.includes('publish at') || t.includes('set date')) {
                                el.click();
                                return;
                            }
                        }
                    })()
                """)
                await asyncio.sleep(2)

                html = await page.content()
                # Check if date picker appeared
                schedule_set = "date" in html.lower() and ("picker" in html.lower() or "calendar" in html.lower())
                if schedule_set:
                    print("  📅 Scheduling UI found — setting date...")
                    # Try to find and set the date input
                    date_str = publish_time.strftime("%m/%d/%Y")
                    time_str_12h = publish_time.strftime("%I:%M %p")

                    await page.evaluate(f"""
                        (function() {{
                            // Find date inputs
                            var inputs = document.querySelectorAll('input[type="text"], input[type="date"], input');
                            for (var el of inputs) {{
                                var ph = (el.placeholder || el.name || el.id || '').toLowerCase();
                                if (ph.includes('date') || ph.includes('day') || ph.includes('month')) {{
                                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                                    ns.call(el, '{date_str}');
                                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                    break;
                                }}
                            }}

                            // Find time inputs
                            for (var el of inputs) {{
                                var ph = (el.placeholder || el.name || el.id || '').toLowerCase();
                                if (ph.includes('time') || ph.includes('hour')) {{
                                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                                    ns.call(el, '{time_str_12h}');
                                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                                    break;
                                }}
                            }}
                        }})()
                    """)
                    await asyncio.sleep(1.5)
                else:
                    print("  ⚠️ Scheduling UI not found — posting immediately")
            except Exception as e:
                print(f"  ⚠️ Scheduling failed: {e} — posting immediately")

        # 7. Click Save/Publish
        await page.evaluate("""
            (function() {
                var btns = document.querySelectorAll('button, div[role="button"]');
                for (var btn of btns) {
                    var t = (btn.textContent || '').trim().toLowerCase();
                    if (t === 'save' || t === 'publish' || t === 'done' ||
                        t === 'create pin' || t === 'schedule pin') {
                        btn.click();
                        return;
                    }
                }
            })()
        """)
        await asyncio.sleep(7)

        # 8. Verify
        html = await page.content()
        success = any(word in html.lower() for word in ["published", "saved", "scheduled", "pin created", "your pin"])

        if success:
            label = "Scheduled" if schedule_set else "Posted"
            print(f"  ✅ {label}: {title[:50]}")
            return {"slug": slug, "board": board, "title": title, "success": True,
                    "scheduled": schedule_set, "publish_time": publish_time.isoformat() if schedule_set else None}
        else:
            print(f"  ⚠️ May need manual check: {title[:50]}")
            return {"slug": slug, "board": board, "title": title, "success": False,
                    "error": "Save confirmation not detected"}

    except Exception as e:
        print(f"  ❌ Failed: {e}")
        return {"slug": slug, "board": board, "title": title, "success": False, "error": str(e)[:200]}
    finally:
        await page.close()


async def main():
    import argparse
    parser = argparse.ArgumentParser(description="QFINHUB Pinterest Batch Scheduler")
    parser.add_argument("--now", action="store_true", help="Post immediately (no scheduling)")
    parser.add_argument("--days", type=int, default=5, help="Days to schedule across (default: 5)")
    parser.add_argument("--dry-run", action="store_true", help="Show schedule without posting")
    parser.add_argument("--headless", action="store_true", default=True, help="Run headless (default)")
    parser.add_argument("--visible", action="store_true", help="Show browser window")
    args = parser.parse_args()

    # Load queue
    if not QUEUE_PATH.exists():
        print(f"❌ No queue file at {QUEUE_PATH}")
        print("   Run: python3 scripts/pinterest-daily-gen.py first")
        return

    pins = load_queue()
    if not pins:
        print("❌ Queue is empty. Run generator first.")
        return

    print(f"🚀 QFINHUB Pinterest Batch Scheduler")
    print(f"   {len(pins)} pins queued | {'POST NOW' if args.now else f'Schedule over {args.days} days'}")
    print("=" * 60)

    # Check for already-posted pins
    post_log = load_post_log()
    posted_slugs = {p["slug"] for p in post_log if p.get("success")}
    remaining = [p for p in pins if p["slug"] not in posted_slugs]

    if len(remaining) < len(pins):
        print(f"⏭️ {len(pins) - len(remaining)} already posted — skipping")
        pins = remaining

    if not pins:
        print("✅ All pins already posted!")
        return

    # Compute schedule
    if not args.now:
        schedule = compute_schedule(pins, args.days)
        print(f"\n📅 Schedule: {len(pins)} pins over {args.days} days:")
        for pin, pt in schedule[:5]:
            print(f"   {pt.strftime('%b %d %I:%M %p')} — {pin['boardName']}: {pin['title'][:50]}...")
        if len(schedule) > 5:
            print(f"   ... and {len(schedule)-5} more")
    else:
        schedule = [(pin, datetime.now()) for pin in pins]

    if args.dry_run:
        print(f"\n🔍 DRY RUN — no pins posted")
        return

    # ─── Post via CloakBrowser ───
    print(f"\n🕵️ Launching CloakBrowser...")

    try:
        from cloakbrowser import launch_persistent_context_async
    except ImportError:
        print("❌ CloakBrowser not installed. Install: pip install cloakbrowser")
        return

    context = await launch_persistent_context_async(
        str(SESSION_DIR),
        headless=not args.visible,
        humanize=True,
        human_preset="careful",
        viewport={"width": 1280, "height": 900},
    )

    try:
        # Check login
        logged_in, _ = await login_check(context)
        if not logged_in:
            print("⚠️ Not logged in to Pinterest!")
            print("   Run visible mode to login first:")
            print("   python3 scripts/pinterest-batch-schedule.py --visible")
            await context.close()
            return

        print("✅ Logged in to Pinterest")

        # Post each pin
        posted = 0
        failed = 0
        for i, (pin, publish_time) in enumerate(schedule):
            # Human pause between pins (variable)
            if i > 0:
                delay = random.uniform(3, 8)
                print(f"  ⏳ Pausing {delay:.1f}s...")
                await asyncio.sleep(delay)

            result = await post_pin_with_scheduling(
                context, pin, publish_time, now_mode=args.now
            )

            entry = {
                "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
                "slug": result["slug"],
                "board": result["board"],
                "title": result["title"],
                "success": result["success"],
                "scheduled": result.get("scheduled", False),
                "publish_time": result.get("publish_time"),
                "error": result.get("error", ""),
            }
            post_log.append(entry)
            save_post_log(post_log)

            if result["success"]:
                posted += 1
            else:
                failed += 1

            # Save session every 5 pins
            if (i + 1) % 5 == 0:
                print(f"  💾 Progress: {posted} posted, {failed} failed")

        print(f"\n{'='*60}")
        print(f"✅ Batch complete: {posted} posted, {failed} failed, {len(pins)} total")
        print(f"   Post log: {POST_LOG}")

    finally:
        await context.close()

    # Summary
    print(f"\n📊 Remaining in queue: {len(pins) - posted}")
    if not args.now:
        print(f"   Next batch scheduled to start: tomorrow")


if __name__ == "__main__":
    asyncio.run(main())
