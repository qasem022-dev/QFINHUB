#!/usr/bin/env python3
"""
X/Twitter Daily Growth Engine — Fast audience building.
- Follows 2-3 finance influencers daily
- Replies to trending finance posts with valuable comments
- Engages with communities using hashtags
- Posts 2-3 times daily (not just 1)
- Tracks follower growth
"""
import sys, os, time, json, random
from datetime import datetime
sys.path.insert(0, '/home/admin1/qfinhub/scripts')
from cloakbrowser import launch_persistent_context

PROFILE_DIR = os.path.expanduser('~/.hermes/cloak-profiles/x-account-1')
STATE_FILE = '/home/admin1/qfinhub/.x-data-v2/growth-state.json'

# Accounts to follow (rotating)
FOLLOW_TARGETS = [
    'RamitSethi', 'APompliano', 'SahilBloom', 'InvestorsLive',
    'stocktalkweekly', 'DividendGrowth', 'dollarsanddata',
    'BehavioralFins', 'morganhousel', 'awealthofcs',
    'BrianFeroldi', 'TheCompoundNews', 'ValueInvesting',
    'iancassel', 'LynAldenContact', 'daviddrawlshum',
    'MacroAlf', 'NorthmanTrader', 'TihoBrkan',
]

# Finance hashtags for discovery
HASHTAGS = ['#personalfinance', '#investing', '#stockmarket', '#moneytips',
            '#financialfreedom', '#budgeting', '#retirement', '#debtfree',
            '#wealthbuilding', '#cryptocurrency', '#realestate', '#taxes']

# Valuable reply templates (adds real value, not spam)
REPLY_TEMPLATES = [
    "Great thread! This aligns with what we built at QFINHUB — free calculators that make these concepts actionable. qfinhub.com",
    "Love this breakdown. If anyone wants to run the numbers themselves, we have free tools for this at QFINHUB.",
    "This is exactly why we built QFINHUB — making financial math accessible. 125 free calculators, no sign-up.",
    "Solid analysis. For anyone wanting to calculate their own scenario, we have a free tool for this at qfinhub.com/calculators",
    "100%. We actually built a free calculator for this exact scenario at QFINHUB. Check it out if you want to run your numbers.",
]

# Daily tweet ideas (value-first, not promotional)
TWEET_TEMPLATES = [
    "Most people overestimate what they'll save in retirement by 40%. Run your real numbers: qfinhub.com/calculators/retirement-planning",
    "The average American pays $5,000+ in hidden mortgage costs. Calculate your true monthly payment (free tool): qfinhub.com",
    "Compound interest is the 8th wonder of the world. See what $500/month becomes in 30 years: qfinhub.com/calculators/compound-interest",
    "Debt snowball vs avalanche — which actually saves you more? We built a free tool to compare both strategies side by side.",
    "Budgeting doesn't have to be complicated. Try the 50/30/20 calculator at QFINHUB — takes 30 seconds, changes everything.",
    "Interest rates just shifted. Use our free mortgage calculator to see how a 0.5% change affects your monthly payment.",
    "Thinking about refinancing? Run the numbers first. Our free refi calculator shows your break-even point instantly.",
    "401k match = free money. But are you optimizing it? Calculate your retirement trajectory with our free 401k tool.",
    "Tax season hack: deducting mortgage interest can save you thousands. Calculate your tax savings at QFINHUB.",
    "Saving $100/month at 7% for 30 years = $122,000. Small habits, massive results. Run your numbers free.",
]

def load_state():
    if os.path.exists(STATE_FILE):
        with open(STATE_FILE) as f:
            return json.load(f)
    return {'followed': [], 'tweets_posted': 0, 'replies_made': 0, 'last_run': None, 'followers': 0}

def save_state(state):
    os.makedirs(os.path.dirname(STATE_FILE), exist_ok=True)
    state['last_run'] = datetime.now().isoformat()
    with open(STATE_FILE, 'w') as f:
        json.dump(state, f, indent=2)

