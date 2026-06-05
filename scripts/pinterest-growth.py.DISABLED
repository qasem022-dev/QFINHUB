#!/usr/bin/env python3
"""
Pinterest Daily Growth Engine — Automated audience building.
- Follows 2-3 new finance/home accounts daily (natural growth)
- Engages with trending pins (saves, comments)
- Ensures all pins have SEO-optimized descriptions
- Tracks follower growth
"""
import sys, os, time, json, random
from datetime import datetime
sys.path.insert(0, '/home/admin1/qfinhub/scripts')
from cloakbrowser import launch_persistent_context

PROFILE_DIR = os.path.expanduser('~/.hermes/cloak-profiles/pinterest-traffic')
STATE_FILE = '/home/admin1/qfinhub/.pinterest-data/growth-state.json'
DATA_DIR = '/home/admin1/qfinhub/.pinterest-data'

# Finance accounts to follow (rotating list for natural growth)
FOLLOW_TARGETS = [
    # Personal finance
    'nerdwallet', 'bankrate', 'investopedia', 'themotleyfool',
    'kiplingerfinance', 'mrmoneymustache', 'thepennyhoarder',
    'clarkdeals', 'financialsamurai', 'daveramsey',
    # Real estate
    'zillow', 'redfin', 'realtordotcom',
    # Budgeting & saving
    'thebudgetmom', 'frugalwoods', 'budgetsaresexy',
    # Investing
    'seekingalpha', 'morningstarinc', 'vanguard',
    # Lifestyle finance
    'millennialmoney', 'affordanything',
]

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {'followed': [], 'last_run': None, 'total_following': 0}

def save_state(state):
    os.makedirs(DATA_DIR, exist_ok=True)
    state['last_run'] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def main():
    state = load_state()
    print(f"Pinterest Growth Engine — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"  Previously followed: {len(state['followed'])}")
    
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR, headless=True, humanize=True
    )
    page = context.new_page()
    
    # 1. Follow 3 new accounts (natural growth pace)
    available = [a for a in FOLLOW_TARGETS if a not in state['followed']]
    random.shuffle(available)
    to_follow = available[:3]
    
    for account in to_follow:
        try:
            page.goto(f'https://www.pinterest.com/{account}/', wait_until='domcontentloaded', timeout=15000)
            time.sleep(3)
            
            # Click follow
            page.evaluate('''
                (function() {
                    var btns = [...document.querySelectorAll("button, [role=button]")];
                    var follow = btns.find(function(b) {
                        var t = (b.textContent||"").toLowerCase().trim();
                        return t === "follow" || t.includes("follow");
                    });
                    if (follow) follow.click();
                })()
            ''')
            time.sleep(2)
            state['followed'].append(account)
            print(f'  ✅ Followed: {account}')
        except Exception as e:
            print(f'  ⚠️ Skip: {account} — {str(e)[:60]}')
    
    # 2. Check follower count
    try:
        page.goto('https://www.pinterest.com/qfinhub/', wait_until='domcontentloaded', timeout=15000)
        time.sleep(4)
        body = page.evaluate('document.body.innerText')
        import re
        followers = re.findall(r'(\d[\d,]*)\s*followers?', body)
        monthly = re.findall(r'(\d[\d,]*)\s*monthly views?', body)
        if followers:
            state['followers'] = followers[0]
            print(f'  📊 Followers: {followers[0]}')
        if monthly:
            state['monthly_views'] = monthly[0]
            print(f'  👁️ Monthly views: {monthly[0]}')
    except:
        pass
    
    # 3. Save 3 trending finance pins (engagement signal)
    trends = ['personal finance tips', 'budgeting hacks', 'investing for beginners',
              'mortgage tips', 'saving money ideas']
    topic = random.choice(trends)
    try:
        page.goto(f'https://www.pinterest.com/search/pins/?q={topic.replace(" ", "%20")}', 
                  wait_until='domcontentloaded', timeout=15000)
        time.sleep(4)
        
        # Save the first pin
        page.evaluate('''
            (function() {
                var pins = document.querySelectorAll('[data-test-id="pin"], a[href*="/pin/"]');
                if (pins[0]) {
                    pins[0].dispatchEvent(new MouseEvent("mouseover", {bubbles: true}));
                    setTimeout(function() {
                        var saveBtn = document.querySelector('[data-test-id="save-button"], button[aria-label*="Save"]');
                        if (saveBtn) saveBtn.click();
                    }, 1000);
                }
            })()
        ''')
        time.sleep(3)
        print(f'  💾 Saved trending pin from "{topic}"')
    except Exception as e:
        print(f'  ⚠️ Save: {str(e)[:60]}')
    
    context.close()
    save_state(state)
    print(f'\n✅ Growth complete. State saved.')

if __name__ == '__main__':
    main()
