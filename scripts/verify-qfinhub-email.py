#!/usr/bin/env python3
"""
QFINHUB email connection verifier.

Tests that GMAIL_ADDRESS + GMAIL_APP_PASSWORD in .env.local can actually
authenticate against Google Workspace SMTP and IMAP. Does NOT send mail.

Usage:
    python3 scripts/verify-qfinhub-email.py

Exit codes:
    0 = both SMTP and IMAP authenticated
    1 = one or both failed
    2 = credentials missing from environment
"""

import os
import re
import smtplib
import imaplib
import ssl
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ENV_FILE = ROOT / ".env.local"

REQUIRED = ("GMAIL_ADDRESS", "GMAIL_APP_PASSWORD")


def load_env() -> None:
    """Load .env.local without overriding already-set environment vars."""
    if not ENV_FILE.exists():
        return
    for raw in ENV_FILE.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def mask(value: str) -> str:
    if not value:
        return "(empty)"
    if "@" in value:
        local, _, domain = value.partition("@")
        shown = local[:2] + "*" * max(len(local) - 2, 1)
        return f"{shown}@{domain}"
    return "*" * min(len(value), 16)


def main() -> int:
    load_env()

    missing = [k for k in REQUIRED if not os.environ.get(k)]
    if missing:
        print(f"MISSING: {', '.join(missing)} not set in {ENV_FILE}")
        print()
        print("Fix: create a Gmail App Password for Q.finhub@qfinhub.com")
        print("     (Google Account -> Security -> 2-Step Verification ON")
        print("      -> App passwords), then add to .env.local:")
        print("       GMAIL_ADDRESS=Q.finhub@qfinhub.com")
        print("       GMAIL_APP_PASSWORD=<16-char app password>")
        return 2

    address = os.environ["GMAIL_ADDRESS"]
    password = os.environ["GMAIL_APP_PASSWORD"].replace(" ", "")
    failures = 0

    print(f"Account : {mask(address)}")
    print(f"Password: {len(password)} chars (app passwords are 16)")
    print()

    # ── SMTP ──
    print("[1/2] SMTP smtp.gmail.com:587 ...")
    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=20) as s:
            s.ehlo("qfinhub-verify")
            s.starttls(context=ssl.create_default_context())
            s.ehlo("qfinhub-verify")
            s.login(address, password)
            print("      OK — authenticated. Server accepts sends.")
    except smtplib.SMTPAuthenticationError as e:
        failures += 1
        print(f"      FAIL — auth rejected: {e.smtp_code} {e.smtp_error!r}")
        print("      Usual cause: not an App Password, or 2-Step Verification is off.")
    except Exception as e:
        failures += 1
        print(f"      FAIL — {type(e).__name__}: {e}")

    # ── IMAP ──
    print("[2/2] IMAP imap.gmail.com:993 ...")
    try:
        m = imaplib.IMAP4_SSL("imap.gmail.com", 993, timeout=20)
        m.login(address, password)
        typ, data = m.list()
        folders = len(data) if typ == "OK" and data else 0
        print(f"      OK — authenticated. {folders} mailboxes visible.")
        m.logout()
    except imaplib.IMAP4.error as e:
        failures += 1
        print(f"      FAIL — auth rejected: {e}")
    except Exception as e:
        failures += 1
        print(f"      FAIL — {type(e).__name__}: {e}")

    print()
    if failures:
        print(f"RESULT: {failures} of 2 checks failed.")
        return 1
    print("RESULT: email connection fully working (SMTP + IMAP).")
    return 0


if __name__ == "__main__":
    sys.exit(main())
