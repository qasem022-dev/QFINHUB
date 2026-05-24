#!/usr/bin/env python3
"""
QFINHUB Widget Outreach — Batch Email Sender
Sends outreach emails to all remaining unsent targets.
"""

import json
import smtplib
import time
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / ".widget-outreach"
TARGETS_FILE = DATA_DIR / "targets.json"
SENT_FILE = DATA_DIR / "sent-outreach.json"
CAMPAIGN_LOG = DATA_DIR / "campaign-log.json"

GMAIL_USER = "q.finhub@gmail.com"
GMAIL_PASS = "igro rdgg swjo dmwp"
BASE_URL = "https://www.qfinhub.com"

# ─── Calculator Map (niche → widget) ───
CALC_MAP = {
    "mortgage": {"slug": "mortgage-affordability", "name": "Mortgage Affordability Calculator"},
    "real estate": {"slug": "mortgage-affordability", "name": "Mortgage Affordability Calculator"},
    "investing": {"slug": "compound-interest", "name": "Compound Interest Calculator"},
    "stock": {"slug": "investment-growth", "name": "Investment Growth Calculator"},
    "retirement": {"slug": "retirement", "name": "Retirement Calculator"},
    "debt": {"slug": "credit-card-payoff", "name": "Debt Payoff Calculator"},
    "credit": {"slug": "credit-card-payoff", "name": "Debt Payoff Calculator"},
    "tax": {"slug": "tax", "name": "Tax Calculator"},
    "savings": {"slug": "savings-goal", "name": "Savings Goal Calculator"},
    "budget": {"slug": "budget", "name": "Budget Planner"},
    "loan": {"slug": "loan", "name": "Loan Calculator"},
    "personal finance": {"slug": "budget", "name": "Budget Planner"},
    "general": {"slug": "compound-interest", "name": "Compound Interest Calculator"},
}

def pick_calculator(niche_str):
    """Match niche string to best calculator widget."""
    if not niche_str:
        return CALC_MAP["general"]
    lower = niche_str.lower()
    for key, calc in CALC_MAP.items():
        if key in lower:
            return calc
    # Check for partial matches
    if "debt" in lower or "payoff" in lower:
        return CALC_MAP["debt"]
    if "budget" in lower or "saving" in lower or "frugal" in lower or "minimalis" in lower:
        return CALC_MAP["budget"]
    if "invest" in lower or "stock" in lower or "dividend" in lower or "etf" in lower:
        return CALC_MAP["investing"]
    if "retire" in lower or "fire" in lower:
        return CALC_MAP["retirement"]
    if "mortgage" in lower or "real estate" in lower or "home" in lower:
        return CALC_MAP["mortgage"]
    if "credit card" in lower or "credit score" in lower:
        return CALC_MAP["credit"]
    return CALC_MAP["general"]

def generate_embed(slug, name):
    """Generate iframe embed code."""
    return (
        f'<iframe src="{BASE_URL}/api/widget/{slug}" title="{name}" '
        f'width="100%" height="500" frameborder="0" loading="lazy" '
        f'style="max-width:100%;border:none;border-radius:8px;'
        f'box-shadow:0 1px 4px rgba(0,0,0,0.1);"></iframe>\n'
        f'<p style="text-align:center;font-size:12px;color:#888;margin-top:4px;">'
        f'<a href="{BASE_URL}/calculators/{slug}" target="_blank" rel="noopener" '
        f'style="color:#888;text-decoration:none;">Powered by QFINHUB — Free {name}</a></p>'
    )

def generate_pitch(blog, calc):
    """Generate the outreach email body."""
    name = blog.get("title", "your blog")
    niche = blog.get("niche", "personal finance")
    embed = generate_embed(calc["slug"], calc["name"])

    body = f"""Hi there,

I came across {name} and love the content you're putting out about {niche}. I run QFINHUB.com — we build free financial calculators that bloggers can embed on their sites.

I think your readers would really benefit from our {calc['name']}. It's completely free, takes 30 seconds to embed, and keeps readers engaged on your site longer. No sign-up required for you or your readers.

Here's the embed code — ready to paste into any page:

{embed}

Let me know if you have any questions or would like a different calculator. Happy to help!

Best,
Qasem
QFINHUB.com"""

    subject = f"Free {calc['name']} for {name.split(' - ')[0].split(' | ')[0]}"
    # Keep subject under 80 chars
    if len(subject) > 78:
        subject = f"Free {calc['name']} for your readers"

    return subject, body

def send_email(to, subject, body):
    """Send email via Gmail SMTP."""
    msg = MIMEMultipart("alternative")
    msg["From"] = f"QFINHUB <{GMAIL_USER}>"
    msg["To"] = to
    msg["Subject"] = subject

    msg.attach(MIMEText(body, "plain", "utf-8"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587, timeout=30) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_PASS)
            server.send_message(msg)
        return True, None
    except Exception as e:
        return False, str(e)

def main():
    # Load targets and sent log
    targets_data = json.loads(TARGETS_FILE.read_text())
    targets = targets_data["targets"]
    sent = json.loads(SENT_FILE.read_text()) if SENT_FILE.exists() else {}

    # Find unsent targets with emails
    remaining = [t for t in targets if t.get("email") and not sent.get(t["email"])]

    print(f"📊 Campaign Status:")
    print(f"   Total targets: {len(targets)}")
    print(f"   Already sent: {len(sent)}")
    print(f"   Remaining to contact: {len(remaining)}")
    print()

    if not remaining:
        print("✅ All targets contacted! Nothing to do.")
        return

    sent_count = 0
    fail_count = 0

    for i, target in enumerate(remaining):
        email = target["email"]
        niche = target.get("niche", "general")
        calc = pick_calculator(niche)
        subject, body = generate_pitch(target, calc)

        print(f"[{i+1}/{len(remaining)}] {target['title'][:50]}")
        print(f"   To: {email}")
        print(f"   Subject: {subject}")
        print(f"   Widget: {calc['name']}")

        success, error = send_email(email, subject, body)

        if success:
            print(f"   ✅ Sent!")
            sent[email] = {
                "sentAt": datetime.utcnow().isoformat() + "Z",
                "url": target["url"],
                "niche": niche,
                "subject": subject,
            }
            sent_count += 1
        else:
            print(f"   ❌ Failed: {error}")
            fail_count += 1

        # Save sent log after each to be safe
        SENT_FILE.write_text(json.dumps(sent, indent=2))

        # Polite delay between sends
        if i < len(remaining) - 1:
            time.sleep(1)

    # Log to campaign log
    log_entry = {
        "ts": datetime.utcnow().isoformat() + "Z",
        "type": "batch-outreach",
        "details": {"sent": sent_count, "failed": fail_count, "total": len(remaining)},
    }
    if CAMPAIGN_LOG.exists():
        log = json.loads(CAMPAIGN_LOG.read_text())
    else:
        log = []
    log.append(log_entry)
    if len(log) > 2000:
        log = log[-2000:]
    CAMPAIGN_LOG.write_text(json.dumps(log, indent=2))

    print(f"\n📊 Batch complete: {sent_count} sent, {fail_count} failed")
    print(f"   Updated sent-outreach.json")

if __name__ == "__main__":
    main()
