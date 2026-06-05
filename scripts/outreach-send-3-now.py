#!/usr/bin/env python3
"""Send 3 personalized outreach emails for Phase 16.8."""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import json

GMAIL_USER = 'q.finhub@gmail.com'
GMAIL_PASS = 'igro rdgg swjo dmwp'

EMBED_CODE = '<iframe src="https://www.qfinhub.com/embed/mortgage-affordability" width="100%" height="650" style="border:0;max-width:100%;" loading="lazy" title="Mortgage Affordability Calculator"></iframe>'

emails = [
    {
        'to': 'editorial@investopedia.com',
        'subject': 'Free Mortgage Affordability Widget for Investopedias Mortgage Section',
        'body': f"""Hi Investopedia Editorial Team,

I've been a long-time reader of Investopedia's mortgage and homebuying guides — they're some of the most trusted resources in personal finance education.

I run QFINHUB.com, a free financial calculator platform with 125+ tools. We've built a mortgage affordability calculator widget that I think would complement your mortgage education hub perfectly.

The widget helps readers determine how much house they can afford based on income, debts, and down payment — using standard 28%/36% DTI lending guidelines. It's:
- 100% free, no signup
- No user data collected (all calculations client-side)
- Mobile responsive
- One line of HTML to embed

Here's the embed code:
{EMBED_CODE}

Full details: https://www.qfinhub.com/widgets/mortgage-affordability-embed

No catch, no paid tiers — we built this to be genuinely useful. Let me know if you have any questions or would like a different calculator widget.

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    },
    {
        'to': 'support@biggerpockets.com',
        'subject': 'Free Mortgage Affordability Widget for BiggerPockets Community',
        'body': f"""Hi BiggerPockets Team,

BiggerPockets is the go-to community for real estate investors — I've seen how your members share deal analysis and property evaluation strategies daily.

I run QFINHUB.com, a free calculator platform. We've built a mortgage affordability calculator widget that could be a helpful tool for your members, especially newer investors figuring out their first property budget.

The widget calculates affordable home price based on income, existing debts, and down payment — with visual DTI ratio breakdowns. It's:
- 100% free, no signup required
- Zero data collection (calculations stay in user's browser)
- Mobile responsive
- Embeddable in one line of HTML

Embed code:
{EMBED_CODE}

More info: https://www.qfinhub.com/widgets/mortgage-affordability-embed

If your members would benefit from other calculators (cap rate, cash-on-cash return, compound interest), I'm happy to discuss. Let me know!

Best,
Qasem Mohammed
Founder, QFINHUB.com"""
    },
    {
        'to': 'hello@choosefi.com',
        'subject': 'Free Mortgage Affordability Widget for ChooseFI Community',
        'body': f"""Hi ChooseFI Team,

I've followed the FI community for years — the ChooseFI podcast and resources have helped so many people on their path to financial independence.

I run QFINHUB.com, a free financial calculator platform. Homebuying is one of the biggest financial decisions on the FI journey, and we've built a mortgage affordability calculator widget that could be a great resource for your community.

The widget helps users instantly determine how much house they can afford based on their income, debts, and down payment — fundamental math for anyone weighing renting vs. buying on their FI path.

It's completely free, no signup, no data collection, and works on any website with one line of HTML:

{EMBED_CODE}

Details: https://www.qfinhub.com/widgets/mortgage-affordability-embed

Happy to discuss other calculators that might be useful for your community. Let me know!

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
