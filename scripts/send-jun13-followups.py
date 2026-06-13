#!/usr/bin/env python3
"""Phase 19: Send Jun 13 outreach follow-ups (8 audited, low spam risk)"""

import json, smtplib, os, sys
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load env
with open('.env.local') as f:
    env = {}
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            env[k.strip()] = v.strip().strip('"').strip("'")

GMAIL = env['GMAIL_ADDRESS']
APP_PASS = env['GMAIL_APP_PASSWORD']

# Load follow-ups
with open('.optimizer-data/jun13-followup-readiness-check.json') as f:
    data = json.load(f)

followups = data['followups']
log_entries = []

for i, fu in enumerate(followups):
    prospect = fu['prospect']
    email = fu['email']
    subject = f"Re: Free calculator widget for {prospect}"
    body = fu['followup_copy_short']
    
    msg = MIMEMultipart()
    msg['From'] = GMAIL
    msg['To'] = email
    msg['Subject'] = subject
    msg['Message-ID'] = f'<jun13-followup-{i}-{prospect.replace(" ","-").lower()}@qfinhub.com>'
    msg.attach(MIMEText(body, 'plain'))
    
    try:
        s = smtplib.SMTP('smtp.gmail.com', 587, timeout=15)
        s.starttls()
        s.login(GMAIL, APP_PASS)
        s.send_message(msg)
        s.quit()
        print(f"  ✅ {prospect} → {email}")
        log_entries.append({
            'prospect': prospect,
            'email': email,
            'status': 'SENT',
            'sent_at': datetime.utcnow().isoformat() + 'Z',
            'spam_risk': fu['spam_risk_score']
        })
    except Exception as e:
        print(f"  ❌ {prospect} → {email}: {str(e)[:80]}")
        log_entries.append({
            'prospect': prospect,
            'email': email,
            'status': f'FAILED: {str(e)[:80]}',
            'sent_at': datetime.utcnow().isoformat() + 'Z'
        })

# Save log
log = {
    'phase': '19',
    'batch': 'jun13-followups',
    'sent_at': datetime.utcnow().isoformat() + 'Z',
    'total': len(followups),
    'sent': sum(1 for e in log_entries if e['status'] == 'SENT'),
    'failed': sum(1 for e in log_entries if e['status'] != 'SENT'),
    'entries': log_entries
}
with open('.optimizer-data/jun13-followup-send-log.json', 'w') as f:
    json.dump(log, f, indent=2)

print(f"\nSent: {log['sent']}/{log['total']} follow-ups")
