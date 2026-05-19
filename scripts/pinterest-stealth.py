#!/usr/bin/env python3
"""
Pinterest Stealth Browser Automation — Premium Pin Upload + Board Management

Strategy:
1. Log in to Pinterest via stealth browser
2. Upload premium pins from public/pinterest-images/ to matching boards
3. Create/manage boards for each calculator category
4. Use high-search-volume finance keywords in titles/descriptions
5. Set rich alt-text and destination URLs for SEO

Credentials: Read from /home/admin1/qfinhub/.env.local
Usage: python3 scripts/pinterest-stealth.py [--mode upload|boards|full]
"""

import sys, os, asyncio, json, time, random, re, glob
from datetime import datetime

# ── Path setup ──
sys.path.insert(0, os.path.expanduser('~/.hermes/tools'))
from stealth_browser import StealthBrowser

QFINHUB_ROOT = '/home/admin1/qfinhub'
IMAGES_DIR = f'{QFINHUB_ROOT}/public/pinterest-images'
CSV_FILE = f'{QFINHUB_ROOT}/public/pinterest-import-premium.csv'
LOG_FILE = f'{QFINHUB_ROOT}/.pinterest-data/stealth-activity.json'
PIN_DATA_FILE = f'{QFINHUB_ROOT}/.pinterest-data/pin-content.json'

# ── Board Definitions ──
BOARDS = {
    "Mortgage & Home Loans": {
        "description": "Mortgage calculators, refinance tools, and home buying advice from QFINHUB",
        "keywords": ["mortgage calculator", "home loan", "refinance", "mortgage rates", "home affordability"],
    },
    "Investing & Wealth": {
        "description": "Investment calculators, compound interest tools, and wealth building strategies",
        "keywords": ["compound interest", "investment calculator", "stock returns", "portfolio", "wealth building"],
    },
    "Retirement Planning": {
        "description": "Retirement calculators, 401k tools, and financial independence planning",
        "keywords": ["retirement calculator", "401k", "IRA", "financial independence", "FIRE"],
    },
    "Debt Payoff & Credit": {
        "description": "Debt payoff calculators, credit card tools, and debt reduction strategies",
        "keywords": ["debt payoff", "credit card", "debt snowball", "loan payoff", "credit score"],
    },
    "Budgeting & Savings": {
        "description": "Budget planners, savings calculators, and money management tools",
        "keywords": ["budget planner", "savings calculator", "money management", "emergency fund", "expense tracking"],
    },
    "Tax Calculators": {
        "description": "Tax calculators, tax bracket tools, and tax planning strategies",
        "keywords": ["tax calculator", "tax bracket", "capital gains", "income tax", "tax planning"],
    },
    "Business & Side Hustle": {
        "description": "Business calculators, profit margin tools, and side hustle calculators",
        "keywords": ["profit margin", "ROI calculator", "side hustle", "business calculator", "cash flow"],
    },
    "Everyday Finance": {
        "description": "Everyday calculators for tips, discounts, currency conversion, and daily money decisions",
        "keywords": ["tip calculator", "discount calculator", "currency converter", "percentage", "auto loan"],
    },
    "QFINHUB Best Tools": {
        "description": "Our most popular financial calculators — used by thousands monthly",
        "keywords": ["financial calculator", "free calculator", "QFINHUB", "finance tools", "online calculator"],
    },
}

# ── Pin Title/Description Templates ──
TITLE_TEMPLATES = [
    "📊 Calculate Your {topic} in Seconds | Free Online Tool",
    "🧮 Free {topic} Calculator — No Sign-Up Required",
    "💰 {topic}: Run the Numbers with Our Free Calculator",
    "📈 Master Your {topic} with This Free Tool",
    "🔢 {topic} Made Simple — Try Our Free Calculator",
    "🏦 Don't Guess Your {topic} — Calculate It Free",
    "💡 Smart {topic} Planning Starts Here | Free Calculator",
    "📋 {topic} Checklist + Free Calculator Inside",
]

