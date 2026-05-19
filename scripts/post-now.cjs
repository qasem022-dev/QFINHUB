#!/usr/bin/env node
/**
 * Post-Now: Post 3-5 finance tweets immediately (not schedule-based)
 * Usage: node scripts/post-now.cjs [count]
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const { randomBytes } = require("crypto");

// ── Load .env.local ──
try {
  const envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  envContent.split("\n").forEach(function(line) {
    const match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      const key = match[1].trim();
      const val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
} catch(e) {
  console.error("Could not load .env.local");
  process.exit(1);
}

const DATA_DIR = resolve(__dirname, "..", ".x-data-v2");
const CONTENT_FILE = resolve(DATA_DIR, "monthly-content.json");
const LOG_FILE = resolve(DATA_DIR, "activity-log.json");
const POSTED_FILE = resolve(DATA_DIR, "posted-now.json");

const IMG_DIR = resolve(DATA_DIR, "images");
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

// ── SVG Image Generation ──
function makeSvg(stat, label, topic, cta) {
  const colors = {
    mortgage: ["#1e3a5f", "#2563eb"], investing: ["#14532d", "#16a34a"],
    retirement: ["#4c1d95", "#7c3aed"], debt: ["#7f1d1d", "#dc2626"],
    tax: ["#713f12", "#ca8a04"], savings: ["#0f766e", "#14b8a6"],
    loan: ["#1e40af", "#3b82f6"], general: ["#1e293b", "#475569"],
  };
  const c = colors[topic] || colors.general;
  const safe = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675">
<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${c[0]}"/><stop offset="100%" stop-color="${c[1]}"/></linearGradient></defs>
<rect width="1200" height="675" fill="url(#g)"/>
<rect width="1200" height="60" fill="rgba(0,0,0,0.2)"/>
<text x="30" y="40" font-size="20" font-weight="700" fill="rgba(255,255,255,0.9)">QFINHUB</text>
<text x="1170" y="40" text-anchor="end" font-size="15" fill="rgba(255,255,255,0.5)">Free Financial Calculators</text>
<text x="60" y="180" font-size="34" font-weight="800" fill="white">${safe(stat)}</text>
<text x="60" y="230" font-size="20" fill="rgba(255,255,255,0.8)">${safe(label)}</text>
<rect x="60" y="${675-100}" width="1080" height="50" rx="25" fill="rgba(255,255,255,0.15)"/>
<text x="600" y="${675-68}" text-anchor="middle" font-size="18" font-weight="600" fill="white">${safe(cta)}</text>
<rect x="0" y="${675-30}" width="1200" height="30" fill="rgba(0,0,0,0.15)"/>
<text x="600" y="${675-8}" text-anchor="middle" font-size="13" fill="rgba(255,255,255,0.4)">qfinhub.com</text>
</svg>`;
}

async function svgToPng(svg) {
  try {
    const sharp = require("sharp");
    const fn = `x-now-${randomBytes(4).toString("hex")}.png`;
    const fp = resolve(IMG_DIR, fn);
    await sharp(Buffer.from(svg)).resize(1200, 675).png().toFile(fp);
    return fp;
  } catch(e) {
    console.error("Image gen:", e.message);
    return null;
  }
}

function log(type, details) {
  let logData = [];
  if (existsSync(LOG_FILE)) try { logData = JSON.parse(readFileSync(LOG_FILE,"utf-8")); } catch(e) {}
  logData.push({ ts: new Date().toISOString(), type, details });
  if (logData.length > 500) logData = logData.slice(-500);
  writeFileSync(LOG_FILE, JSON.stringify(logData, null, 2));
}

async function main() {
  const { TwitterApi } = require("twitter-api-v2");

  const xClient = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  const count = parseInt(process.argv[2]) || 5;
  console.log(`\n═══════════════════════════════════\n  X Post Now — ${count} tweets\n  ${new Date().toISOString()}\n═══════════════════════════════════\n`);

  // Load content
  if (!existsSync(CONTENT_FILE)) {
    console.error("No content file. Run: node scripts/x-agent-v2.cjs --generate");
    process.exit(1);
  }
  const content = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));

  // Track which posts were already used
  let posted = [];
  if (existsSync(POSTED_FILE)) {
    try { posted = JSON.parse(readFileSync(POSTED_FILE, "utf-8")); } catch(e) {}
  }

  // Pick next unused posts, cycling if needed
  const available = content.posts.filter((_, i) => !posted.includes(i));
  if (available.length < count) {
    console.log(`Only ${available.length} unused posts. Resetting tracking.`);
    posted = [];
    writeFileSync(POSTED_FILE, "[]");
  }

  const toPost = content.posts
    .map((p, i) => ({ ...p, index: i }))
    .filter(p => !posted.includes(p.index))
    .slice(0, count);

  if (toPost.length === 0) {
    console.log("No posts available!");
    process.exit(0);
  }

  console.log(`Posting ${toPost.length} tweets with ${Math.round(toPost.length * 1.2)}s spacing...\n`);

  for (let i = 0; i < toPost.length; i++) {
    const p = toPost[i];
    const body = p.text.substring(0, 220); // Keep under X limit
    const fullText = `${body}\n\n${p.link || "https://www.qfinhub.com/calculators"}`;

    console.log(`[${i+1}/${toPost.length}] ${p.topic}: "${body.substring(0, 60)}..."`);

    try {
      // Generate image
      const svg = makeSvg(p.stat || "Free Calculator", p.label || p.topic, p.topic || "general", p.cta || "Try it free");
      const png = await svgToPng(svg);
      let mediaId = null;
      if (png) mediaId = await xClient.v1.uploadMedia(png);

      const params = { text: fullText };
      if (mediaId) params.media = { media_ids: [mediaId] };

      const r = await xClient.v2.tweet(params);
      console.log(`  ✅ Posted! ID: ${r.data.id}`);
      log("tweet-now", { id: r.data.id, topic: p.topic, index: p.index });

      // Track as posted
      posted.push(p.index);
      writeFileSync(POSTED_FILE, JSON.stringify(posted));

      // 70s spacing to avoid rate limits (500 posts / 3 hours for free tier = ~1 per 21s, but we stay safe)
      if (i < toPost.length - 1) {
        await new Promise(r => setTimeout(r, 70000));
      }
    } catch(e) {
      console.error(`  ❌ Failed: ${e.message}`);
      log("tweet-now-failed", { error: e.message, index: p.index });

      // If rate limited, wait longer
      if (e.code === 429 || e.message.includes("Rate limit")) {
        console.log("  ⏳ Rate limited. Waiting 5 minutes...");
        await new Promise(r => setTimeout(r, 300000));
      }
    }
  }

  console.log(`\n✅ Done! Posted ${toPost.length} tweets.`);
  console.log(`📊 Remaining unused posts: ${content.posts.length - posted.length}/${content.posts.length}`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
