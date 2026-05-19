#!/usr/bin/env python3
"""
X/Twitter Login — Human Mouse + Human Typing
Mouse moves like a real human (Bezier curves, variable speed, overshoot).
Types letter-by-letter. Alternates email/username until password. Never gives up.
"""
import sys, os, asyncio, random, math, time

sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QFINHUB_ROOT = '/home/admin1/qfinhub'

def get_credentials():
    creds = {}
    with open(f'{QFINHUB_ROOT}/.env.local') as f:
        for line in f:
            if '=' in line and not line.startswith('#'):
                k, v = line.strip().split('=', 1)
                v = v.strip().strip('"').strip("'")
                if k == 'X_EMAIL': creds['email'] = v
                elif k == 'X_PASSWORD': creds['password'] = v
                elif k == 'X_USERNAME': creds['username'] = v
    return creds


# ═══════════════════════════════════════════
#  HUMAN MOUSE MOVEMENT
# ═══════════════════════════════════════════

def bezier_point(t, p0, p1, p2, p3):
    """Cubic Bezier at time t (0-1)."""
    u = 1 - t
    x = u**3 * p0[0] + 3*u**2*t * p1[0] + 3*u*t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3*u**2*t * p1[1] + 3*u*t**2 * p2[1] + t**3 * p3[1]
    return (x, y)

def generate_path(start_x, start_y, end_x, end_y, steps=40):
    """Generate a human-like Bezier mouse path from start to end."""
    dx = end_x - start_x
    dy = end_y - start_y
    
    # Control points with natural overshoot/curve
    cp1_x = start_x + dx * random.uniform(0.2, 0.4) + random.uniform(-50, 50)
    cp1_y = start_y + dy * random.uniform(0.1, 0.3) + random.uniform(-30, 30)
    cp2_x = start_x + dx * random.uniform(0.6, 0.8) + random.uniform(-40, 40)
    cp2_y = start_y + dy * random.uniform(0.5, 0.7) + random.uniform(-20, 20)
    
    # Add slight overshoot to make it human-like
    overshoot_factor = random.uniform(0, 0.08) if random.random() < 0.3 else 0
    final_x = end_x + dx * overshoot_factor
    final_y = end_y + dy * overshoot_factor
    
    path = []
    for i in range(steps + 1):
        t = i / steps
        point = bezier_point(t,
            (start_x, start_y),
            (cp1_x, cp1_y),
            (cp2_x, cp2_y),
            (final_x, final_y)
        )
        path.append(point)
    
    # If we overshot, add a small correction back to the exact target
    if overshoot_factor > 0:
        path.append((end_x, end_y))
    
    return path

async def human_mouse_move(page, target_x, target_y, from_x=None, from_y=None):
    """Move mouse to target with human-like Bezier curve."""
    import random as rnd
    
    # Get current position if not provided
    if from_x is None or from_y is None:
        try:
            pos = await page.evaluate("""
                var result = {x: window._lastMouseX || 400, y: window._lastMouseY || 300};
                result;
            """)
            from_x = pos.get('x', 400)
            from_y = pos.get('y', 300)
        except:
            from_x = random.randint(100, 700)
            from_y = random.randint(100, 500)
    
    steps = random.randint(25, 50)
    path = generate_path(from_x, from_y, target_x, target_y, steps)
    
    for i, (x, y) in enumerate(path):
        # Variable speed — faster in middle, slower at start/end
        progress = i / len(path)
        if progress < 0.15 or progress > 0.85:
            delay = random.uniform(8, 20)  # Slower at edges
        else:
            delay = random.uniform(3, 10)  # Faster in middle
        
        await page.mouse.move(x, y)
        await page.wait_for_timeout(int(delay))
    
    # Track position for next move
    try:
        await page.evaluate(f"window._lastMouseX = {target_x}; window._lastMouseY = {target_y};")
    except:
        pass
    
    # Small pause after arriving (human re-focuses)
    await page.wait_for_timeout(random.randint(100, 350))

async def human_click(page, selector):
    """Click an element with full human mouse movement."""
    import random as rnd
    
    # Get the element's bounding box
    box = await page.locator(selector).first.bounding_box()
    if not box:
        print(f"   ⚠️  Element not found: {selector}")
        return False
    
    # Target: random point within the element (humans don't click dead center)
    target_x = box['x'] + rnd.uniform(box['width'] * 0.1, box['width'] * 0.9)
    target_y = box['y'] + rnd.uniform(box['height'] * 0.1, box['height'] * 0.9)
    
    # Move mouse like a human
    await human_mouse_move(page, target_x, target_y)
    
    # Small pause before clicking (human decision moment)
    await page.wait_for_timeout(rnd.randint(50, 200))
    
    # Click
    await page.mouse.click(target_x, target_y)
    
    # Track position
    try:
        await page.evaluate(f"window._lastMouseX = {target_x}; window._lastMouseY = {target_y};")
    except:
        pass
    
    return True