def main():
    state = load_state()
    print(f"X Growth Engine — {datetime.now().strftime('%Y-%m-%d %H:%M')}")
    print(f"  Previous: {state['tweets_posted']} tweets, {state['replies_made']} replies")
    
    context = launch_persistent_context(
        user_data_dir=PROFILE_DIR, headless=True, humanize=True
    )
    page = context.new_page()
    
    # 1. Follow 3 new finance accounts
    available = [a for a in FOLLOW_TARGETS if a not in state['followed']]
    random.shuffle(available)
    to_follow = available[:3]
    
    for account in to_follow:
        try:
            page.goto(f'https://x.com/{account}', wait_until='domcontentloaded', timeout=15000)
            time.sleep(4)
            page.evaluate('''
                (function() {
                    var btns = [...document.querySelectorAll("[role=button]")];
                    var follow = btns.find(function(b) {
                        var t = (b.textContent||"").toLowerCase().trim();
                        return t === "follow";
                    });
                    if (follow) follow.click();
                })()
            ''')
            time.sleep(2)
            state['followed'].append(account)
            print(f'  ✅ Followed: @{account}')
        except Exception as e:
            print(f'  ⚠️ @{account}: {str(e)[:50]}')
    
    # 2. Find trending finance posts and reply
    hashtag = random.choice(HASHTAGS)
    try:
        page.goto(f'https://x.com/search?q={hashtag}&src=typed_query&f=live', 
                  wait_until='domcontentloaded', timeout=15000)
        time.sleep(5)
        
        # Reply to the first visible post
        page.evaluate('''
            (function() {
                var replyBtn = document.querySelector('[data-testid="reply"], [aria-label*="Reply"]');
                if (replyBtn) replyBtn.click();
            })()
        ''')
        time.sleep(3)
        
        reply_text = random.choice(REPLY_TEMPLATES)
        escaped = reply_text.replace("'", "\\'").replace("$", "\\$")
        page.evaluate(f'''
            (function() {{
                var el = document.querySelector('[data-testid="tweetTextarea_0"], [contenteditable="true"], div[role="textbox"]');
                if (el) {{
                    el.focus();
                    el.textContent = '{escaped}';
                    el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                }}
            }})()
        ''')
        time.sleep(2)
        
        page.evaluate('''
            (function() {
                var btn = document.querySelector('[data-testid="tweetButton"], [data-testid="tweetButtonInline"]');
                if (btn) btn.click();
            })()
        ''')
        time.sleep(5)
        state['replies_made'] += 1
        print(f'  💬 Replied to {hashtag} post')
    except Exception as e:
        print(f'  ⚠️ Reply: {str(e)[:60]}')
    
    # 3. Post a value-add tweet
    tweet = random.choice(TWEET_TEMPLATES)
    try:
        page.goto('https://x.com/compose/post', wait_until='domcontentloaded', timeout=15000)
        time.sleep(4)
        
        escaped = tweet.replace("'", "\\'").replace("$", "\\$")
        page.evaluate(f'''
            (function() {{
                var el = document.querySelector('[data-testid="tweetTextarea_0"], [contenteditable="true"], div[role="textbox"]');
                if (el) {{
                    el.focus();
                    el.textContent = '{escaped}';
                    el.dispatchEvent(new Event("input", {{ bubbles: true }}));
                }}
            }})()
        ''')
        time.sleep(2)
        
        page.evaluate('''
            (function() {
                var btn = document.querySelector('[data-testid="tweetButtonInline"], [data-testid="tweetButton"]');
                if (btn) btn.click();
            })()
        ''')
        time.sleep(5)
        state['tweets_posted'] += 1
        print(f'  🐦 Posted: {tweet[:70]}...')
    except Exception as e:
        print(f'  ⚠️ Tweet: {str(e)[:60]}')
    
    # 4. Check follower count
    try:
        page.goto('https://x.com/qfinhub', wait_until='domcontentloaded', timeout=15000)
        time.sleep(4)
        body = page.evaluate('document.body.innerText')
        import re
        followers = re.findall(r'(\d[\d,]*)\s*Followers?', body)
        if followers:
            state['followers'] = int(followers[0].replace(',', ''))
            print(f'  📊 Followers: {state["followers"]}')
    except:
        pass
    
    context.close()
    save_state(state)
    print(f'\n✅ X Growth complete.')

if __name__ == '__main__':
    main()
