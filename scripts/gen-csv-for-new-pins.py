#!/usr/bin/env python3
"""Generate Pinterest CSV import for the 5 new pins."""
import csv, io, os, json

ROOT = '/home/admin1/qfinhub'
QUEUE_FILE = f'{ROOT}/.pinterest-data/post-queue.json'
CSV_OUTPUT = f'{ROOT}/.pinterest-data/csv-imports/pinterest-import-2026-05-19T14-41-00.csv'

os.makedirs(os.path.dirname(CSV_OUTPUT), exist_ok=True)

with open(QUEUE_FILE) as f:
    queue = json.load(f)

pins = queue['pins']

# Map boardName to CSV board path
BOARD_PATHS = {
    "Mortgage Calculators": "Mortgage & Home Buying Tools/Mortgage Calculators",
    "Investment Calculators": "Investment & Wealth Growth/Investment Calculators",
    "Retirement Planning": "Retirement Planning Calculators/Retirement Tools",
    "Debt Payoff Tools": "Debt Payoff Strategies/Debt Reduction Tools",
    "Tax Calculators": "Tax Planning & Estimators/Tax Calculators",
    "Savings & Budget": "Personal Budgeting Hacks/Budget & Savings",
}

TAGS_MAP = {
    "mortgages": "Home Buying, Mortgage Tips, Real Estate",
    "investing": "Investing, Wealth Growth, Passive Income",
    "retirement": "Retirement Planning, Financial Freedom, Money Management",
    "debt": "Debt Payoff, Budgeting, Personal Finance",
    "taxes": "Tax Planning, Money Hacks, Financial Literacy",
}

CRLF = "\r\n"
output = io.StringIO()
output.write('\ufeff')  # UTF-8 BOM
writer = csv.writer(output, lineterminator=CRLF, quoting=csv.QUOTE_ALL)
writer.writerow(["Title", "Media URL", "Pinterest board", "Thumbnail", "Description", "Link", "Publish date", "Keywords"])

for p in pins:
    board_path = BOARD_PATHS.get(p['boardName'], "QFINHUB Best Tools")
    tags = TAGS_MAP.get(p['category'], "Personal Finance, Financial Tools")
    desc = p['description'].replace('\n', ' ').replace('\\n', ' ')
    writer.writerow([
        p['title'],
        p['imageUrl'],
        board_path,
        "",
        desc,
        p['link'],
        "",
        tags,
    ])

csv_content = output.getvalue()

with open(CSV_OUTPUT, "w", newline="", encoding="utf-8-sig") as f:
    f.write(csv_content)

raw = csv_content.encode("utf-8")
print(f"Written to: {CSV_OUTPUT}")
print(f"Size: {len(raw)} bytes")
print(f"Has BOM: {raw[:3].hex() == 'efbbbf'}")
has_crlf = "\r\n" in csv_content
print(f"Has CRLF: {has_crlf}")
print(f"Number of rows: {len(pins)}")
print(f"\n--- CSV Preview ---")
print(csv_content[:500])
