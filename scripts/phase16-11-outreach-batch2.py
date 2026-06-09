#!/usr/bin/env python3
"""Phase 16.11 — Batch 2 Outreach: 5 Reply Accelerator prospects"""
import smtplib, os, json
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load creds
from dotenv import load_dotenv
load_dotenv('.env.local')
GMAIL = os.getenv('GMAIL_ADDRESS')
APP_PASS = os.getenv('GMAIL_APP_PASSWORD')

# Widget share packet
WIDGET_EMBED_CODE = '''<iframe
  src="https://www.qfinhub.com/embed/mortgage-affordability"
  width="100%"
  height="650"
  style="border:0;max-width:100%;"
  loading="lazy"
  title="Mortgage Affordability Calculator">
</iframe>'''

DEBT_WIDGET_EMBED = '''<iframe
  src="https://www.qfinhub.com/embed/debt-payoff"
  width="100%"
  height="650"
  style="border:0;max-width:100%;"
  loading="lazy"
  title="Debt Payoff Calculator (Snowball + Avalanche)">
</iframe>'''

# Prospects with personalized pitches
prospects = [
    {
        "name": "Afford Anything",
        "email": "hello@affordanything.com",
        "subject": "Free tool for your readers: Mortgage Affordability Calculator widget",
        "body": """Hi Paula,

I'm a fan of Afford Anything — your core message about intentional choices is something I deeply respect.

I built a free mortgage affordability calculator widget that I think would be genuinely useful for your readers. When someone's biggest expense is housing, knowing their exact budget makes every other financial choice clearer.

It's a simple embed — copy/paste one line of HTML. No signup, no data collection, no upsells. Just a clean calculator that shows readers exactly what home price fits their finances. Mobile-friendly, zero maintenance.

Here's the embed code:

{embed_code}

And the widget landing page with live preview and FAQ: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Would this be useful for your readers? Happy to help with any sizing or placement questions.

Best,
Qasem Mohammed
QFINHUB""",
        "asset": "mortgage-affordability-embed"
    },
    {
        "name": "The College Investor",
        "email": "robert@thecollegeinvestor.com",
        "subject": "Free widget: Mortgage Affordability Calculator for your readers",
        "body": """Hi Robert,

I read The College Investor regularly — you do great work helping young people navigate their finances.

I built a free mortgage affordability calculator widget that I think would help your readers who are entering their peak homebuying years. Instead of guessing what they can afford, they get a real number based on their income, debts, and down payment.

Simple embed — one line of HTML. No signup, no data collection, no catch. Mobile-responsive and zero maintenance.

Embed code:

{embed_code}

Landing page with live preview: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Would this be useful for your audience? Happy to help with sizing or placement.

Best,
Qasem Mohammed
QFINHUB""",
        "asset": "mortgage-affordability-embed"
    },
    {
        "name": "ESI Money",
        "email": "esi@esimoney.com",
        "subject": "Free debt payoff widget for your readers",
        "body": """Hi ESI,

I appreciate your millionaire interview series — the focus on intentional wealth-building really resonates.

I built a free debt snowball vs avalanche comparison widget that I think your readers would find valuable. It shows side-by-side results for both payoff methods using the reader's actual debts — they see exactly which method saves more and gets them debt-free faster.

Simple embed — just copy/paste HTML. No signup, no data collection, no upsells. Mobile-friendly.

Embed code:

{debt_embed}

Landing page with live preview: https://www.qfinhub.com/widgets/debt-snowball-vs-avalanche-embed

Would your readers find this useful? Let me know if you'd like to try it.

Best,
Qasem Mohammed
QFINHUB""",
        "asset": "debt-snowball-vs-avalanche-embed"
    },
    {
        "name": "Millennial Revolution",
        "email": "kristy@millennial-revolution.com",
        "subject": "Free tool for your readers: Mortgage Affordability widget (FIRE-friendly)",
        "body": """Hi Kristy,

I love Millennial Revolution's practical approach to FIRE — you make the math accessible and real.

I built a free mortgage affordability calculator widget that fits perfectly with FIRE math. Housing is the #1 variable in anyone's FIRE calculation, and this widget shows readers exactly what home price keeps them on track — no guesswork.

Clean embed, one line of HTML. No signup, no data collection, no catch. Mobile-responsive.

Embed code:

{embed_code}

Landing page: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Would your readers find this helpful? Happy to help with sizing or anything else.

Best,
Qasem Mohammed
QFINHUB""",
        "asset": "mortgage-affordability-embed"
    },
    {
        "name": "Can I Retire Yet",
        "email": "editor@caniretireyet.com",
        "subject": "Free retirement/housing calculator widget for your readers",
        "body": """Hi,

I'm a fan of Can I Retire Yet — the practical retirement content is exactly what people need.

Retirees often face big housing decisions (downsize, relocate, rent vs buy). I built a free mortgage affordability calculator widget that helps answer the first question: what can I actually afford?

I also have a debt snowball vs avalanche widget that could help pre-retirees eliminate debt before leaving work.

Both are simple embeds — copy/paste HTML. No signup, no data, no catch.

Mortgage widget: https://www.qfinhub.com/widgets/mortgage-affordability-embed
Debt widget: https://www.qfinhub.com/widgets/debt-snowball-vs-avalanche-embed

Would either of these be useful for your readers? I'm happy to help with any questions.

Best,
Qasem Mohammed
QFINHUB""",
        "asset": "mortgage-affordability-embed"
    },
]

def send_email(prospect):
    """Send one outreach email"""
    body = prospect['body'].replace('{embed_code}', WIDGET_EMBED_CODE).replace('{debt_embed}', DEBT_WIDGET_EMBED)

    msg = MIMEMultipart('alternative')
    msg['From'] = f'Qasem Mohammed <{GMAIL}>'
    msg['To'] = prospect['email']
    msg['Subject'] = prospect['subject']
    msg['Message-ID'] = f'<{datetime.now().strftime("%Y%m%d%H%M%S")}.{prospect["name"].replace(" ","").lower()}@qfinhub.com>'

    msg.attach(MIMEText(body, 'plain'))

    try:
        s = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
        s.starttls()
        s.login(GMAIL, APP_PASS)
        s.send_message(msg)
        s.quit()
        return {'target': prospect['name'], 'status': 'SENT', 'email': prospect['email']}
    except Exception as e:
        return {'target': prospect['name'], 'status': f'FAILED: {e}', 'email': prospect['email']}

results = []
for p in prospects:
    r = send_email(p)
    results.append(r)
    print(f"  {r['target']}: {r['status']}")

print(f"\nTotal sent: {sum(1 for r in results if r['status']=='SENT')}/{len(prospects)}")
print(json.dumps(results, indent=2))
