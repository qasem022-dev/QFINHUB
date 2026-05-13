#!/usr/bin/env node
// Pinterest Pin Content Generator for QFINHUB
// Usage:
//   node scripts/pinterest-content.cjs --generate    Generate weekly pin content (1 DeepSeek call)
//   node scripts/pinterest-content.cjs               Get next pin for current hour
//
// Cron: 0 5 * * 1 node /path/to/scripts/pinterest-content.cjs --generate

const { readFileSync, writeFileSync, existsSync, mkdirSync, appendFileSync } = require("fs");
const { resolve } = require("path");
const { randomBytes, createHash } = require("crypto");

// Load .env.local
try {
  var envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  envContent.split("\n").forEach(function(line) {
    var match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      var key = match[1].trim();
      var val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
} catch(e) {
  console.error("Could not load .env.local");
}

const DATA_DIR = resolve(__dirname, "..", ".pinterest-data");
const PIN_DIR = resolve(DATA_DIR, "images");
const CONTENT_FILE = resolve(DATA_DIR, "pin-content.json");
const LOG_FILE = resolve(DATA_DIR, "pin-log.json");
const PINS_SCHEDULE = resolve(DATA_DIR, "schedule.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(PIN_DIR)) mkdirSync(PIN_DIR, { recursive: true });

// ─── 124 calculator slugs organized by category ───
const CALCULATORS_BY_CATEGORY = {
  mortgages: {
    label: "Mortgages",
    description: "Mortgage calculators & home buying tools",
    slugs: [
      "mortgage-calculator",
      "mortgage-affordability",
      "refinance-calculator",
      "home-equity",
      "closing-costs",
      "mortgage-payoff",
      "biweekly-mortgage",
      "fha-loan",
      "va-loan",
      "arm-calculator",
      "pmi-calculator",
      "home-renovation",
      "amortization-schedule"
    ]
  },
  investing: {
    label: "Investing",
    description: "Investment calculators & portfolio tools",
    slugs: [
      "compound-interest",
      "simple-interest",
      "investment-return",
      "roi-calculator",
      "stock-return",
      "dividend-calculator",
      "dollar-cost-average",
      "irr-calculator",
      "npv-calculator",
      "present-value",
      "future-value",
      "portfolio-allocator",
      "sharpe-ratio",
      "time-value-of-money",
      "rule-of-72"
    ]
  },
  retirement: {
    label: "Retirement",
    description: "Retirement planning calculators",
    slugs: [
      "retirement-planning",
      "401k-calculator",
      "roth-ira",
      "traditional-ira",
      "social-security",
      "early-retirement",
      "retirement-income",
      "pension-calculator",
      "retirement-withdrawal",
      "required-minimum-distribution",
      "retirement-expenses"
    ]
  },
  loans: {
    label: "Loans",
    description: "Loan calculators & comparison tools",
    slugs: [
      "loan-calculator",
      "auto-loan",
      "student-loan",
      "personal-loan",
      "loan-comparison",
      "loan-refinancing",
      "lease-vs-buy",
      "debt-consolidation"
    ]
  },
  debt: {
    label: "Debt Payoff",
    description: "Debt reduction calculators",
    slugs: [
      "debt-snowball",
      "debt-avalanche",
      "debt-payoff",
      "credit-card-payoff"
    ]
  },
  "taxes": {
    label: "Taxes",
    description: "Tax calculators & planning",
    slugs: [
      "tax-calculator",
      "capital-gains-tax",
      "sales-tax",
      "property-tax",
      "estate-tax",
      "inheritance-tax",
      "effective-tax-rate",
      "tax-bracket",
      "marginal-tax-rate",
      "w4-calculator",
      "1099-calculator",
      "self-employment-tax"
    ]
  },
  savings: {
    label: "Savings & Budget",
    description: "Personal finance planning tools",
    slugs: [
      "savings-goal",
      "budget-planner",
      "net-worth",
      "inflation-calculator",
      "break-even",
      "annuity-calculator",
      "perpetuity-calculator",
      "payback-period"
    ]
  },
  everyday: {
    label: "Everyday Tools",
    description: "Daily life calculators",
    slugs: [
      "basic-calculator",
      "currency-converter",
      "tip-calculator",
      "discount-calculator",
      "salary-calculator",
      "percentage-calculator",
      "bmi-calculator",
      "calorie-calculator",
      "date-difference",
      "age-calculator",
      "fraction-calculator",
      "unit-converter",
      "gas-mileage",
      "fuel-cost"
    ]
  }
};

// ─── SVG Infographic Generator ───

function generateStatCardSVG(title, stat, description, statColor) {
  var w = 800, h = 418;
  var color = statColor || "#1e40af";
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="' + color + '"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>' +
    '<rect width="' + w + '" height="' + h + '" rx="16" fill="url(#g)"/>' +
    '<text x="30" y="50" font-size="13" font-weight="700" fill="rgba(255,255,255,0.7)">QFINHUB</text>' +
    '<text x="400" y="120" text-anchor="middle" font-size="22" font-weight="700" fill="white">' + escapeXml(title) + '</text>' +
    '<text x="400" y="230" text-anchor="middle" font-size="64" font-weight="800" fill="white">' + stat + '</text>' +
    '<text x="400" y="270" text-anchor="middle" font-size="15" fill="rgba(255,255,255,0.85)">' + escapeXml(description) + '</text>' +
    '<text x="400" y="360" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.6)">Try it free at qfinhub.com</text></svg>';
}

function generateComparisonTableSVG(title, columns, rows) {
  var w = 800, h = 418, colW = Math.floor((w - 40) / columns.length), rowH = 32, startY = 90;
  
  var headers = columns.map(function(col, i) {
    var x = 20 + i * colW;
    return '<text x="' + (x + colW / 2) + '" y="' + (startY - 10) + '" text-anchor="middle" font-size="12" font-weight="600" fill="#1e40af">' + escapeXml(col) + '</text>';
  }).join("");
  
  var rowsEl = rows.map(function(row, i) {
    var y = startY + i * rowH;
    var bg = row.highlight ? "#f3f4f6" : (i % 2 === 1 ? "#f3f4f6" : "transparent");
    var cells = row.values.map(function(val, j) {
      var x = 20 + j * colW;
      var color = j === 0 ? "#1f2937" : "#1e40af";
      var weight = j === 0 ? "500" : "700";
      return '<text x="' + (x + colW / 2) + '" y="' + (y + 20) + '" text-anchor="middle" font-size="13" font-weight="' + weight + '" fill="' + color + '">' + val + '</text>';
    }).join("");
    return '<rect x="20" y="' + y + '" width="' + (w - 40) + '" height="' + rowH + '" rx="4" fill="' + bg + '"/>' + cells;
  }).join("");
  
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<rect width="' + w + '" height="' + h + '" rx="16" fill="#ffffff"/>' +
    '<rect x="0" y="0" width="' + w + '" height="48" rx="16" fill="#1e40af"/>' +
    '<rect x="0" y="16" width="' + w + '" height="32" fill="#1e40af"/>' +
    '<text x="20" y="32" font-size="13" font-weight="700" fill="white">QFINHUB</text>' +
    '<text x="' + (w - 20) + '" y="32" text-anchor="end" font-size="12" fill="rgba(255,255,255,0.8)">Free Financial Calculators</text>' +
    '<text x="400" y="72" text-anchor="middle" font-size="16" font-weight="700" fill="#1f2937">' + escapeXml(title) + '</text>' +
    headers + '<line x1="20" y1="' + startY + '" x2="' + (w - 20) + '" y2="' + startY + '" stroke="#e5e7eb" stroke-width="1"/>' +
    rowsEl + '</svg>';
}

function escapeXml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ─── Pin content templates by category ───
// Each returns: { title, description, link, svg, slug }

function getPinContentForSlug(slug, category) {
  var base = "https://www.qfinhub.com";
  var link = base + "/calculators/" + slug;
  var name = slug.split("-").map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(" ");

  // Specific pin templates for top calculators
  var templates = {
    "mortgage-calculator": function() {
      return {
        title: "Calculate Your Monthly Mortgage Payment Instantly",
        description: "Find out exactly what your monthly mortgage payment will be. Our free calculator factors in principal, interest, taxes, and insurance. No signup needed.",
        link: link
      };
    },
    "compound-interest": function() {
      return {
        title: "The Power of Compound Interest Explained",
        description: "See how your money grows exponentially over time. Use our free compound interest calculator to project your investment growth. Start investing smarter today.",
        link: link
      };
    },
    "investment-return": function() {
      return {
        title: "How Much Will Your Investment Be Worth?",
        description: "Calculate the future value of any investment with our free ROI calculator. Plan your financial future with confidence.",
        link: link
      };
    },
    "retirement-planning": function() {
      return {
        title: "Are You On Track for Retirement?",
        description: "Our free retirement calculator shows you exactly how much you need to save. Get a personalized retirement plan in seconds.",
        link: link
      };
    },
    "budget-planner": function() {
      return {
        title: "Take Control of Your Finances with a Budget",
        description: "Create a personalized budget in minutes. Track income, expenses, and savings goals. Free, no email required.",
        link: link
      };
    },
    "mortgage-affordability": function() {
      return {
        title: "How Much House Can You Really Afford?",
        description: "Find your home buying budget with our free affordability calculator. Get a clear number based on your income, debt, and down payment.",
        link: link
      };
    },
    "tax-calculator": function() {
      return {
        title: "Estimate Your 2024 Tax Refund or Bill",
        description: "Our free tax calculator estimates your federal income tax. Plan ahead for tax season and avoid surprises.",
        link: link
      };
    },
    "savings-goal": function() {
      return {
        title: "Reach Your Savings Goals Faster",
        description: "Calculate exactly how much to save each month to reach any financial goal. Free and easy to use.",
        link: link
      };
    },
    "debt-payoff": function() {
      return {
        title: "Get Out of Debt Faster with Our Calculator",
        description: "See exactly when you'll be debt-free. Compare snowball vs avalanche methods. Free debt payoff calculator.",
        link: link
      };
    },
    "401k-calculator": function() {
      return {
        title: "Maximize Your 401(k) Growth",
        description: "Calculate your 401(k) balance at retirement. Factor in employer match, contribution increases, and market returns.",
        link: link
      };
    },
    "student-loan": function() {
      return {
        title: "Plan Your Student Loan Repayment",
        description: "Calculate monthly payments and total interest for federal and private student loans. Free student loan calculator.",
        link: link
      };
    },
    "rent-vs-buy": function() {
      return {
        title: "Rent vs Buy: Which Is Smarter for You?",
        description: "Compare the true cost of renting vs buying a home. Our free calculator gives you a data-driven answer in seconds.",
        link: link
      };
    },
    "currency-converter": function() {
      return {
        title: "Convert Any Currency Instantly",
        description: "Free real-time currency converter. USD to EUR, GBP, JPY, and 180+ currencies. No sign-up required.",
        link: link
      };
    },
    "inflation-calculator": function() {
      return {
        title: "How Inflation Eats Your Savings",
        description: "Calculate the real value of money over time. See how inflation impacts your purchasing power with our free calculator.",
        link: link
      };
    }
  };

  // Default template for any calculator
  if (templates[slug]) {
    return templates[slug]();
  }

  return {
    title: "Free " + name + " Calculator — Try It Now",
    description: "Calculate " + name.toLowerCase() + " instantly with our free online tool. No signup, no email, just results. Used by thousands of people every month.",
    link: link
  };
}

// ─── SVG to PNG conversion ───
async function svgToPng(svgContent) {
  try {
    var sharp = require("sharp");
    var filename = "pin-" + randomBytes(4).toString("hex") + ".png";
    var filepath = resolve(PIN_DIR, filename);
    
    await sharp(Buffer.from(svgContent))
      .resize(800, 418)
      .png()
      .toFile(filepath);
    
    return filepath;
  } catch(e) {
    console.error("SVG→PNG failed:", e.message);
    return null;
  }
}

// ─── Generate all pins for a category ───
function generatePinsForCategory(catKey, catInfo) {
  var pins = [];
  var colors = ["#1e40af", "#059669", "#dc2626", "#d97706", "#7c3aed", "#0891b2", "#be185d"];
  
  catInfo.slugs.forEach(function(slug, idx) {
    var content = getPinContentForSlug(slug, catKey);
    var colorIdx = idx % colors.length;
    
    // Generate a description with hashtags for Pinterest SEO
    var hashtags = "#" + catInfo.label.replace(/\s+/g, "") + " #FinancialFreedom #FreeTools";
    if (catKey === "mortgages") hashtags += " #HomeBuying #RealEstate";
    else if (catKey === "investing") hashtags += " #Investing #WealthBuilding";
    else if (catKey === "retirement") hashtags += " #RetirementPlanning #SaveForRetirement";
    else if (catKey === "loans") hashtags += " #Loans #Borrowing";
    else if (catKey === "debt") hashtags += " #DebtFree #GetOutOfDebt";
    else if (catKey === "taxes") hashtags += " #TaxSeason #TaxTips";
    else if (catKey === "savings") hashtags += " #Savings #MoneyManagement";
    else if (catKey === "everyday") hashtags += " #LifeHacks #Productivity";
    
    pins.push({
      slug: slug,
      category: catKey,
      boardName: catInfo.label,
      boardDescription: catInfo.description,
      title: content.title,
      description: content.description + "\n\n" + hashtags,
      link: content.link,
      svgColor: colors[colorIdx],
      bestHour: Math.floor(Math.random() * 9) + 8, // 8 AM - 4 PM (peak Pinterest time)
    });
  });
  
  return pins;
}

// ─── Main ───
async function main() {
  var args = process.argv.slice(2);
  var isGenerate = args.includes("--generate");

  if (isGenerate) {
    console.log("Generating Pinterest pin content...");
    
    var allPins = [];
    var catKeys = Object.keys(CALCULATORS_BY_CATEGORY);
    catKeys.forEach(function(catKey) {
      var pins = generatePinsForCategory(catKey, CALCULATORS_BY_CATEGORY[catKey]);
      allPins = allPins.concat(pins);
      console.log("  " + pins.length + " pins for " + catKey);
    });

    console.log("Total pins generated: " + allPins.length);

    writeFileSync(CONTENT_FILE, JSON.stringify({
      generated: new Date().toISOString(),
      pins: allPins,
      postedIndex: 0
    }, null, 2));

    console.log("Saved to " + CONTENT_FILE);
    return;
  }

  // ── Get next unposted pin ──
  if (!existsSync(CONTENT_FILE)) {
    console.error("No pin content. Run with --generate first.");
    process.exit(1);
  }

  var data = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));
  var pins = data.pins || [];
  var postedIndex = data.postedIndex || 0;

  // Check pin log for already-posted slugs
  var postedLog = { pins: [] };
  if (existsSync(LOG_FILE)) {
    try { postedLog = JSON.parse(readFileSync(LOG_FILE, "utf-8")); } catch(e) {}
  }
  var postedSlugs = new Set();
  (postedLog.pins || []).forEach(function(p) { postedSlugs.add(p.slug); });

  // Find next unposted pin, cycling through categories
  var bestPin = null;
  var hour = new Date().getHours();

  for (var i = 0; i < pins.length; i++) {
    var idx = (postedIndex + i) % pins.length;
    var pin = pins[idx];
    
    // Skip if already posted
    if (postedSlugs.has(pin.slug)) continue;
    
    // Prefer pins close to best hour
    if (!bestPin) bestPin = pin;
    if (Math.abs(pin.bestHour - hour) <= 2) {
      bestPin = pin;
      break;
    }
  }

  if (!bestPin) {
    console.error("All pins have been posted. Run --generate to refresh.");
    process.exit(1);
  }

  // Update posted index
  var newIndex = pins.indexOf(bestPin) + 1;
  data.postedIndex = newIndex >= pins.length ? 0 : newIndex;

  // Generate the infographic SVG
  console.log("Generating infographic for: " + bestPin.slug);
  var svg = generateStatCardSVG(
    bestPin.title.length > 50 ? bestPin.title.substring(0, 47) + "..." : bestPin.title,
    bestPin.slug === "mortgage-calculator" ? "$1,969/mo" :
      bestPin.slug === "compound-interest" ? "$76,122" :
      bestPin.slug === "retirement-planning" ? "$1.7M" :
      bestPin.slug === "debt-payoff" ? "36 mo" :
      bestPin.slug === "mortgage-affordability" ? "$350K" :
      bestPin.slug === "savings-goal" ? "$500/mo" :
      bestPin.slug === "inflation-calculator" ? "-50%" :
      bestPin.slug === "budget-planner" ? "50/30/20" :
      bestPin.slug === "401k-calculator" ? "$1.2M" :
      bestPin.slug === "rent-vs-buy" ? "$235K" : "100% Free",
    "Try our free " + bestPin.slug.split("-").join(" ") + " calculator",
    bestPin.svgColor
  );

  var pngPath = await svgToPng(svg);
  
  // Update posted log
  postedLog.pins.push({
    slug: bestPin.slug,
    category: bestPin.category,
    boardName: bestPin.boardName,
    title: bestPin.title,
    description: bestPin.description || "Calculate your finances free at QFINHUB",
    link: bestPin.link || "https://www.qfinhub.com/calculators/" + bestPin.slug,
    time: new Date().toISOString(),
    imagePath: pngPath
  });
  writeFileSync(LOG_FILE, JSON.stringify(postedLog, null, 2));
  writeFileSync(CONTENT_FILE, JSON.stringify(data, null, 2));

  // Output pin data as JSON for the poster script
  var output = JSON.stringify({
    pin: bestPin,
    imagePath: pngPath
  });
  console.log("PIN_DATA:" + output);
}

main().catch(function(err) {
  console.error(err);
  process.exit(1);
});