# ═══════════════════════════════════════════
#  HUMAN TYPING
# ═══════════════════════════════════════════

async def human_type(page, text: str):
    """Type text one character at a time with natural variation."""
    import random as rnd
    for char in text:
        await page.keyboard.type(char, delay=rnd.randint(60, 180))
        if rnd.random() < 0.03:
            await page.wait_for_timeout(rnd.randint(200, 600))


# ═══════════════════════════════════════════
#  PAGE STATE DETECTION
# ═══════════════════════════════════════════

async def get_state(page):
    """Read what's on screen — the human eyes."""
    body = await page.locator('body').inner_text()
    pw_count = await page.locator('input[type="password"]').count()
    text_count = await page.locator('input[name="text"]').count()
    
    return {
        'url': page.url,
        'has_password': pw_count > 0,
        'has_text': text_count > 0,
        'body': body,
    }

async def click_button(page, text_match):
    """Find and human-click a button by its text."""
    import random as rnd
    
    # Get all matching buttons
    btns = page.locator(f'[role="button"]:has-text("{text_match}")')
    count = await btns.count()
    
    if count == 0:
        return False
    
    # Click the first visible one
    for i in range(count):
        btn = btns.nth(i)
        if await btn.is_visible():
            box = await btn.bounding_box()
            if box:
                tx = box['x'] + rnd.uniform(box['width'] * 0.15, box['width'] * 0.85)
                ty = box['y'] + rnd.uniform(box['height'] * 0.15, box['height'] * 0.85)
                await human_mouse_move(page, tx, ty)
                await page.wait_for_timeout(rnd.randint(50, 200))
                await page.mouse.click(tx, ty)
                return True
    
    return False


# ═══════════════════════════════════════════
#  MAIN LOGIN FLOW
# ═══════════════════════════════════════════

