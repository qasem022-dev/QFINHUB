#!/usr/bin/env python3
"""Phase 25 — Send 5 V2 test emails"""
import smtplib, json, os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

GMAIL = "q.finhub@gmail.com"
APP_PASS = "igro rdgg swjo dmwp"

EMBED_MORTGAGE = '<iframe src="https://www.qfinhub.com/embed/mortgage-affordability" width="100%" height="650" style="border:0;max-width:100%;" loading="lazy" title="Mortgage Affordability Calculator"></iframe>'
EMBED_DEBT = '<iframe src="https://www.qfinhub.com/embed/debt-payoff" width="100%" height="650" style="border:0;max-width:100%;" loading="lazy" title="Debt Payoff Calculator"></iframe>'

test_emails = [
    {
        "prospect": "Debt Free Forties",
        "email": "debtfreeforties@protonmail.com",
        "subject": "Quick tool idea for your debt payoff content",
        "body": f"""Hi,

I read your debt payoff journey — the snowball method walkthrough is really clear.

I built a free debt snowball vs avalanche calculator where readers enter their actual debts and see both methods side-by-side with real numbers. No signup, no data collection — just a clean calculator they can use on the page.

Would this be useful for your readers? Happy to send the one-line embed code.

Best,
Qasem Mohammed
QFINHUB

{EMBED_DEBT}""",
        "offer": "offer-B"
    },
    {
        "prospect": "Debt Roundup",
        "email": "contact@debtroundup.com",
        "subject": "Quick tool idea for your debt consolidation guide",
        "body": f"""Hi,

Your debt consolidation content explains the strategy well but the math is static.

I built a free debt payoff calculator where readers enter their actual debts and rates and see exactly which payoff order saves the most. No signup, no data collection — just real numbers.

Would this be useful alongside your consolidation guides? Happy to send the embed.

Best,
Qasem Mohammed
QFINHUB

{EMBED_DEBT}""",
        "offer": "offer-B"
    },
    {
        "prospect": "Frugalwoods",
        "email": "frugalwoods@gmail.com",
        "subject": "Idea for your frugal living content",
        "body": """Hi Liz,

I've read Frugalwoods for years — your approach to intentional spending is something I deeply respect.

I built a free mortgage affordability calculator that fits with your philosophy: knowing exactly what home price fits your finances before making the biggest purchase of your life. No signup, no data collection — just real numbers.

Also have a debt payoff calculator if that's more relevant for your readers. Happy to send either embed code.

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-A"
    },
    {
        "prospect": "Miss Elvane",
        "email": "elva@misselvane.com",
        "subject": "Quick idea for your budgeting content",
        "body": """Hi Elva,

Your saving challenges and budgeting content is really practical — exactly what people need.

I built a free debt snowball vs avalanche calculator where readers plug in their actual debts and see which method saves them more. No signup, no data collection — just a clean calculator they can use.

Would your readers find this useful? Happy to send the one-line embed code.

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-B"
    },
    {
        "prospect": "Simplify and Enjoy",
        "email": "simplifyandenjoy@gmail.com",
        "subject": "Idea for your budgeting content",
        "body": """Hi,

Your approach to simplifying finances is exactly what most people need.

I built a free debt snowball vs avalanche calculator that simplifies a complex decision — readers enter their debts and see instantly which method saves more money. No signup, no data collection.

Would this be useful for your readers? Happy to send the one-line embed.

Best,
Qasem Mohammed
QFINHUB""",
        "offer": "offer-B"
    }
]

sent_log = []
failed = []

for i, e in enumerate(test_emails):
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f'Qasem Mohammed <{GMAIL}>'
        msg['To'] = e['email']
        msg['Subject'] = e['subject']
        msg['Message-ID'] = f'<phase25-v2-{datetime.now().strftime("%Y%m%d%H%M%S")}-{i}@qfinhub.com>'
        msg.attach(MIMEText(e['body'], 'plain', 'utf-8'))
        
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=30) as s:
            s.starttls()
            s.login(GMAIL, APP_PASS)
            s.send_message(msg)
        
        sent_log.append({
            "prospect": e['prospect'],
            "email": e['email'],
            "subject": e['subject'],
            "offer": e['offer'],
            "sent_at": datetime.now().isoformat() + "Z",
            "status": "SENT"
        })
        print(f"SENT: {e['prospect']} ({e['email']})")
    except Exception as err:
        failed.append({"prospect": e['prospect'], "email": e['email'], "error": str(err)})
        print(f"FAILED: {e['prospect']} — {err}")

# Save results
result = {
    "phase": "25",
    "total_sent": len(sent_log),
    "total_failed": len(failed),
    "emails": sent_log,
    "failed": failed
}

DATA = "/home/admin1/qfinhub/.optimizer-data"
os.makedirs(DATA, exist_ok=True)

with open(f"{DATA}/phase25-test-email-send-log.json", 'w') as f:
    json.dump(result, f, indent=2)

print(f"\nDone: {len(sent_log)} sent, {len(failed)} failed")
