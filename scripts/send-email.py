#!/usr/bin/env python3
"""
Send mail as Q.finhub@qfinhub.com through the Gmail API.

Uses the Google Workspace OAuth token at ~/.hermes/google_token.json (scope
gmail.send), NOT SMTP, so no app password is required.

Usage:
    python3 scripts/send-email.py --to someone@example.com --subject "Hi" --body-file msg.txt
    python3 scripts/send-email.py --to x@y.com --subject "Hi" --body "text"
    python3 scripts/send-email.py --verify            # send a self-test to our own inbox
    python3 scripts/send-email.py --list-sent 10      # show recently sent subjects
"""

import argparse
import base64
import json
import sys
import urllib.parse
import urllib.request
from email.mime.text import MIMEText
from email.utils import formataddr, formatdate, make_msgid
from pathlib import Path

TOKEN_PATH = Path.home() / ".hermes" / "google_token.json"
TOKEN_URI = "https://oauth2.googleapis.com/token"
SENDER = "Q.finhub@qfinhub.com"
SENDER_NAME = "Qasem — QFINHUB"


def _refresh(creds: dict) -> str:
    """Exchange the refresh token for a fresh access token."""
    data = urllib.parse.urlencode(
        {
            "client_id": creds["client_id"],
            "client_secret": creds["client_secret"],
            "refresh_token": creds["refresh_token"],
            "grant_type": "refresh_token",
        }
    ).encode()
    req = urllib.request.Request(TOKEN_URI, data=data)
    with urllib.request.urlopen(req, timeout=45) as r:
        payload = json.loads(r.read())
    access = payload["access_token"]
    # persist so repeated sends don't re-refresh
    creds["token"] = access
    TOKEN_PATH.write_text(json.dumps(creds))
    TOKEN_PATH.chmod(0o600)
    return access


def get_access_token() -> str:
    creds = json.loads(TOKEN_PATH.read_text())
    if not creds.get("refresh_token"):
        raise SystemExit("No refresh token in google_token.json — re-run the OAuth setup.")
    return _refresh(creds)


def send(to: str, subject: str, body: str, *, reply_to: str | None = None) -> dict:
    token = get_access_token()
    msg = MIMEText(body, "plain", "utf-8")
    msg["To"] = to
    msg["From"] = formataddr((SENDER_NAME, SENDER))
    msg["Subject"] = subject
    msg["Date"] = formatdate(localtime=True)
    msg["Message-ID"] = make_msgid(domain="qfinhub.com")
    if reply_to:
        msg["Reply-To"] = reply_to

    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    req = urllib.request.Request(
        f"https://gmail.googleapis.com/gmail/v1/users/{SENDER}/messages/send",
        data=json.dumps({"raw": raw}).encode(),
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
    )
    with urllib.request.urlopen(req, timeout=45) as r:
        return json.loads(r.read())


def list_sent(n: int = 10) -> None:
    token = get_access_token()
    q = urllib.parse.quote(f"in:sent")
    url = (
        f"https://gmail.googleapis.com/gmail/v1/users/{SENDER}/messages"
        f"?q={q}&maxResults={n}"
    )
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=45) as r:
        data = json.loads(r.read())
    for m in data.get("messages", []):
        dreq = urllib.request.Request(
            f"https://gmail.googleapis.com/gmail/v1/users/{SENDER}/messages/{m['id']}"
            "?format=metadata&metadataHeaders=Subject&metadataHeaders=To",
            headers={"Authorization": f"Bearer {token}"},
        )
        with urllib.request.urlopen(dreq, timeout=45) as r2:
            detail = json.loads(r2.read())
        hdrs = {
            h["name"]: h["value"]
            for h in detail.get("payload", {}).get("headers", [])
        }
        print(f"  {hdrs.get('To','?'):45} {hdrs.get('Subject','?')[:50]}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--to")
    ap.add_argument("--subject", default="")
    ap.add_argument("--body")
    ap.add_argument("--body-file")
    ap.add_argument("--verify", action="store_true")
    ap.add_argument("--list-sent", type=int, default=0)
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    if args.list_sent:
        list_sent(args.list_sent)
        return 0

    if args.verify:
        res = send(
            SENDER,
            "QFINHUB outreach channel — self test",
            "This confirms the Gmail API send path works from the automation, "
            "with no app password involved.\n\nSent by the QFINHUB agent.",
        )
        print("VERIFY OK ->", res.get("id"))
        return 0

    if not args.to:
        print("--to is required", file=sys.stderr)
        return 2
    body = args.body or ""
    if args.body_file:
        body = Path(args.body_file).read_text()

    if args.dry_run:
        print(f"DRY RUN\nTo: {args.to}\nSubject: {args.subject}\n\n{body}")
        return 0

    res = send(args.to, args.subject, body)
    print(f"sent -> id={res.get('id')} thread={res.get('threadId')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
