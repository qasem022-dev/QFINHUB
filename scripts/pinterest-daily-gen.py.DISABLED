#!/usr/bin/env python3
"""
QFINHUB Pinterest Pin Generator v2 — TOOL-SHOWCASE STYLE
Creates pins that make people WANT to use the calculator immediately.
Design: Clean calculator mockups, pre-filled examples, problem→solution format.

Usage:
  python3 scripts/pinterest-daily-gen.py              # Generate 10 pins
  python3 scripts/pinterest-daily-gen.py --count 10   # Custom count
"""

import sys, os, json, hashlib, random, time, re
from datetime import datetime
from pathlib import Path
from collections import defaultdict

PROJECT_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DIR = PROJECT_ROOT / "public" / "pinterest-images"
DATA_DIR = PROJECT_ROOT / ".pinterest-data"
QUEUE_PATH = DATA_DIR / "daily-queue.json"
STATE_PATH = DATA_DIR / "generator-state.json"

PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Board registry
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

# Category colors — clean, modern palette
COLORS = {
    "mortgages":  {"bg": "#f8fafc", "card": "#ffffff", "accent": "#0f766e", "text": "#0f172a", "sub": "#64748b"},
    "investing":  {"bg": "#faf5ff", "card": "#ffffff", "accent": "#7c3aed", "text": "#0f172a", "sub": "#64748b"},
    "retirement": {"bg": "#fffbeb", "card": "#ffffff", "accent": "#d97706", "text": "#0f172a", "sub": "#64748b"},
    "loans":      {"bg": "#eff6ff", "card": "#ffffff", "accent": "#2563eb", "text": "#0f172a", "sub": "#64748b"},
    "debt":       {"bg": "#fef2f2", "card": "#ffffff", "accent": "#dc2626", "text": "#0f172a", "sub": "#64748b"},
    "taxes":      {"bg": "#fff7ed", "card": "#ffffff", "accent": "#ea580c", "text": "#0f172a", "sub": "#64748b"},
    "savings":    {"bg": "#ecfdf5", "card": "#ffffff", "accent": "#059669", "text": "#0f172a", "sub": "#64748b"},
    "everyday":   {"bg": "#eef2ff", "card": "#ffffff", "accent": "#6366f1", "text": "#0f172a", "sub": "#64748b"},
}

# Tool showcase content — each pin shows an example calculation with pre-filled numbers
PIN_TEMPLATES = [
    # Template 1: "Try This" — shows exact inputs and result
    {
        "style": "try_this",
        "headline": "Try This: {scenario}",
        "subtitle": "Answer in 2 seconds with our free {calc_name}",
        "layout": "calculator_mockup",
    },
    # Template 2: "Did You Know" — surprising stat + calculator hook
    {
        "style": "did_you_know",
        "headline": "Did You Know? {stat}",
        "subtitle": "Calculate your own numbers instantly — free, no signup",
        "layout": "stat_card",
    },
    # Template 3: "Before you decide" — decision-support pin
    {
        "style": "before_decide",
        "headline": "Before You {action}, Check This",
        "subtitle": "{calc_name} — instant results, no guesswork",
        "layout": "checklist",
    },
    # Template 4: "How much?" — direct question → answer
    {
        "style": "how_much",
        "headline": "How Much {question}?",
        "subtitle": "We ran the numbers. Now run yours →",
        "layout": "answer_card",
    },
    # Template 5: "Compare" — side-by-side options
    {
        "style": "compare",
        "headline": "{option_a}  vs  {option_b}",
        "subtitle": "See which saves you more — one click, instant answer",
        "layout": "comparison",
    },
]

