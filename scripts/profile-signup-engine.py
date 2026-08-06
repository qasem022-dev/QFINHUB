#!/usr/bin/env python3
"""
QFINHUB Profile Signup Engine
Automates profile creation on high-DR platforms with residential proxy.
Designed to bypass Cloudflare/datacenter IP blocks.

Usage:
  python3 scripts/profile-signup-engine.py --platform gravatar
  python3 scripts/profile-signup-engine.py --platform all  # run all platforms
  python3 scripts/profile-signup-engine.py --list           # show all platforms
  python3 scripts/profile-signup-engine.py --status        # show current status
"""

import os
import sys
import json
import time
import random
import re
from pathlib import Path
from datetime import datetime

PROJECT = Path("/home/admin1/qfinhub")
DATA_DIR = PROJECT / ".optimizer-data"
PROFILE_DIR = os.path.expanduser("~/.hermes/cloak-profiles/qfinhub-profiles")
LOG_PATH = DATA_DIR / "profile-signups.json"

sys.path.insert(0, os.path.expanduser("~/.hermes"))

# QFINHUB profile data
PROFILE = {
    "name": "QFINHUB",
    "tagline": "Free financial calculators for everyone",
    "description": "QFINHUB provides 125+ free financial calculators for mortgages, loans, investments, retirement, taxes, and personal finance. No signup required, no data collected, mobile-friendly, and accurate to industry standards.",
    "short_desc": "125+ free financial calculators - mortgages, loans, investments, retirement, taxes. No signup.",
    "url": "https://www.qfinhub.com",
    "logo": "https://www.qfinhub.com/qfinhub-logo.svg",
    "email": "q.finhub@gmail.com",
    "twitter": "@qfinhub",
    "category": "Finance",
    "tags": "finance,calculator,mortgage,investment,retirement,tax,loan,free,personal-finance",
}

PLATFORMS = [
    {
        "id": "gravatar",
        "name": "Gravatar",
        "url": "https://en.gravatar.com/",
        "dr": 95,
        "type": "avatar_service",
        "signup_steps": ["open_homepage", "check_if_qfinhub_exists", "create_account_if_needed", "upload_avatar", "set_profile"],
    },
    {
        "id": "saashub",
        "name": "SaaSHub",
        "url": "https://www.saashub.com/",
        "submit_url": "https://www.saashub.com/qfinhub/submit",
        "dr": 75,
        "type": "directory",
        "signup_steps": ["open_site", "click_submit", "fill_form", "verify_email"],
    },
    {
        "id": "getapp",
        "name": "GetApp",
        "url": "https://www.getapp.com/",
        "submit_url": "https://www.getapp.com/submit-software/",
        "dr": 84,
        "type": "directory",
        "signup_steps": ["open_site", "click_submit_software", "create_account", "fill_form"],
    },
    {
        "id": "indie_hackers",
        "name": "Indie Hackers",
        "url": "https://www.indiehackers.com/",
        "submit_url": "https://www.indiehackers.com/products/new",
        "dr": 78,
        "type": "community",
        "signup_steps": ["open_site", "sign_up_github", "submit_product"],
    },
    {
        "id": "capterra",
        "name": "Capterra",
        "url": "https://www.capterra.com/",
        "submit_url": "https://www.capterra.com/p/187043/qfinhub/",
        "dr": 90,
        "type": "directory",
        "signup_steps": ["open_site", "vendor_signup", "claim_or_create"],
    },
    {
        "id": "g2",
        "name": "G2",
        "url": "https://www.g2.com/",
        "submit_url": "https://www.g2.com/products/new",
        "dr": 91,
        "type": "directory",
        "signup_steps": ["open_site", "vendor_signup", "submit_product"],
    },
    {
        "id": "trustpilot",
        "name": "Trustpilot",
        "url": "https://www.trustpilot.com/",
        "dr": 93,
        "type": "review",
        "signup_steps": ["claim_business", "verify_domain"],
    },
    {
        "id": "producthunt_maker",
        "name": "ProductHunt Maker Profile",
        "url": "https://www.producthunt.com/me",
        "dr": 92,
        "type": "community",
        "signup_steps": ["login", "edit_profile", "add_bio_and_url"],
    },
    {
        "id": "about_me",
        "name": "About.me",
        "url": "https://about.me/",
        "dr": 89,
        "type": "personal_profile",
        "signup_steps": ["signup", "choose_template", "fill_bio", "add_links"],
    },
]


