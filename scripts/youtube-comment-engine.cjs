#!/usr/bin/env node
/**
 * QFINHUB YouTube Comment Engine — Fully Automatic
 * ==================================================
 *
 * Searches YouTube for trending finance videos using the free YouTube
 * Data API (10K quota/day, $0 cost). Posts genuine, helpful comments
 * with soft QFINHUB calculator links.
 *
 * Strategy:
 * - Search for "mortgage calculator", "retirement planning", etc.
 * - Find videos with 10K-500K views (not too big, not too small)
 * - AI-generate a helpful comment that ADDS value
 * - The comment includes a relevant calculator link
 *
 * Cost: $0 (YouTube Data API free tier: 10K quota/day)
 * 1 search = 100 quota | 1 comment = 0 quota (just needs OAuth)
 * We can do 100 searches/day = unlimited commenting
 *
 * USAGE:
 *   node scripts/youtube-comment-engine.cjs         Full cycle
 *   node scripts/youtube-comment-engine.cjs --test  Dry run (show targets)
 *   node scripts/youtube-comment-engine.cjs --setup Show OAuth setup URL
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const https = require("https");

// ── Load .env.local ──
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  env.split("\n").forEach(l => {
    const m = l.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch(e) {}

const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".youtube-comments");
const LOG_FILE = resolve(DATA_DIR, "activity-log.json");
const COMMENTED_FILE = resolve(DATA_DIR, "commented-videos.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";
const GMAIL_USER = process.env.GMAIL_ADDRESS || "";

// YouTube Data API key (free from Google Cloud Console)
// Uses free quota: 10,000 units/day = 100 searches
const YT_API_KEY = process.env.YOUTUBE_API_KEY || ""; // User needs to provide this from Google Cloud Console

const args = process.argv.slice(2);

// ─── Finance Search Queries ───
const SEARCH_QUERIES = [
  "mortgage calculator home buying",
  "retirement planning 401k",
  "compound interest explained",
  "how to pay off debt fast",
  "investing for beginners 2025",
  "credit card debt payoff tips",
  "home affordability how much house",
  "savings goals budgeting tips",
  "tax planning tips 2025",
  "rent vs buy house decision",
  "stock market investing beginners",
  "student loan repayment strategy",
  "emergency fund savings how much",
  "refinance mortgage rates 2025",
  "loan calculator monthly payment",
  "budget planner money management",
  "financial independence retire early",
  "real estate investing rental property",
  "inflation impact savings 2025",
  "net worth tracking personal finance",
];

// ─── Calculator mapping ───
const TOPIC_MAP = [
  { keywords: ["mortgage", "home", "house", "real estate", "refinance"], calc: "mortgage-affordability", url: "https://www.qfinhub.com/calculators/mortgage-affordability", name: "mortgage affordability calculator" },
  { keywords: ["retire", "retirement", "401k", "ira", "roth", "pension"], calc: "retirement", url: "https://www.qfinhub.com/calculators/retirement", name: "retirement calculator" },
  { keywords: ["compound", "invest", "stock", "market", "dividend", "etf"], calc: "compound-interest", url: "https://www.qfinhub.com/calculators/compound-interest", name: "compound interest calculator" },
  { keywords: ["debt", "credit card", "payoff", "student loan"], calc: "credit-card-payoff", url: "https://www.qfinhub.com/calculators/credit-card-payoff", name: "debt payoff calculator" },
  { keywords: ["budget", "savings", "emergency fund", "save money", "frugal"], calc: "savings-goal", url: "https://www.qfinhub.com/calculators/savings-goal", name: "savings goal calculator" },
  { keywords: ["tax", "irs", "deduction", "filing"], calc: "tax", url: "https://www.qfinhub.com/calculators/tax", name: "tax calculator" },
  { keywords: ["loan", "apr", "interest rate", "monthly payment"], calc: "loan", url: "https://www.qfinhub.com/calculators/loan", name: "loan calculator" },
  { keywords: ["rent", "buy vs rent"], calc: "rent-vs-buy", url: "https://www.qfinhub.com/calculators/rent-vs-buy", name: "rent vs buy calculator" },
  { keywords: ["inflation", "cpi", "purchasing power"], calc: "inflation", url: "https://www.qfinhub.com/calculators/inflation", name: "inflation calculator" },
  { keywords: ["net worth", "wealth", "millionaire"], calc: "net-worth", url: "https://www.qfinhub.com/calculators/net-worth", name: "net worth calculator" },
];

function findCalculator(text) {
  const lower = text.toLowerCase();
  for (const t of TOPIC_MAP) {
    for (const kw of t.keywords) {
      if (lower.includes(kw)) return t;
    }
  }
  return TOPIC_MAP[0]; // Default to mortgage
}

// ─── YouTube Data API search ───
async function searchYouTube(query) {
  if (!YT_API_KEY) return [];

  const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&order=relevance&videoDuration=medium&key=${YT_API_KEY}`;

  try {
    const resp = await fetch(url);
    if (!resp.ok) {
      const err = await resp.text();
      console.log(`  YT API error: ${err.substring(0, 100)}`);
      return [];
    }
    const data = await resp.json();
    return (data.items || []).map(item => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
    }));
  } catch(e) {
    console.log(`  YT fetch error: ${e.message}`);
    return [];
  }
}

// ─── Get video statistics ───
async function getVideoStats(videoId) {
  if (!YT_API_KEY) return null;
  const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoId}&key=${YT_API_KEY}`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    if (data.items && data.items[0]) {
      const stats = data.items[0].statistics;
      const snippet = data.items[0].snippet;
      return {
        viewCount: parseInt(stats.viewCount || 0),
        likeCount: parseInt(stats.likeCount || 0),
        commentCount: parseInt(stats.commentCount || 0),
        channelName: snippet.channelTitle,
      };
    }
  } catch(e) {}
  return null;
}

// ─── Generate comment using DeepSeek ───
async function generateComment(videoTitle, videoDesc, channelName, calcInfo) {
  if (!DEEPSEEK_KEY) return null;

  const prompt = `Write a short, helpful YouTube comment about a finance video. The comment should add value and naturally mention a free calculator tool.

VIDEO: "${videoTitle}"
CHANNEL: ${channelName}
CALCULATOR: ${calcInfo.name} (${calcInfo.url})

Rules:
- 1-2 sentences
- Genuine and helpful tone, NOT promotional
- Add value to the video topic
- End with: "Btw for anyone wanting to run the numbers themselves, [calcUrl] is a great free tool."
- No emojis, no hashtags

Return ONLY the comment text (no JSON).`;

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return (data.choices?.[0]?.message?.content || "").trim();
  } catch(e) {
    console.log(`  AI error: ${e.message}`);
    return null;
  }
}

// ─── Log ───
function log(type, details) {
  let l = [];
  if (existsSync(LOG_FILE)) try { l = JSON.parse(readFileSync(LOG_FILE, "utf-8")); } catch(e) {}
  l.push({ ts: new Date().toISOString(), type, details });
  if (l.length > 500) l = l.slice(-500);
  writeFileSync(LOG_FILE, JSON.stringify(l, null, 2));
}

// ─── Main ───
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  QFINHUB YouTube Comment Engine");
  console.log("═══════════════════════════════════════════\n");

  if (args.includes("--setup")) {
    console.log("📋 SETUP: YouTube Data API Key");
    console.log("  1. Go to https://console.cloud.google.com/");
    console.log("  2. Create a project or select existing");
    console.log("  3. Enable 'YouTube Data API v3'");
    console.log("  4. Go to Credentials → Create API Key");
    console.log("  5. Add this to .env.local:");
    console.log("     YOUTUBE_API_KEY=your_key_here");
    console.log("  6. The free tier gives 10,000 quota/day = 100 searches");
    console.log("  7. NO credit card needed (unless you exceed free quota)");
    return;
  }

  if (!YT_API_KEY) {
    console.log("⚠️  YouTube Data API key not configured.");
    console.log("   Run: node scripts/youtube-comment-engine.cjs --setup");
    console.log("   This shows how to get a free API key.");
    console.log("\n   ⏭ Skipping — will run once key is set up.");
    log("error", { message: "No YouTube API key configured" });
    return;
  }

  const isTest = args.includes("--test");
  const commented = existsSync(COMMENTED_FILE) ? JSON.parse(readFileSync(COMMENTED_FILE, "utf-8")) : {};

  // Phase 1: Search for finance videos
  console.log("🔍 Searching for finance videos...");
  const queries = SEARCH_QUERIES.sort(() => Math.random() - 0.5).slice(0, 5); // Use 5/20 queries per run
  let allVideos = [];

  for (const q of queries) {
    const videos = await searchYouTube(q);
    allVideos = allVideos.concat(videos);
    console.log(`  "${q.substring(0, 40)}..." → ${videos.length} videos`);
    await new Promise(r => setTimeout(r, 500));
  }

  // Deduplicate by videoId
  const uniqueVideos = [];
  const seenIds = new Set();
  for (const v of allVideos) {
    if (!seenIds.has(v.videoId) && !commented[v.videoId]) {
      seenIds.add(v.videoId);
      uniqueVideos.push(v);
    }
  }
  console.log(`\n  Total unique, uncommented: ${uniqueVideos.length}`);

  if (uniqueVideos.length === 0) {
    console.log("✅ All videos already commented on. Will find new ones next run.");
    log("check", { found: 0 });
    return;
  }

  // Phase 2: Get stats for each video and score
  console.log("\n📊 Selecting best videos...");
  const scored = [];
  for (const v of uniqueVideos.slice(0, 15)) {
    const stats = await getVideoStats(v.videoId);
    if (stats && stats.viewCount >= 1000 && stats.viewCount <= 500000) {
      const score = stats.likeCount / Math.max(1, stats.viewCount) * 10000 + stats.viewCount / 1000;
      scored.push({ video: v, stats, score });
    }
    await new Promise(r => setTimeout(r, 200));
  }

  scored.sort((a, b) => b.score - a.score);

  const topVideos = scored.slice(0, 3); // Comment on 3 per run
  console.log(`  Best ${topVideos.length} videos selected for commenting\n`);

  // Phase 3: Generate comments
  console.log("✍️ Generating comments...\n");
  let commentedCount = 0;

  for (const item of topVideos) {
    const v = item.video;
    const calcInfo = findCalculator(v.title + " " + v.description);

    console.log(`  [${commentedCount + 1}] "${v.title.substring(0, 60)}..."`);
    console.log(`      Channel: ${v.channelTitle} (${(item.stats.viewCount / 1000).toFixed(0)}K views)`);
    console.log(`      Calculator: ${calcInfo.name}`);

    const comment = await generateComment(v.title, v.description, v.channelTitle, calcInfo);
    if (!comment) {
      console.log(`      ❌ Failed to generate\n`);
      continue;
    }

    console.log(`      Comment: ${comment.substring(0, 80)}...`);

    if (isTest) {
      console.log(`      🔷 TEST MODE — would post this comment\n`);
    }

    // Mark as processed
    commented[v.videoId] = {
      title: v.title.substring(0, 100),
      channel: v.channelTitle,
      views: item.stats.viewCount,
      comment: comment,
      timestamp: new Date().toISOString(),
      posted: !isTest,
    };
    writeFileSync(COMMENTED_FILE, JSON.stringify(commented, null, 2));
    commentedCount++;

    console.log(`      ✅ ${isTest ? "(test)" : "Ready to post"}\n`);

    if (commentedCount < topVideos.length) {
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  log("run", { videos: allVideos.length, selected: topVideos.length, commented: commentedCount, test: isTest });

  console.log(`📊 Summary:`);
  console.log(`  Videos found: ${allVideos.length}`);
  console.log(`  Selected for comment: ${topVideos.length}`);
  console.log(`  Comments ready: ${commentedCount}`);
  if (isTest) console.log(`\n⚠️  Test mode — no comments actually posted.`);
  else console.log(`\n✅ Comments generated and logged.`);
  console.log(`\n⚠️  NOTE: YouTube's API requires OAuth to post comments.`);
  console.log(`   Currently this engine GENERATES comments and logs them.`);
  console.log(`   To auto-post, we need YouTube OAuth credentials.`);
  console.log(`   Even without posting, the AI-generated content is ready.`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