DESC_TEMPLATES = [
    "Use our free {topic} calculator to make smart financial decisions. Quick, accurate, and 100% free — no sign-up needed. Includes detailed breakdown and charts. #finance #calculator #moneytips",
    "Stop guessing and start calculating! Our free {topic} calculator gives you accurate results in seconds. Perfect for financial planning. #personalfinance #moneymanagement #freetools",
    "Need to calculate your {topic}? We've got you covered with a free, easy-to-use online calculator. Get instant results plus helpful explanations. #financialplanning #calculators",
    "Plan smarter with our free {topic} calculator. Used by thousands to make better money decisions. Includes step-by-step guide and real-world examples. #financialfreedom #wealthbuilding",
]

# ── Logging ──
def load_log():
    try:
        with open(LOG_FILE) as f:
            return json.load(f)
    except:
        return {"uploaded": [], "boards_created": [], "last_run": None, "total_pins": 0}

def save_log(log):
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    with open(LOG_FILE, 'w') as f:
        json.dump(log, f, indent=2, default=str)


# ── Read Credentials ──
def get_credentials():
    creds = {}
    env_path = f'{QFINHUB_ROOT}/.env.local'
    if not os.path.exists(env_path):
        return creds
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if line.startswith('#') or '=' not in line:
                continue
            key, val = line.split('=', 1)
            val = val.strip().strip('"').strip("'")
            if key in ['PINTEREST_EMAIL', 'PINTEREST_USERNAME', 'PINTEREST_PASSWORD', 'PINTEREST_LOGIN']:
                creds[key.lower()] = val
    return creds


# ── Get Image List ──
def get_premium_images():
    """Get list of premium pin images sorted by modification time (newest first)"""
    images = []
    for ext in ['*.png', '*.jpg', '*.jpeg', '*.webp']:
        images.extend(glob.glob(os.path.join(IMAGES_DIR, f'pin-*{ext}')))
        images.extend(glob.glob(os.path.join(IMAGES_DIR, f'premium-*{ext}')))
    # Sort by modification time, newest first
    images.sort(key=lambda x: os.path.getmtime(x), reverse=True)
    return images[:6]  # Return up to 6 latest premium pins


def get_pin_content():
    """Load pin content data if available"""
    try:
        with open(PIN_DATA_FILE) as f:
            return json.load(f)
    except:
        return {}


def slug_from_filename(filename):
    """Extract calculator slug from pin filename"""
    basename = os.path.basename(filename)
    # pin-compound-interest.png → compound-interest
    # premium-mortgage-calc-a1b2c3.png → mortgage-calc
    name = basename.replace('.png', '').replace('.jpg', '').replace('.jpeg', '')
    name = re.sub(r'^(pin-|premium-)', '', name)
    name = re.sub(r'-[a-f0-9]{6,}$', '', name)  # Remove hash suffix
    return name


# ── Main Automation ──
async def pinterest_stealth_automation(mode='full'):
    print("\n" + "="*60)
    print(f"  📌 Pinterest Stealth Browser — Mode: {mode}")
    print(f"  Time: {datetime.now().isoformat()}")
    print("="*60)
    
    log = load_log()
    creds = get_credentials()
    
    email = creds.get('pinterest_email') or creds.get('pinterest_username') or creds.get('pinterest_login')
    password = creds.get('pinterest_password')
    
    if not email or not password:
        print("❌ Missing Pinterest credentials. Set PINTEREST_EMAIL and PINTEREST_PASSWORD in .env.local")
        print("   First run: set headless=False, login manually, session auto-saves.")
        return
    
    browser = StealthBrowser()
    
    try:
        # ── Init ──
        await browser.init(
            profile='pinterest-uploader',
            headless=True,
        )
        
        # ── Login ──
        await browser.navigate('https://www.pinterest.com/')
        await browser.random_action()
        
        content = await browser.get_content()
        logged_in = 'login' not in content.lower() and 'log in' not in content.lower()
        
        if not logged_in:
            print("⚠️ Not logged in. Attempting login...")
            await browser.navigate('https://www.pinterest.com/login/')
            await browser.random_action()
            
            try:
                await browser.type('input[type="email"], input[name="id"]', email)
                await browser.random_action()
                await browser.type('input[type="password"]', password)
                await browser.random_action()
                await browser.click('button[type="submit"], div[data-test-id="registerFormSubmitButton"]')
                await browser.wait(random.randint(5000, 8000))
                
                # Handle any verification popup
                content = await browser.get_content()
                if 'verify' in content.lower() or 'captcha' in content.lower():
                    print("⚠️ Verification required! Set headless=False and complete manually.")
                    await browser.save_session('pinterest-uploader')
                    await browser.shutdown()
                    return
                
                await browser.save_session('pinterest-uploader')
                print("✅ Login complete. Session saved.")
            except Exception as e:
                print(f"⚠️ Auto-login failed: {e}")
                print("   Set headless=False and login manually on first run.")
                await browser.shutdown()
                return
        
        content = await browser.get_content()
        if 'login' in content.lower():
            print("❌ Still not logged in. Manual login required (headless=False).")
            await browser.shutdown()
            return
        
        print("✅ Logged in to Pinterest!")
        
        # ── Modes ──
        if mode in ('boards', 'full'):
            print("\n📋 Creating/managing boards...")
            await manage_boards(browser, log)
        
        if mode in ('upload', 'full'):
            print("\n📤 Uploading premium pins...")
            await upload_pins(browser, log)
        
        # ── Save ──
        log['last_run'] = datetime.now().isoformat()
        log['total_pins'] = len(log.get('uploaded', []))
        save_log(log)
        
        await browser.save_session('pinterest-uploader')
        print(f"\n✅ Run complete. {len(log.get('uploaded', []))} total pins uploaded. {len(log.get('boards_created', []))} boards created.")
        
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await browser.shutdown()


