#!/usr/bin/env node
/**
 * Pinterest RSS Feed + CSV Generator
 * ====================================
 *
 * Two solutions for Pinterest while Standard access is pending:
 *
 * SOLUTION 1: Create RSS/XML feed at qfinhub.com/pinterest-feed.xml
 *   - Pinterest can auto-pull from any RSS feed connected to your domain
 *   - Feeds new pin-ready content automatically every time you update it
 *   - Each RSS item becomes a Pin with title, description, image, link
 *
 * SOLUTION 2: Generate a CSV file for manual upload
 *   - Pinterest accepts .csv uploads for bulk pin creation
 *   - I'll generate a CSV with all 85 pins + images
 *   - You upload it once → all pins go live instantly
 *
 * USAGE:
 *   node scripts/pinterest-rss-csv.cjs         Generate both feed + CSV
 *   node scripts/pinterest-rss-csv.cjs --csv   Generate CSV only
 *   node scripts/pinterest-rss-csv.cjs --feed  Generate RSS feed only
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } = require("fs");
const { resolve } = require("path");

const ROOT = resolve(__dirname, "..");
const PUBLIC_DIR = resolve(ROOT, "public");
const PIN_DATA_DIR = resolve(ROOT, ".pinterest-data");
const CSV_OUTPUT = resolve(PUBLIC_DIR, "pinterest-upload.csv");
const RSS_OUTPUT = resolve(PUBLIC_DIR, "pinterest-feed.xml");

if (!existsSync(ROOT)) mkdirSync(ROOT, { recursive: true });

const BASE_URL = "https://www.qfinhub.com";
const SITE_NAME = "QFINHUB — Free Financial Calculators";

const args = process.argv.slice(2);

// ─── Available Pin Categories + Calculators ───
const PIN_CATEGORIES = [
  { id: "mortgage", name: "Mortgage", url: "/calculators/mortgage-affordability", color: "#1e3a5f" },
  { id: "investing", name: "Investing", url: "/calculators/compound-interest", color: "#14532d" },
  { id: "retirement", name: "Retirement", url: "/calculators/retirement", color: "#4c1d95" },
  { id: "debt", name: "Debt Payoff", url: "/calculators/credit-card-payoff", color: "#7f1d1d" },
  { id: "tax", name: "Tax", url: "/calculators/tax", color: "#713f12" },
  { id: "savings", name: "Savings", url: "/calculators/savings-goal", color: "#0f766e" },
  { id: "loan", name: "Loan", url: "/calculators/loan", color: "#1e40af" },
  { id: "general", name: "General Finance", url: "/calculators", color: "#1e293b" },
];

// ─── Existing pin data ───
function loadPinData() {
  // Try post-queue.json (main pin data store)
  const postQueueFile = resolve(PIN_DATA_DIR, "post-queue.json");
  const pinContentFile = resolve(PIN_DATA_DIR, "pin-content.json");

  let pins = [];

  if (existsSync(postQueueFile)) {
    try {
      const data = JSON.parse(readFileSync(postQueueFile, "utf-8"));
      if (data.pins && Array.isArray(data.pins)) {
        pins = data.pins;
        console.log(`  Loaded ${pins.length} pins from post-queue.json`);
      }
    } catch(e) {}
  }

  if (pins.length === 0 && existsSync(pinContentFile)) {
    try {
      const data = JSON.parse(readFileSync(pinContentFile, "utf-8"));
      if (data.pins && Array.isArray(data.pins)) {
        pins = data.pins;
        console.log(`  Loaded ${pins.length} pins from pin-content.json`);
      }
    } catch(e) {}
  }

  return pins;
}

// ─── Generate a CSV row ───
function csvEscape(val) {
  if (val == null) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function generateCSV() {
  console.log("\n📄 Generating Pinterest CSV...");

  // Header
  let csv = "title,description,link,image_url,board_name,alt_text\n";

  const pins = loadPinData();

  if (pins.length > 0) {
    for (const pin of pins) {
      const pinTitle = pin.title || "Free Financial Calculator";
      const pinDesc = (pin.description || "Free financial calculator from QFINHUB — 124+ calculators for mortgages, loans, retirement, investing, and more.")
        .substring(0, 500); // Pinterest has character limits
      const pinLink = pin.link || `${BASE_URL}${pin.url || "/calculators"}`;
      const imageFile = pin.imageFile || (pin.slug ? `${pin.slug}.png` : "pin-placeholder.png");
      const imageUrl = `${BASE_URL}/.pinterest-data/images/${imageFile}`;
      const board = pin.boardName || pin.board || "Finance";

      csv += [
        csvEscape(pinTitle),
        csvEscape(pinDesc),
        pinLink,
        imageUrl,
        csvEscape(board),
        csvEscape(pinTitle),
      ].join(",") + "\n";
    }
    console.log(`  ✅ CSV: ${pins.length} pins from real data`);
  } else {
    // Fallback to template pins
    console.log("  No pin data found. Generating from templates...");
    for (const cat of PIN_CATEGORIES) {
      for (let i = 0; i < 10; i++) {
        const tpl = PIN_TITLES[i % PIN_TITLES.length];
        csv += [
          csvEscape(`${tpl} ${cat.name}`),
          csvEscape(`Use our free ${cat.name.toLowerCase()} calculator. Instant results, no sign-up.`),
          `${BASE_URL}${cat.url}`,
          `${BASE_URL}/pin-placeholder.png`,
          csvEscape(cat.name + " Tips"),
          csvEscape(`${tpl} ${cat.name}`),
        ].join(",") + "\n";
      }
    }
    console.log(`  ✅ CSV: ${PIN_CATEGORIES.length * 10} template pins`);
  }

  writeFileSync(CSV_OUTPUT, csv);
  console.log(`  📁 Saved: public/pinterest-upload.csv (${(csv.length / 1024).toFixed(0)} KB)`);
  return csv;
}

const PIN_TITLES = ["Free ", "Calculate Your ", "How Much ", "The Ultimate ", "Simple ", "Smart ", "Guide to ", "Compare "];

// ─── Generate RSS Feed ───
function generateRSSFeed() {
  console.log("\n📡 Generating Pinterest RSS Feed...");

  const now = new Date();
  const pins = loadPinData();

  // If no pins, generate from templates
  const feedItems = pins.length > 0 ? pins : [];
  if (feedItems.length === 0) {
    for (const cat of PIN_CATEGORIES) {
      feedItems.push({
        title: `Free ${cat.name} Calculator`,
        description: `Plan your finances with our free ${cat.name.toLowerCase()} calculator. Instant results, no sign-up.`,
        link: `${BASE_URL}${cat.url}`,
        board: cat.name,
      });
    }
  }

  // Build RSS items
  const rssItems = [];
  for (const pin of feedItems) {
    const pubDate = now.toUTCString();
    const imageUrl = `${BASE_URL}/pinterest-placeholder.png`;
    const item = `
    <item>
      <title><![CDATA[${pin.title || "Free Financial Calculator"}]]></title>
      <description><![CDATA[${pin.description || "Free financial calculator from QFINHUB.com — 124+ calculators for mortgages, loans, retirement, investing, and more."}]]></description>
      <link>${pin.link || `${BASE_URL}/calculators`}</link>
      <guid isPermaLink="false">pin-${Date.now()}-${Math.random().toString(36).substring(2, 8)}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${imageUrl}" type="image/png" length="0"/>
      <category>${pin.board || "Finance"}</category>
    </item>`;
    rssItems.push(item);
  }

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${BASE_URL}</link>
    <description>Free financial calculators and personal finance tools — updated daily with new calculators and guides.</description>
    <language>en-us</language>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
    <image>
      <url>${BASE_URL}/pin-placeholder.png</url>
      <title>${SITE_NAME}</title>
      <link>${BASE_URL}</link>
    </image>
    ${rssItems.join("\n")}
  </channel>
</rss>`;

  writeFileSync(RSS_OUTPUT, rss);
  console.log(`  📁 Saved: public/pinterest-feed.xml (${(rss.length / 1024).toFixed(0)} KB, ${feedItems.length} items)`);
  return rss;
}

// ═══════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  Pinterest RSS Feed + CSV Generator");
  console.log("═══════════════════════════════════════════");

  const genCsv = args.includes("--csv") || args.length === 0;
  const genFeed = args.includes("--feed") || args.length === 0;

  if (genCsv) {
    generateCSV();
  }

  if (genFeed) {
    generateRSSFeed();
    console.log(`\n📌 To connect your RSS feed on Pinterest:`);
    console.log(`   1. Go to https://www.pinterest.com/rss/`);
    console.log(`   2. Enter: ${BASE_URL}/pinterest-feed.xml`);
    console.log(`   3. Click "Connect"`);
    console.log(`   Pinterest will auto-create pins from feed items!`);
  }

  if (genCsv) {
    console.log(`\n📌 To upload CSV to Pinterest:`);
    console.log(`   1. Go to https://www.pinterest.com/pin-builder/`);
    console.log(`   2. Click "Create Pin" → "Import" → "CSV"`);
    console.log(`   3. Upload: public/pinterest-upload.csv`);
    console.log(`   All pins will be created instantly!`);
  }

  console.log(`\n✅ Done! Files are in the public/ directory.`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
