#!/usr/bin/env python3
"""
QFINHUB Search Console OAuth bootstrap.

Separate from the Hermes google-workspace token because GSC needs scopes the
Workspace setup doesn't request (webmasters, siteverification) plus
cloud-platform to enable the Search Console API.

Reuses the existing OAuth client at ~/.hermes/google_client_secret.json.
Writes ~/.hermes/gsc-oauth-token.json.

Usage:
    python3 scripts/gsc-oauth-setup.py --auth-url
    python3 scripts/gsc-oauth-setup.py --auth-code "<full redirect url or code>"
    python3 scripts/gsc-oauth-setup.py --check
"""

import argparse
import json
import os
import sys
import urllib.parse
import urllib.request
from pathlib import Path

HERMES = Path.home() / ".hermes"
CLIENT = HERMES / "google_client_secret.json"
TOKEN = HERMES / "gsc-oauth-token.json"
REDIRECT = "http://localhost:1"

SCOPES = [
    "https://www.googleapis.com/auth/webmasters",          # GSC properties, sitemaps, analytics
    "https://www.googleapis.com/auth/indexing",            # Indexing API notifications
    "https://www.googleapis.com/auth/siteverification",    # DNS verification tokens
    "https://www.googleapis.com/auth/cloud-platform",      # enable APIs / create SA keys
]


def load_client():
    if not CLIENT.exists():
        sys.exit(f"ERROR: no OAuth client at {CLIENT}")
    data = json.loads(CLIENT.read_text())
    return data.get("installed") or data.get("web")


def cmd_auth_url(_args):
    c = load_client()
    params = {
        "response_type": "code",
        "client_id": c["client_id"],
        "redirect_uri": REDIRECT,
        "scope": " ".join(SCOPES),
        "access_type": "offline",
        "prompt": "consent",
        "include_granted_scopes": "true",
    }
    print("https://accounts.google.com/o/oauth2/auth?" + urllib.parse.urlencode(params))


def cmd_auth_code(args):
    raw = args.auth_code.strip()
    if "code=" in raw:
        qs = urllib.parse.urlparse(raw).query or raw.split("?", 1)[-1]
        code = urllib.parse.parse_qs(qs).get("code", [""])[0]
    else:
        code = raw
    if not code:
        sys.exit("ERROR: no code found in supplied value")

    c = load_client()
    body = urllib.parse.urlencode({
        "code": code,
        "client_id": c["client_id"],
        "client_secret": c["client_secret"],
        "redirect_uri": REDIRECT,
        "grant_type": "authorization_code",
    }).encode()
    req = urllib.request.Request(c["token_uri"], data=body,
                                 headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            tok = json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"TOKEN EXCHANGE FAILED: {e.code} {e.read().decode(errors='replace')[:400]}")

    if "refresh_token" not in tok:
        print("WARNING: no refresh_token returned — token will not survive an hour.")

    out = {
        "client_id": c["client_id"],
        "client_secret": c["client_secret"],
        "token_uri": c["token_uri"],
        "token": tok.get("access_token"),
        "refresh_token": tok.get("refresh_token"),
        "scopes": tok.get("scope", "").split(),
        "type": "authorized_user",
    }
    TOKEN.write_text(json.dumps(out, indent=2))
    TOKEN.chmod(0o600)
    print(f"OK: token saved to {TOKEN}")
    print("granted scopes:")
    for s in out["scopes"]:
        print("   ", s.rsplit("/auth/", 1)[-1])
    print("has refresh_token:", bool(out["refresh_token"]))


def cmd_check(_args):
    if not TOKEN.exists():
        sys.exit(f"NOT_AUTHENTICATED: no token at {TOKEN}")
    from google.oauth2.credentials import Credentials
    from google.auth.transport.requests import Request
    creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            d = json.loads(TOKEN.read_text())
            d["token"] = creds.token
            TOKEN.write_text(json.dumps(d, indent=2))
            print("refreshed access token")
        else:
            sys.exit("INVALID: token cannot be refreshed")
    print("AUTHENTICATED:", TOKEN)
    print("scopes:", len(creds.scopes or []))


def main():
    ap = argparse.ArgumentParser()
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--auth-url", action="store_true")
    g.add_argument("--auth-code", metavar="CODE")
    g.add_argument("--check", action="store_true")
    args = ap.parse_args()
    if args.auth_url:
        cmd_auth_url(args)
    elif args.auth_code:
        cmd_auth_code(args)
    else:
        cmd_check(args)


if __name__ == "__main__":
    main()