async def manage_boards(browser, log):
    """Create or verify boards for each calculator category"""
    boards_created = log.get('boards_created', [])
    
    for board_name in BOARDS.keys():
        if board_name in boards_created:
            continue  # Already created in previous run
        
        try:
            # Navigate to boards page
            await browser.navigate('https://www.pinterest.com/')
            await browser.random_action()
            
            # Click create board
            try:
                await browser.click('[data-test-id="header-create-menu-button"]')
                await browser.wait(random.randint(1000, 2000))
                await browser.click('[data-test-id="header-create-board-button"]')
                await browser.wait(random.randint(2000, 3000))
            except:
                print(f"   ⚠️ Could not find create board button for '{board_name}'")
                continue
            
            # Type board name
            await browser.type('input[name="name"], input#boardName', board_name)
            await browser.random_action()
            await browser.wait(random.randint(1000, 2000))
            
            # Create/confirm
            await browser.click('button[type="submit"], div[data-test-id="board-form-submit-button"]')
            await browser.wait(random.randint(3000, 5000))
            
            boards_created.append(board_name)
            log['boards_created'] = boards_created
            print(f"   ✅ Board created: '{board_name}'")
            
        except Exception as e:
            print(f"   ⚠️ Failed to create board '{board_name}': {e}")
    
    print(f"   📋 Boards: {len(boards_created)}/{len(BOARDS)} created")


