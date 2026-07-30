#!/usr/bin/env python3
"""
Publish a QFINHUB editorial article to Medium @q.finhub via CloakBrowser.
Uses existing logged-in cookies (no re-auth needed).

Usage:
  python3 scripts/medium-publish.py "Article Title" "Article body markdown"
  python3 scripts/medium-publish.py --from-url https://www.qfinhub.com/blog/slug
"""
import argparse
import os
import sys
import time
from pathlib import Path

VENV_PYTHON = "/home/admin1/.hermes/hermes-agent/venv/bin/python3"
MEDIUM_PROFILE = "/home/admin1/.hermes/cloak-profiles/medium-qfinhub"


def publish_article(title, body_markdown):
    os.environ["LD_LIBRARY_PATH"] = os.path.expanduser("~/.local/lib")
    from cloakbrowser import launch_persistent_context

    ctx = launch_persistent_context(user_data_dir=MEDIUM_PROFILE, headless=True)
    page = ctx.new_page()

    try:
        print(f"→ Opening Medium editor…")
        page.goto("https://medium.com/new-story", timeout=60000)
        time.sleep(5)

        print(f"→ Filling title: {title[:60]}")
        # Title field selector for Medium editor
        page.fill("h3[data-testid='editorTitleParagraph']", title, timeout=15000)
        time.sleep(1)

        print(f"→ Filling body ({len(body_markdown)} chars)…")
        # Body paragraph is data-testid="editorParagraphText" and starts focused (is-selected)
        page.click("p[data-testid='editorParagraphText']", timeout=15000)
        time.sleep(1)
        # Type body in chunks (Medium editor is contenteditable)
        chunk_size = 500
        for i in range(0, len(body_markdown), chunk_size):
            chunk = body_markdown[i:i+chunk_size]
            page.keyboard.type(chunk, delay=10)
            time.sleep(0.3)
        time.sleep(3)

        print(f"→ Adding link to QFINHUB in body…")
        # Select a key phrase and convert to link
        # Simpler: just leave the URL as plain text + add footer link
        page.keyboard.press("End")
        page.keyboard.type(
            "\n\n---\n\nExplore 100+ free financial calculators: https://www.qfinhub.com",
            delay=10,
        )
        time.sleep(2)

        # Add tags via Publish flow
        print(f"→ Clicking Publish button…")
        page.click("button:has-text('Publish')", timeout=15000)
        time.sleep(5)

        # Add tags
        tag_input = page.locator("input[placeholder*='tag' i]").first
        if tag_input.count() > 0:
            for tag in ["finance", "calculator", "mortgage", "investment"]:
                tag_input.fill(tag)
                page.keyboard.press("Enter")
                time.sleep(1)

        # Final publish
        final_publish = page.locator("button:has-text('Publish now')").first
        if final_publish.count() > 0:
            final_publish.click()
            time.sleep(8)

        final_url = page.url
        print(f"\n✓ Article published!")
        print(f"  URL: {final_url}")
        return final_url

    except Exception as e:
        print(f"\n✗ Error: {e}")
        page.screenshot(path="/tmp/medium-publish-error.png")
        raise
    finally:
        ctx.close()


def get_editorial_post(slug):
    """Fetch an editorial post from QFINHUB to re-publish on Medium."""
    import urllib.request
    import re

    url = f"https://www.qfinhub.com/blog/{slug}"
    try:
        with urllib.request.urlopen(url, timeout=15) as r:
            html = r.read().decode("utf-8")
    except Exception as e:
        print(f"Fetch failed: {e}")
        return None, None

    # Extract title from og:title or <title>
    title = None
    m = re.search(r'<meta property="og:title" content="([^"]+)"', html)
    if m:
        title = m.group(1).replace(" | QFINHUB", "").strip()
    if not title:
        m = re.search(r"<title>([^<]+)</title>", html)
        if m:
            title = m.group(1).replace(" | QFINHUB", "").strip()

    # Extract description
    desc = None
    m = re.search(r'<meta property="og:description" content="([^"]+)"', html)
    if m:
        desc = m.group(1)

    return title, desc


def main():
    p = argparse.ArgumentParser()
    p.add_argument("title", nargs="?", help="Article title")
    p.add_argument("body", nargs="?", help="Article body (markdown)")
    p.add_argument("--from-url", help="Fetch content from QFINHUB blog URL")
    args = p.parse_args()

    if args.from_url:
        slug = args.from_url.rstrip("/").split("/")[-1]
        title, desc = get_editorial_post(slug)
        if not title:
            print(f"Could not extract content from {args.from_url}")
            sys.exit(1)
        body = f"{desc or ''}\n\nOriginally published on QFINHUB: {args.from_url}\n\nRead the full article: {args.from_url}"
    else:
        if not args.title or not args.body:
            print("Provide title + body, or --from-url")
            sys.exit(1)
        title = args.title
        body = args.body

    final_url = publish_article(title, body)
    print(f"\nPublished to: {final_url}")


if __name__ == "__main__":
    main()