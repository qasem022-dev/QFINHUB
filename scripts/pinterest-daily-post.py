#!/usr/bin/env python3
"""Post 2 pins via Pinterest internal API using CloakBrowser."""
import os, sys, json, time

os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib") + ":" + os.environ.get("LD_LIBRARY_PATH", "")

from cloakbrowser import launch_persistent_context

# Load pin plan
with open("/tmp/pin-plan.json") as f:
    all_pins = json.load(f)

# Take first 2 pins for direct posting
pins_to_post = all_pins[:2]
print(f"Posting {len(pins_to_post)} pins via Pinterest internal API")

results = []

context = launch_persistent_context(
    user_data_dir=os.path.expanduser("~/.hermes/cloak-profiles/pinterest-poster"),
    headless=True,
    humanize=True,
)
page = context.new_page()

try:
    # 1. Navigate to ANY Pinterest page (just need auth session)
    page.goto("https://www.pinterest.com/", wait_until="domcontentloaded", timeout=30000)
    time.sleep(4)

    # Auth check
    if "login" in page.url.lower() or "signin" in page.url.lower():
        print("ERROR: Not authenticated - need to login first")
        results.append({"error": "not_authenticated", "slug": "all"})
    else:
        print(f"Authenticated, on URL: {page.url}")

        # 2. Get CSRF token
        csrf = page.evaluate("""
            (function() {
                var cookies = document.cookie.split(';');
                for (var c of cookies) {
                    c = c.trim();
                    if (c.startsWith('csrftoken=')) return c.split('=')[1];
                }
                return null;
            })()
        """)
        print(f"CSRF token: {csrf[:20] if csrf else 'NONE'}...")
        
        if not csrf:
            print("ERROR: No CSRF token found")
            results.append({"error": "no_csrf", "slug": "all"})
        else:
            for pin in pins_to_post:
                print(f"Posting: {pin['slug']} -> {pin['board_name']}")
                
                # Escape strings
                def esc(s):
                    s = s.replace('\\', '\\\\').replace("'", "\\'")
                    return s
                
                escaped_title = esc(pin['title'])
                escaped_desc = esc(pin['description'])
                escaped_link = esc(pin['link'])
                escaped_image = esc(pin['image_url'])
                escaped_board = pin['board_id']
                
                result = page.evaluate("""
                    async function() {
                        try {
                            let data = JSON.stringify({"options": {
                                "board_id": "%s",
                                "title": "%s",
                                "description": "%s",
                                "image_url": "%s",
                                "link": "%s"
                            }, "context": {}});
                            let resp = await fetch('/resource/PinResource/create/', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded',
                                    'X-CSRFToken': '%s',
                                    'X-Requested-With': 'XMLHttpRequest',
                                    'Accept': 'application/json'
                                },
                                body: 'source_url=/pin-builder/&data=' + encodeURIComponent(data)
                            });
                            let text = await resp.text();
                            return text;
                        } catch(e) {
                            return JSON.stringify({"error": e.message});
                        }
                    }
                """ % (escaped_board, escaped_title, escaped_desc, escaped_image, escaped_link, csrf))
                
                # Parse response
                try:
                    resp_json = json.loads(result)
                    status = resp_json.get('resource_response', {}).get('status', 'unknown')
                    pin_id = resp_json.get('resource_response', {}).get('data', {}).get('node_id', '')
                except:
                    status = 'parse_fail'
                    pin_id = ''
                
                print(f"  Result: status={status}, pin_id={pin_id[:30]}...")
                results.append({
                    "slug": pin['slug'],
                    "title": pin['title'],
                    "board": pin['board_name'],
                    "image": pin['image'],
                    "success": status == 'success',
                    "response_preview": result[:500],
                    "pin_id": pin_id,
                    "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S.000000+00:00')
                })
                time.sleep(3)  # respect rate limit

finally:
    context.close()

# Save results
with open("/tmp/cloakbrowser-post-results.json", "w") as f:
    json.dump(results, f, indent=2)

print(f"\nDone. Posted {sum(1 for r in results if r.get('success'))}/{len(pins_to_post)} pins successfully")
print("Results saved to /tmp/cloakbrowser-post-results.json")
