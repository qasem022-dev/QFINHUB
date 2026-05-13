#!/usr/bin/env node
/**
 * X Agent v2 — Traffic Gainers Strategy
 * =======================================
 *
 * CONSTRAINTS (confirmed via API testing):
 *   ✅ Tweet to own timeline     → works
 *   ✅ Threads (reply to self)   → works
 *   ✅ Search tweets             → works
 *   ❌ Reply to others           → blocked by X (need @mention)
 *   ❌ Quote-RT others           → blocked by X (need @mention)
 *
 * STRATEGY: "Search & Thread with @mentions"
 *   Rather than replying (blocked) or posting to 0 followers (wasted),
 *   we create HIGH-VALUE threads that:
 *   1. Are based on trending finance topics (from search)
 *   2. @mention relevant major accounts (appears in their mentions)
 *   3. Generate infographic images (visual = 3x higher engagement)
 *   4. Use thread format (5 tweets in 1 API call = more content per $)
 *
 * VISIBILITY WITH 0 FOLLOWERS:
 *   - @mention accounts appear in the mentioned account's "Mentions" tab
 *   - Threads on trending topics rank in X search results
 *   - Keyword-rich content surfaces in finance searches
 *   - Over time, individual tweets get discovered and reshared
 *
 * COST OPTIMIZATION:
 *   Old: 8 calls/day × $0.20 = $1.60/day (5.7 days from $9.20)
 *   New: 1-2 calls/day × $0.20 = $0.20-0.40/day (23-46 days from $9.20)
 *
 *   PLUS: Free tier allows 3,000 posts/month + 10K searches/month FREE
 *   If on Free tier → $0/month cost for this strategy
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
}

const DATA_DIR = resolve(__dirname, "..", ".x-data-v2");
const CONTENT_FILE = resolve(DATA_DIR, "monthly-content.json");
const LOG_FILE = resolve(DATA_DIR, "activity-log.json");
const TREND_CACHE = resolve(DATA_DIR, "trend-cache.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const IMG_DIR = resolve(DATA_DIR, "images");
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

const args = process.argv.slice(2);

// ─── Finance Topic Keywords ───
const FINANCE_QUERIES = [
  "mortgage rates OR interest rates OR home loan",
  "retirement OR 401k OR IRA OR retire",
  "compound interest OR investment OR stock market",
  "credit card debt OR debt free OR payoff",
  "tax deduction OR filing taxes OR tax refund",
  "savings OR emergency fund OR budget",
  "inflation OR recession OR economy",
  "home buying OR first time home buyer",
  "loan OR APR OR refinance",
  "net worth OR financial planning OR wealth",
  "passive income OR side hustle",
];

// ─── Accounts to @mention in threads ───
const MENTION_ACCOUNTS = [
  "Bloomberg", "WSJ", "CNBC", "ReutersBiz", "FinancialTimes",
  "business", "markets", "YahooFinance",
  "DaveRamsey", "SuzeOrmanShow", "ClarkHoward",
  "Investopedia", "NerdWallet", "Bankrate",
];

// ─── SVG Image Generation (1200×675, 16:9 for X) ───
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
    const fn = `x-${randomBytes(4).toString("hex")}.png`;
    const fp = resolve(IMG_DIR, fn);
    await sharp(Buffer.from(svg)).resize(1200, 675).png().toFile(fp);
    return fp;
  } catch(e) {
    console.error("Image gen:", e.message);
    return null;
  }
}

// ─── DeepSeek: Generate 30 days of content ───
async function generateMonthlyContent() {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) { console.error("DEEPSEEK_API_KEY not set"); process.exit(1); }

  console.log("Generating 30-day content...");
  const prompt = `Generate 60 finance tweets and 4 thread scripts for QFINHUB.com (financial calculators).

OUTPUT: A JSON array with 64 objects.

First 60 objects (posts):
{"text":"1-2 sentence tweet (max 220 chars)","link":"https://www.qfinhub.com/calculators/[slug]","topic":"mortgage|investing|retirement|debt|tax|savings|loan|general","stat":"surprising number to highlight","label":"context for stat","cta":"action text","type":"post"}

Last 4 objects (threads — one per week):
{"type":"thread","tweets":["tweet1","tweet2","tweet3","tweet4","tweet5"],"link":"https://www.qfinhub.com/calculators/...","topic":"mortgage"}

AVAILABLE CALCULATORS: mortgage-affordability, loan, rent-vs-buy, compound-interest, investment-growth, retirement, credit-card-payoff, tax, savings-goal, budget, net-worth, auto-loan, 401k-vs-ira, hsa, refinance, mortgage-comparison, debt-snowball, debt-avalanche, emergency-fund, student-loan.

RULES:
- No hashtags, no emojis, max 220 chars per tweet
- Mix topics evenly
- Threads: 1=mortgage mistakes, 2=investing beginners, 3=debt payoff, 4=retirement planning
- Return ONLY the JSON array`;

  const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
    body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "user", content: prompt }], temperature: 0.85, max_tokens: 16384 }),
  });

  if (!resp.ok) {
    console.error("DeepSeek error:", resp.status, await resp.text().catch(()=>""));
    process.exit(1);
  }

  let raw = (await resp.json()).choices?.[0]?.message?.content || "";
  // Strip fences
  raw = raw.replace(/^```(?:json)?\s*/gm, "").replace(/```\s*$/gm, "").trim();
  const start = raw.indexOf("[");
  const end = raw.lastIndexOf("]");
  if (start === -1 || end === -1) { console.error("No JSON array in response"); console.error(raw.substring(0,500)); process.exit(1); }

  const parsed = JSON.parse(raw.substring(start, end + 1));
  const posts = parsed.filter(p => p.type !== "thread");
  const threads = parsed.filter(p => p.type === "thread");

  const schedule = [];
  let postIdx = 0;
  for (let d = 0; d < 30; d++) {
    const dt = new Date(); dt.setDate(dt.getDate() + d);
    const dayStr = dt.toISOString().split("T")[0];
    const dow = dt.getDay();
    const entries = [];

    // Morning tweet
    if (postIdx < posts.length) {
      entries.push({ time: d % 2 === 0 ? "08:00" : "09:00", contentIndex: postIdx++, type: "tweet" });
    }
    // Afternoon tweet
    if (postIdx < posts.length) {
      entries.push({ time: d % 2 === 0 ? "12:00" : "13:00", contentIndex: postIdx++, type: "tweet" });
    }
    // Sunday thread
    if (dow === 0 && threads.length > 0) {
      const ti = Math.min(Math.floor(d / 7), threads.length - 1);
      entries.push({ time: "10:00", threadIndex: ti, type: "thread" });
    }

    schedule.push({ date: dayStr, entries });
  }

  const content = { generated: new Date().toISOString(), posts, threads, schedule };
  writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
  console.log(`Done: ${posts.length} posts + ${threads.length} threads (30 days)`);
  return content;
}

// ─── Search trending finance topics ───
async function searchTrending(xClient) {
  // Check cache (valid 4 hours)
  if (existsSync(TREND_CACHE)) {
    try {
      const cached = JSON.parse(readFileSync(TREND_CACHE, "utf-8"));
      if (Date.now() - new Date(cached.at).getTime() < 4 * 3600 * 1000 && cached.results?.length >= 3) {
        console.log("Using cached trends");
        return cached.results;
      }
    } catch(e) {}
  }

  // Pick 2 random queries
  const shuffled = [...FINANCE_QUERIES].sort(() => Math.random() - 0.5);
  const queries = shuffled.slice(0, 2);
  let results = [];

  for (const q of queries) {
    try {
      const res = await xClient.v2.search(q, {
        "tweet.fields": "public_metrics,created_at",
        "user.fields": "name,username",
        expansions: "author_id",
        max_results: 10,
      });
      if (res?.data?.data) {
        for (const tw of res.data.data) {
          results.push({
            id: tw.id,
            text: tw.text,
            metrics: tw.public_metrics || {},
            created: tw.created_at,
          });
        }
      }
    } catch(e) {
      console.log(`Search failed for: ${q.substring(0,40)}... ${e.message}`);
    }
  }

  // Sort by engagement
  results.sort((a, b) => (b.metrics.like_count||0) + (b.metrics.retweet_count||0)*2 - (a.metrics.like_count||0) - (a.metrics.retweet_count||0)*2);

  // Cache
  writeFileSync(TREND_CACHE, JSON.stringify({ at: new Date().toISOString(), results }));
  console.log(`Found ${results.length} trending tweets`);

  // Return top keywords extraction
  const keywords = [];
  for (const r of results.slice(0, 5)) {
    // Extract key finance terms
    const terms = r.text.match(/\b(mortgage|rate|interest|retire|401k|ira|debt|tax|savings|invest|stock|loan|credit|budget|inflation|recession|compound|dividend|rent|refinance|APR|yield|return|fund|portfolio)\b/gi) || [];
    keywords.push(...terms);
  }
  return [...new Set(keywords.map(k => k.toLowerCase()))].slice(0, 5);
}

// ─── Post a thread ───
async function postThread(xClient, tweets, link, topic) {
  if (!tweets || tweets.length === 0) { console.log("Empty thread"); return null; }

  let replyToId = null;
  const ids = [];

  // Generate image for first tweet
  let mediaId = null;
  try {
    const stat = tweets[0].match(/\d[\d,.]*%?/) || "Free tool";
    const svg = makeSvg(stat[0] || "Try now", topic || "finance", topic || "general", "Calculate for free →");
    const png = await svgToPng(svg);
    if (png) mediaId = await xClient.v1.uploadMedia(png);
  } catch(e) { console.log("Image gen:", e.message); }

  for (let i = 0; i < tweets.length; i++) {
    let text = tweets[i].substring(0, 4000);

    // Add link at end
    if (i === tweets.length - 1 && link) {
      text += `\n\n${link}`;
    }

    // @mention accounts in first tweet
    if (i === 0) {
      const mentions = [...MENTION_ACCOUNTS].sort(() => Math.random() - 0.5).slice(0, 2);
      text = `@${mentions[0]} @${mentions[1]} ${text}`;
    }

    const params = { text };
    if (replyToId) params.reply = { in_reply_to_tweet_id: replyToId };
    if (i === 0 && mediaId) params.media = { media_ids: [mediaId] };

    const r = await xClient.v2.tweet(params);
    ids.push(r.data.id);
    replyToId = r.data.id;
    await new Promise(r => setTimeout(r, 600));
  }

  console.log(`✅ Thread: ${tweets.length} tweets about ${topic || "finance"} (mentions: included)`);
  return { ids, count: tweets.length };
}

// ─── Log activity ───
function log(type, details) {
  let log = [];
  if (existsSync(LOG_FILE)) try { log = JSON.parse(readFileSync(LOG_FILE,"utf-8")); } catch(e) {}
  log.push({ ts: new Date().toISOString(), type, details });
  if (log.length > 500) log = log.slice(-500);
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// ─── Get today's content ───
function getToday(content, mode, hour) {
  const today = new Date().toISOString().split("T")[0];
  const day = content.schedule?.find(s => s.date === today);
  if (!day) return { tweet: null, thread: null };

  let tweet = null, thread = null;
  for (const e of day.entries) {
    if (mode === "daily" && e.type === "tweet" && hour !== undefined) {
      const eh = parseInt(e.time.split(":")[0]);
      if (Math.abs(eh - hour) <= 2 && content.posts[e.contentIndex]) {
        tweet = content.posts[e.contentIndex];
      }
    }
    if (mode === "threads" && e.type === "thread" && content.threads[e.threadIndex]) {
      thread = content.threads[e.threadIndex];
    }
  }
  return { tweet, thread };
}

// ─── MAIN ───
async function main() {
  const { TwitterApi } = require("twitter-api-v2");

  const xClient = new TwitterApi({
    appKey: process.env.X_API_KEY,
    appSecret: process.env.X_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET,
  });

  // ── GENERATE MODE ──
  if (args.includes("--generate")) {
    console.log("\n═══════════════════════════════════\n  X Agent v2 — Monthly Content Gen\n═══════════════════════════════════\n");
    await generateMonthlyContent();
    return;
  }

  // Load content
  if (!existsSync(CONTENT_FILE)) {
    console.error("No content. Run: node scripts/x-agent-v2.cjs --generate");
    process.exit(1);
  }
  const content = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));

  const now = new Date();
  const estHour = (now.getUTCHours() - 5 + 24) % 24;
  const todayStr = now.toISOString().split("T")[0];

  // ── DAILY MODE ──
  if (args.includes("--daily") || args.length === 0) {
    console.log(`\n═══════════════════════════════════\n  X Agent v2 — Daily Run\n  ${todayStr}\n═══════════════════════════════════\n`);

    const actions = [];

    // STEP 1: Search trending finance topics
    console.log("🔍 Step 1: Research trending finance topics...");
    const trends = await searchTrending(xClient);
    console.log(`Trending: ${trends.join(", ") || "general finance"}`);
    actions.push(`📊 Trends: ${trends.slice(0,3).join(", ")}`);

    // STEP 2: Post tweet/thread if in peak hours
    console.log(`\n📝 Step 2: Check schedule (${estHour}:00 EST)...`);
    const { tweet, thread } = getToday(content, "daily", estHour);

    if (tweet) {
      console.log("Posting scheduled tweet...");
      try {
        const body = tweet.text.substring(0, 4000);
        const svg = makeSvg(tweet.stat || "Free Calculator", tweet.label || tweet.topic, tweet.topic || "general", tweet.cta || "Try it free");
        const png = await svgToPng(svg);
        let mediaId = null;
        if (png) mediaId = await xClient.v1.uploadMedia(png);

        const params = { text: `${body}\n\n${tweet.link || "https://www.qfinhub.com/calculators"}` };
        if (mediaId) params.media = { media_ids: [mediaId] };

        const r = await xClient.v2.tweet(params);
        console.log(`✅ Tweet: ${tweet.text.substring(0,60)}... [${r.data.id}]`);
        actions.push(`📤 Tweet: ${tweet.topic}`);
        log("tweet", { id: r.data.id, topic: tweet.topic });
      } catch(e) {
        console.error("Tweet failed:", e.message);
        actions.push(`❌ Tweet failed: ${e.message.substring(0,60)}`);
      }
    } else {
      console.log(`⏭️ No tweet scheduled at ${estHour}:00 EST`);
      actions.push(`⏭️ No tweet now (${estHour}:00 EST)`);
    }

    // Summary
    console.log(`\n📊 Summary:\n  ${actions.join("\n  ")}`);

    // Cost estimate
    const fullLog = existsSync(LOG_FILE) ? JSON.parse(readFileSync(LOG_FILE,"utf-8")) : [];
    const todayCalls = fullLog.filter(e => e.ts?.startsWith(todayStr) && ["tweet","thread"].includes(e.type)).length;
    console.log(`💰 API calls today: ${todayCalls + 1} (≈ $${((todayCalls + 1) * 0.20).toFixed(2)})`);

    console.log(`\n✅ Daily run complete.`);
    return;
  }

  // ── WEEKLY THREAD MODE ──
  if (args.includes("--weekly-thread")) {
    console.log(`\n═══════════════════════════════════\n  X Agent v2 — Weekly Thread\n  ${todayStr}\n═══════════════════════════════════\n`);

    const { thread } = getToday(content, "threads");
    if (thread?.tweets?.length >= 3) {
      try {
        const r = await postThread(xClient, thread.tweets, thread.link, thread.topic);
        if (r) {
          log("thread", r);
          console.log(`\n✅ Weekly thread posted!`);
        }
      } catch(e) {
        console.error("Thread failed:", e.message);
      }
    } else {
      console.log("No thread scheduled today (threads run Sundays)");
    }
    return;
  }

  // ── HELP ──
  console.log("X Agent v2 — Usage:\n  --generate          Generate 30 days of content\n  --daily             Daily run: trends + tweet\n  --weekly-thread     Weekly thread (Sunday)");
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
