#!/usr/bin/env python3
"""
Gmail IMAP-based verification code fetcher.
Reads verification codes from q.finhub@gmail.com so the agent can complete
signups on platforms that require email verification.

Usage:
  python3 scripts/email-verification-fetcher.py --latest 5          # Show last 5 messages
  python3 scripts/email-verification-fetcher.py --search "github"   # Search from specific sender
  python3 scripts/email-verification-fetcher.py --wait-for <sender> # Block until a code arrives
  python3 scripts/email-verification-fetcher.py --extract-code     # Parse most recent for code
"""
import argparse
import imaplib
import email
import re
import sys
import time
from email.header import decode_header

IMAP_HOST = "imap.gmail.com"
IMAP_PORT = 993
GMAIL_USER = "q.finhub@gmail.com"
GMAIL_PASS = "igro rdgg swjo dmwp"

# Patterns that match verification codes in emails
CODE_PATTERNS = [
    r"\b(\d{6})\b",  # 6-digit code
    r"\b(\d{4,8})\b",  # 4-8 digit code
    r"code[:\s]+([A-Z0-9]{4,12})",  # "code: ABC123"
    r"verification[:\s]+([A-Z0-9]{4,12})",  # "verification: XYZ789"
    r"pin[:\s]+([A-Z0-9]{4,12})",  # "pin: ABCDEF"
    r"confirm[:\s]+([A-Z0-9]{4,12})",  # "confirm: 123ABC"
    r"https?://[^\s]*confirm[^\s]*token=([A-Za-z0-9_-]+)",  # Confirmation link token
    r"https?://[^\s]*verify[^\s]*code=([A-Za-z0-9_-]+)",  # Verify link code
]


def login():
    M = imaplib.IMAP4_SSL(IMAP_HOST, IMAP_PORT)
    M.login(GMAIL_USER, GMAIL_PASS)
    return M


def decode_header_value(s):
    if not s:
        return ""
    parts = decode_header(s)
    out = []
    for text, charset in parts:
        if isinstance(text, bytes):
            out.append(text.decode(charset or "utf-8", errors="replace"))
        else:
            out.append(text)
    return " ".join(out)


def extract_body(msg):
    body = ""
    if msg.is_multipart():
        for part in msg.walk():
            ctype = part.get_content_type()
            if ctype == "text/plain" and not body:
                try:
                    body = part.get_payload(decode=True).decode(
                        part.get_content_charset() or "utf-8", errors="replace"
                    )
                    break
                except Exception:
                    pass
        if not body:
            for part in msg.walk():
                if part.get_content_type() == "text/html":
                    try:
                        html = part.get_payload(decode=True).decode(
                            part.get_content_charset() or "utf-8", errors="replace"
                        )
                        # Strip HTML tags
                        body = re.sub(r"<[^>]+>", " ", html)
                        body = re.sub(r"\s+", " ", body).strip()
                        break
                    except Exception:
                        pass
    else:
        try:
            body = msg.get_payload(decode=True).decode(
                msg.get_content_charset() or "utf-8", errors="replace"
            )
        except Exception:
            body = str(msg.get_payload())
    return body


def get_latest(M, n=5, sender_filter=None):
    M.select("INBOX")
    if sender_filter:
        typ, data = M.search(None, f'(FROM "{sender_filter}")')
    else:
        typ, data = M.search(None, "ALL")
    if not data[0]:
        return []
    ids = data[0].split()[-n:]
    results = []
    for id in reversed(ids):
        typ, msg_data = M.fetch(id, "(RFC822)")
        msg = email.message_from_bytes(msg_data[0][1])
        results.append(
            {
                "id": id.decode(),
                "from": decode_header_value(msg.get("From", "")),
                "subject": decode_header_value(msg.get("Subject", "")),
                "date": msg.get("Date", ""),
                "body": extract_body(msg)[:1500],
            }
        )
    return results


def extract_codes(text):
    codes = []
    for pat in CODE_PATTERNS:
        for m in re.finditer(pat, text, re.IGNORECASE):
            codes.append(m.group(1))
    return list(dict.fromkeys(codes))  # dedupe, preserve order


def wait_for_code(M, sender_hint, timeout=120, poll_interval=5):
    """Poll inbox until a new code from sender_hint arrives. Return first code found."""
    M.select("INBOX")
    typ, data = M.search(None, "ALL")
    initial = set(data[0].split()) if data[0] else set()
    deadline = time.time() + timeout
    while time.time() < deadline:
        typ, data = M.search(None, "ALL")
        current = set(data[0].split()) if data[0] else set()
        new_ids = current - initial
        if new_ids:
            # Process new IDs
            for id in sorted(new_ids, key=lambda x: int(x)):
                typ, msg_data = M.fetch(id, "(RFC822)")
                msg = email.message_from_bytes(msg_data[0][1])
                sender = decode_header_value(msg.get("From", "")).lower()
                subject = decode_header_value(msg.get("Subject", ""))
                body = extract_body(msg)
                if sender_hint.lower() in sender or sender_hint.lower() in subject.lower():
                    codes = extract_codes(body)
                    if codes:
                        return codes[0], {"from": sender, "subject": subject}
        time.sleep(poll_interval)
    return None, {"error": f"No code from {sender_hint} after {timeout}s"}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--latest", type=int, default=0, help="Show N latest messages")
    p.add_argument("--search", type=str, default=None, help="Filter by sender substring")
    p.add_argument("--wait-for", type=str, default=None, help="Block until code from sender arrives")
    p.add_argument("--timeout", type=int, default=120, help="Timeout seconds for --wait-for")
    p.add_argument("--extract-code", action="store_true", help="Print codes found in latest message")
    args = p.parse_args()

    M = login()
    try:
        if args.wait_for:
            code, meta = wait_for_code(M, args.wait_for, timeout=args.timeout)
            if code:
                print(f"CODE_FOUND={code}")
                print(f"META={meta}")
                sys.exit(0)
            else:
                print(f"NO_CODE: {meta}", file=sys.stderr)
                sys.exit(2)
        elif args.latest:
            msgs = get_latest(M, n=args.latest, sender_filter=args.search)
            for m in msgs:
                print(f"\n=== ID {m['id']} | {m['date']} ===")
                print(f"From: {m['from']}")
                print(f"Subject: {m['subject']}")
                print(f"Body (first 800 chars):\n{m['body'][:800]}")
                if args.extract_code:
                    codes = extract_codes(m["body"])
                    if codes:
                        print(f"\n>>> EXTRACTED CODES: {codes}")
    finally:
        try:
            M.logout()
        except Exception:
            pass


if __name__ == "__main__":
    main()