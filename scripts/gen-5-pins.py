#!/usr/bin/env python3
"""
Generate 5 premium Pinterest pins (SVGs → PNGs) + populate post-queue.json
Topics: Mortgage Calculator Tip, Compound Interest Growth, Retirement Savings by Age,
        Debt Payoff Strategies Comparison, Tax Deduction Checklist
"""

import os, json, hashlib, time
from datetime import datetime
import cairosvg

ROOT = '/home/admin1/qfinhub'
PUBLIC_IMG = f'{ROOT}/public/pinterest-images'
QUEUE_FILE = f'{ROOT}/.pinterest-data/post-queue.json'
SVG_DIR = f'{ROOT}/.pinterest-data/images-v2'

os.makedirs(PUBLIC_IMG, exist_ok=True)
os.makedirs(SVG_DIR, exist_ok=True)

# ─── Board definitions from boards.json ───
BOARDS = {
    "mortgages": {"id": "1086071335079246633", "name": "Mortgage Calculators"},
    "investing": {"id": "1086071335079246634", "name": "Investment Calculators"},
    "retirement": {"id": "1086071335079246635", "name": "Retirement Planning"},
    "debt": {"id": "1086071335079246637", "name": "Debt Payoff Tools"},
    "taxes": {"id": "1086071335079246638", "name": "Tax Calculators"},
}