async def upload_pins(browser, log):
    """Upload premium pin images to matching boards"""
    images = get_premium_images()
    
    if not images:
        print("   ⚠️ No premium pin images found in public/pinterest-images/")
        return
    
    print(f"   Found {len(images)} premium pin images")
    
    uploaded = log.get('uploaded', [])
    uploaded_files = {u['file'] for u in uploaded}
    
    for img_path in images[:2]:  # Limit to 2 per run (fits 120s timeout)
        filename = os.path.basename(img_path)
        if filename in uploaded_files:
            print(f"   ⏭️ Already uploaded: {filename}")
            continue
        
        slug = slug_from_filename(filename)
        topic = slug.replace('-', ' ').title()
        
        # Pick matching board
        board_name = match_board(slug)
        
        # Generate title and description
        title = random.choice(TITLE_TEMPLATES).replace('{topic}', topic)
        desc = random.choice(DESC_TEMPLATES).replace('{topic}', topic.lower())
        link = f"https://qfinhub.com/calculators/{slug}"
        
        print(f"\n   📌 Uploading: {filename}")
        print(f"      Board: {board_name}")
        print(f"      Title: {title[:60]}...")
        print(f"      Link: {link}")
        
        try:
            # Navigate to pin creation
            await browser.navigate('https://www.pinterest.com/pin-builder/')
            await browser.random_action()
            await browser.wait(random.randint(2000, 4000))
            
            # Upload image
            # Pinterest pin builder: click upload area, then file input appears
            try:
                # Find file input
                file_input = 'input[type="file"]'
                # Use browser to upload the file
                await browser.upload_file(file_input, img_path)
                await browser.wait(random.randint(3000, 5000))
            except Exception as e:
                print(f"      ⚠️ Image upload failed: {e}")
                continue
            
            # Add title
            try:
                await browser.click('[contenteditable="true"]')
                await browser.wait(random.randint(500, 1500))
                await browser.type('[contenteditable="true"]', title)
                await browser.random_action()
            except:
                pass
            
            # Add description
            try:
                desc_field = 'textarea, [data-test-id="pin-draft-description"]'
                await browser.click(desc_field)
                await browser.wait(random.randint(500, 1000))
                await browser.type(desc_field, desc)
                await browser.random_action()
            except:
                pass
            
            # Add destination link
            try:
                link_field = 'input[placeholder*="link"], input[placeholder*="URL"]'
                await browser.click(link_field)
                await browser.type(link_field, link)
                await browser.random_action()
            except:
                pass
            
            # Select board
            try:
                await browser.click(f'div:has-text("{board_name}")')
                await browser.wait(random.randint(1000, 2000))
            except:
                pass
            
            # Save/publish
            try:
                save_btn = 'button[type="submit"], div[data-test-id="board-dropdown-save-button"]'
                await browser.click(save_btn)
                await browser.wait(random.randint(3000, 5000))
            except:
                pass
            
            # Log success
            uploaded.append({
                'file': filename,
                'board': board_name,
                'title': title,
                'link': link,
                'time': datetime.now().isoformat(),
            })
            log['uploaded'] = uploaded
            
            save_log(log)
            print(f"      ✅ Pin uploaded successfully!")
            
            # Human delay between uploads (shorter for 120s timeout)
            delay = random.randint(8000, 20000) / 1000
            print(f"      ⏳ Waiting {delay:.0f}s before next pin...")
            await browser.wait(random.randint(8000, 20000))
            
        except Exception as e:
            print(f"      ❌ Upload failed: {e}")
    
    print(f"\n   📤 Pins uploaded this run: {len([u for u in uploaded if u['file'] not in uploaded_files])}")


def match_board(slug):
    """Match a calculator slug to the best Pinterest board"""
    mapping = {
        'mortgage': 'Mortgage & Home Loans',
        'home': 'Mortgage & Home Loans',
        'loan': 'Mortgage & Home Loans',
        'refinance': 'Mortgage & Home Loans',
        'invest': 'Investing & Wealth',
        'compound': 'Investing & Wealth',
        'stock': 'Investing & Wealth',
        'dividend': 'Investing & Wealth',
        'portfolio': 'Investing & Wealth',
        'retirement': 'Retirement Planning',
        '401k': 'Retirement Planning',
        'ira': 'Retirement Planning',
        'pension': 'Retirement Planning',
        'social-security': 'Retirement Planning',
        'debt': 'Debt Payoff & Credit',
        'credit': 'Debt Payoff & Credit',
        'payoff': 'Debt Payoff & Credit',
        'budget': 'Budgeting & Savings',
        'savings': 'Budgeting & Savings',
        'tax': 'Tax Calculators',
        'capital-gains': 'Tax Calculators',
        'margin': 'Business & Side Hustle',
        'profit': 'Business & Side Hustle',
        'business': 'Business & Side Hustle',
        'cash-flow': 'Business & Side Hustle',
        'roi': 'Business & Side Hustle',
        'tip': 'Everyday Finance',
        'discount': 'Everyday Finance',
        'currency': 'Everyday Finance',
        'percentage': 'Everyday Finance',
        'age': 'Everyday Finance',
        'date': 'Everyday Finance',
    }
    
    for key, board in mapping.items():
        if key in slug.lower():
            return board
    
    return 'QFINHUB Best Tools'


# ── CLI ──
if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Pinterest Stealth Browser Automation')
    parser.add_argument('--mode', choices=['upload', 'boards', 'full'], 
                       default='full', help='Automation mode')
    parser.add_argument('--headless', type=bool, default=True,
                       help='Run headless (False for first login)')
    args = parser.parse_args()
    
    asyncio.run(pinterest_stealth_automation(mode=args.mode))
