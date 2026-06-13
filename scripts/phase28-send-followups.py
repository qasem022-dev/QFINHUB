#!/usr/bin/env python3
"""Phase 28 — Send 8 Jun 13 follow-ups"""
import smtplib, json, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

GMAIL = "q.finhub@gmail.com"
APP_PASS = "igro rdgg swjo dmwp"

EMBED_MORTGAGE = '<iframe src="https://www.qfinhub.com/embed/mortgage-affordability" width="100%" height="650" style="border:0;max-width:100%;" loading="lazy" title="Mortgage Affordability Calculator"></iframe>'
EMBED_DEBT = '<iframe src="https://www.qfinhub.com/embed/debt-payoff" width="100%" height="650" style="border:0;max-width:100%;" loading="lazy" title="Debt Payoff Calculator"></iframe>'

followups = [
    {
        "prospect": "Money Under 30",
        "email": "info@moneyunder30.com",
        "subject": "Re: Free calculator idea (debt version)",
        "body": f"""Hi,

Reaching back about the calculator widget. I've built a debt snowball vs avalanche tool that would pair well with your debt payoff content — readers compare both methods with their actual numbers. Free embed, no signup.

Want me to send the code?

Best,
Qasem Mohammed
QFINHUB

{EMBED_DEBT}""",
        "offer": "offer-B"
    },
    {
        "prospect": "Making Sense of Cents",
        "email": "info@makingsenseofcents.com",
        "subject": "Re: Free tool for your readers (updated)",
        "body": f"""Hi Michelle,

Following up from last month. I now have a debt snowball vs avalanche calculator that might help your readers working through debt — side-by-side comparison with their real numbers. Free, no signup.

Want me to send the one-line embed?

Best,
Qasem Mohammed
QFINHUB

{EMBED_DEBT}""",
        "offer": "offer-B"
    },
    {
        "prospect": "Personal Finance Club",
        "email": "contact@personalfinanceclub.com",
        "subject": "Re: Interactive calculator idea",
        "body": """Hi Jeremy,

Checking in on the custom calculator idea — I can create an interactive version where your readers plug in their own investing numbers instead of reading static examples. No cost, no signup.

Would that be useful for any of your articles?

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-C"
    },
    {
        "prospect": "The Mortgage Reports",
        "email": "contact@themortgagereports.com",
        "subject": "Re: Mortgage calculator (corrected offer)",
        "body": f"""Hi,

Reaching out again — my earlier email sent the wrong calculator. I actually have a mortgage affordability calculator that's a much better fit for your readers. Shows exact home price based on income, debts, and down payment. Free embed, no signup.

Want the code?

Best,
Qasem Mohammed
QFINHUB

{EMBED_MORTGAGE}""",
        "offer": "offer-A"
    },
    {
        "prospect": "Afford Anything",
        "email": "hello@affordanything.com",
        "subject": "Re: Mortgage affordability widget — quick check",
        "body": """Hi Paula,

Just checking the mortgage affordability widget I shared didn't get buried. No pressure — happy to answer questions or adjust sizing.

Let me know either way!

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-A"
    },
    {
        "prospect": "The College Investor",
        "email": "robert@thecollegeinvestor.com",
        "subject": "Re: Mortgage calculator widget — quick check",
        "body": """Hi Robert,

Just checking if the mortgage affordability widget would be useful for your readers. Happy to answer questions.

Let me know either way!

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-A"
    },
    {
        "prospect": "ESI Money",
        "email": "esi@esimoney.com",
        "subject": "Re: Debt payoff widget — quick check",
        "body": """Hi ESI,

Following up on the debt snowball vs avalanche widget — no worries if it's not a fit, just wanted to check it didn't get lost.

Let me know!

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-B"
    },
    {
        "prospect": "Millennial Revolution",
        "email": "kristy@millennial-revolution.com",
        "subject": "Re: FIRE-friendly mortgage widget — quick check",
        "body": """Hi Kristy,

Quick follow-up on the FIRE-friendly mortgage calculator widget — just checking it didn't get buried.

Happy to answer questions!

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-A"
    }
]

sent_log = []
failed = []

for i, e in enumerate(followups):
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f'Qasem Mohammed <{GMAIL}>'
        msg['To'] = e['email']
        msg['Subject'] = e['subject']
        msg['Message-ID'] = f'<phase28-followup-{datetime.now().strftime("%Y%m%d%H%M%S")}-{i}@qfinhub.com>'
        msg.attach(MIMEText(e['body'], 'plain', 'utf-8'))
        
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=30) as s:
            s.starttls()
            s.login(GMAIL, APP_PASS)
            s.send_message(msg)
        
        entry = {
            "prospect": e['prospect'],
            "email": e['email'],
            "subject": e['subject'],
            "offer": e['offer'],
            "sent": True,
            "sent_at": datetime.now().isoformat() + "Z",
            "message_id": msg['Message-ID'],
            "bounced": False,
            "replied": None,
            "positive": None
        }
        sent_log.append(entry)
        print(f"SENT: {e['prospect']} ({e['email']}) — {e['offer']}")
    except Exception as err:
        failed.append({"prospect": e['prospect'], "email": e['email'], "error": str(err)})
        print(f"FAILED: {e['prospect']} — {err}")

DATA = "/home/admin1/qfinhub/.optimizer-data"
result = {
    "phase": "28",
    "task": "jun13-followup-send-log",
    "sent_at": datetime.now().isoformat() + "Z",
    "total": len(followups),
    "sent": len(sent_log),
    "failed": len(failed),
    "followups": sent_log,
    "failures": failed
}

with open(f"{DATA}/jun13-followup-send-log.json", 'w') as f:
    json.dump(result, f, indent=2)

print(f"\nDone: {len(sent_log)} sent, {len(failed)} failed")
