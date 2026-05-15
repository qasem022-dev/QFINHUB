#!/usr/bin/env python3
"""Generate Pinterest CSV with proper formatting: UTF-8 BOM, CRLF, ALL fields quoted."""

import csv, io, os

script_dir = os.path.dirname(os.path.abspath(__file__))
output_path = os.path.join(script_dir, "..", "public", "pinterest-import-premium.csv")

PINS = [
    {
        "title": "How to Save $50k on Your Mortgage Interest",
        "media_url": "https://www.qfinhub.com/pinterest-images/pin-mortgage-payoff.png",
        "board": "Mortgage & Home Buying Tools/Mortgage Calculators",
        "desc": "Stop overpaying the bank. See exactly how much interest you can save by adding just a small amount to your monthly mortgage payment. Use our free calculator to find your new payoff date. #MortgageTips #HomeOwnership #DebtFree",
        "link": "https://www.qfinhub.com/calculators/mortgage-payoff",
        "tags": "Home Buying, Mortgage Tips, Real Estate"
    },
    {
        "title": "The Compound Interest Secret to Wealth",
        "media_url": "https://www.qfinhub.com/pinterest-images/pin-compound-interest.png",
        "board": "Investment & Wealth Growth/Investment Calculators",
        "desc": "Your money should be working as hard as you do. See how small, consistent investments turn into a fortune over time. It is not magic, it is math. Try our free calculator to see your future net worth. #Investing #WealthBuilding #FinanceTips",
        "link": "https://www.qfinhub.com/calculators/compound-interest",
        "tags": "Investing, Wealth Growth, Passive Income"
    },
    {
        "title": "Are You On Track for Retirement?",
        "media_url": "https://www.qfinhub.com/pinterest-images/pin-retirement-planning.png",
        "board": "Retirement Planning Calculators/Retirement Tools",
        "desc": "The biggest risk to your retirement is not knowing your number. Stop guessing and start planning. Use our free retirement calculator to see if you are on track for the life you want. #RetirementPlanning #FinancialFreedom #MoneyGoals",
        "link": "https://www.qfinhub.com/calculators/retirement-planning",
        "tags": "Retirement Planning, Financial Freedom, Money Management"
    },
    {
        "title": "Pay Off All Your Debt Faster (The Snowball Method)",
        "media_url": "https://www.qfinhub.com/pinterest-images/pin-debt-snowball.png",
        "board": "Debt Payoff Strategies/Debt Reduction Tools",
        "desc": "Overwhelmed by multiple debts? The snowball method is the fastest way to get debt-free. Enter your balances into our free tool to get your custom payoff plan today. #DebtFreeCommunity #Budgeting #MoneySaving",
        "link": "https://www.qfinhub.com/calculators/debt-snowball",
        "tags": "Debt Payoff, Budgeting, Personal Finance"
    },
    {
        "title": "How to Legally Lower Your Tax Bill",
        "media_url": "https://www.qfinhub.com/pinterest-images/pin-tax-calculator.png",
        "board": "Tax Planning & Estimators/Tax Calculators",
        "desc": "Tax season does not have to be painful. Discover how much you could save by adjusting your deductions. Use our free tax estimator to keep more of your hard-earned money. #TaxTips #MoneySaving #FinancialLiteracy",
        "link": "https://www.qfinhub.com/calculators/tax-calculator",
        "tags": "Tax Planning, Money Hacks, Financial Literacy"
    },
    {
        "title": "The 50/30/20 Budget Rule Explained",
        "media_url": "https://www.qfinhub.com/pinterest-images/pin-budget-planner.png",
        "board": "Personal Budgeting Hacks/Budget & Savings",
        "desc": "Struggling to save money? The 50/30/20 rule is the gold standard for personal budgeting. Use our free calculator to see exactly how much you should be spending vs. saving. #BudgetingTips #SavingMoney #FinancialPlanning",
        "link": "https://www.qfinhub.com/calculators/budget-planner",
        "tags": "Budgeting, Personal Budget, Money Management"
    }
]

CRLF = "\r\n"

output = io.StringIO()
output.write('\ufeff')  # UTF-8 BOM
writer = csv.writer(output, lineterminator=CRLF, quoting=csv.QUOTE_ALL)
writer.writerow(["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"])
for p in PINS:
    writer.writerow([p["title"], p["media_url"], p["board"], "", p["desc"], p["link"], "", p["tags"]])

csv_content = output.getvalue()

with open(output_path, "w", newline="", encoding="utf-8-sig") as f:
    f.write(csv_content)

raw = csv_content.encode("utf-8")
print(f"Written to: {output_path}")
print(f"Size: {len(raw)} bytes")
print(f"Has BOM: {raw[:3].hex() == 'efbbbf'}")
has_crlf = "\r\n" in csv_content
print(f"Has CRLF: {has_crlf}")
print(f"Number of rows: {len(PINS)}")
print(f"\nFull CSV output:")
print(csv_content)