# ─── 5 Pin Definitions ───
PINS = [
    {
        "slug": "mortgage-calculator-tips",
        "category": "mortgages",
        "boardId": BOARDS["mortgages"]["id"],
        "boardName": BOARDS["mortgages"]["name"],
        "title": "5 Smart Mortgage Tips That Save You Thousands",
        "description": (
            "Discover 5 proven mortgage hacks that could slash your total interest by $50,000+.\n"
            "Learn when to refinance, how extra payments compound, and why biweekly payments work.\n"
            "Use our free mortgage calculator to run your own numbers. No signup needed.\n\n"
            "#MortgageTips #HomeBuying #RealEstate #FinancialFreedom #MoneySavingTips #QFINHUB"
        ),
        "link": "https://www.qfinhub.com/calculators/mortgage-calculator",
        "stat": "Save $50K+",
        "emoji": "🏠",
        "color": "#059669",
        "colorDark": "#064e3b",
        "subtitle": "Free Mortgage Calculator & Tips",
        "features": ["Extra Payment Impact", "Refinance Timing", "Biweekly Savings"],
        "descPreview": (
            "The average homeowner overpays $50,000+ in mortgage interest by not using these 5 simple strategies. "
            "Extra principal payments, biweekly schedules, and smart refinance timing can shave years off your loan. "
            "Our free calculator shows you exactly how much you can save — try it now at qfinhub.com."
        ),
        "hashtags": "#MortgageTips #HomeBuying #RealEstate #FinancialFreedom #MoneySavingTips",
    },
    {
        "slug": "compound-interest-growth",
        "category": "investing",
        "boardId": BOARDS["investing"]["id"],
        "boardName": BOARDS["investing"]["name"],
        "title": "How $500/Month Becomes $1,000,000+",
        "description": (
            "See the shocking growth chart: $500/month invested at 8% grows to over $1 million in 30 years.\n"
            "The secret is time in the market, not timing the market. Compound interest rewards consistency.\n"
            "Use our free compound interest calculator to project your own wealth journey.\n\n"
            "#CompoundInterest #Investing #WealthBuilding #FinancialFreedom #PassiveIncome #QFINHUB"
        ),
        "link": "https://www.qfinhub.com/calculators/compound-interest",
        "stat": "$1M+",
        "emoji": "📈",
        "color": "#2563eb",
        "colorDark": "#1e3a8a",
        "subtitle": "Free Compound Interest Growth Calculator",
        "features": ["Growth Projections", "Year-by-Year Charts", "Compare Scenarios"],
        "descPreview": (
            "Albert Einstein called compound interest the 8th wonder of the world. See why: $500/month at 8% grows to "
            "$745,000 in 30 years. Start 10 years earlier? That jumps to $1.7 million. Time is your greatest asset — "
            "use our free calculator to see your personal growth trajectory today."
        ),
        "hashtags": "#CompoundInterest #Investing #WealthBuilding #PassiveIncome #FinancialLiteracy",
    },
    {
        "slug": "retirement-savings-by-age",
        "category": "retirement",
        "boardId": BOARDS["retirement"]["id"],
        "boardName": BOARDS["retirement"]["name"],
        "title": "Retirement Savings By Age: Are You On Track?",
        "description": (
            "See the recommended retirement savings milestones for every decade: 30s, 40s, 50s, and beyond.\n"
            "Age 30: 1x salary | Age 40: 3x salary | Age 50: 6x salary | Age 60: 8x salary.\n"
            "Use our free retirement calculator to check your progress. It takes 2 minutes.\n\n"
            "#RetirementPlanning #401k #FinancialIndependence #SaveForRetirement #MoneyGoals #QFINHUB"
        ),
        "link": "https://www.qfinhub.com/calculators/retirement-planning",
        "stat": "8X by 60",
        "emoji": "🎯",
        "color": "#dc2626",
        "colorDark": "#7f1d1d",
        "subtitle": "Free Retirement Savings Calculator",
        "features": ["Age Milestones", "Catch-Up Strategies", "Personalized Plan"],
        "descPreview": (
            "Fidelity recommends having 1x your salary saved by 30, 3x by 40, 6x by 50, and 8x by 60. "
            "Are you hitting these benchmarks? Don't guess — use our free retirement calculator to see exactly "
            "where you stand and what adjustments you need to make. Your future self will thank you."
        ),
        "hashtags": "#RetirementPlanning #401k #FinancialIndependence #FIREMovement #MoneyGoals",
    },
    {
        "slug": "debt-payoff-strategies",
        "category": "debt",
        "boardId": BOARDS["debt"]["id"],
        "boardName": BOARDS["debt"]["name"],
        "title": "Debt Snowball vs Avalanche: Which Wins?",
        "description": (
            "Snowball method: Pay smallest debts first for quick wins. Avalanche: Attack highest interest first.\n"
            "See a side-by-side comparison showing total interest saved and payoff timeline for each strategy.\n"
            "Use our free debt payoff calculator to build your custom plan. Get debt-free faster.\n\n"
            "#DebtFreeJourney #DebtPayoff #PersonalFinance #MoneyTips #DebtSnowball #QFINHUB"
        ),
        "link": "https://www.qfinhub.com/calculators/debt-snowball",
        "stat": "Save $4,200+",
        "emoji": "💳",
        "color": "#7c3aed",
        "colorDark": "#4c1d95",
        "subtitle": "Free Debt Payoff Strategy Calculator",
        "features": ["Snowball Method", "Avalanche Method", "Side-by-Side Comparison"],
        "descPreview": (
            "Snowball (smallest balance first) builds momentum with quick wins. Avalanche (highest APR first) "
            "saves the most in interest. Which is right for you? Our free comparison calculator shows both strategies "
            "side by side — see your exact payoff date and total interest saved with each approach."
        ),
        "hashtags": "#DebtFreeJourney #DebtPayoff #DebtSnowball #PersonalFinance #MoneyTips",
    },
    {
        "slug": "tax-deduction-checklist",
        "category": "taxes",
        "boardId": BOARDS["taxes"]["id"],
        "boardName": BOARDS["taxes"]["name"],
        "title": "2025 Tax Deduction Checklist: 15 Write-Offs",
        "description": (
            "Don't leave money on the table! Complete checklist of 15 commonly missed tax deductions.\n"
            "Includes: mortgage interest, student loan interest, medical expenses, home office, and more.\n"
            "Use our free tax calculator to estimate your refund with every deduction applied.\n\n"
            "#TaxDeductions #TaxTips #TaxSeason #MoneySaving #TaxPlanning #QFINHUB"
        ),
        "link": "https://www.qfinhub.com/calculators/tax-calculator",
        "stat": "Save $3,200+",
        "emoji": "📋",
        "color": "#0891b2",
        "colorDark": "#164e63",
        "subtitle": "Free Tax Deduction Calculator",
        "features": ["15 Deductions Listed", "Refund Estimator", "Printable Checklist"],
        "descPreview": (
            "The average taxpayer misses $3,200+ in legitimate deductions every year. Don't be one of them. "
            "Our checklist covers mortgage interest, charitable donations, student loan interest, medical expenses, "
            "home office deductions, and 10 more commonly overlooked write-offs. Estimate your savings today."
        ),
        "hashtags": "#TaxDeductions #TaxTips #TaxSeason #TaxPlanning #FinancialLiteracy",
    },
]


