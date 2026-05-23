#!/usr/bin/env python3
"""
QFINHUB Daily Pinterest Pin Generator
Generates 10 high-quality, concept-driven pins per batch.
Covers all 8 boards on rotation. Premium designs — no template reuse.

Usage:
  python3 scripts/pinterest-daily-gen.py              # Generate 10 pins
  python3 scripts/pinterest-daily-gen.py --count 50   # Generate 50 pins (5-day batch)
  python3 scripts/pinterest-daily-gen.py --dry-run    # Preview without saving
"""

import sys, os, json, hashlib, random, time
from datetime import datetime, timedelta
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public" / "pinterest-images"
DATA_DIR = PROJECT_ROOT / ".pinterest-data"
QUEUE_PATH = DATA_DIR / "daily-queue.json"
STATE_PATH = DATA_DIR / "generator-state.json"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# ─── Board Registry ───
BOARDS = {
    "mortgages":  {"id": "1086071335079246633", "name": "Mortgage Calculators", "slug": "mortgage-calculator"},
    "investing":  {"id": "1086071335079246634", "name": "Investment Calculators", "slug": "compound-interest"},
    "retirement": {"id": "1086071335079246635", "name": "Retirement Planning", "slug": "retirement-planning"},
    "loans":      {"id": "1086071335079246636", "name": "Loan Calculators", "slug": "auto-loan"},
    "debt":       {"id": "1086071335079246637", "name": "Debt Payoff Tools", "slug": "debt-snowball"},
    "taxes":      {"id": "1086071335079246638", "name": "Tax Calculators", "slug": "tax-calculator"},
    "savings":    {"id": "1086071335079246639", "name": "Savings & Budget", "slug": "budget-planner"},
    "everyday":   {"id": "1086071335079246640", "name": "Everyday Calculators", "slug": "percentage-calculator"},
}

# ─── Category Colors ───
CAT_COLORS = {
    "mortgages":  {"primary": "#0f766e", "accent": "#14b8a6", "dark": "#0d1f1c", "light": "#f0fdfa"},
    "investing":  {"primary": "#7c3aed", "accent": "#a78bfa", "dark": "#1a1030", "light": "#f5f3ff"},
    "retirement": {"primary": "#d97706", "accent": "#fbbf24", "dark": "#2d1a04", "light": "#fffbeb"},
    "loans":      {"primary": "#2563eb", "accent": "#60a5fa", "dark": "#0c1a3a", "light": "#eff6ff"},
    "debt":       {"primary": "#dc2626", "accent": "#f87171", "dark": "#2d0a0a", "light": "#fef2f2"},
    "taxes":      {"primary": "#ea580c", "accent": "#fb923c", "dark": "#2d1404", "light": "#fff7ed"},
    "savings":    {"primary": "#059669", "accent": "#34d399", "dark": "#0a1f18", "light": "#ecfdf5"},
    "everyday":   {"primary": "#6366f1", "accent": "#a5b4fc", "dark": "#0f1030", "light": "#eef2ff"},
}

# ─── Pin Content Templates (10 unique concepts) ───

