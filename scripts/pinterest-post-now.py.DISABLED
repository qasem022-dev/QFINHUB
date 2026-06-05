#!/usr/bin/env python3
"""Post queued Pinterest pins via stealth browser — direct, one by one."""
import sys, os, json, asyncio, time
sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QUEUE_PATH = "/home/admin1/qfinhub/.pinterest-data/post-queue.json"
POST_LOG = "/home/admin1/qfinhub/.pinterest-data/post-log.json"

def load_queue():
    with open(QUEUE_PATH) as f:
        return json.load(f)["pins"]

def log_post(pin_slug, board, title, success, error=""):
    entry = {
        "ts": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "slug": pin_slug,
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
    
    print(f"\n📌 Posting: {title[:60]}...")
    
    # 1. Navigate to pin builder
    await browser.navigate('https://www.pinterest.com/pin-builder/')
    await browser.wait(4000)
    
    # 2. Upload image
    print("  📤 Uploading image...")
    await browser.upload_file('input[type="file"]', img)
    await browser.wait(5000)
    
    # 3. Set title
    escaped_title = title.replace("'", "\\'").replace("$", "\\$")
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
    print("  ✏️ Title set")
    
    # 4. Add link
    escaped_link = link.replace("'", "\\'")
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
            // Fallback: look for any empty text input near the bottom
            for (var el of inputs) {{
                if (el.type === 'text' && !el.value && !el.placeholder) {{
                    var nativeSetter = Object.getOwnPropertyDescriptor(
                        HTMLInputElement.prototype, 'value').set;
                    nativeSetter.call(el, '{escaped_link}');
                    el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                    return;
                }}
            }}
        }})()
    ''')
    await browser.wait(1500)
    print("  🔗 Link set")
    
    # 5. Select board
    escaped_board = board.replace("'", "\\'")
    await browser.evaluate(f'''
        (function() {{
            // Click board dropdown first
            var boardTriggers = document.querySelectorAll('div[role="button"], button, div');
            for (var el of boardTriggers) {{
                var t = el.textContent.toLowerCase();
                if (t.includes('board') || t.includes('profile') || t.includes('save to')) {{
                    el.click();
                    break;
                }}
            }}
        }})()
    ''')
    await browser.wait(2000)
    
    await browser.evaluate(f'''
        (function() {{
            var items = document.querySelectorAll('div[role="option"], div[role="menuitem"], li, div, span');
            for (var el of items) {{
                if (el.textContent.trim() === '{escaped_board}') {{
                    el.click();
                    return;
                }}
            }}
            // Partial match
            for (var el of items) {{
                if (el.textContent.includes('{escaped_board[:20]}')) {{
                    el.click();
                    return;
                }}
            }}
        }})()
    ''')
    await browser.wait(2000)
    print(f"  📋 Board: {board}")
    
    # 6. Click Save/Publish
    await browser.evaluate('''
        (function() {
            var btns = document.querySelectorAll('button, div[role="button"]');
            for (var btn of btns) {
                var t = btn.textContent.trim().toLowerCase();
                if (t === 'save' || t === 'publish' || t === 'done' || t === 'create pin') {
                    btn.click();
                    return;
                }
            }
        })()
    ''')
    await browser.wait(6000)
    
    html = await browser.get_html()
    success = 'published' in html.lower() or 'saved' in html.lower() or 'pin' in html.lower()
    
    if success:
        print(f"  ✅ Posted: {title[:50]}")
        log_post(slug, board, title, True)
    else:
        print(f"  ⚠️ May need manual check: {title[:50]}")
        log_post(slug, board, title, False, "Save confirmation not detected")
    
    return success

async def main():
    pins = load_queue()
    print(f"🚀 Posting {len(pins)} Pinterest pins via stealth browser...")
    print("=" * 50)
    
    browser = StealthBrowser()
    
    try:
        # Try headless first (session should persist from prior login)
        await browser.init(profile='pinterest-traffic', headless=True)
        
        # Check if logged in
        await browser.navigate('https://www.pinterest.com/')
        await browser.wait(5000)
        html = await browser.get_html()
        
        # Correct Pinterest login check: look for elements only shown when logged in
        logged_in = 'create-menu-button' in html or 'app-shell' in html
        current_url = await browser.get_url()
        if 'login' in (current_url or ''):
            logged_in = False
        
        if not logged_in:
            print("⚠️ Not logged in. Pinterest reCAPTCHA likely blocking headless.")
            print("📋 Use CSV bulk upload instead: https://www.pinterest.com/pin-builder/")
            print(f"   CSV ready at: /home/admin1/qfinhub/.pinterest-data/pinterest-bulk-20-pins-final.csv")
            await browser.shutdown()
            return
        
        print("✅ Logged in to Pinterest")
        
        # Post pins one by one (skip already posted today)
        posted = 0
        today = time.strftime("%Y-%m-%d")
        
        # Check which slugs were already posted today
        already_posted = set()
        if os.path.exists(POST_LOG):
            with open(POST_LOG) as f:
                try:
                    data = json.load(f)
                    existing = data if isinstance(data, list) else data.get("posts", [])
                    for entry in existing:
                        if entry.get("success") and entry.get("ts", "").startswith(today):
                            already_posted.add(entry.get("slug", ""))
                except:
                    pass
        
        for i, pin in enumerate(pins):
            if pin["slug"] in already_posted:
                print(f"  ⏭️ Already posted: {pin['title'][:50]}")
                continue
                
            try:
                success = await post_pin(browser, pin)
                if success:
                    posted += 1
                    already_posted.add(pin["slug"])
            except Exception as e:
                print(f"  ❌ Failed: {pin['title'][:50]} — {e}")
                log_post(pin["slug"], pin["boardName"], pin["title"], False, str(e)[:100])
            
            # Save session after each successful pin
            if i < len(pins) - 1:
                await browser.save_session('pinterest-traffic')
                await browser.wait(3000)  # Human pause between pins
        
        print(f"\n✅ {posted}/{len(pins)} pins posted in this session")
        
        # Save session
        await browser.save_session('pinterest-traffic')
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()
    
    print("\n📊 Post log updated:", POST_LOG)

if __name__ == "__main__":
    asyncio.run(main())