# Board-specific scenarios with REAL computed numbers
SCENARIOS = {
    "mortgages": [
        {"scenario": "$350K home, 6.5%, 30yr → $1,896/month", "stat": "You pay 56% in interest over 30 years",
         "action": "buying a home", "question": "will your mortgage actually cost",
         "option_a": "30-Year Fixed", "option_b": "15-Year Fixed",
         "calc_name": "Mortgage Calculator", "link": "/calculators/mortgage-calculator"},
        {"scenario": "$400K home with 10% down → $2,547/month", "stat": "$400K home at 6.5% = $682K total cost",
         "action": "making an offer", "question": "house can you actually afford",
         "option_a": "Buy Now", "option_b": "Wait & Save 20%",
         "calc_name": "Mortgage Calculator", "link": "/calculators/mortgage-calculator"},
    ],
    "investing": [
        {"scenario": "$500/month × 30 years × 8% = $745,000", "stat": "$500/month becomes $1M+ if you start at 25",
         "action": "investing", "question": "will your investments grow",
         "option_a": "Start at 25", "option_b": "Start at 35",
         "calc_name": "Compound Interest Calc", "link": "/calculators/compound-interest"},
        {"scenario": "$10K initial + $500/mo × 20yr = $310K", "stat": "The first $100K takes 8 years. The next $100K takes 4.",
         "action": "opening a brokerage account", "question": "could compound interest earn you",
         "option_a": "Index Funds (8%)", "option_b": "Savings Account (1%)",
         "calc_name": "Investment Calculator", "link": "/calculators/investment-return"},
    ],
    "retirement": [
        {"scenario": "$75K salary, save 15% → $750K by 67", "stat": "Starting at 25 vs 35 = $500K difference",
         "action": "planning your retirement", "question": "will you need to retire comfortably",
         "option_a": "Retire at 60", "option_b": "Retire at 67",
         "calc_name": "Retirement Calculator", "link": "/calculators/retirement-planning"},
        {"scenario": "$50K/yr retirement × 25 = $1.25M needed", "stat": "At 40, you need 33× annual expenses saved",
         "action": "quitting your job", "question": "do you need to retire by 40",
         "option_a": "FIRE at 40", "option_b": "Traditional at 65",
         "calc_name": "FIRE Calculator", "link": "/calculators/financial-independence"},
    ],
    "loans": [
        {"scenario": "$25K auto loan, 4.5% × 60mo → $466/month", "stat": "A 1% lower rate saves you $650 over the loan",
         "action": "signing that loan", "question": "will your monthly payment be",
         "option_a": "36-Month Loan", "option_b": "72-Month Loan",
         "calc_name": "Auto Loan Calculator", "link": "/calculators/auto-loan"},
        {"scenario": "$30K personal loan, 8% × 5yr → $608/month", "stat": "Total interest on 5yr $30K loan at 8%: $6,500",
         "action": "borrowing money", "question": "will this loan cost you",
         "option_a": "5-Year Term", "option_b": "7-Year Term",
         "calc_name": "Loan Calculator", "link": "/calculators/loan-calculator"},
    ],
    "debt": [
        {"scenario": "$15K credit card debt at 22% → avalanche saves $3,200", "stat": "Snowball method has 3× higher completion rate",
         "action": "paying minimums", "question": "debt can you eliminate this year",
         "option_a": "Avalanche Method", "option_b": "Snowball Method",
         "calc_name": "Debt Payoff Calculator", "link": "/calculators/debt-snowball"},
        {"scenario": "$8K debt at 24% APR → pay $800/mo = debt-free in 12 months", "stat": "Adding $200/month saves $1,800 in interest",
         "action": "ignoring that balance", "question": "faster can you be debt-free",
         "option_a": "Minimum Payment", "option_b": "Extra $200/Month",
         "calc_name": "Credit Card Payoff", "link": "/calculators/credit-card-payoff"},
    ],
    "taxes": [
        {"scenario": "$85K salary → $14,260 federal tax (effective 16.8%)", "stat": "Maxing 401(k) saves $4,600 in taxes this year",
         "action": "filing your taxes", "question": "tax will you actually owe",
         "option_a": "Standard Deduction", "option_b": "Itemized Deductions",
         "calc_name": "Tax Calculator", "link": "/calculators/tax-calculator"},
        {"scenario": "$50K stock profit → $7,500 long-term cap gains tax", "stat": "Holding 1 more day can cut your tax rate in half",
         "action": "selling investments", "question": "capital gains tax will you pay",
         "option_a": "Short-Term Gains", "option_b": "Long-Term Gains",
         "calc_name": "Capital Gains Calc", "link": "/calculators/capital-gains-tax"},
    ],
    "savings": [
        {"scenario": "$3K/month income → 50/30/20 = $600 to savings", "stat": "Saving 20% of income = financial independence in 25 years",
         "action": "making a budget", "question": "should you save each month",
         "option_a": "50/30/20 Budget", "option_b": "Zero-Based Budget",
         "calc_name": "Budget Planner", "link": "/calculators/budget-planner"},
        {"scenario": "Save $200/month → $7,200 emergency fund in 3 years", "stat": "Only 39% of Americans can cover a $1,000 emergency",
         "action": "spending everything", "question": "emergency savings do you need",
         "option_a": "3 Months Expenses", "option_b": "6 Months Expenses",
         "calc_name": "Emergency Fund Calc", "link": "/calculators/emergency-fund"},
    ],
    "everyday": [
        {"scenario": "25% off $80 item → you pay $60 (save $20)", "stat": "Most people can't calculate percentages in their head",
         "action": "shopping a sale", "question": "are you actually saving",
         "option_a": "25% Off", "option_b": "Buy One Get One",
         "calc_name": "Percentage Calculator", "link": "/calculators/percentage-calculator"},
        {"scenario": "18% tip on $65 dinner → $11.70 tip, $76.70 total", "stat": "Over-tipping by just 2% costs you $100+ per year",
         "action": "splitting the bill", "question": "tip should you leave",
         "option_a": "15% Tip", "option_b": "20% Tip",
         "calc_name": "Tip Calculator", "link": "/calculators/tip-calculator"},
    ],
}


