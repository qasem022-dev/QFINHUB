#!/usr/bin/env python3
"""
QFINHUB Pinterest Poster — CloakBrowser (Sync)
Posts pins directly using CloakBrowser's sync API — no asyncio, no conflicts.
Proven: CloakBrowser's 58 C++ Chromium patches beat reCAPTCHA.

Usage:
  python3 scripts/pinterest-cloak-post.py              # Post 5 pins
  python3 scripts/pinterest-cloak-post.py --count 10   # Post 10 pins
  python3 scripts/pinterest-cloak-post.py --all        # Post ALL unposted
"""

import sys, os, json, time, random
from pathlib import Path

QUEUE_PATH = "/home/admin1/qfinhub/.pinterest-data/daily-queue.json"
POST_LOG = "/home/admin1/qfinhub/.pinterest-data/post-log.json"
SESSION_DIR = os.path.expanduser("~/.hermes/cloak-profiles/pinterest-poster")

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, PROJECT_ROOT)


def load_queue():
    with open(QUEUE_PATH) as f:
        return json.load(f)["pins"]


def get_unposted(max_count=None):
    pins = load_queue()
    posted = set()
    if os.path.exists(POST_LOG):
        with open(POST_LOG) as f:
            data = json.load(f)
            existing = data if isinstance(data, list) else data.get("posts", [])
            for e in existing:
                if e.get("success"):
                    posted.add(e.get("slug", ""))
    unposted = [p for p in pins if p["slug"] not in posted]
    if max_count:
        unposted = unposted[:max_count]
    return unposted


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


def human_pause(seconds=None):
    """Random human-like pause."""
    t = seconds or random.uniform(2.0, 5.0)
    time.sleep(t)


def escape_js(s):
    """Escape string for JavaScript injection."""
    return s.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "\\n").replace("$", "\\$")


def post_pin(page, pin):
    """Post a single pin via Pinterest pin builder using CloakBrowser page."""
    title = pin["title"]
    link = pin["link"]
    board = pin["boardName"]
    img = pin["imagePath"]
    slug = pin["slug"]

    print(f"\n📌 Posting: {title[:55]}...")

    # 1. Navigate to pin builder
    page.goto("https://www.pinterest.com/pin-builder/", wait_until="domcontentloaded", timeout=30000)
    human_pause(5)

    # 2. Upload image
    print("  📤 Uploading image...")
    file_input = page.locator('input[type="file"]')
    file_input.set_input_files(img)
    human_pause(6)

    # 3. Set title
    escaped_title = escape_js(title)
    page.evaluate(f"""
        (function() {{
            var el = document.querySelector('[contenteditable="true"]');
            if (!el) {{
                var divs = document.querySelectorAll('[role="textbox"]');
                el = divs[divs.length - 1] || divs[0];
            }}
            if (el) {{
                el.focus();
                el.textContent = '{escaped_title}';
                el.dispatchEvent(new Event('input', {{ bubbles: true }}));
            }}
        }})()
    """)
    human_pause(2)
    print("  ✏️ Title set")

    # 4. Set link
    escaped_link = escape_js(link)
    page.evaluate(f"""
        (function() {{
            var inputs = document.querySelectorAll('input');
            for (var el of inputs) {{
                var ph = (el.placeholder || '').toLowerCase();
                if (ph.includes('link') || ph.includes('url') || ph.includes('website')) {{
                    var ns = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
                    ns.call(el, '{escaped_link}');
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    return;
                }}
            }}
        }})()
    """)
    human_pause(1.5)
    print("  🔗 Link set")

    # 5. Select board
    escaped_board = escape_js(board)
    page.evaluate("""
        (function() {
            var all = document.querySelectorAll('div[role="button"], button');
            for (var el of all) {
                var t = (el.textContent || '').toLowerCase();
                if (t.includes('board') || t.includes('save to') || t.includes('profile')) {
                    el.click();
                    break;
                }
            }
        })()
    """)
    human_pause(3)

    page.evaluate(f"""
        (function() {{
            var items = document.querySelectorAll('div[role="option"], div[role="menuitem"], li, div, span');
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
    """)
    human_pause(2)
    print(f"  📋 Board: {board}")

    # 6. Click Save/Publish
    page.evaluate("""
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
    """)
    human_pause(7)

    # 7. Verify
    html = page.content()
    success = any(w in html.lower() for w in ["published", "saved", "pin created", "your pin", "just saved"])

    if success:
        print(f"  ✅ Posted: {title[:50]}")
        log_post(slug, board, title, True)
    else:
        print(f"  ⚠️ Manual check needed: {title[:50]}")
        log_post(slug, board, title, False, "Confirmation not detected")

    return success


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=5)
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    max_count = None if args.all else args.count
    pins = get_unposted(max_count)

    if not pins:
        print("✅ No pins to post — all caught up!")
        return

    print(f"🚀 CloakBrowser Pinterest Poster — {len(pins)} pins")
    print("=" * 50)

    if args.dry_run:
        for p in pins:
            print(f"   📌 {p['boardName']}: {p['title'][:60]}")
        print(f"\n🔍 DRY RUN — {len(pins)} pins would be posted")
        return

    # ─── CloakBrowser Sync Launch ───
    print("\n🕵️ Launching CloakBrowser...")
    from cloakbrowser import launch_persistent_context

    context = launch_persistent_context(
        SESSION_DIR,
        headless=True,
        humanize=True,
        human_preset="careful",
        viewport={"width": 1280, "height": 900},
    )

    try:
        page = context.new_page()

        # Login check
        page.goto("https://www.pinterest.com/", wait_until="domcontentloaded", timeout=30000)
        human_pause(5)
        html = page.content()
        url = page.url
        logged_in = ("create-menu-button" in html or "app-shell" in html) and "login" not in url

        if not logged_in:
            print("⚠️ Not logged in to Pinterest!")
            print("   Run with visible browser to login first:")
            print("   Set headless=False in script and re-run")
            context.close()
            return

        print("✅ Logged in to Pinterest")

        # Post pins
        posted = 0
        for i, pin in enumerate(pins):
            if i > 0:
                human_pause(random.uniform(4, 8))

            try:
                if post_pin(page, pin):
                    posted += 1
            except Exception as e:
                print(f"  ❌ Error: {pin['title'][:50]} — {e}")
                log_post(pin["slug"], pin["boardName"], pin["title"], False, str(e)[:200])

            human_pause(2)

        print(f"\n✅ {posted}/{len(pins)} pins posted")

    finally:
        context.close()

    print(f"\n📊 Post log: {POST_LOG}")


if __name__ == "__main__":
    main()