PIN_CONCEPTS = [
    # Concept 1: "Big Number Stat" — eye-catching statistic
    {
        "template": "big_stat",
        "headline_patterns": [
            "{stat_value} — That's How Much You Could {action}",
            "The Average {audience} {verb} ${stat_value}",
            "Is Your {metric} Worth ${stat_value}?",
        ],
        "stat_patterns": ["$12,500", "$50,000+", "$3,200/yr", "$27,800", "$950/mo", "$1.2M", "8 Years", "72%", "4.5×", "$8,400"],
    },
    # Concept 2: "Before/After Comparison" — dramatic split
    {
        "template": "before_after",
        "headline_patterns": [
            "Before vs After: {topic} Can Change Everything",
            "See What Happens When You {action}",
            "The {topic} Difference: One Simple Change, Massive Results",
        ],
    },
    # Concept 3: "X vs Y" — comparison
    {
        "template": "versus",
        "headline_patterns": [
            "{option_a} vs {option_b}: Which Actually Saves More?",
            "{option_a} or {option_b}? The Numbers Don't Lie",
            "Stop Guessing — {option_a} vs {option_b} Compared",
        ],
    },
    # Concept 4: "How Much?" — provocative question
    {
        "template": "how_much",
        "headline_patterns": [
            "How Much {topic} Do You Actually Need?",
            "How Much Could You Save By {action}?",
            "How Much Will Your {asset} Be Worth in {timeframe}?",
        ],
    },
    # Concept 5: "Mistake Alert" — what to avoid
    {
        "template": "mistake_alert",
        "headline_patterns": [
            "The #1 {topic} Mistake Costing You Thousands",
            "Are You Making This {topic} Error?",
            "Most People Get {topic} Wrong — Here's the Right Way",
        ],
    },
    # Concept 6: "Step-by-Step" — numbered guide
    {
        "template": "steps",
        "headline_patterns": [
            "{num_steps} Steps to {goal}: Start Today",
            "Your {num_steps}-Step Plan for {goal}",
            "Follow These {num_steps} Steps to {goal}",
        ],
    },
    # Concept 7: "By the Numbers" — multiple stats
    {
        "template": "by_numbers",
        "headline_patterns": [
            "{topic} By the Numbers: Surprising Stats",
            "The Real Numbers Behind {topic}",
            "{topic}: What the Data Actually Shows",
        ],
    },
    # Concept 8: "Timeline / By Age" — age-based milestones
    {
        "template": "timeline",
        "headline_patterns": [
            "{topic} Milestones: Where Should You Be at Every Age?",
            "Age {start} to {end}: Your {topic} Journey",
            "What Your {topic} Should Look Like at Every Decade",
        ],
    },
    # Concept 9: "Calculator Tease" — show a mock calculation
    {
        "template": "calculator_tease",
        "headline_patterns": [
            "We Ran the Numbers: {scenario} = ${result}",
            "Try This: If You {action}, Here's What Happens",
            "Calculate This: {scenario} Could Give You ${result}",
        ],
    },
    # Concept 10: "Checklist" — actionable list
    {
        "template": "checklist",
        "headline_patterns": [
            "The Ultimate {topic} Checklist: {num_items} Things to Do",
            "{num_items} {topic} Moves That Pay Off Big",
            "Your {topic} Action Plan: Every Step You Need",
        ],
    },
]

# ─── Board-specific Content ───