async def login():
    import random as rnd
    creds = get_credentials()
    email = creds['email']
    username = creds.get('username', 'qfinhub')
    password = creds['password']
    
    browser = StealthBrowser()
    
    try:
        await browser.init(profile='x-human-mouse', headless=False)
        page = browser._page_obj
        
        # ── Go to X ──
        print("👁️  Navigating to x.com...")
        await page.goto('https://x.com', wait_until='domcontentloaded')
        await page.wait_for_timeout(rnd.randint(3000, 5000))
        
        # ── Human-click "Sign in" ──
        print("👆 Human-clicking 'Sign in'...")
        signin_clicked = await click_button(page, "Sign in")
        
        if not signin_clicked:
            # Try direct link click
            signin_link = page.locator('a:has-text("Sign in")')
            if await signin_link.count() > 0:
                box = await signin_link.first.bounding_box()
                if box:
                    tx = box['x'] + rnd.uniform(box['width'] * 0.2, box['width'] * 0.8)
                    ty = box['y'] + rnd.uniform(box['height'] * 0.2, box['height'] * 0.8)
                    await human_mouse_move(page, tx, ty)
                    await page.wait_for_timeout(rnd.randint(100, 300))
                    await page.mouse.click(tx, ty)
                    signin_clicked = True
        
        if not signin_clicked:
            print("⚠️  Could not find Sign in, going directly to login...")
            await page.goto('https://x.com/i/flow/login', wait_until='domcontentloaded')
        
        await page.wait_for_timeout(rnd.randint(3000, 5000))
        
        # ── PHASE 1: Email/Username persistence loop ──
        toggle = True  # True=email, False=username
        attempts = 0
        max_attempts = 20
        
        while attempts < max_attempts:
            state = await get_state(page)
            
            # Password reached!
            if state['has_password']:
                print("✅ Password field appeared!")
                break
            
            if state['has_text']:
                value = email if toggle else username
                label = "email" if toggle else "username"
                
                print(f"⌨️  Typing {label} letter-by-letter (attempt {attempts + 1})...")
                
                # Human-click the text input
                inp_box = await page.locator('input[name="text"]').first.bounding_box()
                if inp_box:
                    tx = inp_box['x'] + rnd.uniform(inp_box['width'] * 0.2, inp_box['width'] * 0.8)
                    ty = inp_box['y'] + rnd.uniform(inp_box['height'] * 0.3, inp_box['height'] * 0.7)
                    await human_mouse_move(page, tx, ty)
                    await page.wait_for_timeout(rnd.randint(100, 300))
                    await page.mouse.click(tx, ty)
                
                await page.wait_for_timeout(rnd.randint(300, 700))
                
                # Clear and type
                await page.locator('input[name="text"]').first.fill('')
                await page.wait_for_timeout(rnd.randint(150, 400))
                await human_type(page, value)
                await page.wait_for_timeout(rnd.randint(800, 2000))
                
                # Human-click Next
                print("👆 Human-clicking Next...")
                await click_button(page, "Next")
                await page.wait_for_timeout(rnd.randint(5000, 8000))
                
                toggle = not toggle
                attempts += 1
            else:
                print(f"⏳ No text input visible... waiting (URL: {state['url'][:60]})")
                await page.wait_for_timeout(3000)
                attempts += 1
        
        if attempts >= max_attempts and not (await get_state(page))['has_password']:
            print("❌ Never reached password step")
            await browser.shutdown()
            return False
        
        # ── PHASE 2: Password persistence loop ──
        pw_attempts = 0
        max_pw = 15
        
        while pw_attempts < max_pw:
            state = await get_state(page)
            
            if 'Home' in state['body'] or 'Timeline' in state['body']:
                print("🎉 Already logged in!")
                break
            
            if state['has_password']:
                print(f"🔑 Typing password (attempt {pw_attempts + 1})...")
                
                # Human-click password field
                pw_box = await page.locator('input[type="password"]').first.bounding_box()
                if pw_box:
                    tx = pw_box['x'] + rnd.uniform(pw_box['width'] * 0.2, pw_box['width'] * 0.8)
                    ty = pw_box['y'] + rnd.uniform(pw_box['height'] * 0.3, pw_box['height'] * 0.7)
                    await human_mouse_move(page, tx, ty)
                    await page.wait_for_timeout(rnd.randint(100, 300))
                    await page.mouse.click(tx, ty)
                
                await page.wait_for_timeout(rnd.randint(300, 700))
                await page.locator('input[type="password"]').first.fill('')
                await page.wait_for_timeout(rnd.randint(150, 400))
                await human_type(page, password)
                await page.wait_for_timeout(rnd.randint(800, 2000))
                
                # Human-click Log in
                print("👆 Human-clicking Log in...")
                await click_button(page, "Log in")
                await page.wait_for_timeout(rnd.randint(7000, 10000))
                
                pw_attempts += 1
            elif state['has_text']:
                # Bounced back
                value = email if toggle else username
                label = "email" if toggle else "username"
                print(f"🔄 Bounced back — re-entering {label}...")
                
                inp_box = await page.locator('input[name="text"]').first.bounding_box()
                if inp_box:
                    tx = inp_box['x'] + rnd.uniform(inp_box['width'] * 0.2, inp_box['width'] * 0.8)
                    ty = inp_box['y'] + rnd.uniform(inp_box['height'] * 0.3, inp_box['height'] * 0.7)
                    await human_mouse_move(page, tx, ty)
                    await page.wait_for_timeout(rnd.randint(100, 300))
                    await page.mouse.click(tx, ty)
                
                await page.wait_for_timeout(rnd.randint(300, 700))
                await page.locator('input[name="text"]').first.fill('')
                await page.wait_for_timeout(rnd.randint(150, 400))
                await human_type(page, value)
                await page.wait_for_timeout(rnd.randint(800, 2000))
                await click_button(page, "Next")
                await page.wait_for_timeout(rnd.randint(5000, 8000))
                
                toggle = not toggle
                pw_attempts += 1
            else:
                # Try navigating home to check
                await page.goto('https://x.com/home', wait_until='domcontentloaded')
                await page.wait_for_timeout(4000)
                body = await page.locator('body').inner_text()
                if 'Home' in body or 'Timeline' in body:
                    print("✅ Logged in!")
                    break
                pw_attempts += 1
        
        # ── Verify ──
        await page.goto('https://x.com/home', wait_until='domcontentloaded')
        await page.wait_for_timeout(4000)
        body = await page.locator('body').inner_text()
        
        if 'Home' in body or 'Timeline' in body or 'Following' in body:
            print("🎉 LOGIN SUCCESSFUL!")
            await browser.save_session('x-engagement-bot')
            print("💾 Session saved")
            return True
        else:
            print(f"❌ Failed. Page: {body[:300]}")
            return False
            
    except Exception as e:
        print(f"💥 Error: {e}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        await browser.shutdown()

if __name__ == '__main__':
    result = asyncio.run(login())
    print(f"\n{'✅ SUCCESS' if result else '❌ FAILED'}")
    sys.exit(0 if result else 1)
