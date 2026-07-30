#!/usr/bin/env python3
"""
Generic directory submission engine.
Takes a directory config (URL + field map) and submits QFINHUB.
Handles cookie consent, math captcha ("What is X+Y?"), and JS overlays.
"""
import argparse
import json
import os
import re
import sys
import time
from pathlib import Path

VENV_PYTHON = "/home/admin1/.hermes/hermes-agent/venv/bin/python3"
PROFILE_DIR = "/home/admin1/.hermes/cloak-profiles/directory-submitter"
LOG_DIR = Path("/home/admin1/qfinhub/.optimizer-data/directory-submissions")
LOG_DIR.mkdir(parents=True, exist_ok=True)


def solve_math_captcha(page):
    """If page contains 'What is X+Y?' text, solve and return answer, else None."""
    try:
        text = page.evaluate("() => document.body.innerText")
        m = re.search(r"What is\s+(\d+)\s*\+\s*(\d+)\s*\?", text)
        if m:
            answer = int(m.group(1)) + int(m.group(2))
            print(f"  ✓ Math captcha solved: {m.group(1)} + {m.group(2)} = {answer}")
            return str(answer)
    except Exception:
        pass
    return None


def submit(config):
    os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
    from cloakbrowser import launch_persistent_context

    ctx = launch_persistent_context(user_data_dir=PROFILE_DIR, headless=True)
    page = ctx.new_page()
    page.set_viewport_size({"width": 1920, "height": 1080})

    url = config["url"]
    fields = dict(config.get("fields", {}))  # copy so we can override math
    submit_sel = config.get("submit_selector")
    success_pattern = config.get("success_indicator", r"thank you|submitted for review|received your submission|moderation")
    fail_pattern = config.get("fail_indicator", r"please fix|invalid|captcha error|error submitting")

    result = {"url": url, "fields_filled": [], "errors": [], "success": False}

    try:
        print(f"→ Navigating to {url}")
        page.goto(url, timeout=60000)
        time.sleep(6)

        # Dismiss cookie consent banners
        for consent_text in ['Accept all', 'Accept', 'I agree', 'I accept', 'Allow all', 'OK', 'Got it']:
            try:
                btn = page.locator(f'button:has-text("{consent_text}")').first
                if btn.count() > 0 and btn.is_visible():
                    btn.click()
                    print(f"  ✓ Dismissed consent: {consent_text}")
                    time.sleep(2)
                    break
            except Exception:
                pass

        # Force-remove silktide/cookie overlays
        page.evaluate("""() => {
            const ids = ['silktide-wrapper', 'silktide-backdrop', 'silktide-banner', 'onetrust-banner-sdk', 'CybotCookiebotDialog', 'cookie-law-info-bar'];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (el) el.remove();
            }
            document.querySelectorAll('[class*="cookie-banner" i], [class*="consent" i]').forEach(el => {
                if (getComputedStyle(el).position === 'fixed') el.remove();
            });
        }""")
        time.sleep(1)

        # Solve math captcha if present (overrides 'math' field value if set)
        if "math" in fields:
            math_answer = solve_math_captcha(page)
            if math_answer:
                fields["math"] = math_answer
            else:
                # Use the field value as-is
                pass

        # Fill each field
        for name, value in fields.items():
            try:
                el = page.locator(f'input[name="{name}"], textarea[name="{name}"], select[name="{name}"]').first
                if el.count() == 0:
                    el = page.locator(f'#{name}').first
                if el.count() == 0:
                    result["errors"].append(f"Field not found: {name}")
                    print(f"  ✗ Field not found: {name}")
                    continue

                tag_name = el.evaluate("el => el.tagName.toLowerCase()")
                el_type = el.get_attribute("type") or ""

                if tag_name == "select":
                    el.select_option(value=value)
                elif el_type == "checkbox":
                    if value in (True, "true", "yes", "1"):
                        el.check()
                    else:
                        el.uncheck()
                elif el_type == "radio":
                    radio = page.locator(f'input[type="radio"][name="{name}"][value="{value}"]').first
                    if radio.count() > 0:
                        radio.check()
                else:
                    el.fill(str(value))
                result["fields_filled"].append(name)
                print(f"  ✓ {name}: {str(value)[:60]}")
                time.sleep(0.5)
            except Exception as e:
                result["errors"].append(f"{name}: {str(e)[:100]}")
                print(f"  ✗ {name}: {e}")

        # Submit
        if submit_sel:
            submit_btn = page.locator(submit_sel).first
            if submit_btn.count() == 0:
                submit_btn = page.locator('button[type="submit"], input[type="submit"]').first
            if submit_btn.count() > 0:
                print(f"\n→ Submitting…")
                submit_btn.click()
                time.sleep(10)
                result["post_submit_url"] = page.url
                result["post_submit_title"] = page.title()

                # Get clean text content (strip scripts and styles)
                content = page.content()
                content_clean = re.sub(r'<script[^>]*>.*?</script>', '', content, flags=re.DOTALL)
                content_clean = re.sub(r'<style[^>]*>.*?</style>', '', content_clean, flags=re.DOTALL)
                text_only = re.sub(r'<[^>]+>', ' ', content_clean).lower()
                text_only = re.sub(r'\s+', ' ', text_only)

                if re.search(fail_pattern, text_only):
                    result["success"] = False
                    print(f"  ✗ FAIL pattern detected")
                elif re.search(success_pattern, text_only):
                    result["success"] = True
                    print(f"  ✓ SUCCESS pattern detected")
                else:
                    # Neutral - check URL change
                    if page.url != url:
                        result["success"] = True
                        print(f"  ✓ URL changed (likely success)")
                    else:
                        print(f"  ? No clear indicator (url: {page.url})")

                # Save content excerpt for verification
                result["post_submit_text_excerpt"] = text_only[:800]
                page.screenshot(path=f"/tmp/{config.get('name', 'submit')}-after.png", full_page=True)
        else:
            print(f"  No submit selector specified")

    except Exception as e:
        result["errors"].append(f"Fatal: {str(e)[:300]}")
        print(f"\n✗ Error: {e}")
        page.screenshot(path=f"/tmp/{config.get('name', 'submit')}-error.png", full_page=True)
    finally:
        ctx.close()

    # Save log
    log_file = LOG_DIR / f"{config.get('name', 'submit')}-{int(time.time())}.json"
    with open(log_file, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nLog saved: {log_file}")
    return result


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--config", required=True, help="JSON config file")
    args = p.parse_args()

    config = json.loads(Path(args.config).read_text())
    submit(config)


if __name__ == "__main__":
    main()