#!/usr/bin/env node
/**
 * Pinterest Batch Pin Generator — generates ALL pin images + metadata
 * ready for instant posting when Standard access is approved.
 * 
 * Usage:
 *   node scripts/pinterest-batch.cjs          Generate all pin images (85 pins)
 *   node scripts/pinterest-batch.cjs --post    Post ALL queued pins (requires Standard access)
 *   node scripts/pinterest-batch.cjs --status  Check queue status
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const { randomBytes } = require("crypto");

// Load env
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  env.split("\n").forEach(l => {
    const m = l.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch(e) {}

const DATA_DIR = resolve(__dirname, "..", ".pinterest-data");
const QUEUE_FILE = resolve(DATA_DIR, "post-queue.json");
const IMG_DIR = resolve(DATA_DIR, "images");
const BOARDS_FILE = resolve(DATA_DIR, "boards.json");

if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

// ─── High-Quality SVG Infographic Generator ───

function generatePinterestSVG(title, stat, description, category, slug) {
  const w = 1000, h = 1500; // Pinterest optimal format (2:3 ratio)
  
  const colors = {
    mortgages: { bg1: "#1e3a5f", bg2: "#2563eb", accent: "#93c5fd" },
    investing: { bg1: "#064e3b", bg2: "#059669", accent: "#6ee7b7" },
    retirement: { bg1: "#4c1d95", bg2: "#7c3aed", accent: "#c4b5fd" },
    loans:      { bg1: "#1e1b4b", bg2: "#4338ca", accent: "#a5b4fc" },
    debt:       { bg1: "#7f1d1d", bg2: "#dc2626", accent: "#fca5a5" },
    taxes:      { bg1: "#451a03", bg2: "#d97706", accent: "#fde68a" },
    savings:    { bg1: "#064e3b", bg2: "#059669", accent: "#6ee7b7" },
    everyday:   { bg1: "#0f172a", bg2: "#475569", accent: "#cbd5e1" },
  };
  const c = colors[category] || colors.everyday;
  
  const headerGrad = `<linearGradient id="hg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c.bg1}"/><stop offset="100%" stop-color="${c.bg2}"/></linearGradient>`;
  const glowGrad = `<radialGradient id="glow"><stop offset="0%" stop-color="${c.accent}" stop-opacity="0.15"/><stop offset="100%" stop-color="${c.accent}" stop-opacity="0"/></radialGradient>`;
  
  function esc(t) { return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>${headerGrad}${glowGrad}</defs>
  
  <!-- Background -->
  <rect width="${w}" height="${h}" fill="#0f172a"/>
  <rect x="0" y="0" width="${w}" height="${h}" fill="url(#glow)"/>
  
  <!-- Decorative circles -->
  <circle cx="850" cy="200" r="300" fill="${c.accent}" opacity="0.03"/>
  <circle cx="-100" cy="800" r="400" fill="${c.accent}" opacity="0.02"/>
  
  <!-- Header bar -->
  <rect x="0" y="0" width="${w}" height="80" fill="url(#hg)"/>
  <text x="50" y="52" font-size="22" font-weight="800" fill="white" font-family="Arial, Helvetica, sans-serif" letter-spacing="2">QFINHUB</text>
  <rect x="750" y="28" width="200" height="28" rx="14" fill="rgba(255,255,255,0.15)"/>
  <text x="850" y="47" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.8)" font-family="Arial">Free Calculators</text>
  
  <!-- Title -->
  <text x="60" y="160" font-size="28" font-weight="700" fill="white" font-family="Arial" letter-spacing="0.5">${esc(title)}</text>
  
  <!-- Decorative line -->
  <rect x="60" y="180" width="60" height="4" rx="2" fill="${c.accent}"/>
  
  <!-- Big Stat -->
  <text x="60" y="380" font-size="80" font-weight="800" fill="${c.accent}" font-family="Arial">${esc(stat)}</text>
  
  <!-- Description area -->
  <rect x="60" y="440" width="880" height="2" fill="rgba(255,255,255,0.1)"/>
  <text x="60" y="480" font-size="18" fill="rgba(255,255,255,0.7)" font-family="Arial" line-height="1.6">${esc(description)}</text>
  
  <!-- Feature boxes -->
  <rect x="60" y="560" width="420" height="90" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="80" y="595" font-size="14" font-weight="600" fill="${c.accent}" font-family="Arial">100% Free</text>
  <text x="80" y="625" font-size="12" fill="rgba(255,255,255,0.5)" font-family="Arial">No sign-up required</text>
  
  <rect x="520" y="560" width="420" height="90" rx="12" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="540" y="595" font-size="14" font-weight="600" fill="${c.accent}" font-family="Arial">Instant Results</text>
  <text x="540" y="625" font-size="12" fill="rgba(255,255,255,0.5)" font-family="Arial">Enter numbers, get answers</text>
  
  <!-- Bottom CTA -->
  <rect x="250" y="750" width="500" height="60" rx="30" fill="${c.bg2}" opacity="0.9"/>
  <text x="500" y="788" text-anchor="middle" font-size="18" font-weight="700" fill="white" font-family="Arial">Visit QFINHUB.com</text>
  
  <!-- Calculator preview at bottom -->
  <rect x="60" y="870" width="880" height="520" rx="16" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
  <text x="120" y="920" font-size="20" font-weight="600" fill="white" font-family="Arial">Free ${slug.split("-").join(" ").replace(/\b\w/g, l => l.toUpperCase())}</text>
  
  <!-- Simulated calculator inputs -->
  <rect x="120" y="960" width="350" height="50" rx="8" fill="rgba(255,255,255,0.06)"/>
  <text x="140" y="992" font-size="14" fill="rgba(255,255,255,0.4)" font-family="Arial">Enter your amount...</text>
  <rect x="510" y="960" width="350" height="50" rx="8" fill="rgba(255,255,255,0.06)"/>
  <text x="530" y="992" font-size="14" fill="rgba(255,255,255,0.4)" font-family="Arial">Interest rate...</text>
  
  <rect x="120" y="1040" width="350" height="50" rx="8" fill="rgba(255,255,255,0.06)"/>
  <text x="140" y="1072" font-size="14" fill="rgba(255,255,255,0.4)" font-family="Arial">Loan term...</text>
  <rect x="510" y="1040" width="350" height="130" rx="8" fill="${c.bg2}" opacity="0.2"/>
  <text x="685" y="1090" text-anchor="middle" font-size="16" font-weight="600" fill="${c.accent}" font-family="Arial">Your Result</text>
  <text x="685" y="1130" text-anchor="middle" font-size="14" fill="rgba(255,255,255,0.6)" font-family="Arial">Calculated instantly</text>
  
  <rect x="120" y="1210" width="760" height="50" rx="25" fill="${c.bg2}" opacity="0.3"/>
  <text x="500" y="1242" text-anchor="middle" font-size="15" font-weight="600" fill="${c.accent}" font-family="Arial">Try this calculator at qfinhub.com</text>
  
  <!-- Footer -->
  <text x="500" y="${h - 30}" text-anchor="middle" font-size="11" fill="rgba(255,255,255,0.2)" font-family="Arial">124+ Free Calculators · 33 Languages · 100% Free</text>
</svg>`;
}

// ─── Pin data (from existing content) ───
function getStatForSlug(slug) {
  const stats = {
    "mortgage-calculator": "$1,969",
    "compound-interest": "$76,122",
    "investment-return": "$492K",
    "retirement-planning": "$1.7M",
    "mortgage-affordability": "$350K",
    "budget-planner": "50/30/20",
    "savings-goal": "$500/mo",
    "debt-payoff": "36 mo",
    "401k-calculator": "$1.2M",
    "rent-vs-buy": "$235K",
    "inflation-calculator": "-50%",
    "tax-calculator": "$2,850",
    "student-loan": "$450/mo",
    "loan-calculator": "$1,234",
    "credit-card-payoff": "24 mo",
    "net-worth": "$100K+",
    "roi-calculator": "312%",
    "biweekly-mortgage": "$68K",
    "currency-converter": "1.08",
    "dollar-cost-average": "$476K",
  };
  return stats[slug] || "Free";
}

// ─── Main ───
async function main() {
  var args = process.argv.slice(2);
  var isPost = args.includes("--post");
  var isStatus = args.includes("--status");
  var sharp = require("sharp");
  
  // ── Status ──
  if (isStatus) {
    if (!existsSync(QUEUE_FILE)) {
      console.log("No batch queue found. Run without --post to generate.");
      return;
    }
    var queue = JSON.parse(readFileSync(QUEUE_FILE, "utf-8"));
    var total = queue.pins ? queue.pins.length : 0;
    var posted = queue.posted || 0;
    console.log("=== Pinterest Batch Queue ===");
    console.log("  Total pins in queue:", total);
    console.log("  Posted so far:", posted);
    console.log("  Remaining:", total - posted);
    return;
  }
  
  // ── Post queue (after Standard approved) ──
  if (isPost) {
    console.log("=== Posting Batch Queue ===");
    if (!existsSync(QUEUE_FILE)) {
      console.error("No queue file found. Generate first.");
      process.exit(1);
    }
    
    var queue = JSON.parse(readFileSync(QUEUE_FILE, "utf-8"));
    var pins = queue.pins || [];
    var posted = queue.posted || 0;
    var token = process.env.PINTEREST_ACCESS_TOKEN || "";
    
    if (!token) { console.error("No access token"); process.exit(1); }
    if (posted >= pins.length) { console.log("All pins already posted!"); return; }
    
    console.log("Posting " + pins.length + " pins, " + posted + " already done...");
    
    for (var i = posted; i < pins.length; i++) {
      var pin = pins[i];
      console.log("\n[" + (i + 1) + "/" + pins.length + "] " + pin.slug);
      
      try {
        var resp = await fetch("https://api.pinterest.com/v5/pins", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            board_id: pin.boardId,
            title: (pin.title || "").substring(0, 100),
            description: ((pin.description || "") + "\n\n#QFINHUB #FreeCalculators #PersonalFinance").substring(0, 500),
            link: pin.link,
            alt_text: "Financial infographic from QFINHUB",
            media_source: {
              source_type: "image_url",
              url: pin.imageUrl,
            },
          }),
        });
        
        var body = await resp.text();
        if (resp.ok) {
          var data = JSON.parse(body);
          console.log("  ✅ Posted — Pin ID: " + (data.id || "?"));
          queue.posted = i + 1;
          writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
        } else {
          console.log("  ❌ Failed: " + body.substring(0, 150));
          if (resp.status === 429) {
            console.log("  Rate limited, waiting 60s...");
            await new Promise(r => setTimeout(r, 60000));
            i--; // retry
          } else if (resp.status === 403) {
            break; // Can't continue without Standard access
          }
        }
      } catch(e) {
        console.log("  ❌ Error: " + e.message.substring(0, 100));
        break;
      }
      
      // Rate limit: 1 pin every 5 seconds
      if (i < pins.length - 1) await new Promise(r => setTimeout(r, 5000));
    }
    
    console.log("\nDone. Posted: " + queue.posted + "/" + pins.length);
    return;
  }
  
  // ── Generate batch queue ──
  console.log("=== Generating Pinterest Batch Queue ===");
  
  // Load pin content
  if (!existsSync(resolve(DATA_DIR, "pin-content.json"))) {
    console.error("No pin-content.json found. Run: node scripts/pinterest-content.cjs --generate");
    process.exit(1);
  }
  var contentData = JSON.parse(readFileSync(resolve(DATA_DIR, "pin-content.json"), "utf-8"));
  var pins = contentData.pins || [];
  console.log("Total pins to generate: " + pins.length);
  
  // Load boards
  var boardMap = {};
  if (existsSync(BOARDS_FILE)) {
    boardMap = JSON.parse(readFileSync(BOARDS_FILE, "utf-8"));
  }
  if (Object.keys(boardMap).length === 0) {
    console.error("No boards found. Run: node scripts/post-pinterest.cjs --setup");
    process.exit(1);
  }
  
  var queue = { generated: new Date().toISOString(), pins: [], posted: 0 };
  var publicDir = resolve(__dirname, "..", "public", "pinterest-images");
  if (!existsSync(publicDir)) mkdirSync(publicDir, { recursive: true });
  
  for (var i = 0; i < pins.length; i++) {
    var pin = pins[i];
    var boardEntry = boardMap[pin.category];
    var boardId = boardEntry ? boardEntry.id : null;
    
    if (!boardId) {
      console.log("  ⏭ [" + (i + 1) + "/" + pins.length + "] " + pin.slug + " (no board mapping)");
      continue;
    }
    
    var stat = getStatForSlug(pin.slug);
    var desc = (pin.description || "").replace(/\n/g, " ");
    
    console.log("  🎨 [" + (i + 1) + "/" + pins.length + "] " + pin.slug + " (" + pin.category + ")");
    
    var svg = generatePinterestSVG(pin.title, stat, desc, pin.category, pin.slug);
    
    var filename = "batch-" + pin.slug + "-" + randomBytes(3).toString("hex") + ".png";
    var imgPath = resolve(IMG_DIR, filename);
    var publicPath = resolve(publicDir, filename);
    
    await sharp(Buffer.from(svg))
      .resize(1000, 1500)
      .png()
      .toFile(imgPath);
    
    // Copy to public
    var fs = require("fs");
    fs.copyFileSync(imgPath, publicPath);
    
    queue.pins.push({
      slug: pin.slug,
      category: pin.category,
      boardId: boardId,
      boardName: boardEntry.name,
      title: pin.title,
      description: desc,
      link: pin.link || "https://www.qfinhub.com/calculators/" + pin.slug,
      stat: stat,
      imageUrl: "https://www.qfinhub.com/pinterest-images/" + filename,
      imagePath: publicPath,
    });
  }
  
  writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2));
  console.log("\n✅ Queue saved! " + queue.pins.length + " pins ready.");
  console.log("  Images in: " + IMG_DIR);
  console.log("  Public at: " + publicDir);
  console.log("");
  console.log("When Standard access is approved, run:");
  console.log("  node scripts/pinterest-batch.cjs --post");
}

main().catch(function(err) {
  console.error("Fatal:", err.message);
  process.exit(1);
});
