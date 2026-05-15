#!/usr/bin/env node
/**
 * QFINHUB Pinterest Pin Generator v2
 *
 * High-quality pin generation pipeline:
 *   1. Gemini 3.1 Flash-Lite generates titles, descriptions, tags (1 batch call)
 *   2. Creates 1000×1500 SVG pin images with professional design
 *   3. Converts SVGs to PNGs via sharp
 *   4. Outputs Pinterest import CSV
 *
 * Usage:
 *   node scripts/pinterest-generator-v2.cjs                    # Generate 6 pins NOW
 *   node scripts/pinterest-generator-v2.cjs --count 10         # Generate 10 pins
 *   node scripts/pinterest-generator-v2.cjs --csv-only         # Skip image generation
 *   node scripts/pinterest-generator-v2.cjs --scheduled        # Daily cron mode
 *
 * Daily cron: 0 6 * * * node /path/to/scripts/pinterest-generator-v2.cjs --scheduled
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const { randomBytes } = require("crypto");

// ─── Config ──────────────────────────────────────────────────────────────────

const PROJECT_ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(PROJECT_ROOT, ".pinterest-data");
const IMAGES_DIR = resolve(DATA_DIR, "images-v2");
const CSV_DIR = resolve(DATA_DIR, "csv-imports");
const PUBLIC_PIN_DIR = resolve(PROJECT_ROOT, "public", "pinterest-images");

// Load .env.local for Gemini API key
try {
  const envContent = readFileSync(resolve(PROJECT_ROOT, ".env.local"), "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
} catch (e) {
  console.error("Could not load .env.local");
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-3.1-flash-lite";
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

// Ensure directories exist
[DATA_DIR, IMAGES_DIR, CSV_DIR, PUBLIC_PIN_DIR].forEach((dir) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
});

// ─── Calculator Pool (rotated daily) ─────────────────────────────────────────

const CALCULATORS = [
  // Mortgages
  { slug: "mortgage-calculator", category: "Mortgages", color: "#0f766e", emoji: "🏠" },
  { slug: "mortgage-affordability", category: "Mortgages", color: "#0d9488", emoji: "🏡" },
  { slug: "refinance-calculator", category: "Mortgages", color: "#14b8a6", emoji: "🔄" },
  { slug: "mortgage-payoff", category: "Mortgages", color: "#115e59", emoji: "💰" },
  { slug: "amortization-schedule", category: "Mortgages", color: "#134e4a", emoji: "📊" },
  // Investing
  { slug: "compound-interest", category: "Investing", color: "#7c3aed", emoji: "📈" },
  { slug: "simple-interest", category: "Investing", color: "#8b5cf6", emoji: "🧮" },
  { slug: "investment-return", category: "Investing", color: "#a855f7", emoji: "📊" },
  { slug: "roi-calculator", category: "Investing", color: "#6d28d9", emoji: "🎯" },
  { slug: "dividend-calculator", category: "Investing", color: "#9333ea", emoji: "💵" },
  { slug: "dollar-cost-average", category: "Investing", color: "#7e22ce", emoji: "📉" },
  // Retirement
  { slug: "retirement-planning", category: "Retirement", color: "#d97706", emoji: "🌅" },
  { slug: "401k-calculator", category: "Retirement", color: "#f59e0b", emoji: "🏦" },
  { slug: "roth-ira", category: "Retirement", color: "#eab308", emoji: "🛡️" },
  { slug: "social-security", category: "Retirement", color: "#ca8a04", emoji: "🇺🇸" },
  // Loans
  { slug: "loan-calculator", category: "Loans", color: "#2563eb", emoji: "📋" },
  { slug: "auto-loan", category: "Loans", color: "#3b82f6", emoji: "🚗" },
  { slug: "student-loan", category: "Loans", color: "#1d4ed8", emoji: "🎓" },
  { slug: "personal-loan", category: "Loans", color: "#1e40af", emoji: "👤" },
  // Debt
  { slug: "debt-snowball", category: "Debt Payoff", color: "#dc2626", emoji: "❄️" },
  { slug: "debt-avalanche", category: "Debt Payoff", color: "#ef4444", emoji: "🏔️" },
  { slug: "credit-card-payoff", category: "Debt Payoff", color: "#b91c1c", emoji: "💳" },
  // Taxes
  { slug: "tax-calculator", category: "Taxes", color: "#ea580c", emoji: "🧾" },
  { slug: "capital-gains-tax", category: "Taxes", color: "#f97316", emoji: "📈" },
  { slug: "self-employment-tax", category: "Taxes", color: "#c2410c", emoji: "💼" },
  { slug: "tax-bracket", category: "Taxes", color: "#9a3412", emoji: "📊" },
  // Savings
  { slug: "savings-goal", category: "Savings", color: "#059669", emoji: "🎯" },
  { slug: "budget-planner", category: "Savings", color: "#10b981", emoji: "📒" },
  { slug: "net-worth", category: "Savings", color: "#047857", emoji: "🏰" },
  { slug: "inflation-calculator", category: "Savings", color: "#0f766e", emoji: "📉" },
  // Everyday
  { slug: "salary-calculator", category: "Everyday", color: "#6366f1", emoji: "💼" },
  { slug: "percentage-calculator", category: "Everyday", color: "#4f46e5", emoji: "%" },
  { slug: "currency-converter", category: "Everyday", color: "#4338ca", emoji: "💱" },
  { slug: "tip-calculator", category: "Everyday", color: "#3730a3", emoji: "💁" },
  { slug: "discount-calculator", category: "Everyday", color: "#312e81", emoji: "🏷️" },
  // Business
  { slug: "break-even", category: "Business", color: "#0891b2", emoji: "⚖️" },
  { slug: "irr-calculator", category: "Business", color: "#06b6d4", emoji: "📈" },
  { slug: "npv-calculator", category: "Business", color: "#0e7490", emoji: "💎" },
];

// ─── State file for rotation ─────────────────────────────────────────────────

const STATE_FILE = resolve(DATA_DIR, "generator-state.json");

function getState() {
  if (existsSync(STATE_FILE)) {
    try { return JSON.parse(readFileSync(STATE_FILE, "utf-8")); } catch (e) {}
  }
  return { postedSlugs: [], lastRun: null };
}

function saveState(state) {
  writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

function pickCalculators(count = 6) {
  const state = getState();
  const postedSet = new Set(state.postedSlugs || []);

  // Unposted calculators
  let available = CALCULATORS.filter((c) => !postedSet.has(c.slug));

  // If all posted, reset (start fresh rotation)
  if (available.length < count) {
    available = CALCULATORS;
    state.postedSlugs = [];
  }

  // Shuffle and pick
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, count);

  // Update state
  picked.forEach((c) => state.postedSlugs.push(c.slug));
  state.lastRun = new Date().toISOString();
  saveState(state);

  return picked;
}

// ─── Gemini API: Generate Pin Content (1 batch call for all 6 pins) ──────────

async function generatePinContent(calculators) {
  const calcList = calculators
    .map(
      (c, i) =>
        `${i + 1}. Slug: "${c.slug}" (${c.category}) — A free ${c.category.toLowerCase()} calculator at qfinhub.com/calculators/${c.slug}`
    )
    .join("\n");

  const prompt = `You are a Pinterest marketing expert for financial content. Generate content for ${calculators.length} financial calculator pins for QFINHUB (qfinhub.com).

For EACH calculator, provide ALL THREE fields separated by "|||":
- OPTIMAL PIN TITLE (40-60 characters, must start with a benefit or problem-solution, include the keyword naturally, and NOT mention QFINHUB in the title itself)
- OPTIMAL PIN DESCRIPTION (150-250 characters, structure: hook → problem their have → QFINHUB as solution with calculator name → CTA to try it free → 2-3 hashtags at the end)
- TAGS/TOPICS (3-5 comma-separated Pinterest tags/topics that match Pinterest search intent for this calculator)

Calculators:
${calcList}

Important rules:
- Titles must be benefit-driven search queries, not just the calculator name
- Example good title: "Pay Off Your Mortgage 5 Years Early — Free Calculator"
- Example bad title: "Mortgage Calculator" (too generic)
- Descriptions must include the word "free" and the exact link path
- Hashtags maximum 3, placed at the very end of description
- Tags should be broad Pinterest categories like: Personal Finance, Budgeting, Investing, Home Buying, Tax Tips, Retirement Planning, Debt Management, Money Saving Tips, Financial Freedom

FORMAT YOUR RESPONSE AS:
Pin 1: [TITLE] ||| [DESCRIPTION] ||| [TAGS]
Pin 2: [TITLE] ||| [DESCRIPTION] ||| [TAGS]
...and so on for all ${calculators.length} pins.`;

  const response = await fetch(
    `${BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 2048, topP: 0.95 },
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  // Parse the response
  const lines = text.split("\n").filter((l) => l.trim().startsWith("Pin"));
  const results = [];

  for (let i = 0; i < calculators.length; i++) {
    const line = lines[i];
    if (!line) {
      // Fallback
      results.push({
        title: `Free ${calculators[i].slug.split("-").join(" ")} Calculator`,
        description: `Calculate ${calculators[i].category.toLowerCase()} instantly with our free online tool at QFINHUB. No signup needed. #personalfinance #${calculators[i].category.replace(/\s+/g, "")}`,
        tags: `Personal Finance, ${calculators[i].category}, Financial Tools`,
      });
      continue;
    }

    const parts = line.split("|||").map((p) => p.trim());
    const titlePart = parts[0]?.replace(/^Pin \d+:\s*/, "") || "";
    const descPart = parts[1] || "";
    const tagsPart = parts[2] || "";

    results.push({
      title: titlePart.substring(0, 100),
      description: descPart.substring(0, 500),
      tags: tagsPart,
    });
  }

  return results;
}