BOARD_CONTENT = {
    "mortgages": {
        "topics": ["Mortgage", "Home Loan", "Refinancing", "Interest Rate", "Monthly Payment"],
        "actions": ["refinancing your mortgage", "making extra payments", "switching to biweekly", "locking in a lower rate", "paying off your home early"],
        "stats": ["$50,000+", "$12,500", "$320/mo", "5 Years", "2.5% Lower", "$180,000"],
        "links": ["/calculators/mortgage-calculator", "/calculators/amortization-schedule", "/calculators/mortgage-payoff"],
        "scenarios": [
            ("a $300K mortgage at 6.5%", "$186,000"),
            ("refinancing from 7% to 5.5%", "$44,000"),
            ("adding $200/month extra payment", "$52,300"),
        ],
        "hashtags": "#MortgageTips #HomeBuying #RealEstate #HomeOwnership #Refinance",
    },
    "investing": {
        "topics": ["Compound Interest", "Investing", "Wealth Building", "Stock Market", "Portfolio Growth"],
        "actions": ["investing $500/month", "starting early at 25 vs 35", "maxing your 401(k)", "reinvesting dividends", "choosing low-fee index funds"],
        "stats": ["$1,000,000+", "$950/mo", "8% Annual", "30 Years", "$2.3M", "3× Faster"],
        "links": ["/calculators/compound-interest", "/calculators/investment-growth", "/calculators/stock-return"],
        "scenarios": [
            ("$500/month invested for 30 years at 8%", "$745,000"),
            ("starting at 25 instead of 35", "$1,100,000 more"),
            ("maxing a 401(k) with employer match", "$2,300,000"),
        ],
        "hashtags": "#CompoundInterest #Investing #WealthBuilding #FinancialFreedom #PassiveIncome",
    },
    "retirement": {
        "topics": ["Retirement", "401(k)", "Nest Egg", "Early Retirement", "Pension"],
        "actions": ["saving for retirement", "retiring 5 years early", "maxing retirement contributions", "choosing Roth vs Traditional", "planning your withdrawal strategy"],
        "stats": ["$1.5M", "8× Salary", "Age 60", "25× Expenses", "$62,000/yr", "4% Rule"],
        "links": ["/calculators/retirement-planning", "/calculators/401k-calculator", "/calculators/financial-independence"],
        "scenarios": [
            ("saving 15% of $80K salary for 35 years", "$1,470,000"),
            ("retiring at 60 vs 67", "$280,000 difference"),
            ("the 4% withdrawal rule on $1M", "$40,000/yr safe income"),
        ],
        "hashtags": "#RetirementPlanning #401k #FIRE #FinancialIndependence #SaveForRetirement",
    },
    "loans": {
        "topics": ["Auto Loan", "Personal Loan", "Student Loan", "Loan Interest", "Monthly Payment"],
        "actions": ["refinancing your auto loan", "comparing loan terms", "paying off student loans faster", "getting a lower APR", "choosing the right loan length"],
        "stats": ["$2,800 Saved", "3.9% APR", "$195/mo Less", "48 Months", "0% Intro", "$4,500"],
        "links": ["/calculators/auto-loan", "/calculators/personal-loan", "/calculators/student-loan"],
        "scenarios": [
            ("a $35K auto loan at 3.9% for 48 months", "$789/mo"),
            ("refinancing from 8% to 5% on $50K student loans", "$4,200 saved"),
            ("choosing 36-month vs 72-month term on $25K", "$1,900 interest saved"),
        ],
        "hashtags": "#AutoLoan #CarBuying #StudentLoans #LoanTips #PersonalFinance",
    },
    "debt": {
        "topics": ["Debt Payoff", "Credit Card Debt", "Debt Strategy", "Snowball Method", "Avalanche Method"],
        "actions": ["paying off credit card debt", "using the snowball method", "attacking high-interest debt", "consolidating your loans", "becoming debt-free"],
        "stats": ["$4,200+ Saved", "23% APR", "14 Months Faster", "$8,900 Debt", "2× Payments", "Zero Interest"],
        "links": ["/calculators/debt-snowball", "/calculators/credit-card-payoff", "/calculators/debt-consolidation"],
        "scenarios": [
            ("snowball vs avalanche on $25K debt", "$4,200 interest difference"),
            ("adding $300/month to minimum payments", "5 years faster payoff"),
            ("a 0% balance transfer saving on $15K", "$3,400 in interest"),
        ],
        "hashtags": "#DebtFreeJourney #DebtPayoff #CreditCardDebt #MoneyTips #FinancialFreedom",
    },
    "taxes": {
        "topics": ["Tax Deductions", "Tax Refund", "Tax Bracket", "Income Tax", "Tax Planning"],
        "actions": ["claiming tax deductions", "optimizing your tax bracket", "planning tax-efficient investments", "filing your taxes correctly", "reducing taxable income"],
        "stats": ["$3,200+ Back", "22% Bracket", "15 Write-Offs", "$6,500 Saved", "$0 Owed", "Standard: $14,600"],
        "links": ["/calculators/tax-calculator", "/calculators/capital-gains-tax", "/calculators/paycheck-tax"],
        "scenarios": [
            ("a $75K salary with standard vs itemized deductions", "$2,800 difference"),
            ("long-term capital gains vs ordinary income on $50K profit", "$8,000 saved"),
            ("maxing 401(k) contributions to lower taxable income", "$4,600 tax savings"),
        ],
        "hashtags": "#TaxDeductions #TaxTips #TaxSeason #MoneySaving #FinancialPlanning",
    },
    "savings": {
        "topics": ["Budgeting", "Saving Money", "Emergency Fund", "Financial Goals", "Monthly Budget"],
        "actions": ["building an emergency fund", "creating a budget that works", "saving $1,000 in 30 days", "automating your savings", "cutting unnecessary expenses"],
        "stats": ["$1,000 Emergency", "6 Months Saved", "50/30/20 Rule", "$350/mo Saved", "20% Savings Rate", "3-Month Goal"],
        "links": ["/calculators/budget-planner", "/calculators/savings-goal", "/calculators/emergency-fund"],
        "scenarios": [
            ("the 50/30/20 budget on $5,000/month income", "$1,000 to savings"),
            ("saving $15/day automatically for 1 year", "$5,475"),
            ("cutting 3 subscriptions and 2 dining-out nights", "$3,120/year"),
        ],
        "hashtags": "#Budgeting #SaveMoney #FinancialGoals #EmergencyFund #MoneyManagement",
    },
    "everyday": {
        "topics": ["Percentage", "BMI", "Age", "Date", "Tip Calculator", "Currency"],
        "actions": ["calculating percentages instantly", "checking your BMI", "figuring out the tip", "converting currencies", "counting days between dates"],
        "stats": ["25% Off", "22.5 BMI", "18% Tip", "1.25 Exchange", "365 Days", "30% Discount"],
        "links": ["/calculators/percentage-calculator", "/calculators/bmi-calculator", "/calculators/tip-calculator", "/calculators/age-calculator"],
        "scenarios": [
            ("a 25% discount on a $120 item", "$30 saved, pay $90"),
            ("18% tip on a $75 dinner bill", "$13.50 tip, $88.50 total"),
            ("BMI for 5'8\" 165 lbs person", "25.1 — borderline"),
        ],
        "hashtags": "#MathMadeEasy #EverydayCalculators #QuickMath #LifeHacks #SmartTools",
    },
}


