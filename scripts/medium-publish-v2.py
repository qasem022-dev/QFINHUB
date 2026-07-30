#!/usr/bin/env python3
"""
Publish a QFINHUB editorial article to Medium @q.finhub via CloakBrowser.
Fixed: types in chunks with Enter presses to trigger Medium auto-save events.
"""
import argparse
import os
import sys
import time
from pathlib import Path

VENV_PYTHON = "/home/admin1/.hermes/hermes-agent/venv/bin/python3"
MEDIUM_PROFILE = "/home/admin1/.hermes/cloak-profiles/medium-qfinhub"


def publish(title, paragraphs):
    """paragraphs: list of strings (each becomes one paragraph)."""
    os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
    from cloakbrowser import launch_persistent_context

    ctx = launch_persistent_context(user_data_dir=MEDIUM_PROFILE, headless=True)
    page = ctx.new_page()

    try:
        print(f"→ Opening Medium editor…")
        page.goto("https://medium.com/new-story", timeout=60000)
        time.sleep(8)

        print(f"→ Title: {title[:60]}")
        title_el = page.locator("h3[data-testid='editorTitleParagraph']").first
        title_el.click()
        time.sleep(1)
        page.keyboard.type(title, delay=20)
        time.sleep(3)

        print(f"→ Body: {len(paragraphs)} paragraphs")
        body_el = page.locator("p[data-testid='editorParagraphText']").first
        body_el.click()
        time.sleep(1)

        for i, para in enumerate(paragraphs):
            print(f"  Para {i+1}/{len(paragraphs)}: {len(para)} chars")
            # Type in 100-char chunks
            for j in range(0, len(para), 100):
                chunk = para[j:j+100]
                page.keyboard.type(chunk, delay=15)
                time.sleep(0.3)
            # Press Enter twice to start new paragraph (Medium uses blank line)
            page.keyboard.press("Enter")
            page.keyboard.press("Enter")
            time.sleep(2)  # Let auto-save fire

        # Wait for Publish button to enable
        print("→ Waiting for Publish button to enable…")
        for attempt in range(20):
            time.sleep(5)
            btn = page.locator("button[data-action='show-prepublish']").first
            if btn.count() == 0:
                btn = page.locator("button:has-text('Publish')").first
            if btn.count() > 0:
                disabled = btn.get_attribute("disabled")
                if disabled is None:
                    print(f"  ✓ Publish button enabled after {(attempt+1)*5}s")
                    break
        else:
            print("  ✗ Publish button never enabled")
            page.screenshot(path="/tmp/medium-publish-debug.png")
            return None

        print("→ Clicking Publish…")
        btn.click()
        time.sleep(8)

        # Now in publish modal — add tags (with Escape to dismiss dropdown overlay)
        print("→ Adding tags…")
        tag_input = page.locator("input[placeholder='Add a topic...']").first
        if tag_input.count() > 0:
            for tag in ["Finance", "Personal Finance", "Investing", "Money", "Calculator"]:
                tag_input.click(force=True)
                time.sleep(0.5)
                tag_input.fill("")
                time.sleep(0.5)
                tag_input.type(tag, delay=20)
                time.sleep(0.5)
                page.keyboard.press("Enter")
                time.sleep(2)
                page.keyboard.press("Escape")
                time.sleep(1)
        else:
            print("  No tag input found, looking for alternatives…")

        time.sleep(2)

        # Final publish — click the visible Publish button in the dialog (last one)
        print("→ Final publish…")
        final = page.locator("button:has-text('Publish'):visible").last
        if final.count() > 0:
            final.click()
            time.sleep(15)
        else:
            print("  ✗ No Publish button found in dialog")
            return None

        final_url = page.url
        print(f"\n✓ Final URL: {final_url}")
        # Extract canonical published URL (medium.com/p/ID is the draft ID; canonical has slug)
        return final_url

    except Exception as e:
        print(f"\n✗ Error: {e}")
        page.screenshot(path="/tmp/medium-publish-error.png")
        import traceback
        traceback.print_exc()
        return None
    finally:
        ctx.close()


def main():
    p = argparse.ArgumentParser()
    p.add_argument("title", help="Article title")
    p.add_argument("--from-file", help="File with paragraphs (one per line, blank line separates)")
    args = p.parse_args()

    if args.from_file:
        content = Path(args.from_file).read_text()
        # Split on double-newline (blank line = paragraph separator)
        paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    else:
        paragraphs = sys.stdin.read().split("\n\n")

    paragraphs = [p.strip() for p in paragraphs if p.strip()]
    print(f"Loaded {len(paragraphs)} paragraphs from input")

    final_url = publish(args.title, paragraphs)
    if final_url:
        print(f"\n✓ Published to Medium!")
        print(f"  URL: {final_url}")
        sys.exit(0)
    else:
        print("\n✗ Publish failed")
        sys.exit(1)


if __name__ == "__main__":
    main()