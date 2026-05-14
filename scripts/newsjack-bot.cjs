#!/usr/bin/env node
/**
 * QFINHUB Newsjacking Bot — Automated Breaking News Content Engine
 * ================================================================
 *
 * Monitors 16 financial RSS feeds. When breaking news is detected
 * (Fed rates, housing, tax, inflation, etc.), it:
 * 1. Identifies the news + relevant QFINHUB calculator
 * 2. Generates a full blog post using DeepSeek AI
 * 3. Appends to src/lib/blog/posts.ts (auto-publishes on next build)
 * 4. Tweets about it (via X API)
 *
 * USAGE:
 *   node scripts/newsjack-bot.cjs           Full cycle (check feeds + publish)
 *   node scripts/newsjack-bot.cjs --test     Test mode (show matches, no publish)
 *   node scripts/newsjack-bot.cjs --recent  Show recent newsjacking activity
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const https = require("https");
const http = require("http");
const { URL } = require("url");

// ── Load .env.local ──
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  env.split("\n").forEach(l => {
    const m = l.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch(e) {}

const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".newsjack-data");
const LOG_FILE = resolve(DATA_DIR, "activity-log.json");
const PUBLISHED_FILE = resolve(DATA_DIR, "published.json");
const POSTS_FILE = resolve(ROOT, "src", "lib", "blog", "posts.ts");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";

const args = process.argv.slice(2);

// ─── RSS Feeds ───
const FEEDS = [
  { name: "Fed Press", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "fed-rate" },
  { name: "Fed Speeches", url: "https://www.federalreserve.gov/feeds/speeches.xml", category: "fed-rate" },
  { name: "Housing Wire", url: "https://www.housingwire.com/feed/", category: "housing" },
  { name: "CNBC Finance", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "stock-market" },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", category: "stock-market" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "stock-market" },
  { name: "BLS News", url: "https://www.bls.gov/feed/news.rss", category: "inflation" },
  { name: "Zillow Research", url: "https://www.zillow.com/research/feed/", category: "real-estate" },
  { name: "Realtor.com", url: "https://www.realtor.com/news/feed/", category: "real-estate" },
  { name: "IRS Newsroom", url: "https://www.irs.gov/newsroom/rss.xml", category: "tax" },
  { name: "NAR Research", url: "https://www.nar.realtor/research-and-statistics/rss.xml", category: "housing" },
  // { name: "Freddie Mac", url: "https://freddiemac.gcs-web.com/news-releases/rss", category: "housing" }, // Always ETIMEDOUT (dead feed)
  { name: "Reuters Finance", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best&best-sectors=personal-finance", category: "personal-finance" },
  { name: "Student Aid", url: "https://studentaid.gov/data-center/rss.xml", category: "student-loan" },
  { name: "BEA Data", url: "https://www.bea.gov/rss/news.xml", category: "inflation" },
];

// ─── Category → Calculator → Blog category mapping ───
const CATEGORY_MAP = {
  "fed-rate": { calculators: ["mortgage-affordability", "loan", "savings-goal"], blogCategory: "mortgage", angle: "Fed rate" },
  "housing": { calculators: ["mortgage-affordability", "rent-vs-buy", "mortgage-comparison"], blogCategory: "mortgage", angle: "Housing" },
  "real-estate": { calculators: ["mortgage-affordability", "rent-vs-buy"], blogCategory: "mortgage", angle: "Real estate" },
  "stock-market": { calculators: ["compound-interest", "investment-growth", "retirement"], blogCategory: "investment", angle: "Market" },
  "inflation": { calculators: ["inflation", "savings-goal", "retirement"], blogCategory: "personal", angle: "Economy" },
  "tax": { calculators: ["tax", "effective-tax-rate"], blogCategory: "tax", angle: "Tax" },
  "student-loan": { calculators: ["student-loan", "loan"], blogCategory: "loan", angle: "Student loans" },
  "personal-finance": { calculators: ["budget", "savings-goal"], blogCategory: "personal", angle: "Finance" },
  recession: { calculators: ["retirement", "budget", "savings-goal"], blogCategory: "personal", angle: "Economy" },
};

// ─── Fetch RSS feed ───
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === "https:" ? https : http;
      mod.get(url, { timeout: 15000, headers: { "User-Agent": "Mozilla/5.0 (RSS Reader)" } }, (res) => {
        let data = "";
        res.on("data", c => { data += c; if (data.length > 200000) data = data.substring(0, 200000); });
        res.on("end", () => resolve(data));
      }).on("error", reject).on("timeout", function() { this.destroy(); reject(new Error("timeout")); });
    } catch(e) { reject(e); }
  });
}

// ─── Parse RSS XML ───
function parseRSSItems(xml) {
  const items = [];
  // Simple XML parsing - extract <item> blocks
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = (block.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || block.match(/<title[^>]*>([\s\S]*?)<\/title>/))?.[1] || "";
    const desc = (block.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) || block.match(/<description[^>]*>([\s\S]*?)<\/description>/))?.[1] || "";
    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/) || block.match(/<link[^>]*>(https?:\/\/[^\s<]+)/))?.[1] || "";
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)?.[1] || "";
    const guid = (block.match(/<guid[^>]*>([\s\S]*?)<\/guid>/) || block.match(/<guid[^>]*>(https?:\/\/[^\s<]+)/))?.[1] || link;

    if (title && title.length > 10) {
      items.push({ title: title.trim(), description: desc.trim().replace(/<[^>]+>/g, ""), link: link.trim(), pubDate, guid: guid.trim(), parsedDate: new Date(pubDate) });
    }
  }
  return items;
}

// ─── Detect if news is relevant through keyword matching ───
function detectMatch(title, description) {
  const combined = `${title} ${description}`.toLowerCase();
  const keywords = {
    "fed|federal reserve|interest rate|rate hike|rate cut|fed decision": { category: "fed-rate", priority: 10 },
    "mortgage rate|home price|housing market|home sales|existing home": { category: "housing", priority: 9 },
    "inflation|cpi|consumer price|inflation rate|price increase": { category: "inflation", priority: 9 },
    "tax|irs|tax bracket|deduction|tax deadline|tax refund": { category: "tax", priority: 8 },
    "stock market|s&p|dow jones|nasdaq|market rally|market crash": { category: "stock-market", priority: 7 },
    "student loan|student debt|student aid|loan forgiveness": { category: "student-loan", priority: 8 },
    "recession|economic downturn|gdp|economic growth": { category: "recession", priority: 8 },
    "real estate|home buying|rental|property value|listing price": { category: "real-estate", priority: 7 },
    "401k|retirement|social security|pension|retire": { category: "personal-finance", priority: 6 },
    "credit card|debt|bankruptcy|credit score|fico": { category: "personal-finance", priority: 6 },
    "savings|emergency fund|budget|personal finance|money tips": { category: "personal-finance", priority: 5 },
  };

  for (const [pattern, config] of Object.entries(keywords)) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(combined)) {
      return config;
    }
  }
  return null;
}

// ─── Load published log ───
function loadPublished() {
  if (!existsSync(PUBLISHED_FILE)) return {};
  try { return JSON.parse(readFileSync(PUBLISHED_FILE, "utf-8")); } catch(e) { return {}; }
}

// ─── Generate blog post using DeepSeek ───
async function generateBlogPost(item, category, calculators) {
  if (!DEEPSEEK_KEY) {
    console.log("  ❌ No DeepSeek key");
    return null;
  }

  const calcSlugs = calculators.join(", ");
  const catMap = CATEGORY_MAP[category] || CATEGORY_MAP["personal-finance"];
  const blogCat = catMap.blogCategory;
  const angle = catMap.angle;

  const prompt = `Write a timely finance blog post for QFINHUB (qfinhub.com), a financial calculators website.

BREAKING NEWS: "${item.title}"
SOURCE: ${item.description ? item.description.substring(0, 200) : "Financial news report"}

REQUIREMENTS:
- Blog post about this news from a personal finance perspective
- Must include links to these calculators: ${calcSlugs} (use format: https://www.qfinhub.com/calculators/SLUG)
- Category: ${blogCat}
- 500-800 words
- Include: TL;DR, What Happened, Why It Matters, How to Calculate, FAQ section
- Make it practical and helpful for readers to take action
- Title must be SEO-friendly, include keywords

Output EXACTLY this JSON:
{
  "title": "SEO-friendly title",
  "description": "Meta description (150 chars max)",
  "content": "Full blog post content in HTML format (use <h2>, <p>, <ul>, <li> tags)",
  "calcSlug": "${calcSlugs.split(",")[0].trim()}",
  "readingTime": 5
}

Return ONLY the JSON.`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2500,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");
    return JSON.parse(jsonMatch[0]);
  } catch(e) {
    console.log(`  AI gen failed: ${e.message}`);
    return null;
  }
}

// ─── Append to posts.ts ───
function appendToPosts(blogPost, category, calculators) {
  try {
    const existing = readFileSync(POSTS_FILE, "utf-8");

    // Convert blog category
    const blogCat = (CATEGORY_MAP[category]?.blogCategory || "personal");

    // Create slug
    const slug = blogPost.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 80);

    // Check if slug already exists
    if (existing.includes(`slug: "${slug}"`)) {
      console.log(`  ⏭️ Post already exists: ${slug}`);
      return null;
    }

    // Build the new post entry
    const calcs = calculators.map(c => `"${c}"`).join(", ");
    const today = new Date();
    const dateStr = `new Date("${today.toISOString().split("T")[0]}")`;

    const newEntry = `  {
    slug: "${slug}",
    title: "${blogPost.title.replace(/"/g, '\\"')}",
    description: "${(blogPost.description || "").replace(/"/g, '\\"')}",
    category: "${blogCat}",
    publishedAt: ${dateStr},
    readingTime: ${blogPost.readingTime || 5},
    relatedCalculators: [${calcs}],
    content: \`${blogPost.content}\`,
  },\n`;

    // Insert before the closing `];`
    const insertPos = existing.lastIndexOf("];");
    if (insertPos === -1) {
      console.log("  ❌ Could not find array close marker in posts.ts");
      return null;
    }

    const updated = existing.substring(0, insertPos) + newEntry + existing.substring(insertPos);
    writeFileSync(POSTS_FILE, updated, "utf-8");
    console.log(`  ✅ Published: ${slug}`);
    return slug;
  } catch(e) {
    console.error(`  ❌ Failed to append: ${e.message}`);
    return null;
  }
}

// ─── Tweet about newsjacking post ───
async function tweetPost(slug, title) {
  try {
    const { TwitterApi } = require("twitter-api-v2");
    const xClient = new TwitterApi({
      appKey: process.env.X_API_KEY,
      appSecret: process.env.X_API_SECRET,
      accessToken: process.env.X_ACCESS_TOKEN,
      accessSecret: process.env.X_ACCESS_SECRET,
    });

    const text = `📰 ${title.substring(0, 200)}\n\nFull analysis → https://www.qfinhub.com/blog/${slug}`;
    const result = await xClient.v2.tweet(text.substring(0, 4000));
    console.log(`  ✅ Tweeted: ${result.data.id}`);
    return result.data.id;
  } catch(e) {
    console.log(`  ⏭️ Tweet failed (non-critical): ${e.message}`);
    return null;
  }
}

// ─── Log ───
function log(type, details) {
  let log = [];
  if (existsSync(LOG_FILE)) try { log = JSON.parse(readFileSync(LOG_FILE, "utf-8")); } catch(e) {}
  log.push({ ts: new Date().toISOString(), type, details });
  if (log.length > 500) log = log.slice(-500);
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// ─── Show recent activity ───
function showRecent() {
  if (!existsSync(LOG_FILE)) { console.log("No activity yet."); return; }
  const log = JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  const newsEntries = log.filter(e => e.type === "news-published" || e.type === "news-match");
  console.log(`\n📰 Recent Newsjacking Activity:\n`);
  newsEntries.slice(-10).reverse().forEach(e => {
    console.log(`  [${e.ts.split("T")[0]}] ${e.type}`);
    if (e.details.title) console.log(`    ${e.details.title.substring(0,80)}`);
    if (e.details.slug) console.log(`    → /blog/${e.details.slug}`);
    console.log();
  });
  console.log(`Total matches: ${newsEntries.filter(e => e.type === "news-match").length}`);
  console.log(`Total published: ${newsEntries.filter(e => e.type === "news-published").length}`);
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  QFINHUB Newsjacking Bot");
  console.log("  " + new Date().toISOString().split("T")[0]);
  console.log("═══════════════════════════════════════════\n");

  if (args.includes("--recent")) { showRecent(); return; }

  const published = loadPublished();
  const isTest = args.includes("--test");

  // Phase 1: Fetch all RSS feeds
  console.log("📡 Phase 1: Fetching RSS feeds...");
  let allItems = [];

  for (const feed of FEEDS) {
    process.stdout.write(`  ${feed.name}... `);
    try {
      const xml = await fetchRSS(feed.url);
      const items = parseRSSItems(xml);
      items.forEach(i => i.feedName = feed.name);
      items.forEach(i => i.feedCategory = feed.category);
      allItems = allItems.concat(items);
      console.log(`${items.length} items`);
    } catch(e) {
      const msg = e.message || e.code || "unknown";
      console.log(`❌ ${msg.substring(0, 30)}`);
    }
    // Small delay between feeds
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1500));
  }

  console.log(`\n  Total: ${allItems.length} news items from ${FEEDS.length} feeds\n`);

  // Phase 2: Match news to triggers
  console.log("🔍 Phase 2: Matching relevant news...");
  const matches = [];

  for (const item of allItems) {
    const match = detectMatch(item.title, item.description);
    if (match) {
      // Skip already published
      if (published[item.guid]) {
        continue;
      }
      matches.push({ item, match });
    }
  }

  // Sort by priority
  matches.sort((a, b) => b.match.priority - a.match.priority);

  // Deduplicate by similar title
  const uniqueMatches = [];
  const seenTitles = new Set();
  for (const m of matches) {
    const key = m.item.title.toLowerCase().substring(0, 40);
    if (!seenTitles.has(key)) {
      seenTitles.add(key);
      uniqueMatches.push(m);
    }
  }

  console.log(`  ${uniqueMatches.length} new relevant news items found\n`);

  if (uniqueMatches.length === 0) {
    console.log("✅ No breaking news to cover. Next check will find new items.");
    log("check", { itemsFound: allItems.length, matches: 0 });
    return;
  }

  // Phase 3: Generate + publish
  console.log("✍️ Phase 3: Generating blog posts...\n");
  let publishedCount = 0;

  for (const match of uniqueMatches.slice(0, 2)) { // Max 2 per run
    const item = match.item;
    const category = match.match.category || item.feedCategory;
    const calcConfig = CATEGORY_MAP[category] || CATEGORY_MAP["personal-finance"];
    const calculators = calcConfig.calculators;

    console.log(`  [${publishedCount + 1}] ${item.title.substring(0, 80)}`);
    console.log(`      Source: ${item.feedName} | Category: ${category}`);

    log("news-match", { title: item.title, category, source: item.feedName, guid: item.guid });

    if (isTest) {
      console.log(`      🔷 TEST MODE — would generate & publish post\n`);
      continue;
    }

    // Generate AI blog post
    console.log(`      Generating AI post...`);
    const blogPost = await generateBlogPost(item, category, calculators);
    if (!blogPost) {
      console.log(`      ❌ Generation failed\n`);
      continue;
    }

    console.log(`      Title: ${blogPost.title.substring(0, 60)}...`);

    // Append to posts.ts
    const slug = appendToPosts(blogPost, category, calculators);
    if (!slug) {
      console.log(`      ❌ Publishing failed\n`);
      continue;
    }

    // Tweet about it
    console.log(`      Tweeting...`);
    const tweetId = await tweetPost(slug, blogPost.title);

    // Mark as published
    published[item.guid] = {
      slug,
      title: blogPost.title,
      publishedAt: new Date().toISOString(),
      category,
      tweetId,
      sourceUrl: item.link,
    };
    writeFileSync(PUBLISHED_FILE, JSON.stringify(published, null, 2));

    log("news-published", { slug, title: blogPost.title, category, tweetId, guid: item.guid });
    publishedCount++;

    console.log(`      ✅ Published! (run 'npm run build' to deploy)\n`);

    // Delay between posts
    if (publishedCount < Math.min(uniqueMatches.length, 2)) {
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  console.log(`📊 Summary: ${publishedCount} post(s) published from ${uniqueMatches.length} matches`);
  console.log(`   Next build will include the new blog post(s)`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