def load_state():
    if LOG_PATH.exists():
        with open(LOG_PATH) as f:
            return json.load(f)
    return {"platforms": {}, "last_run": None}


def save_state(state):
    state["last_run"] = datetime.utcnow().isoformat()
    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG_PATH, "w") as f:
        json.dump(state, f, indent=2)


def get_proxy():
    """Load residential proxy."""
    try:
        from proxy_helper import get_playwright_proxy
        return get_playwright_proxy()
    except Exception as e:
        print(f"⚠️ Proxy load failed: {e}")
        return None


def hs(seconds=None):
    """Human-like sleep."""
    if seconds:
        time.sleep(seconds + random.uniform(-0.2, 0.4))
    else:
        time.sleep(random.uniform(1.0, 3.0))


def random_scroll(page):
    """Scroll like a human."""
    for _ in range(random.randint(1, 3)):
        page.evaluate(f"window.scrollBy(0, {random.randint(150, 500)})")
        time.sleep(random.uniform(0.5, 1.5))


def launch_browser(visible=False):
    """Launch CloakBrowser with residential proxy."""
    os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
    from cloakbrowser import launch_persistent_context
    return launch_persistent_context(
        PROFILE_DIR,
        headless=not visible,
        humanize=True,
        human_preset="careful",
        viewport={"width": 1440, "height": 900},
        proxy=get_proxy(),
    )


def check_email_for_verification():
    """Check Gmail IMAP for verification emails OR codes from platforms.
    Returns: URL string, code string, or None.
    """
    try:
        import imaplib
        import email
        from email import policy
        mail = imaplib.IMAP4_SSL("imap.gmail.com", 993)
        env_path = PROJECT / ".env.local"
        env = {}
        for line in env_path.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip().strip('"').strip("'")
        mail.login(env["GMAIL_ADDRESS"], env["GMAIL_APP_PASSWORD"])
        mail.select("INBOX")
        from datetime import timedelta
        date = (datetime.now() - timedelta(days=1)).strftime("%d-%b-%Y")
        typ, data = mail.search(None, f'(SINCE "{date}")')
        if not data or not data[0]:
            mail.close()
            mail.logout()
            return None, None
        # Check the last 10 messages
        candidates = data[0].split()[-10:]
        for num in reversed(candidates):  # most recent first
            typ, msg_data = mail.fetch(num, "(RFC822)")
            if not msg_data[0]:
                continue
            raw = msg_data[0][1]
            if not isinstance(raw, bytes):
                continue
            msg = email.message_from_bytes(raw, policy=policy.default)
            subj = str(msg["Subject"])
            sender = str(msg["From"]).lower()
            # Skip non-verification emails
            if not any(kw in subj.lower() for kw in ["verify", "code", "confirm", "activate", "sign", "login", "auth", "one-time", "pin"]):
                continue
            if not any(d in sender for d in ["gravatar", "wordpress", "saashub", "getapp", "g2", "capterra", "trustpilot", "producthunt", "about.me", "no-reply", "noreply"]):
                continue

            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_content()
                        break
                if not body:
                    for part in msg.walk():
                        if part.get_content_type() == "text/html":
                            body = part.get_content()
                            break
            else:
                body = msg.get_content()

            print(f"  📧 Email found: {subj} (from {sender})")

            # Try URL extraction first
            urls = re.findall(r'https?://[^\s"<>]+(?:verify|confirm|activate|signin|login|auth)[^\s"<>]*', body, re.IGNORECASE)
            if urls:
                # Prefer verify/confirm URLs
                for u in urls:
                    if "token=" in u or "code=" in u or "key=" in u:
                        return u, None
                return urls[0], None

            # Try 2FA code extraction from SUBJECT first (most reliable)
            # Subject pattern: "PIUC6Z is your Gravatar code"
            subj_match = re.search(r'^([A-Z0-9]{4,8})\s+is your', subj)
            if subj_match:
                code = subj_match.group(1)
                if code.isalnum():
                    return None, code

            # Try 2FA code extraction
            # Patterns: "Your code is PIUC6Z", "code: 123456", "PIUC6Z is your Gravatar code"
            code_patterns = [
                r'\b([A-Z0-9]{6,8})\s+is your',
                r'code[:\s]+([A-Z0-9]{4,8})\b',
                r'verification code[:\s]+([A-Z0-9]{4,8})\b',
                r'your\s+code\s+is\s+([A-Z0-9]{4,8})\b',
            ]
            for pat in code_patterns:
                m = re.search(pat, body, re.IGNORECASE)
                if m:
                    code = m.group(1).strip()
                    # Skip if it's a common English word
                    if code.lower() in ["the", "and", "for", "will", "your", "code", "with", "this", "have", "from"]:
                        continue
                    if len(code) >= 4 and len(code) <= 8 and code.isalnum():
                        return None, code

        mail.close()
        mail.logout()
    except Exception as e:
        print(f"  ⚠️ Email check failed: {e}")
    return None, None


