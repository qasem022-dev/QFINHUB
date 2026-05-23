#!/usr/bin/env python3
"""
QFINHUB Pinterest Daily Poster — posts N pins from the daily queue.
Used by cron to spread pins across different times of day.

Usage:
  python3 scripts/pinterest-daily-post.py           # Post 5 pins (default)
  python3 scripts/pinterest-daily-post.py --count 10 # Post 10 pins
  python3 scripts/pinterest-daily-post.py --dry-run  # Check what would be posted
"""

import sys, os, json, asyncio, time

QUEUE_PATH = "/home/admin1/qfinhub/.pinterest-data/daily-queue.json"
POST_LOG = "/home/admin1/qfinhub/.pinterest-data/post-log.json"

sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser


def load_queue():
    with open(QUEUE_PATH) as f:
        return json.load(f)["pins"]


def get_unposted(count=5):
    """Return up to 'count' unposted pins from the daily queue."""
    pins = load_queue()
    posted = set()

    if os.path.exists(POST_LOG):
        with open(POST_LOG) as f:
            try:
                data = json.load(f)
                existing = data if isinstance(data, list) else data.get("posts", [])
                for entry in existing:
                    if entry.get("success"):
                        posted.add(entry.get("slug", ""))
            except:
                pass

    unposted = [p for p in pins if p["slug"] not in posted]
    return unposted[:count]


def log_post(slug, board, title, success, error=""):
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "slug": slug,
        "board": board,
        "title": title,
        "success": success,
        "error": error,
    }
    log = []
    if os.path.exists(POST_LOG):
        with open(POST_LOG) as f:
            try:
                data = json.load(f)
                log = data if isinstance(data, list) else data.get("posts", [])
            except:
                log = []
    log.append(entry)
    with open(POST_LOG, "w") as f:
        json.dump({"posts": log}, f, indent=2)


async def post_pin(browser, pin):
    """Post a single pin via Pinterest pin builder."""
    title = pin["title"]
    link = pin["link"]
    board = pin["boardName"]
    img = pin["imagePath"]
    slug = pin["slug"]

    print(f"\n📌 Posting: {title[:55]}...")

    await browser.navigate('https://www.pinterest.com/pin-builder/')
    await browser.wait(4000)

    # Upload image
    print("  📤 Uploading image...")
    await browser.upload_file('input[type="file"]', img)
    await browser.wait(5000)

    # Set title
    escaped_title = title.replace("\\", "\\\\").replace("'", "\\'").replace("$", "\\$")
    await browser.evaluate(f'''
        (function() {{
            var el = document.querySelector('[contenteditable="true"]') ||
                     document.querySelector('textarea') ||
                     document.querySelector('[role="textbox"]');
            if (el) {{
                el.focus();
                el.textContent = '{escaped_title}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        }})()
    ''')
    await browser.wait(2000)

    # Set link
    escaped_link = link.replace("\\", "\\\\").replace("'", "\\'")
    await browser.evaluate(f'''
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
    ''')
    await browser.wait(1500)

    # Select board
    escaped_board = board.replace("\\", "\\\\").replace("'", "\\'")
    await browser.evaluate('''
        (function() {
            var all = document.querySelectorAll('div[role="button"], button, div');
            for (var el of all) {
                var t = (el.textContent || '').toLowerCase();
                if (t.includes('board') || t.includes('save to')) {
                    el.click();
                    break;
                }
            }
        })()
    ''')
    await browser.wait(2000)

    await browser.evaluate(f'''
        (function() {{
            var items = document.querySelectorAll('div[role="option"], div[role="menuitem"], li, div');
            for (var el of items) {{
                if (el.textContent.trim() === '{escaped_board}') {{
                    el.click();
                    return;
                }}
            }}
            var search = '{escaped_board[:20]}';
            for (var el of items) {{
                if (el.textContent.includes(search)) {{
                    el.click();
                    return;
                }}
            }}
        }})()
    ''')
    await browser.wait(2000)

    # Click Save/Publish
    await browser.evaluate('''
        (function() {
            var btns = document.querySelectorAll('button, div[role="button"]');
            for (var btn of btns) {
                var t = (btn.textContent || '').trim().toLowerCase();
                if (t === 'save' || t === 'publish' || t === 'done' || t === 'create pin') {
                    btn.click();
                    return;
                }
            }
        })()
    ''')
    await browser.wait(6000)

    html = await browser.get_html()
    success = any(w in html.lower() for w in ["published", "saved", "pin created", "your pin"])

    if success:
        print(f"  ✅ Posted: {title[:50]}")
        log_post(slug, board, title, True)
    else:
        print(f"  ⚠️ May need manual check: {title[:50]}")
        log_post(slug, board, title, False, "Save confirmation not detected")

    return success


async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    pins = get_unposted(args.count)

    if not pins:
        print("✅ No pins to post — all caught up!")
        return

    print(f"🚀 QFINHUB Daily Poster — {len(pins)} pins")
    print("=" * 50)

    if args.dry_run:
        for p in pins:
            print(f"   📌 {p['boardName']}: {p['title'][:60]}")
        print(f"\n🔍 DRY RUN — {len(pins)} pins would be posted")
        return

    browser = StealthBrowser()

    try:
        await browser.init(profile='pinterest-traffic', headless=True)

        # Login check
        await browser.navigate('https://www.pinterest.com/')
        await browser.wait(5000)
        html = await browser.get_html()
        url = await browser.get_url()
        logged_in = ('create-menu-button' in html or 'app-shell' in html) and 'login' not in (url or '')

        if not logged_in:
            print("⚠️ Not logged in. Skipping.")
            await browser.shutdown()
            return

        print("✅ Logged in")

        posted = 0
        for pin in pins:
            try:
                if await post_pin(browser, pin):
                    posted += 1
            except Exception as e:
                print(f"  ❌ Failed: {pin['title'][:50]} — {e}")
                log_post(pin["slug"], pin["boardName"], pin["title"], False, str(e)[:100])

            await browser.save_session('pinterest-traffic')
            await browser.wait(3000)

        print(f"\n✅ {posted}/{len(pins)} posted")

    finally:
        await browser.save_session('pinterest-traffic')
        await browser.shutdown()


if __name__ == "__main__":
    asyncio.run(main())