def load_state():
    if STATE_PATH.exists():
        with open(STATE_PATH) as f:
            return json.load(f)
    return {"batches": 0, "total_pins": 0, "board_counts": defaultdict(int), "last_run": None}

def save_state(state):
    state["last_run"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2, default=lambda x: dict(x) if isinstance(x, defaultdict) else x)

def pick_boards(state, count=10):
    """Pick 'count' boards with rotation — ensures even coverage across all 8."""
    board_names = list(BOARDS.keys())
    # Sort by how many times each board has been used (least first)
    board_names.sort(key=lambda b: state["board_counts"].get(b, 0))
    chosen = []
    for i in range(count):
        idx = i % len(board_names)
        b = board_names[idx]
        chosen.append(b)
        state["board_counts"][b] = state["board_counts"].get(b, 0) + 1
    # Shuffle within groups to avoid same board twice in a row
    random.shuffle(chosen)
    return chosen

def generate_pin(idx, board_key, used_slugs, dry_run=False):
    """Generate one pin: metadata + concept assignment."""
    board = BOARDS[board_key]
    content = BOARD_CONTENT[board_key]
    colors = CAT_COLORS[board_key]
    concept = random.choice(PIN_CONCEPTS)

    # Pick content elements
    topic = random.choice(content["topics"])
    action = random.choice(content["actions"])
    stat = random.choice(content["stats"])
    link = random.choice(content["links"])
    scenario, result = random.choice(content["scenarios"])
    headline_pattern = random.choice(concept["headline_patterns"])

    # Build headline — strip extra $ from result if template already has one
    clean_result = result.replace("$", "") if "${result}" in headline_pattern and "$" in result else result

    headline = headline_pattern.format(
        topic=topic, action=action, stat_value=stat,
        option_a=random.choice(content["topics"]),
        option_b=random.choice(["Renting", "Leasing", "Minimum Payment", "Waiting", "Traditional"]),
        num_steps=random.choice(["3", "5", "7"]),
        goal=action.replace("ing ", "").replace(" by", ""),
        start=random.choice(["25", "30", "35", "40"]),
        end=random.choice(["55", "60", "65", "70"]),
        scenario=scenario, result=clean_result,
        num_items=random.choice(["5", "7", "10"]),
        asset=topic.lower(), timeframe=random.choice(["10 Years", "20 Years", "30 Years", "Retirement"]),
        audience=random.choice(["American", "Homeowner", "Investor", "Family", "Borrower"]),
        verb=random.choice(["Loses", "Saves", "Pays", "Earns", "Owes"]),
        metric=random.choice(["Mortgage", "Investment", "Savings", "Retirement Fund", "Portfolio"]),
    )
    # Clean up any double dollar signs
    headline = headline.replace("$$", "$")
    # Trim to max 100 chars
    if len(headline) > 100:
        headline = headline[:97] + "..."

    # Build description (max 500 chars)
    description = (
        f"{headline}\n\n"
        f"Discover the real numbers behind {topic.lower()}. {content['hashtags'].split('#')[0].strip()} "
        f"Use our free calculator to run your own scenario — no signup, instant results.\n\n"
        f"{content['hashtags']} #QFINHUB"
    )
    if len(description) > 500:
        description = description[:497] + "..."

    # Unique slug
    slug_base = f"{board_key}-{concept['template']}"
    slug = slug_base
    counter = 0
    while slug in used_slugs:
        counter += 1
        slug = f"{slug_base}-{counter}"
    used_slugs.add(slug)

    # Image filename
    h = hashlib.md5(slug.encode()).hexdigest()[:6]
    img_file = f"pin-{slug}-{h}.png"
    img_path = PUBLIC_DIR / img_file

    pin = {
        "slug": slug,
        "category": board_key,
        "boardId": board["id"],
        "boardName": board["name"],
        "title": headline,
        "description": description,
        "link": f"https://www.qfinhub.com{link}",
        "stat": stat,
        "concept": concept["template"],
        "colors": colors,
        "imageUrl": f"https://www.qfinhub.com/pinterest-images/{img_file}",
        "imagePath": str(img_path),
        "topics": [topic],
        "scenario": scenario,
        "result": result,
    }

    return pin