def signup_gravatar(context):
    """Sign up for Gravatar - just needs email verification."""
    page = context.new_page()
    print(f"  → Opening Gravatar")
    page.goto("https://en.gravatar.com/", wait_until="domcontentloaded", timeout=30000)
    hs(3)

    # Check if already signed in (look for avatar/profile link)
    page_text = page.content()
    if "Sign out" in page_text or "My Profile" in page_text or "Log out" in page_text:
        print("  ✅ Already signed in to Gravatar")
        # Skip directly to profile fill
        page.close()
        return fill_gravatar_profile(context)

    # Click "Log in" or "Get Started Now"
    try:
        login_btn = page.locator('a:has-text("Log in"), a:has-text("Get Started Now"), button:has-text("Log in")').first
        login_btn.click()
        hs(4)
    except Exception as e:
        print(f"  ⚠️ Could not find Log in button: {e}")
        page.close()
        return {"success": False, "error": "no_login_button"}

    # Sign in with email
    try:
        email_input = page.locator('input[name="usernameOrEmail"], input[type="email"], input[name="email"], input[name="user"], input[name="login"]').first
        if email_input.count() == 0:
            print(f"  ⚠️ No email input on login page. May need WordPress.com auth.")
            page.close()
            return {"success": False, "error": "no_email_field"}
        email_input.fill(PROFILE["email"])
        hs(1)
        submit_btn = page.locator('button[type="submit"], button:has-text("Continue"), button:has-text("Log in"), button:has-text("Sign in")').first
        if submit_btn.count() > 0:
            submit_btn.click()
        else:
            email_input.press("Enter")
        hs(5)
    except Exception as e:
        print(f"  ⚠️ Login form failed: {e}")
        page.close()
        return {"success": False, "error": str(e)}

    # Now we may be on a code-entry page or password page
    # Wait for email verification
    print(f"  📧 Verification code/email sent. Checking inbox...")
    for attempt in range(8):
        verify_url, code = check_email_for_verification()
        if verify_url:
            print(f"  → Verifying via URL: {verify_url[:80]}...")
            page.goto(verify_url, wait_until="domcontentloaded", timeout=30000)
            hs(5)
            break
        elif code:
            print(f"  → Got code: {code}")
            # Find the code input field (Gravatar uses placeholder, no name attr)
            code_input = page.locator('input[placeholder*="code" i], input[name="code"], input[name="otp"], input[name="token"], input[autocomplete="one-time-code"], input[inputmode="numeric"]').first
            if code_input.count() > 0:
                code_input.fill(code)
                hs(2)
                # IMPORTANT: target the "Continue" button specifically, not first submit
                # (multiple submit buttons exist; Continue is the one that submits the code)
                continue_btn = page.locator('button:has-text("Continue")').first
                if continue_btn.count() > 0:
                    continue_btn.click()
                else:
                    code_input.press("Enter")
                # Wait for OAuth redirect
                for wait_i in range(20):
                    hs(2)
                    if "gravatar.com/profile" in page.url or "gravatar.com/me" in page.url:
                        print(f"  ✅ Logged in. URL: {page.url}")
                        break
                else:
                    print(f"  ⚠️ Login redirect incomplete. URL: {page.url}")
                break
            else:
                print(f"  ⚠️ Code received but no code input field found")
                break
        time.sleep(10)
        print(f"  ⏳ Waiting for email (attempt {attempt+1}/8)...")
    else:
        print(f"  ❌ No verification email received in 80s")
        page.close()
        return {"success": False, "error": "no_verification_email"}

    # Now fill the profile
    page.close()
    return fill_gravatar_profile(context)