def generate_pin(cat_key, used_slugs):
    """Generate one tool-showcase pin."""
    board = BOARDS[cat_key]
    colors = COLORS[cat_key]
    scenarios = SCENARIOS[cat_key]
    template = random.choice(PIN_TEMPLATES)
    scenario = random.choice(scenarios)

    headline = template["headline"].format(
        scenario=scenario["scenario"], stat=scenario["stat"],
        action=scenario["action"], question=scenario["question"],
        option_a=scenario["option_a"], option_b=scenario["option_b"],
        calc_name=scenario["calc_name"],
    )
    subtitle = template["subtitle"].format(
        scenario=scenario["scenario"], calc_name=scenario["calc_name"],
    )

    # Clean up
    headline = headline[:100]
    if len(headline) > 97:
        headline = headline[:97] + "..."

    # Description
    hashtags_map = {
        "mortgages": "#MortgageCalculator #HomeBuying #RealEstate",
        "investing": "#Investing #CompoundInterest #WealthBuilding",
        "retirement": "#RetirementPlanning #FIRE #FinancialFreedom",
        "loans": "#LoanCalculator #AutoLoan #CarBuying",
        "debt": "#DebtFree #DebtPayoff #PersonalFinance",
        "taxes": "#TaxCalculator #TaxTips #MoneySaving",
        "savings": "#Budgeting #SaveMoney #EmergencyFund",
        "everyday": "#QuickMath #LifeHacks #SmartTools",
    }
    hashtags = hashtags_map.get(cat_key, "#Calculator #Finance")

    description = (
        f"{headline}\n\n"
        f"{subtitle}\n\n"
        f"125 free calculators. No signup. Instant results.\n\n"
        f"{hashtags} #QFINHUB"
    )[:500]

    # Unique slug
    slug_base = f"{cat_key}-{template['style']}"
    slug = slug_base
    c = 0
    while slug in used_slugs:
        c += 1
        slug = f"{slug_base}-{c}"
    used_slugs.add(slug)

    h = hashlib.md5(slug.encode()).hexdigest()[:6]
    img_file = f"pin-{slug}-{h}.png"

    return {
        "slug": slug,
        "category": cat_key,
        "boardId": board["id"],
        "boardName": board["name"],
        "title": headline,
        "description": description,
        "link": f"https://www.qfinhub.com{scenario['link']}",
        "stat": scenario["stat"],
        "style": template["style"],
        "scenario": scenario["scenario"],
        "calc_name": scenario["calc_name"],
        "imageUrl": f"https://www.qfinhub.com/pinterest-images/{img_file}",
        "imagePath": str(PUBLIC_DIR / img_file),
        "colors": colors,
    }


