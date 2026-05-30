#!/usr/bin/env python3
"""
submit-sitemaps-gsc.py — Submit sitemaps to Google Search Console.

Submits:
  - https://www.qfinhub.com/sitemap.xml
  - https://www.qfinhub.com/news-sitemap.xml

NEVER submits:
  - https://www.qfinhub.com/scenario/sitemap.xml

Uses Google Search Console API (webmasters/v3).
Requires OAuth token with 'webmasters' scope (NOT readonly).

Credentials:
  GOOGLE_TOKEN_FILE — path to OAuth token JSON (default: ~/.hermes/google-indexing-token.json)
  GSC_SITE_URL — verified GSC property URL (default: https://www.qfinhub.com/)

Usage:
  python3 scripts/submit-sitemaps-gsc.py
  python3 scripts/submit-sitemaps-gsc.py --dry-run   # Don't actually submit
  python3 scripts/submit-sitemaps-gsc.py --list       # List existing sitemaps
"""

import os
import sys
import json
import time
import argparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
from datetime import datetime

# ── Configuration ───────────────────────────────────────────

DEFAULT_TOKEN_FILE = os.path.expanduser("~/.hermes/google-indexing-token.json")
DEFAULT_SITE_URL = "https://www.qfinhub.com/"

GSC_API_BASE = "https://www.googleapis.com/webmasters/v3"

SITEMAPS_TO_SUBMIT = [
    "https://www.qfinhub.com/sitemap.xml",
    "https://www.qfinhub.com/news-sitemap.xml",
]

NEVER_SUBMIT = [
    "https://www.qfinhub.com/scenario/sitemap.xml",
]

# ── Token management ────────────────────────────────────────

def load_token(token_file):
    """Load OAuth token from JSON file."""
    try:
        with open(token_file) as f:
            return json.load(f)
    except Exception as e:
        print(f"❌ Cannot load token from {token_file}: {e}")
        return None

def refresh_token(token_data):
    """Refresh an expired OAuth token using refresh_token."""
    refresh = token_data.get("refresh_token")
    if not refresh:
        print("❌ No refresh_token in token data")
        return None

    # Use the token endpoint from the token data or default
    token_uri = token_data.get("token_uri", "https://oauth2.googleapis.com/token")
    client_id = token_data.get("client_id", "")
    client_secret = token_data.get("client_secret", "")

    # Try the installed app flow
    from urllib.parse import urlencode
    params = {
        "client_id": client_id,
        "client_secret": client_secret,
        "refresh_token": refresh,
        "grant_type": "refresh_token",
    }

    print("🔄 Refreshing Google OAuth token...")
    try:
        data = urlencode(params).encode()
        req = Request(token_uri, data=data, method="POST")
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
        resp = urlopen(req, timeout=15)
        new_token = json.loads(resp.read().decode())

        # Merge with existing token data, preserving refresh_token
        token_data["access_token"] = new_token["access_token"]
        token_data["expires_in"] = new_token.get("expires_in", 3600)
        token_data["expires_at"] = time.time() + new_token.get("expires_in", 3600)
        token_data["token_type"] = new_token.get("token_type", "Bearer")

        print(f"   ✅ Token refreshed (expires in {token_data['expires_in']}s)")
        return token_data
    except HTTPError as e:
        body = e.read().decode()[:500]
        print(f"❌ Token refresh failed ({e.code}): {body}")
        return None
    except Exception as e:
        print(f"❌ Token refresh error: {e}")
        return None

def get_valid_token(token_file):
    """Load token, refresh if expired, return valid access_token."""
    token_data = load_token(token_file)
    if not token_data:
        return None

    # Check if token is expired
    expires_at = token_data.get("expires_at", 0)
    if time.time() > expires_at - 60:  # 60s buffer
        token_data = refresh_token(token_data)
        if not token_data:
            return None

        # Save refreshed token
        try:
            os.makedirs(os.path.dirname(token_file), exist_ok=True)
            with open(token_file, "w") as f:
                json.dump(token_data, f, indent=2)
        except Exception:
            pass

    return token_data["access_token"]

# ── GSC API calls ───────────────────────────────────────────

def gsc_request(access_token, site_url, endpoint, method="GET", data=None):
    """Make a GSC API request."""
    # URL-encode the site URL for the API path
    from urllib.parse import quote
    encoded_site = quote(site_url, safe="")

    url = f"{GSC_API_BASE}/sites/{encoded_site}/{endpoint}"
    req = Request(url, method=method)
    req.add_header("Authorization", f"Bearer {access_token}")
    req.add_header("Content-Type", "application/json")

    if data:
        req.data = json.dumps(data).encode()

    try:
        resp = urlopen(req, timeout=15)
        return resp.status, json.loads(resp.read().decode())
    except HTTPError as e:
        body = e.read().decode()[:500]
        return e.code, {"error": body}