def fill_gravatar_profile(context):
    """Fill in Gravatar profile (5-step onboarding wizard).
    Steps: 1=Full name, 2=Avatar(skip), 3=About you, 4=Website, 5=Finish
    """
    page = context.new_page()
    try:
        page.goto("https://en.gravatar.com/profile/", wait_until="domcontentloaded", timeout=30000)
        hs(3)
        if "usernameOrEmail" in page.content() or "/log-in" in page.url:
            print(f"  ⚠️ Session not persistent. URL: {page.url}")
            page.close()
            return {"success": False, "error": "not_logged_in"}
        print(f"  ✓ Logged in. On profile page.")

        # Helper: read current step number
        def current_step():
            txt = page.evaluate('document.body.innerText')
            import re
            m = re.search(r'(\d+)\s+of\s+5', txt)
            return int(m.group(1)) if m else 0

        # Step 1: Full name
        if current_step() == 1:
            name_input = page.locator('input[placeholder="Full name"]').first
            if name_input.count() > 0 and not name_input.input_value():
                name_input.fill(PROFILE["name"])
                hs(1)
                print(f"  ✓ Step 1: Full name = {PROFILE['name']}")
            _click_next_button(page, ["Continue"])

        # Step 2: Avatar — click "Do this later"
        hs(4)
        if current_step() == 2:
            print(f"  → Step 2: avatar upload - skipping")
            _click_next_button(page, ["Do this later"])

        # Step 3: About you — optional Location/Job/Org/Bio. Fill what we have.
        hs(4)
        if current_step() == 3:
            print(f"  → Step 3: About you")
            # Job title
            job_input = page.locator('input[placeholder*="Job" i], input[name*="job" i]').first
            if job_input.count() > 0 and not job_input.input_value():
                job_input.fill("Financial Tools Platform")
                hs(1)
            # Organization
            org_input = page.locator('input[placeholder*="Organization" i], input[name*="organization" i]').first
            if org_input.count() > 0 and not org_input.input_value():
                org_input.fill("QFINHUB")
                hs(1)
            _click_next_button(page, ["Continue"])

        # Step 4: Website + bio
        hs(4)
        if current_step() == 4:
            print(f"  → Step 4: Website + bio")
            website_input = page.locator('input[name="url"], input[placeholder*="website" i], input[type="url"]').first
            if website_input.count() > 0 and not website_input.input_value():
                website_input.fill(PROFILE["url"])
                hs(1)
                print(f"  ✓ Website = {PROFILE['url']}")
            bio_field = page.locator('textarea[name="about"], textarea[name="description"], textarea[placeholder*="about" i], textarea[placeholder*="biography" i]').first
            if bio_field.count() > 0 and not bio_field.input_value():
                bio_field.fill(PROFILE["short_desc"])
                hs(1)
                print(f"  ✓ Bio added")
            _click_next_button(page, ["Continue"])

        # Step 5: Finish
        hs(4)
        if current_step() == 5:
            print(f"  → Step 5: Finish")
            _click_next_button(page, ["Finish", "Continue", "Save"])
            hs(4)
            print(f"  ✅ Gravatar onboarding completed")

        page.screenshot(path="/tmp/gravatar-final.png")
        page.close()
        import hashlib
        email_hash = hashlib.md5(PROFILE["email"].encode()).hexdigest()
        return {"success": True, "email_hash": email_hash, "url": PROFILE["url"]}
    except Exception as e:
        print(f"  ⚠️ Profile edit failed: {e}")
        page.screenshot(path="/tmp/gravatar-error.png")
        page.close()
        return {"success": False, "error": str(e)}