# ─── XML Escape ───
def xml_escape(text):
    """Escape special XML characters."""
    text = text.replace('&', '&amp;')
    text = text.replace('<', '&lt;')
    text = text.replace('>', '&gt;')
    text = text.replace('"', '&quot;')
    text = text.replace("'", '&apos;')
    return text


# ─── SVG Template Generator ───
def generate_svg(pin):
    """Generate a 1000x1500 SVG pin using the QFINHUB template."""
    # Escape all text for XML safety
    color = pin["color"]
    colorDark = pin["colorDark"]
    emoji = pin["emoji"]
    subtitle = xml_escape(pin["subtitle"])
    stat = xml_escape(pin["stat"])
    features = [xml_escape(f) for f in pin["features"]]
    desc = xml_escape(pin["descPreview"])
    link = xml_escape(pin["link"].replace("https://www.", ""))
    hashtags = xml_escape(pin["hashtags"])

    # Split title into two lines if needed
    words = pin["title"].split()
    mid = len(words) // 2
    if len(words) >= 6:
        line1 = " ".join(words[:4]) if len(words) > 7 else " ".join(words[:mid])
        line2 = " ".join(words[4:]) if len(words) > 7 else " ".join(words[mid:])
    else:
        line1 = pin["title"]
        line2 = ""
    line1 = xml_escape(line1)
    line2 = xml_escape(line2)

    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1500" viewBox="0 0 1000 1500">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{color}"/>
      <stop offset="100%" stop-color="{colorDark}"/>
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f8fafc"/>
    </linearGradient>
    <filter id="shadow" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="4" stdDeviation="12" flood-color="rgba(0,0,0,0.08)"/>
    </filter>
    <filter id="shadowSmall" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="rgba(0,0,0,0.06)"/>
    </filter>
  </defs>

  <!-- White Background -->
  <rect width="1000" height="1500" fill="#ffffff" rx="24"/>

  <!-- Header Section -->
  <rect x="0" y="0" width="1000" height="520" fill="url(#headerGrad)"/>

  <!-- Decorative circles -->
  <circle cx="850" cy="80" r="180" fill="rgba(255,255,255,0.04)"/>
  <circle cx="120" cy="400" r="120" fill="rgba(255,255,255,0.04)"/>
  <circle cx="900" cy="350" r="80" fill="rgba(255,255,255,0.06)"/>

  <!-- Brand Badge -->
  <rect x="36" y="32" width="130" height="34" rx="17" fill="rgba(255,255,255,0.15)"/>
  <text x="101" y="53" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="white">QFINHUB</text>

  <!-- Emoji -->
  <text x="500" y="120" text-anchor="middle" font-size="36">{emoji}</text>

  <!-- Title Line 1 -->
  <text x="500" y="190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="white">{line1}</text>
  <!-- Title Line 2 -->
  <text x="500" y="238" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="white">{line2}</text>

  <!-- Subtitle -->
  <text x="500" y="290" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="rgba(255,255,255,0.85)">{subtitle}</text>

  <!-- CTA Badge -->
  <rect x="350" y="320" width="300" height="44" rx="22" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="500" y="347" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="600" fill="white">⚡ Try It Free — No Signup Needed</text>

  <!-- White Content Area Card -->
  <rect x="40" y="460" width="920" height="440" rx="20" fill="url(#cardGrad)" filter="url(#shadow)"/>

  <!-- Key Stat -->
  <text x="500" y="570" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="82" font-weight="900" fill="{color}">{stat}</text>
  <text x="500" y="610" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#6b7280">{subtitle}</text>

  <!-- Divider -->
  <line x1="180" y1="640" x2="820" y2="640" stroke="#e5e7eb" stroke-width="1"/>

  <!-- Feature Cards -->
  <g transform="translate(60, 670)">
    <rect x="0" y="0" width="260" height="46" rx="10" fill="#f0fdf4" filter="url(#shadowSmall)"/>
    <text x="15" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#059669">✓ {features[0]}</text>

    <rect x="290" y="0" width="260" height="46" rx="10" fill="#f0f9ff" filter="url(#shadowSmall)"/>
    <text x="305" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#2563eb">✓ {features[1]}</text>

    <rect x="580" y="0" width="260" height="46" rx="10" fill="#faf5ff" filter="url(#shadowSmall)"/>
    <text x="595" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#7c3aed">✓ {features[2]}</text>
  </g>

  <!-- Description -->
  <rect x="60" y="960" width="880" height="180" rx="16" fill="#f9fafb"/>
  <text x="500" y="1000" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#374151">
    <tspan x="500" dy="0">{desc[:110]}</tspan>
    <tspan x="500" dy="24">{desc[110:220] if len(desc) > 110 else ''}</tspan>
    <tspan x="500" dy="24">{desc[220:330] if len(desc) > 220 else ''}</tspan>
  </text>

  <!-- URL Badge -->
  <rect x="250" y="1160" width="500" height="48" rx="24" fill="{color}"/>
  <text x="500" y="1190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="white">{link}</text>

  <!-- Bottom Brand Bar -->
  <rect x="0" y="1250" width="1000" height="60" fill="#f8fafc"/>
  <text x="500" y="1278" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">Join thousands using QFINHUB — 124 Free Financial Calculators</text>

  <!-- Hashtags -->
  <text x="500" y="1330" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8">
    {hashtags}
  </text>

  <!-- Decorative dots -->
  <g opacity="0.2">
    <circle cx="40" cy="1460" r="3" fill="{color}"/><circle cx="120" cy="1460" r="3" fill="{color}"/><circle cx="200" cy="1460" r="3" fill="{color}"/><circle cx="280" cy="1460" r="3" fill="{color}"/><circle cx="360" cy="1460" r="3" fill="{color}"/><circle cx="440" cy="1460" r="3" fill="{color}"/><circle cx="520" cy="1460" r="3" fill="{color}"/><circle cx="600" cy="1460" r="3" fill="{color}"/><circle cx="680" cy="1460" r="3" fill="{color}"/><circle cx="760" cy="1460" r="3" fill="{color}"/><circle cx="840" cy="1460" r="3" fill="{color}"/><circle cx="920" cy="1460" r="3" fill="{color}"/>
  </g>
