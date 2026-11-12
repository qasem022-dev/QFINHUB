#!/usr/bin/env python3
"""
Outreach sender for the QFINHUB calculator-build offer.

Reads prospects-clean.csv, renders a personalized plain-text email, and sends
through scripts/send-email.py (Gmail API). Maintains a sent-log so a prospect is
never contacted twice and so reply rates can be measured per template.

Deliverability rules baked in:
  - plain text only, one link maximum
  - hard daily cap (default 15) to protect qfinhub.com's sending reputation
  - random 45-150s gap between sends so it does not look like a blast
  - skips anything already in the log

Usage:
    python3 scripts/outreach-send.py --dry-run --limit 3
    python3 scripts/outreach-send.py --template A --limit 12
    python3 scripts/outreach-send.py --stats
"""

import argparse
import csv
import datetime
import random
import subprocess
import sys
import time
from pathlib import Path

DATA = Path(".optimizer-data")
PROSPECTS = DATA / "prospects-clean.csv"
LOG = DATA / "outreach-sent.csv"
OFFER_URL = "https://www.qfinhub.com/services"
SENDER = "Q.finhub@qfinhub.com"

# Segments where the offer makes sense; associations/aggregators do not buy.
SKIP_DOMAIN_HINTS = (
    "americascreditunions.org",  # association, not a buyer
    "homeshow.ai",               # SaaS competitor-ish
    "mycreditunion.gov",
)

TEMPLATES = {
    "A": {
        "subject": "mortgage calculator for {domain}",
        "body": """Hi {org},

I looked at {domain} — you clearly work hard for the enquiry, then send people off to a lender's calculator to get a number you can't capture.

I build calculators that keep that number on your site and capture it as a lead. Your branding, your rates, live in 72 hours.

I'll build you one free before you pay anything — you click it, and if it's not useful you delete the email.

Want me to send the staging link?

Qasem
QFINHUB
{offer_url}""",
    },
    "B": {
        "subject": "quick question about {domain}",
        "body": """Hi {org},

Most {niche} sites in {state} send visitors to a bank calculator when they want a payment estimate. The visitor leaves, the lender gets the lead.

I put a branded calculator on your own site instead — same numbers, but the enquiry stays yours.

72 hours, fixed price, and I build the first one before you pay for it.

Reply "send it" and I'll put a live sample under your brand.

Qasem
QFINHUB
{offer_url}""",
    },
}


def load_rows() -> list[dict]:
    if not PROSPECTS.exists():
        raise SystemExit(f"missing {PROSPECTS}")
    return list(csv.DictReader(PROSPECTS.open()))


def load_log() -> list[dict]:
    if not LOG.exists():
        return []
    return list(csv.DictReader(LOG.open()))


def already_sent(log: list[dict]) -> set[str]:
    return {r["email"].lower() for r in log}


def render(row: dict, template_id: str) -> tuple[str, str]:
    t = TEMPLATES[template_id]
    niche = row.get("niche") or "mortgage"
    # state is only used in template B; fall back gracefully
    state = row.get("state") or "your area"
    vals = {
        "org": row["org"].strip() or row["domain"],
        "domain": row["domain"],
        "niche": niche,
        "state": state,
        "offer_url": OFFER_URL,
    }
    return t["subject"].format(**vals), t["body"].format(**vals)


def send_one(to: str, subject: str, body: str) -> bool:
    proc = subprocess.run(
        [sys.executable, "scripts/send-email.py", "--to", to,
         "--subject", subject, "--body", body],
        capture_output=True, text=True,
    )
    if proc.returncode != 0:
        print(f"    FAILED: {proc.stderr.strip()[:160]}")
        return False
    print(f"    {proc.stdout.strip()[:90]}")
    return True


def append_log(rows: list[dict]) -> None:
    new = not LOG.exists()
    with LOG.open("a", newline="") as f:
        w = csv.DictWriter(
            f,
            fieldnames=["sent_at", "email", "org", "domain", "template", "subject"],
        )
        if new:
            w.writeheader()
        w.writerows(rows)


def stats() -> None:
    log = load_log()
    if not log:
        print("no sends yet")
        return
    by_t = {}
    for r in log:
        by_t.setdefault(r["template"], 0)
        by_t[r["template"]] += 1
    print(f"total sent: {len(log)}")
    for t, n in sorted(by_t.items()):
        print(f"   template {t}: {n}")
    days = {}
    for r in log:
        d = r["sent_at"][:10]
        days[d] = days.get(d, 0) + 1
    print("by day:")
    for d, n in sorted(days.items()):
        print(f"   {d}: {n}")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--template", default="A", choices=sorted(TEMPLATES))
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--cap", type=int, default=15, help="max sends in this run")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--stats", action="store_true")
    args = ap.parse_args()

    if args.stats:
        stats()
        return 0

    rows = load_rows()
    log = load_log()
    sent_to = already_sent(log)

    today = datetime.date.today().isoformat()
    sent_today = sum(1 for r in log if r["sent_at"].startswith(today))
    remaining_cap = max(0, args.cap - sent_today)
    if remaining_cap == 0:
        print(f"daily cap reached ({sent_today}/{args.cap}). Nothing sent.")
        return 0

    queue = [
        r for r in rows
        if r["email"].lower() not in sent_to
        and not any(h in r["domain"] for h in SKIP_DOMAIN_HINTS)
    ]
    if args.limit:
        queue = queue[: args.limit]
    queue = queue[:remaining_cap]

    print(f"prospects: {len(rows)} | already sent: {len(sent_to)} | "
          f"sent today: {sent_today}/{args.cap} | queueing: {len(queue)}\n")

    sendable = []
    for i, r in enumerate(queue, 1):
        subject, body = render(r, args.template)
        print(f"[{i}/{len(queue)}] {r['org'][:44]} <{r['email']}>")
        if args.dry_run:
            print(f"    SUBJECT: {subject}")
            for line in body.splitlines():
                print(f"    | {line}")
            print()
            continue
        if send_one(r["email"], subject, body):
            sendable.append(
                {
                    "sent_at": datetime.datetime.now().isoformat(timespec="seconds"),
                    "email": r["email"],
                    "org": r["org"],
                    "domain": r["domain"],
                    "template": args.template,
                    "subject": subject,
                }
            )
            if i < len(queue):
                time.sleep(random.uniform(45, 150))
        else:
            time.sleep(5)

    if sendable:
        append_log(sendable)
        print(f"\nsent {len(sendable)} -> logged to {LOG}")
    print("dry run complete" if args.dry_run else "run complete")
    return 0


if __name__ == "__main__":
    sys.exit(main())
