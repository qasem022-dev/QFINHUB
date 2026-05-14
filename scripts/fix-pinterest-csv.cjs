#!/usr/bin/env node
/**
 * Generate Pinterest CSV with CORRECT format for Pinterest bulk upload.
 * Pinterest required columns: Title, Media URL, Pinterest board, Description, Link, Keywords, Publish date
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PUBLIC_DIR = path.join(ROOT, "public");
const CSV_OUT = path.join(PUBLIC_DIR, "pinterest-upload.csv");
const PIN_DATA = path.join(ROOT, ".pinterest-data", "pin-content.json");
const IMG_DIR = path.join(PUBLIC_DIR, "pins");

// ── Actual Pinterest board names (created via API, stored in boards.json) ──
const BOARD_MAP = {
  // by pin.category (lowercase):
  mortgages: "Mortgage Calculators",
  investing: "Investment Calculators",
  retirement: "Retirement Planning",
  loans: "Loan Calculators",
  debt: "Debt Payoff Tools",
  taxes: "Tax Calculators",
  savings: "Savings & Budget",
  everyday: "Everyday Calculators",
  // by pin.boardName (capitalized, as fallback):
  Mortgages: "Mortgage Calculators",
  Investing: "Investment Calculators",
  Retirement: "Retirement Planning",
  Loans: "Loan Calculators",
  "Debt Payoff": "Debt Payoff Tools",
  Taxes: "Tax Calculators",
  "Savings & Budget": "Savings & Budget",
  "Everyday Tools": "Everyday Calculators",
};

// ── Keywords per category ──
const KEYWORDS = {
  mortgages: "mortgage, home loan, real estate, house payment, interest rates, refinance",
  investing: "investing, stocks, compound interest, portfolio, ROI, wealth, market growth",
  retirement: "retirement planning, 401k, IRA, pension, retirement savings, social security, retire",
  loans: "personal loan, auto loan, student loan, debt, monthly payment, interest rate, borrowing",
  debt: "debt payoff, debt free, credit card, debt snowball, debt avalanche, get out of debt",
  taxes: "tax calculator, income tax, tax refund, tax bracket, capital gains, tax filing, irs",
  savings: "savings, budget, net worth, inflation, money management, personal finance, budgeting",
  everyday: "finance calculators, math, money tips, financial planning, free tools, online calculator",
};

// ── Load pin data ──
let pins = [];
try {
  const raw = fs.readFileSync(PIN_DATA, "utf-8");
  const data = JSON.parse(raw);
  pins = Array.isArray(data) ? data : (data.pins || data.items || []);
} catch (e) {
  console.error("❌ Could not load pin data:", e.message);
  process.exit(1);
}

console.log(`📊 Loaded ${pins.length} pins from pin-content.json`);

// ── Build image filename lookup ──
const imgFiles = fs.readdirSync(IMG_DIR);
const imgLookup = {};
for (const f of imgFiles) {
  // Files are batch-{slug}-{hash}.png — match by slug prefix
  for (const pin of pins) {
    const slug = pin.slug;
    if (slug && f.startsWith(`batch-${slug}-`) && f.endsWith(".png")) {
      imgLookup[slug] = f;
    }
  }
}
console.log(`📸 Found ${Object.keys(imgLookup).length} images in /pins/`);

// ── CSV helpers ──
function csvQuote(val) {
  if (val == null) return '""';
  const s = String(val).replace(/"/g, '""').replace(/\n/g, " ").replace(/\r/g, " ").trim();
  return `"${s}"`;
}

// ── Generate CSV ──
const header = ["Title", "Media URL", "Pinterest board", "Description", "Link", "Keywords", "Publish date"];
const rows = [header.map(csvQuote).join(",")];

let pinned = 0;
let skipped_noimg = 0;
let skipped_notitle = 0;

for (const pin of pins) {
  const title = (pin.title || "").substring(0, 100);
  const desc = (pin.description || "").substring(0, 500);
  const link = pin.link || `https://www.qfinhub.com/calculators/${pin.slug || ""}`;
  const slug = pin.slug || "";
  const cat = pin.category || "";

  if (!title) { skipped_notitle++; continue; }

  // Look up actual image filename
  const imgFile = imgLookup[slug];
  if (!imgFile) { skipped_noimg++; continue; }
  const imgUrl = `https://www.qfinhub.com/pins/${imgFile}`;

  // Board name: try category (lowercase) first, then boardName
  const board = BOARD_MAP[cat] || BOARD_MAP[pin.boardName] || "Everyday Calculators";

  // Keywords
  const keywords = KEYWORDS[cat] || "finance, calculator, personal finance, money";

  rows.push([title, imgUrl, board, desc, link, keywords, ""].map(csvQuote).join(","));
  pinned++;
}

// ── Write CSV ──
fs.writeFileSync(CSV_OUT, rows.join("\n") + "\n", "utf-8");

// ── Report ──
const missingPins = pins.length - pinned;
console.log(`\n✅ CSV: ${CSV_OUT}`);
console.log(`   ${pinned} pins written | ${missingPins} missing (no-img:${skipped_noimg}, no-title:${skipped_notitle})`);

// Validate boards
const boardCounts = {};
for (let i = 1; i < rows.length; i++) {
  const parts = rows[i].split(",");
  const b = parts[2]?.replace(/"/g, "") || "?";
  boardCounts[b] = (boardCounts[b] || 0) + 1;
}
console.log("\n📊 Board distribution:");
let allOk = true;
for (const [name, count] of Object.entries(boardCounts).sort()) {
  const known = Object.values(BOARD_MAP).includes(name) && !name.startsWith("?");
  if (!known) allOk = false;
  console.log(`   ${known ? "✅" : "⚠️"} ${name}: ${count} pins`);
}

console.log(allOk ? "\n✅ All board names verified" : "\n⚠️ Some board names need checking");

// Verify first 3 image URLs
console.log("\n📸 Image URL check (first 3):");
for (let i = 1; i <= Math.min(3, rows.length - 1); i++) {
  const url = rows[i].split(",")[1]?.replace(/"/g, "");
  console.log(`   ${url}`);
}