def _click_next_button(page, button_texts):
    """Click the first visible button matching any of the given text labels."""
    for text in button_texts:
        btns = page.locator(f'button:has-text("{text}")').all()
        for btn in btns:
            try:
                if btn.is_visible():
                    btn.click()
                    print(f"  ✓ Clicked: {text}")
                    return True
            except Exception:
                continue
    return False


def signup_saashub(context):
    """Submit to SaaSHub."""
    page = context.new_page()
    print(f"  → Opening SaaSHub")
    page.goto(PLATFORMS[1]["submit_url"], wait_until="domcontentloaded", timeout=30000)
    hs(4)
    random_scroll(page)
    print(f"  📍 Landed at SaaSHub submit. Inspecting form...")
    page.close()
    return {"success": False, "status": "visited", "note": "manual review needed"}


def signup_generic(context, platform_id, platform_name):
    """Generic platform signup - opens the page, scrolls, captures state."""
    platform = next((p for p in PLATFORMS if p["id"] == platform_id), None)
    if not platform:
        return {"success": False, "error": "unknown_platform"}

    page = context.new_page()
    submit_url = platform.get("submit_url", platform["url"])
    print(f"  → Opening {platform_name}: {submit_url}")
    try:
        page.goto(submit_url, wait_until="domcontentloaded", timeout=45000)
        hs(4)
        random_scroll(page)
        page.screenshot(path=f"/tmp/profile-{platform_id}.png", full_page=False)
        # Save page content snippet
        title = page.title()
        print(f"  📄 Page title: {title}")
        page.close()
        return {"success": True, "status": "visited", "title": title, "screenshot": f"/tmp/profile-{platform_id}.png"}
    except Exception as e:
        page.close()
        return {"success": False, "error": str(e)}


def run_platform(platform_id, visible=False):
    """Run a single platform signup."""
    state = load_state()
    print(f"\n{'='*60}")
    print(f"🚀 Profile signup: {platform_id}")
    print(f"{'='*60}")

    context = launch_browser(visible=visible)
    try:
        if platform_id == "gravatar":
            result = signup_gravatar(context)
        elif platform_id == "saashub":
            result = signup_saashub(context)
        else:
            platform_name = next((p["name"] for p in PLATFORMS if p["id"] == platform_id), platform_id)
            result = signup_generic(context, platform_id, platform_name)

        result["timestamp"] = datetime.utcnow().isoformat()
        state["platforms"][platform_id] = result
        save_state(state)
        return result
    finally:
        context.close()


def list_platforms():
    """List all available platforms."""
    print(f"\n{'='*60}")
    print(f"QFINHUB Profile Signup Targets ({len(PLATFORMS)} platforms)")
    print(f"{'='*60}\n")
    for p in PLATFORMS:
        print(f"  [{p['dr']:>3}] {p['id']:<25} {p['name']:<30} {p['type']}")


def show_status():
    """Show current signup status."""
    state = load_state()
    print(f"\n{'='*60}")
    print(f"Profile Signup Status (last run: {state.get('last_run', 'never')})")
    print(f"{'='*60}\n")
    for p in PLATFORMS:
        ps = state.get("platforms", {}).get(p["id"], {})
        status = ps.get("success", False)
        emoji = "✅" if status else ("⏳" if ps else "⬜")
        note = ps.get("error", ps.get("status", "not run"))
        print(f"  {emoji} [{p['dr']:>3}] {p['id']:<25} {note}")


if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser()
    p.add_argument("--platform", help="Run single platform signup")
    p.add_argument("--all", action="store_true", help="Run all platforms")
    p.add_argument("--list", action="store_true", help="List platforms")
    p.add_argument("--status", action="store_true", help="Show status")
    p.add_argument("--visible", action="store_true", help="Show browser window")
    args = p.parse_args()

    if args.list:
        list_platforms()
    elif args.status:
        show_status()
    elif args.platform:
        run_platform(args.platform, visible=args.visible)
    elif args.all:
        for plat in PLATFORMS:
            run_platform(plat["id"], visible=args.visible)
            time.sleep(30)  # Cool down between platforms
    else:
        list_platforms()
        show_status()