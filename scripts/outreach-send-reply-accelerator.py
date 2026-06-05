#!/usr/bin/env python3
"""Send 5 reply-accelerator outreach emails for Phase 16.9."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

GMAIL_USER = 'q.finhub@gmail.com'
GMAIL_PASS = 'igro rdgg swjo dmwp'

EMBED_CODE = '<iframe src="https://www.qfinhub.com/embed/mortgage-affordability" width="100%" height="650" style="border:0;max-width:100%;" loading="lazy" title="Mortgage Affordability Calculator"></iframe>'

emails = [
    {
        'to': 'retireby40@gmail.com',
        'subject': 'Free Mortgage Affordability Widget for Retire by 40 Readers',
        'body': f"""Hi Retire by 40,

I've enjoyed reading your FI journey and the practical advice you share — housing costs are such a huge factor in the early retirement equation.

I run QFINHUB.com, a free financial calculator platform. We've built a mortgage affordability calculator widget that helps people determine exactly how much house they can afford based on income, debts, and down payment.

For your FI-focused readers, knowing their maximum affordable home price means they can make housing decisions that don't derail their retirement timeline. The widget uses standard 28%/36% DTI lending guidelines and is:
- 100% free, no signup
- No data collection (calculations stay in user's browser)
- Mobile responsive
- One line of HTML to embed

Here's the embed code:
{EMBED_CODE}

Full details: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Let me know if this would be useful for your readers or if you have any questions. Happy to discuss!

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    },
    {
        'to': 'frugalwoods@gmail.com',
        'subject': 'Free Mortgage Affordability Widget for Frugalwoods Readers',
        'body': f"""Hi Frugalwoods,

I've followed your writing on intentional spending and financial independence — your approach to mindful money decisions really resonates.

I run QFINHUB.com, a free calculator platform. We've built a mortgage affordability calculator widget that aligns with frugal values — it helps people determine exactly how much house they can afford without overborrowing.

Your readers are intentional spenders who want to make smart housing decisions. This widget gives them a clear, honest answer about their budget — no upsells, no data collection, no catch. It's:
- 100% free
- No data collected (all client-side)
- Mobile responsive
- One line of HTML

Embed code:
{EMBED_CODE}

Info page: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Would this be useful for your readers? Let me know what you think!

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    },
    {
        'to': 'contact@mymoneywizard.com',
        'subject': 'Free Mortgage Affordability Widget for My Money Wizard Readers',
        'body': f"""Hi My Money Wizard,

I've been reading your finance content — love the practical, no-nonsense advice you share with your audience.

I run QFINHUB.com, a free calculator platform. Most of your millennial readers are navigating their first home purchase, and we've built a mortgage affordability widget that answers their #1 question: how much can I actually afford?

The widget calculates affordable home price based on income, debts, and down payment using 28%/36% DTI guidelines. It's:
- 100% free, no signup
- Zero data collection
- Mobile responsive
- One line of HTML

Embed code:
{EMBED_CODE}

Details: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Let me know if this would be a helpful resource for your readers!

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    },
    {
        'to': 'info@20sfinances.com',
        'subject': 'Free Mortgage Affordability Widget for 20s Finances Readers',
        'body': f"""Hi 20s Finances,

Your site helps 20-somethings navigate early financial decisions — and buying a first home is one of the biggest ones out there.

I run QFINHUB.com, a free calculator platform. We've built a mortgage affordability widget that answers the question every first-time buyer asks: how much house can I afford?

The widget uses standard lending guidelines (28%/36% DTI) to calculate affordable home price from income, debts, and down payment. It's:
- 100% free
- No data collected
- Mobile responsive
- Simple one-line embed

Embed code:
{EMBED_CODE}

More info: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Would this be helpful for your readers who are starting to think about homeownership? Let me know!

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    },
    {
        'to': 'contact@thebudgetmom.com',
        'subject': 'Free Mortgage Affordability Widget for The Budget Mom Readers',
        'body': f"""Hi The Budget Mom,

I love how you make budgeting practical and approachable for families — that's exactly the kind of financial education that makes a difference.

I run QFINHUB.com, a free calculator platform. For families budgeting for a home purchase, we've built a mortgage affordability widget that shows exactly what home price fits their family budget — no guesswork.

The widget calculates affordable home price based on income, existing debts, and down payment using standard 28%/36% DTI guidelines. It's:
- 100% free, no signup
- No data collected (all client-side)
- Mobile responsive
- One line of HTML to embed

Embed code:
{EMBED_CODE}

Info: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Would your readers find this useful as part of their home-buying budget planning? I'd love to hear your thoughts.

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    }
]

sent = []
failed = []

for e in emails:
    try:
        msg = MIMEMultipart('alternative')
        msg['From'] = f'QFINHUB <{GMAIL_USER}>'
        msg['To'] = e['to']
        msg['Subject'] = e['subject']
        msg.attach(MIMEText(e['body'], 'plain', 'utf-8'))
        
        with smtplib.SMTP('smtp.gmail.com', 587, timeout=30) as server:
            server.starttls()
            server.login(GMAIL_USER, GMAIL_PASS)
            server.send_message(msg)
        sent.append(e['to'])
        print(f'SENT: {e["to"]}')
    except Exception as err:
        failed.append({'to': e['to'], 'error': str(err)})
        print(f'FAILED: {e["to"]} — {err}')

print(f'\nDone: {len(sent)} sent, {len(failed)} failed')
print(json.dumps({'sent': sent, 'failed': failed}))