def generate_image(pin):
    """Generate a clean, modern calculator-showcase pin image."""
    try:
        from PIL import Image, ImageDraw, ImageFont
    except ImportError:
        return False

    W, H = 1000, 1500
    c = pin["colors"]

    img = Image.new("RGB", (W, H), c["bg"])
    draw = ImageDraw.Draw(img)

    # Fonts
    font_dir = "/usr/share/fonts"
    try:
        bold_48 = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        bold_36 = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 36)
        bold_28 = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
        regular_22 = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans.ttf", 22)
        regular_18 = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans.ttf", 18)
        bold_64 = ImageFont.truetype(f"{font_dir}/truetype/dejavu/DejaVuSans-Bold.ttf", 64)
    except:
        bold_48 = bold_36 = bold_28 = regular_22 = regular_18 = bold_64 = ImageFont.load_default()

    pad = 60

    # ─── TOP BAR: QFINHUB brand ───
    draw.rectangle([0, 0, W, 80], fill=c["accent"])
    draw.text((pad, 20), "QFINHUB", fill="white", font=bold_36)
    draw.text((W-pad, 22), board_name_short(pin["boardName"]), fill="white", font=regular_22, anchor="ra")

    # ─── HEADLINE SECTION ───
    title = pin["title"]
    # Truncate to fit
    if len(title) > 110:
        title = title[:107] + "..."

    # Word wrap headline over 2-3 lines
    words = title.split()
    lines = []
    current = ""
    for word in words:
        test = f"{current} {word}".strip()
        bbox = draw.textbbox((0, 0), test, font=bold_36)
        if bbox[2] - bbox[0] > W - pad * 2:
            lines.append(current)
            current = word
        else:
            current = test
    lines.append(current)

    y = 110
    for line in lines[:3]:
        draw.text((pad, y), line, fill=c["text"], font=bold_36)
        y += 46

    # ─── CALCULATOR MOCKUP CARD ───
    card_y = y + 20
    card_h = 400
    card_w = W - pad * 2

    # Card shadow
    draw.rounded_rectangle([pad + 8, card_y + 8, pad + card_w + 8, card_y + card_h + 8],
                          radius=24, fill="#00000020")
    # Card
    draw.rounded_rectangle([pad, card_y, pad + card_w, card_y + card_h],
                          radius=24, fill=c["card"], outline="#e2e8f0", width=1)

    # Input field mockup
    input_y = card_y + 30
    inputs = parse_inputs(pin["scenario"])
    for i, (label, val) in enumerate(inputs):
        iy = input_y + i * 60
        draw.text((pad + 30, iy), label, fill=c["sub"], font=regular_18)
        draw.rounded_rectangle([pad + 30, iy + 28, pad + card_w - 30, iy + 54],
                              radius=8, fill="#f1f5f9", outline="#e2e8f0", width=1)
        draw.text((pad + 45, iy + 45), val, fill=c["text"], font=regular_22, anchor="lm")

    # Calculate button
    btn_y = input_y + len(inputs) * 60 + 20
    btn_w = card_w - 60
    draw.rounded_rectangle([pad + 30, btn_y, pad + 30 + btn_w, btn_y + 52],
                          radius=12, fill=c["accent"])
    draw.text((pad + 30 + btn_w // 2, btn_y + 30), "Calculate →", fill="white", font=bold_28, anchor="mm")

    # Result display
    result_y = btn_y + 70
    result_text = extract_result(pin["scenario"])
    if result_text:
        draw.text((pad + 30, result_y), "Result", fill=c["sub"], font=regular_18)
        bbox = draw.textbbox((0, 0), result_text, font=bold_48)
        draw.text((pad + 30, result_y + 38), result_text, fill=c["accent"], font=bold_48)

    # ─── CTA SECTION ───
    cta_y = card_y + card_h + 40
    draw.text((pad, cta_y), "Get your exact numbers →", fill=c["text"], font=bold_36)
    draw.text((pad, cta_y + 50), f"qfinhub.com{pin['link']}", fill=c["accent"], font=regular_22)

    # URL bar at bottom
    url_y = cta_y + 90
    draw.text((pad, url_y), "125 Free Calculators  •  No Signup  •  Instant Results", fill=c["sub"], font=regular_18)

    # Decorative dots
    for i in range(8):
        x = W // 2 - 105 + i * 30
        draw.ellipse([x, H - 60, x + 16, H - 44], fill=c["accent"] + "40")
        draw.ellipse([x + 3, H - 57, x + 13, H - 47], fill=c["accent"])

    img.save(pin["imagePath"], "PNG", optimize=True)
    return True


def board_name_short(name):
    mapping = {
        "Mortgage Calculators": "Mortgage",
        "Investment Calculators": "Investing",
        "Retirement Planning": "Retirement",
        "Loan Calculators": "Loans",
        "Debt Payoff Tools": "Debt",
        "Tax Calculators": "Taxes",
        "Savings & Budget": "Savings",
        "Everyday Calculators": "Everyday",
    }
    return mapping.get(name, name.split()[0])


def parse_inputs(scenario):
    """Extract labeled inputs from scenario text."""
    pairs = []
    # Match patterns like "$350K home" or "6.5%" or "30yr"
    money = re.findall(r'\$[\d,.]+[KMB]?', scenario)
    pct = re.findall(r'[\d.]+%', scenario)
    years = re.findall(r'(\d+)yr', scenario) or re.findall(r'(\d+)\s*years?', scenario)

    if "mortgage" in scenario.lower() or "home" in scenario.lower():
        if money:
            pairs.append(("Home Price", money[0]))
        if pct:
            pairs.append(("Interest Rate", pct[0]))
        pairs.append(("Term", "30 Years"))
    elif "loan" in scenario.lower():
        if money:
            pairs.append(("Loan Amount", money[0]))
        if pct:
            pairs.append(("APR", pct[0]))
        if years:
            pairs.append(("Term", f"{years[0]} Years"))
    elif "invest" in scenario.lower() or "compound" in scenario.lower():
        if money:
            pairs.append(("Monthly", money[0]))
        if pct:
            pairs.append(("Return", pct[0]))
        if years:
            pairs.append(("Years", years[0]))
    elif "retire" in scenario.lower() or "FIRE" in scenario.lower():
        pairs.append(("Annual Need", "$50,000"))
        pairs.append(("Withdrawal", "4%"))
        pairs.append(("Age", "40"))
    elif "tax" in scenario.lower():
        if money:
            pairs.append(("Income", money[0]))
        pairs.append(("Status", "Single"))
    elif "debt" in scenario.lower() or "credit" in scenario.lower():
        if money:
            pairs.append(("Balance", money[0]))
        if pct:
            pairs.append(("APR", pct[0]))
    elif "budget" in scenario.lower() or "save" in scenario.lower():
        if money:
            pairs.append(("Income", money[0]))
    elif "tip" in scenario.lower():
        if money:
            pairs.append(("Bill", money[0]))
        pairs.append(("Tip %", "18%"))
    elif "%" in scenario.lower() or "percent" in scenario.lower():
        pairs.append(("Original", "$80"))
        pairs.append(("Discount", "25%"))
    else:
        pairs = [("Amount", "$1,000"), ("Rate", "5%"), ("Term", "10 Years")]

    # Ensure at least 2 inputs
    while len(pairs) < 2:
        pairs.append(("Value", "100"))
    return pairs[:4]


def extract_result(scenario):
    """Extract the result number from scenario text."""
    # Pattern: → $1,896/month
    m = re.search(r'→\s*(\$[\d,.]+(?:/\w+)?)', scenario)
    if m:
        return m.group(1)
    m = re.search(r'=\s*(\$[\d,.]+[KMB]?)', scenario)
    if m:
        return m.group(1)
    return ""


def load_state():
    if STATE_PATH.exists():
        with open(STATE_PATH) as f:
            return json.load(f)
    return {"batches": 0, "total_pins": 0, "board_counts": {}, "last_run": None}


def save_state(state):
    state["last_run"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    state["batches"] = (state.get("batches", 0) or 0) + 1
    state["total_pins"] = state.get("total_pins", 0)
    with open(STATE_PATH, "w") as f:
        json.dump(state, f, indent=2)


def pick_boards(state, count=10):
    board_names = list(BOARDS.keys())
    bc = state.get("board_counts", {})
    board_names.sort(key=lambda b: bc.get(b, 0))
    chosen = []
    for i in range(count):
        b = board_names[i % len(board_names)]
        chosen.append(b)
        bc[b] = bc.get(b, 0) + 1
    state["board_counts"] = bc
    random.shuffle(chosen)
    return chosen


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--count", type=int, default=10)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    state = load_state()
    boards = pick_boards(state, args.count)
    pins = []
    used_slugs = set()

    print(f"🎯 QFINHUB Tool-Showcase Pin Generator — {args.count} pins")
    print("=" * 55)

    for i, cat_key in enumerate(boards):
        pin = generate_pin(cat_key, used_slugs)
        pins.append(pin)

        if not args.dry_run:
            ok = generate_image(pin)
            icon = "✅" if ok else "❌"
            print(f"  {icon} Pin {i+1}: {pin['boardName']}")
            print(f"      \"{pin['title'][:80]}\"")
            print(f"      Style: {pin['style']} | {pin['calc_name']}")
        else:
            print(f"  📌 Pin {i+1}: {pin['boardName']}")
            print(f"      \"{pin['title'][:80]}\"")

    if not args.dry_run:
        queue = {"generated": time.strftime("%Y-%m-%dT%H:%M:%S"), "batch": state["batches"], "pins": pins}
        with open(QUEUE_PATH, "w") as f:
            json.dump(queue, f, indent=2)
        state["total_pins"] = state.get("total_pins", 0) + len(pins)
        save_state(state)
        print(f"\n✅ {len(pins)} pins queued. Total lifetime: {state['total_pins']}")

if __name__ == "__main__":
    main()