// ─── High-Quality SVG Pin Generator ──────────────────────────────────────────

/**
 * Creates a professional, layered 1000×1500 pin image SVG.
 * Design elements:
 * - Category-colored gradient header
 * - Large benefit-focused headline
 * - Key stat/number in bold
 * - Feature highlight cards
 * - QR-like QFINHUB branding footer
 * - Clean whitespace and typography
 */
function generatePinSVG(calc, content) {
  const W = 1000;
  const H = 1500;
  const c = calc;

  // Category gradient colors
  const gradients = {
    Mortgages: ["#0f766e", "#115e59"],
    Investing: ["#7c3aed", "#5b21b6"],
    Retirement: ["#d97706", "#92400e"],
    Loans: ["#2563eb", "#1e3a8a"],
    "Debt Payoff": ["#dc2626", "#991b1b"],
    Taxes: ["#ea580c", "#9a3412"],
    Savings: ["#059669", "#065f46"],
    Everyday: ["#6366f1", "#4338ca"],
    Business: ["#0891b2", "#0e7490"],
  };
  const [gradFrom, gradTo] = gradients[c.category] || ["#6366f1", "#4338ca"];

  // Title (first line break after ~30 chars for visual balance)
  const words = content.title.split(" ");
  let line1 = "",
    line2 = "";
  let half = Math.ceil(words.length / 2);
  // Make the split at a natural point
  const titleStr = content.title;
  const breakAt =
    titleStr.length > 35
      ? titleStr.lastIndexOf(" ", Math.floor(titleStr.length * 0.55))
      : titleStr.length;
  line1 = escapeXml(titleStr.substring(0, breakAt > 0 ? breakAt : titleStr.length));
  line2 = escapeXml(
    titleStr.substring(breakAt > 0 ? breakAt + 1 : titleStr.length)
  );

  // Extract key stat from the calculator type
  const stats = {
    "mortgage-calculator": "$1,969",
    "mortgage-affordability": "$350K",
    "compound-interest": "10x+",
    "retirement-planning": "40 yrs",
    "debt-snowball": "18 mo",
    "budget-planner": "50/30/20",
    "savings-goal": "$500/mo",
    "401k-calculator": "$2.1M",
    "tax-calculator": "-$850",
    "loan-calculator": "5.8%",
    "credit-card-payoff": "25% APR",
    "investment-return": "+12.4%",
  };

  const stat = escapeXml(stats[c.slug] || "100% Free");
  const statLabel = escapeXml(`Free ${c.category} Tool`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="headerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${gradFrom}"/>
      <stop offset="100%" stop-color="${gradTo}"/>
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
    <clipPath id="roundedTop">
      <rect x="0" y="0" width="${W}" height="520" rx="0"/>
    </clipPath>
  </defs>

  <!-- White Background -->
  <rect width="${W}" height="${H}" fill="#ffffff" rx="24"/>

  <!-- Header Section — Gradient Banner -->
  <rect x="0" y="0" width="${W}" height="520" fill="url(#headerGrad)"/>

  <!-- Decorative circles -->
  <circle cx="850" cy="80" r="180" fill="rgba(255,255,255,0.04)"/>
  <circle cx="120" cy="400" r="120" fill="rgba(255,255,255,0.04)"/>
  <circle cx="900" cy="350" r="80" fill="rgba(255,255,255,0.06)"/>

  <!-- Brand Badge -->
  <rect x="36" y="32" width="130" height="34" rx="17" fill="rgba(255,255,255,0.15)"/>
  <text x="101" y="53" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="700" fill="white">QFINHUB</text>

  <!-- Emoji / Icon area -->
  <text x="500" y="120" text-anchor="middle" font-size="36">${escapeXml(c.emoji)}</text>

  <!-- Title (Two lines for readability) -->
  <text x="500" y="190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="white">${line1}</text>
  <text x="500" y="238" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" fill="white">${line2}</text>

  <!-- Subtitle line -->
  <text x="500" y="290" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="rgba(255,255,255,0.85)">Free Online ${escapeXml(c.category)} Calculator</text>

  <!-- CTA Badge in header -->
  <rect x="350" y="320" width="300" height="44" rx="22" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
  <text x="500" y="347" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="15" font-weight="600" fill="white">⚡ Try It Free — No Signup Needed</text>

  <!-- White Content Area Card -->
  <rect x="40" y="460" width="920" height="440" rx="20" fill="url(#cardGrad)" filter="url(#shadow)"/>

  <!-- Key Stat Display (BIG number) -->
  <text x="500" y="570" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="82" font-weight="900" fill="${gradFrom}">${stat}</text>
  <text x="500" y="610" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="#6b7280">${statLabel}</text>

  <!-- Divider line under stat -->
  <line x1="180" y1="640" x2="820" y2="640" stroke="#e5e7eb" stroke-width="1"/>

  <!-- Feature Highlight Cards (3 rows) -->
  <g transform="translate(60, 670)">
    <!-- Feature 1 -->
    <rect x="0" y="0" width="260" height="46" rx="10" fill="#f0fdf4" filter="url(#shadowSmall)"/>
    <text x="15" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#059669">✓ Instant Results</text>

    <!-- Feature 2 -->
    <rect x="290" y="0" width="260" height="46" rx="10" fill="#f0f9ff" filter="url(#shadowSmall)"/>
    <text x="305" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#2563eb">✓ Interactive Charts</text>

    <!-- Feature 3 -->
    <rect x="580" y="0" width="260" height="46" rx="10" fill="#faf5ff" filter="url(#shadowSmall)"/>
    <text x="595" y="29" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="#7c3aed">✓ Export as PDF</text>
  </g>

  <!-- Description text area -->
  <rect x="60" y="960" width="880" height="180" rx="16" fill="#f9fafb"/>
  <text x="500" y="1000" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#374151">
    <tspan x="500" dy="0">${escapeXml(truncateText(content.description.replace(/#\w+\s*/g, "").trim(), 120))}</tspan>
  </text>

  <!-- URL Badge -->
  <rect x="250" y="1160" width="500" height="48" rx="24" fill="${gradFrom}"/>
  <text x="500" y="1190" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="700" fill="white">qfinhub.com/calculators/${escapeXml(c.slug)}</text>

  <!-- Bottom Brand Bar -->
  <rect x="0" y="1250" width="${W}" height="60" fill="#f8fafc"/>
  <text x="500" y="1278" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="#94a3b8">Join thousands using QFINHUB — 124 Free Financial Calculators</text>

  <!-- Hashtags at bottom -->
  <text x="500" y="1330" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" fill="#94a3b8">
    ${getHashtags(c.category)}
  </text>

  <!-- Decorative bottom dots pattern -->
  <g opacity="0.2">
    ${Array.from({ length: 12 }, (_, i) => i)
      .map((i) => `<circle cx="${40 + i * 80}" cy="1460" r="3" fill="${gradFrom}"/>`)
      .join("")}
  </g>
</svg>`;
}

function getHashtags(category) {
  const map = {
    Mortgages: "#MortgageCalculator #HomeBuying #RealEstateTips",
    Investing: "#InvestmentCalculator #WealthBuilding #CompoundInterest",
    Retirement: "#RetirementPlanning #401k #SaveForRetirement",
    Loans: "#LoanCalculator #DebtFreeJourney #PersonalFinance",
    "Debt Payoff": "#DebtFree #GetOutOfDebt #MoneyManagement",
    Taxes: "#TaxCalculator #TaxSeason #TaxTips",
    Savings: "#SavingsGoals #BudgetPlanner #MoneySavingTips",
    Everyday: "#FreeCalculators #LifeHacks #MathTools",
    Business: "#BusinessFinance #ROI #FinancialAnalysis",
  };
  return map[category] || "#FreeCalculators #PersonalFinance #MoneyTips";
}

function truncateText(text, maxChars) {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - 3) + "...";
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// ─── SVG → PNG Conversion ────────────────────────────────────────────────────

async function svgToPng(svgContent, outputPath) {
  try {
    const sharp = require("sharp");
    await sharp(Buffer.from(svgContent))
      .resize(1000, 1500)
      .png({ quality: 95, compressionLevel: 8 })
      .toFile(outputPath);
    return true;
  } catch (e) {
    console.error("  SVG→PNG failed:", e.message);
    return false;
  }
}

// ─── Pinterest Import CSV Generator ──────────────────────────────────────────

function generateCSV(pins) {
  // Pinterest Bulk CSV format
  const header = "Pin title,Description,Link (URL),Dominant Color,Board name,Board section,Tags,Image URL,Video URL,Video title,Alt text";

  const rows = pins.map((pin) => {
    const title = csvEscape(pin.title);
    const desc = csvEscape(pin.description);
    const link = `https://www.qfinhub.com/calculators/${pin.slug}`;
    const color = pin.color;
    const board = csvEscape(boardForCategory(pin.category));
    const section = csvEscape(sectionForCategory(pin.category));
    const tags = csvEscape(pin.tags || getDefaultTags(pin.category));
    const imageUrl = `https://www.qfinhub.com/pinterest-images/${pin.filename}`;
    const altText = csvEscape(`${pin.title} — Free online calculator at QFINHUB`);
    return `${title},${desc},${link},${color},${board},${section},${tags},${imageUrl},,${title},${altText}`;
  });

  return [header, ...rows].join("\n");
}

function csvEscape(val) {
  const s = String(val).replace(/"/g, '""');
  if (s.includes(",") || s.includes("\n") || s.includes('"')) {
    return `"${s}"`;
  }
  return s;
}

function boardForCategory(cat) {
  const map = {
    Mortgages: "Mortgage & Home Buying Tools",
    Investing: "Investment & Wealth Growth",
    Retirement: "Retirement Planning Calculators",
    Loans: "Debt Payoff Strategies",
    "Debt Payoff": "Debt Payoff Strategies",
    Taxes: "Tax Planning & Estimators",
    Savings: "Personal Budgeting Hacks",
    Everyday: "Financial Literacy for Beginners",
    Business: "Small Business Finance Tools",
  };
  return map[cat] || "Personal Finance Tools";
}

function sectionForCategory(cat) {
  const map = {
    Mortgages: "Mortgage Calculators",
    Investing: "Investment Calculators",
    Retirement: "Retirement Tools",
    Loans: "Loan Calculators",
    "Debt Payoff": "Debt Reduction Tools",
    Taxes: "Tax Calculators",
    Savings: "Budget & Savings",
    Everyday: "Everyday Calculators",
    Business: "Business Calculators",
  };
  return map[cat] || "Financial Calculators";
}

function getDefaultTags(cat) {
  const map = {
    Mortgages: "Home Buying, Mortgage Tips, Real Estate",
    Investing: "Investing for Beginners, Wealth Building, Compound Interest",
    Retirement: "Retirement Planning, 401k Advice, Save for Retirement",
    Loans: "Loan Calculator, Debt Management, Personal Finance",
    "Debt Payoff": "Get Out of Debt, Debt Free Journey, Money Management",
    Taxes: "Tax Tips, Tax Season, Tax Calculator",
    Savings: "Money Saving Tips, Budgeting, Savings Goals",
    Everyday: "Free Online Tools, Life Hacks, Math Help",
    Business: "Business Finance, ROI Analysis, Financial Planning",
  };
  return map[cat] || "Personal Finance, Financial Calculators, Free Tools";
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const pinCount = parseInt(args.find((a) => a.startsWith("--count="))?.split("=")[1] || "6", 10);
  const csvOnly = args.includes("--csv-only");
  const isScheduled = args.includes("--scheduled");

  console.log(`\n📌 QFINHUB Pinterest Pin Generator v2`);
  console.log(`   Generating ${pinCount} pins...`);
  if (csvOnly) console.log("   Mode: CSV only (no images)");
  if (isScheduled) console.log("   Mode: Daily scheduled run");

  // Step 1: Pick calculators (rotation system)
  const calculators = pickCalculators(pinCount);
  console.log(`\n📊 Selected calculators:`);
  calculators.forEach((c) => console.log(`   - ${c.slug} (${c.category})`));

  // Step 2: Generate content via Gemini (1 batch call)
  console.log(`\n🤖 Calling Gemini ${GEMINI_MODEL}...`);
  let contentResults;
  try {
    contentResults = await generatePinContent(calculators);
    console.log(`   ✅ Generated content for ${contentResults.length} pins`);
  } catch (e) {
    console.error(`   ❌ Gemini API failed: ${e.message}`);
    console.log("   Using fallback content...");
    contentResults = calculators.map((c) => ({
      title: `Free ${c.slug.split("-").join(" ")} Calculator`,
      description: `Calculate ${c.category.toLowerCase()} instantly with our free online tool. No signup, no email, just fast results. Try it at qfinhub.com. #FreeCalculators #${c.category.replace(/\s+/g, "")} #PersonalFinance`,
      tags: `Personal Finance, ${c.category}, Financial Tools`,
    }));
  }

  // Step 3: Generate images & collect pin data
  const pins = [];
  for (let i = 0; i < calculators.length; i++) {
    const calc = calculators[i];
    const content = contentResults[i];
    const filename = `pin-${calc.slug}-${randomBytes(4).toString("hex")}.png`;
    const outputPath = resolve(PUBLIC_PIN_DIR, filename);
    const outputPathLocal = resolve(IMAGES_DIR, filename);

    console.log(`\n   🎨 [${i + 1}/${pinCount}] ${calc.slug}`);

    const svg = generatePinSVG(calc, content);

    // Save SVG for reference
    const svgPath = resolve(IMAGES_DIR, `${calc.slug}-${randomBytes(4).toString("hex")}.svg`);
    writeFileSync(svgPath, svg);
    console.log(`      SVG saved: ${svgPath}`);

    if (!csvOnly) {
      // Convert to PNG
      const success = await svgToPng(svg, outputPath);
      if (success) {
        // Also copy to local dir
        try { writeFileSync(outputPathLocal, readFileSync(outputPath)); } catch (e) {}
        const sizeKB = (readFileSync(outputPath).length / 1024).toFixed(1);
        console.log(`      ✅ PNG saved: ${filename} (${sizeKB} KB)`);
      } else {
        // Use SVG as fallback
        writeFileSync(outputPath, svg);
        console.log(`      ⚠️ SVG fallback saved`);
      }
    } else {
      // Save SVG to public dir as fallback
      writeFileSync(outputPath, svg);
      console.log(`      SVG saved to public/pinterest-images/`);
    }

    pins.push({
      slug: calc.slug,
      category: calc.category,
      color: calc.color,
      title: content.title,
      description: content.description,
      tags: content.tags,
      filename: filename,
      board: boardForCategory(calc.category),
      section: sectionForCategory(calc.category),
    });
  }

  // Step 4: Generate CSV
  const csvContent = generateCSV(pins);
  const csvTimestamp = new Date().toISOString().split(".")[0].replace(/[:]/g, "-");
  const csvFilename = `pinterest-import-${csvTimestamp}.csv`;
  const csvPath = resolve(CSV_DIR, csvFilename);

  writeFileSync(csvPath, csvContent);
  console.log(`\n📄 CSV saved: ${csvPath}`);

  // Also save a latest copy
  const latestCsvPath = resolve(DATA_DIR, "pinterest-import-latest.csv");
  writeFileSync(latestCsvPath, csvContent);
  console.log(`   Latest CSV: ${latestCsvPath}`);

  // Print summary
  console.log(`\n═══════════════════════════════════════════`);
  console.log(`   ✅ Generation Complete!`);
  console.log(`   Pins: ${pins.length}`);
  console.log(`   Gemini calls: 1`);
  console.log(`   CSV: ${csvFilename}`);
  console.log(`   Images: ${PUBLIC_PIN_DIR}/`);
  console.log(`═══════════════════════════════════════════\n`);

  // Print the CSV content to stdout for piping
  if (isScheduled) {
    console.log("\n---CSV_CONTENT_START---");
    console.log(csvContent);
    console.log("---CSV_CONTENT_END---");
  }

  // Print pin details for user review
  console.log("\n🔍 Pin Details:");
  pins.forEach((p, i) => {
    console.log(`\n─── Pin ${i + 1}: ${p.slug} ───`);
    console.log(`  Title: ${p.title}`);
    console.log(`  Board: ${p.board} > ${p.section}`);
    console.log(`  Tags: ${p.tags}`);
    console.log(`  Image: ${p.filename}`);
  });
  console.log("");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