def list_sitemaps(access_token, site_url):
    """List submitted sitemaps."""
    status, data = gsc_request(access_token, site_url, "sitemaps")
    if status == 200:
        sitemaps = data.get("sitemap", [])
        print(f"\n📋 Existing sitemaps ({len(sitemaps)}):")
        for sm in sitemaps:
            path = sm.get("path", "unknown")
            last_submitted = sm.get("lastSubmitted", "unknown")
            status_str = sm.get("type", "unknown")
            warnings = sm.get("warnings", 0)
            errors = sm.get("errors", 0)
            icon = "✅" if (warnings == 0 and errors == 0) else "⚠️"
            print(f"   {icon} {path}")
            print(f"      Last submitted: {last_submitted}, warnings: {warnings}, errors: {errors}")
        return sitemaps
    else:
        print(f"❌ Failed to list sitemaps: {data}")
        return []

def submit_sitemap(access_token, site_url, sitemap_url, dry_run=False):
    """Submit a single sitemap to GSC."""
    encoded_site = __import__("urllib.parse").quote(site_url, safe="")
    encoded_sitemap = __import__("urllib.parse").quote(sitemap_url, safe="")

    endpoint = f"sitemaps/{encoded_sitemap}"

    if dry_run:
        print(f"   [DRY RUN] Would submit: {sitemap_url}")
        return True, {"dry_run": True}

    status, data = gsc_request(access_token, site_url, endpoint, method="PUT")
    if status in (200, 204):
        print(f"   ✅ Submitted: {sitemap_url}")
        return True, data
    elif status == 403:
        print(f"   ❌ Permission denied. Token needs 'webmasters' scope (not readonly).")
        print(f"      Current token has readonly access — cannot submit sitemaps.")
        return False, data
    else:
        print(f"   ❌ Failed ({status}): {data}")
        return False, data

# ── Main ────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Submit sitemaps to Google Search Console")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually submit, just show what would be done")
    parser.add_argument("--list", action="store_true", help="List existing sitemaps only")
    parser.add_argument("--token-file", default=DEFAULT_TOKEN_FILE, help="Path to OAuth token JSON")
    parser.add_argument("--site-url", default=DEFAULT_SITE_URL, help="GSC verified site URL")
    args = parser.parse_args()

    print("🔍 GSC Sitemap Submitter")
    print(f"   Site: {args.site_url}")
    print(f"   Token: {args.token_file}")

    # Safety check: never submit scenario sitemap
    for banned in NEVER_SUBMIT:
        if banned in SITEMAPS_TO_SUBMIT:
            print(f"\n❌ SAFETY CHECK FAILED: {banned} is in the submit list!")
            print("   This sitemap must NEVER be submitted. Aborting.")
            return 1

    # Get token
    access_token = get_valid_token(args.token_file)
    if not access_token:
        print("\n❌ Cannot get valid Google OAuth token.")
        print("   Make sure the token file exists and has a refresh_token.")
        print("   Token must have 'webmasters' scope (full, not readonly).")
        return 1

    # List mode
    if args.list:
        list_sitemaps(access_token, args.site_url)
        return 0

    # Check scope
    token_data = load_token(args.token_file)
    scopes = token_data.get("scope", "").split() if token_data else []
    has_write = any("webmasters" in s and "readonly" not in s for s in scopes)
    if not has_write and not args.dry_run:
        print(f"\n⚠️  Token scope: {scopes}")
        print("   Token has 'webmasters.readonly' — CANNOT submit sitemaps.")
        print("   You need the full 'webmasters' scope (not readonly).")
        print("   Re-authorize with expanded scope or use --dry-run to test.")
        return 1

    # Submit each sitemap
    print(f"\n🚀 Submitting sitemaps...")
    results = []
    for sitemap_url in SITEMAPS_TO_SUBMIT:
        success, data = submit_sitemap(access_token, args.site_url, sitemap_url, args.dry_run)
        results.append({"url": sitemap_url, "success": success, "data": data})

    # Summary
    all_ok = all(r["success"] for r in results)
    print(f"\n{'✅ All sitemaps submitted' if all_ok else '❌ Some sitemaps failed'}")

    # Save results
    report_path = os.path.join(
        os.path.dirname(__file__), "..", ".optimizer-data", "gsc-sitemap-submission-log.json"
    )
    report = {
        "timestamp": datetime.now().isoformat(),
        "site": args.site_url,
        "dry_run": args.dry_run,
        "results": results,
    }
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    with open(report_path, "w") as f:
        json.dump(report, f, indent=2)
    print(f"   Log: {report_path}")

    return 0 if all_ok else 1

if __name__ == "__main__":
    sys.exit(main())