</svg>'''
    return svg


# ─── Main Generation ───
def main():
    queue_pins = []
    generated_at = datetime.now().isoformat()

    for i, pin in enumerate(PINS):
        slug = pin["slug"]
        hash_suffix = hashlib.md5(slug.encode()).hexdigest()[:6]

        # 1. Generate SVG
        svg_content = generate_svg(pin)
        svg_path = f'{SVG_DIR}/{slug}-{hash_suffix}.svg'
        with open(svg_path, 'w') as f:
            f.write(svg_content)
        print(f"  [{i+1}/5] SVG saved: {svg_path}")

        # 2. Render to PNG
        png_filename = f'pin-{slug}-{hash_suffix}.png'
        png_path = f'{PUBLIC_IMG}/{png_filename}'
        cairosvg.svg2png(bytestring=svg_content.encode(), write_to=png_path,
                         output_width=1000, output_height=1500)
        file_size = os.path.getsize(png_path)
        print(f"  [{i+1}/5] PNG rendered: {png_path} ({file_size} bytes)")

        # 3. Build queue entry
        image_url = f'https://www.qfinhub.com/pinterest-images/{png_filename}'
        queue_pin = {
            "slug": slug,
            "category": pin["category"],
            "boardId": pin["boardId"],
            "boardName": pin["boardName"],
            "title": pin["title"],
            "description": pin["description"],
            "link": pin["link"],
            "stat": pin["stat"],
            "imageUrl": image_url,
            "imagePath": png_path,
        }
        queue_pins.append(queue_pin)

    # 4. Write post-queue.json
    queue_data = {
        "generated": generated_at,
        "pins": queue_pins,
    }
    with open(QUEUE_FILE, 'w') as f:
        json.dump(queue_data, f, indent=2)
    print(f"\n✅ Post queue saved: {QUEUE_FILE} ({len(queue_pins)} pins)")

    # 5. Print summary
    print("\n" + "=" * 70)
    print("  GENERATED 5 PINTEREST PINS")
    print("=" * 70)
    for i, p in enumerate(queue_pins):
        print(f"\n  📌 Pin {i+1}: {p['slug']}")
        print(f"     Board: {p['boardName']} ({p['boardId']})")
        print(f"     Title: {p['title']}")
        print(f"     Image: {os.path.basename(p['imagePath'])}")
        print(f"     URL:   {p['imageUrl']}")
        print(f"     Link:  {p['link']}")
    print("\n" + "=" * 70)
    print("  Ready for upload via: python3 scripts/pinterest-stealth.py --mode upload")
    print("=" * 70)


if __name__ == '__main__':
    main()