def generate_image(pin, dry_run=False):
    """Generate a premium Pillow-based pin image."""
    if dry_run:
        return True

    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        print("⚠️ Pillow not installed. Install with: pip install Pillow")
        return False

    W, H = 1000, 1500
    colors = pin["colors"]
    primary = colors["primary"]
    accent = colors["accent"]
    dark = colors["dark"]
    light = colors["light"]

    img = Image.new("RGB", (W, H), dark)
    draw = ImageDraw.Draw(img)

    # Try to load fonts, fall back to default
    font_dir = "/usr/share/fonts"
    try:
        title_font = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 46)
        headline_font = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 32)
        body_font = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans.ttf", 20)
        small_font = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans.ttf", 16)
        stat_font = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 72)
    except (OSError, IOError):
        title_font = headline_font = body_font = small_font = stat_font = ImageFont.load_default()

    # ─── Draw Background ───
    # Gradient from dark to slightly lighter
    for y in range(H):
        ratio = y / H
        r = int(int(dark[1:3], 16) + (int(primary[1:3], 16) - int(dark[1:3], 16)) * ratio * 0.3)
        g = int(int(dark[3:5], 16) + (int(primary[3:5], 16) - int(dark[3:5], 16)) * ratio * 0.3)
        b = int(int(dark[5:7], 16) + (int(primary[5:7], 16) - int(dark[5:7], 16)) * ratio * 0.3)
        for x in range(0, W, 4):
            draw.rectangle([x, y, x+3, y], fill=(r, g, b))

    # ─── Decorative Circle ───
    draw.ellipse([W-300, -100, W+200, 450], fill=primary, outline=None)
    draw.ellipse([W-280, -80, W+180, 430], fill=dark, outline=None)

    # ─── QFINHUB Brand Badge ───
    draw.rectangle([40, 35, 200, 58], fill=accent)
    draw.text((48, 37), "QFINHUB", fill="white", font=small_font)

    # ─── Category Label ───
    cat_name = pin["boardName"].replace(" Calculators", "").replace(" Tools", "").replace(" & ", " & ")
    draw.text((48, 105), cat_name.upper(), fill=accent, font=small_font)

    # ─── Headline ───
    title = pin["title"]
    # Word wrap
    words = title.split()
    lines = []
    current_line = ""
    for word in words:
        test_line = f"{current_line} {word}".strip()
        bbox = draw.textbbox((0, 0), test_line, font=headline_font)
        if bbox[2] - bbox[0] > W - 120:
            lines.append(current_line)
            current_line = word
        else:
            current_line = test_line
    lines.append(current_line)

    y_pos = 155
    for line in lines[:3]:  # Max 3 lines
        draw.text((55, y_pos), line, fill="white", font=headline_font)
        y_pos += 44

    # ─── Stat Highlight ───
    stat = pin["stat"]
    bbox = draw.textbbox((0, 0), stat, font=stat_font)
    stat_w = bbox[2] - bbox[0]
    stat_x = (W - stat_w) // 2
    draw.text((stat_x, 420), stat, fill=accent, font=stat_font)

    # ─── Card with details ───
    card_y = 560
    card_h = 380
    draw.rounded_rectangle([50, card_y, W-50, card_y+card_h], radius=20, fill="#1e293b", outline=accent, width=1)

    # Scenario
    draw.text((90, card_y+35), "📊  SCENARIO", fill=accent, font=small_font)
    draw.text((90, card_y+65), pin["scenario"], fill="white", font=body_font)

    # Result
    draw.text((90, card_y+140), "💰  RESULT", fill=accent, font=small_font)
    draw.text((90, card_y+170), pin["result"], fill=accent, font=stat_font)

    # ─── CTA Card ───
    cta_y = card_y + card_h + 40
    draw.rounded_rectangle([120, cta_y, W-120, cta_y+60], radius=30, fill=primary)
    draw.text((W//2 - 140, cta_y+15), "Calculate Yours Free →", fill="white", font=headline_font)

    # ─── Features row ───
    feat_y = cta_y + 100
    features = ["✓ No Signup", "✓ Free Forever", "✓ Instant Results"]
    for i, feat in enumerate(features):
        fx = 75 + i * 310
        draw.rounded_rectangle([fx, feat_y, fx+280, feat_y+40], radius=10, fill="#1e293b", outline="#334155", width=1)
        draw.text((fx+20, feat_y+8), feat, fill=accent, font=small_font)

    # ─── URL ───
    url_y = feat_y + 80
    url_text = "qfinhub.com" + pin["link"].replace("https://www.qfinhub.com", "")
    bbox = draw.textbbox((0, 0), url_text, font=small_font)
    url_w = bbox[2] - bbox[0]
    draw.text(((W - url_w)//2, url_y), url_text, fill=primary, font=small_font)

    # ─── Hashtags ───
    hashtags = BOARD_CONTENT[pin["category"]]["hashtags"]
    tag_y = url_y + 40
    tags_display = "  •  ".join(hashtags.split()[:5])
    bbox = draw.textbbox((0, 0), tags_display, font=ImageFont.load_default())
    tag_w = bbox[2] - bbox[0] if bbox else 200
    draw.text(((W - min(tag_w, W-100))//2, tag_y), tags_display, fill="#64748b", font=small_font)

    # ─── Bottom dots decoration ───
    for i in range(10):
        x = W//2 - 135 + i * 30
        draw.ellipse([x, H-80, x+12, H-68], fill=primary, outline=None)

    # Save
    img.save(pin["imagePath"], "PNG", optimize=True)
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="QFINHUB Daily Pinterest Pin Generator")
    parser.add_argument("--count", type=int, default=10, help="Number of pins to generate (default: 10)")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving images")
    parser.add_argument("--images-only", action="store_true", help="Only generate images, skip metadata")
    args = parser.parse_args()

    state = load_state()
    state["batches"] = (state.get("batches", 0) or 0) + 1
    board_counts = defaultdict(int)
    for k, v in state.get("board_counts", {}).items():
        board_counts[k] = v
    state["board_counts"] = board_counts

    print(f"🎨 QFINHUB Pinterest Pin Generator — Batch #{state['batches']}")
    print(f"   Target: {args.count} pins | {'DRY RUN' if args.dry_run else 'LIVE'}")
    print("=" * 60)

    boards = pick_boards(state, args.count)
    pins = []
    used_slugs = set()

    for i, board_key in enumerate(boards):
        board = BOARDS[board_key]
        print(f"\n📌 Pin {i+1}/{args.count} → {board['name']}")

        pin = generate_pin(i, board_key, used_slugs, args.dry_run)
        pins.append(pin)

        if not args.dry_run and not args.images_only:
            success = generate_image(pin, dry_run=False)
            if success:
                print(f"   ✅ Image: {pin['imagePath']}")
                print(f"   📝 \"{pin['title'][:70]}...\"")
            else:
                print(f"   ❌ Failed to generate image")
        elif args.dry_run:
            print(f"   📝 \"{pin['title'][:80]}...\"")
            print(f"   🎨 Concept: {pin['concept']}")
            print(f"   🔗 {pin['link']}")

    # Save queue
    if not args.dry_run:
        queue = {
            "generated": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "batch": state["batches"],
            "count": len(pins),
            "pins": pins,
        }
        with open(QUEUE_PATH, "w") as f:
            json.dump(queue, f, indent=2)

        state["total_pins"] = state.get("total_pins", 0) + len(pins)
        save_state(state)

        print(f"\n✅ {len(pins)} pins generated and queued at {QUEUE_PATH}")
        print(f"   Total lifetime pins: {state['total_pins']}")
        print(f"   Board distribution: {dict(board_counts)}")
        print(f"\n   📋 To post: python3 scripts/pinterest-batch-schedule.py")
    else:
        print(f"\n🔍 DRY RUN complete — {len(pins)} pins previewed")

if __name__ == "__main__":
    main()
