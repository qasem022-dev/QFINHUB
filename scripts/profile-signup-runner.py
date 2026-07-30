#!/usr/bin/env python3
"""
Generic CloakBrowser signup harness for QFINHUB profile creation.
Pattern: navigate to signup URL → fill form → submit → wait for verification
code via IMAP → enter code → fill profile.

Works for: About.me, DeviantArt, Behance, Dribbble, Flickr, GitLab, Bitbucket,
Hashnode, Substack (with platform-specific field map passed via --profile-spec).

For each platform, pass selectors via JSON --selectors file. The script runs:
  1. Navigate to signup_url (CloakBrowser = residential IP)
  2. Wait for email field, fill with q.finhub@gmail.com
  3. Fill password (Mohammed1)
  4. Click submit
  5. Wait for verification code from <sender_hint>
  6. Fill verification code input
  7. Click submit
  8. Navigate to profile edit page
  9. Fill name/bio/website
  10. Save and capture profile URL

Usage:
  python3 scripts/profile-signup-runner.py \
    --platform aboutme \
    --signup-url https://about.me/signup \
    --sender-hint "about.me" \
    --selectors /tmp/aboutme-selectors.json
"""
import argparse
import json
import subprocess
import sys
import time
from pathlib import Path

PROFILE = {
    "name": "Qasem Mohammed",
    "email": "q.finhub@gmail.com",
    "password": "Mohammed1",
    "username": "qfinhub",
    "website": "https://www.qfinhub.com",
    "tagline": "Personal finance tools and education. Free calculators at QFINHUB.",
    "bio": "Founder of QFINHUB.com — free, no-signup personal finance calculators.",
}

FETCHER_SCRIPT = "/home/admin1/qfinhub/scripts/email-verification-fetcher.py"


def fetch_code(sender_hint, timeout=120):
    """Block until a verification code from sender arrives in inbox."""
    print(f"  ⏳ Waiting for code from {sender_hint} (timeout {timeout}s)…")
    result = subprocess.run(
        [sys.executable, FETCHER_SCRIPT, "--wait-for", sender_hint, "--timeout", str(timeout)],
        capture_output=True,
        text=True,
        timeout=timeout + 10,
    )
    if result.returncode == 0:
        for line in result.stdout.splitlines():
            if line.startswith("CODE_FOUND="):
                code = line.split("=", 1)[1].strip()
                print(f"  ✓ Got code: {code}")
                return code
    print(f"  ✗ No code received. stderr: {result.stderr[:200]}")
    return None


def run_with_cloak(platform_id, signup_url, sender_hint, selectors):
    """Run the signup flow via CloakBrowser."""
    try:
        from cloakbrowser import CloakBrowser
    except ImportError:
        print("ERROR: cloakbrowser not installed in this Python env")
        print("Run with hermes-agent venv: /home/admin1/.hermes/hermes-agent/venv/bin/python3")
        sys.exit(1)

    profile_dir = f"/home/admin1/.hermes/cloak-profiles/profile-signup-{platform_id}"
    Path(profile_dir).mkdir(parents=True, exist_ok=True)

    print(f"\n→ Launching CloakBrowser for {platform_id}")
    print(f"  Profile dir: {profile_dir}")
    print(f"  Signup URL: {signup_url}")

    browser = CloakBrowser(profile_dir=profile_dir, headless=False)
    page = browser.new_page()

    try:
        # Step 1: Open signup
        print(f"\n[1] Navigate to signup: {signup_url}")
        page.goto(signup_url, wait_until="domcontentloaded", timeout=60)
        time.sleep(3)

        # Step 2: Fill email
        if selectors.get("email_selector"):
            print(f"[2] Fill email: {PROFILE['email']}")
            page.fill(selectors["email_selector"], PROFILE["email"], timeout=15)
            time.sleep(1)

        # Step 3: Fill password
        if selectors.get("password_selector"):
            print(f"[3] Fill password")
            page.fill(selectors["password_selector"], PROFILE["password"], timeout=15)
            time.sleep(1)

        # Step 4: Click submit
        if selectors.get("submit_selector"):
            print(f"[4] Click submit: {selectors['submit_selector']}")
            page.click(selectors["submit_selector"], timeout=15)
            time.sleep(5)

        # Step 5: Wait for verification code
        code = fetch_code(sender_hint, timeout=selectors.get("code_timeout", 120))
        if not code:
            print("  ✗ FAILED: no verification code received")
            return False

        # Step 6: Fill verification code
        if selectors.get("code_selector"):
            print(f"[6] Fill verification code")
            page.fill(selectors["code_selector"], code, timeout=15)
            time.sleep(1)

        # Step 7: Submit verification
        if selectors.get("verify_submit_selector"):
            print(f"[7] Submit verification")
            page.click(selectors["verify_submit_selector"], timeout=15)
            time.sleep(5)

        # Step 8: Navigate to profile edit
        if selectors.get("profile_url"):
            print(f"[8] Navigate to profile: {selectors['profile_url']}")
            page.goto(selectors["profile_url"], wait_until="domcontentloaded", timeout=60)
            time.sleep(3)

        # Step 9: Fill profile
        if selectors.get("name_selector"):
            page.fill(selectors["name_selector"], PROFILE["name"], timeout=15)
        if selectors.get("tagline_selector"):
            page.fill(selectors["tagline_selector"], PROFILE["tagline"], timeout=15)
        if selectors.get("bio_selector"):
            page.fill(selectors["bio_selector"], PROFILE["bio"], timeout=15)
        if selectors.get("website_selector"):
            page.fill(selectors["website_selector"], PROFILE["website"], timeout=15)

        # Step 10: Save profile
        if selectors.get("save_selector"):
            print(f"[10] Save profile")
            page.click(selectors["save_selector"], timeout=15)
            time.sleep(3)

        # Capture final URL
        final_url = page.url
        print(f"\n✓ Done. Final URL: {final_url}")
        return final_url

    except Exception as e:
        print(f"\n✗ ERROR during signup: {e}")
        page.screenshot(path=f"/tmp/{platform_id}-error.png")
        print(f"  Screenshot saved: /tmp/{platform_id}-error.png")
        raise
    finally:
        browser.close()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--platform", required=True)
    p.add_argument("--signup-url", required=True)
    p.add_argument("--sender-hint", required=True, help="Substring of sender email or subject")
    p.add_argument("--selectors", required=True, help="JSON file with CSS selectors")
    args = p.parse_args()

    selectors = json.loads(Path(args.selectors).read_text())
    final_url = run_with_cloak(args.platform, args.signup_url, args.sender_hint, selectors)
    if final_url:
        print(f"\n=== {args.platform} signup SUCCESS ===")
        print(f"Final URL: {final_url}")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()