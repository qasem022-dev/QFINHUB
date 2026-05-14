#!/usr/bin/env node
/**
 * QFINHUB Blog Content Engine — Daily High-Quality SEO Posts
 * ============================================================
 *
 * Generates 1 comprehensive SEO-optimized blog post per day based on
 * trending finance topics. Each post is 1000-1500 words with:
 *
 * - SEO-optimized title, meta description, URL slug
 * - Proper heading hierarchy (H1/H2/H3)
 * - Internal links to relevant calculators (3-5 per post)
 * - FAQ section with schema markup (QAPage structured data)
 * - Reading time estimation
 * - Category tagging
 *
 * Uses RSS feeds + AI to find trends, then DeepSeek to write.
 *
 * USAGE:
 *   node scripts/blog-agent.cjs              Generate and publish today's post
 *   node scripts/blog-agent.cjs --test       Show topic + preview, no publish
 *   node scripts/blog-agent.cjs --status     Show blog stats
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const https = require("https");

const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".blog-agent");
const LOG_FILE = resolve(DATA_DIR, "activity-log.json");
const TOPICS_FILE = resolve(DATA_DIR, "used-topics.json");
const POSTS_FILE = resolve(ROOT, "src", "lib", "blog", "posts.ts");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Load .env
try {
  const env = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
  env.split("\n").forEach(l => {
    const m = l.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch(e) {}

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";
const BASE_URL = "https://www.qfinhub.com";
const args = process.argv.slice(2);

// ─── Trend Sources (RSS feeds) ───
const TREND_FEEDS = [
  { name: "Google Trends Finance", url: "https://trends.google.com/trending/rss?geo=US&category=finance" },
  { name: "CNBC Finance", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss" },
  { name: "Housing Wire", url: "https://www.housingwire.com/feed/" },
  { name: "Realtor.com", url: "https://www.realtor.com/news/feed/" },
];

// ─── Evergreen Topic Bank (when no trending news) ───
const EVERGREEN_TOPICS = [
  { title: "How to Calculate Your Mortgage Payment Step by Step", kw: "mortgage payment calculation", cat: "mortgage" },
  { title: "Compound Interest Explained: Why Einstein Called It the 8th Wonder", kw: "compound interest explained", cat: "investment" },
  { title: "The Complete Guide to Retirement Planning in Your 30s", kw: "retirement planning 30s guide", cat: "retirement" },
  { title: "Credit Card Debt Snowball vs Avalanche: Which Saves More?", kw: "debt snowball avalanche comparison", cat: "loan" },
  { title: "How Much Emergency Fund Do You Really Need in 2025?", kw: "emergency fund amount 2025", cat: "personal" },
  { title: "Rent vs Buy Calculator: The Data-Driven Decision Framework", kw: "rent vs buy decision framework", cat: "mortgage" },
  { title: "Tax Brackets 2025: What Your Tax Rate Actually Is", kw: "tax brackets 2025 explained", cat: "tax" },
  { title: "How to Budget Using the 50/30/20 Rule (With Calculator)", kw: "50 30 20 budget rule guide", cat: "personal" },
  { title: "First-Time Home Buyer Guide: Everything You Need to Know", kw: "first time home buyer guide 2025", cat: "mortgage" },
  { title: "Student Loan Repayment Strategies: Which Plan Is Right for You?", kw: "student loan repayment strategy comparison", cat: "loan" },
  { title: "Net Worth by Age: How Do You Compare to Average Americans?", kw: "net worth by age comparison", cat: "personal" },
  { title: "Simple vs Compound Interest: The Difference That Makes You Rich", kw: "simple vs compound interest difference", cat: "investment" },
  { title: "How Much House Can I Afford? The 28/36 Rule Explained", kw: "how much house can i afford rule", cat: "mortgage" },
  { title: "CD vs Savings Account: Where Should You Park Your Money?", kw: "CD vs savings account comparison", cat: "personal" },
  { title: "401(k) vs IRA: Which Retirement Account Is Better for You?", kw: "401k vs IRA comparison guide", cat: "retirement" },
  { title: "Home Equity Loan vs HELOC: Which One to Choose?", kw: "home equity loan vs HELOC", cat: "mortgage" },
  { title: "How Inflation Eats Your Savings (And What to Do About It)", kw: "inflation impact on savings", cat: "personal" },
  { title: "The 4% Rule for Retirement: Does It Still Work in 2025?", kw: "4 percent rule retirement 2025", cat: "retirement" },
  { title: "Capital Gains Tax: What You Pay When You Sell Investments", kw: "capital gains tax explained 2025", cat: "tax" },
  { title: "How to Build a Zero-Based Budget That Actually Works", kw: "zero based budget method explained", cat: "personal" },
  { title: "Mortgage Pre-Approval vs Pre-Qualification: Key Differences", kw: "mortgage pre-approval vs pre-qualification", cat: "mortgage" },
  { title: "Dollar-Cost Averaging: Why Slow and Steady Wins the Investment Race", kw: "dollar cost averaging explained investing", cat: "investment" },
  { title: "How to Pay Off $10,000 in Credit Card Debt Fast", kw: "pay off 10000 credit card debt strategy", cat: "loan" },
  { title: "Roth IRA vs Traditional IRA: The Complete Comparison", kw: "Roth IRA vs traditional IRA comparison", cat: "retirement" },
  { title: "How to Calculate Your Net Worth (Free Template)", kw: "calculate net worth template", cat: "personal" },
];

// ─── Calculator keyword mapping ───
const CALC_MAP = {
  mortgage: { slug: "mortgage-affordability", url: "/calculators/mortgage-affordability", name: "Mortgage Affordability Calculator" },
  loan: { slug: "credit-card-payoff", url: "/calculators/credit-card-payoff", name: "Debt Payoff Calculator" },
  investment: { slug: "compound-interest", url: "/calculators/compound-interest", name: "Compound Interest Calculator" },
  retirement: { slug: "retirement", url: "/calculators/retirement", name: "Retirement Calculator" },
  tax: { slug: "tax", url: "/calculators/tax", name: "Tax Calculator" },
  personal: { slug: "budget", url: "/calculators/budget", name: "Budget Planner" },
};

// ─── Fetch RSS ───
function fetchRSS(url) {
  return new Promise((resolve, reject) => {
    try {
      const parsed = new URL(url);
      const mod = parsed.protocol === "https:" ? https : require("http");
      mod.get(url, { timeout: 10000, headers: { "User-Agent": "Mozilla/5.0" } }, (res) => {
        let data = "";
        res.on("data", c => data += c);
        res.on("end", () => resolve(data));
      }).on("error", reject).on("timeout", function() { this.destroy(); reject(new Error("timeout")); });
    } catch(e) { reject(e); }
  });
}

function parseRSS(xml) {
  const items = [];
  const regex = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    const b = m[1];
    const title = (b.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [,""])[1].trim();
    const desc = (b.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [,""])[1].replace(/<[^>]+>/g,"").trim();
    if (title) items.push({ title, description: desc.substring(0, 300) });
  }
  return items;
}

// ─── Select topic ───
function selectTopic(newsItems) {
  const used = existsSync(TOPICS_FILE) ? JSON.parse(readFileSync(TOPICS_FILE, "utf-8")) : { titles: [], dates: [] };

  // First: Try to find a trending topic from news
  let candidates = [];

  for (const item of newsItems) {
    const t = item.title.toLowerCase();
    const d = item.description.toLowerCase();

    if ((t.includes("mortgage") || t.includes("rate") || t.includes("housing")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "mortgage rates 2025 " + item.title.substring(0, 30), cat: "mortgage", source: "trend" });
    }
    if ((t.includes("retire") || t.includes("401k") || t.includes("social security")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "retirement planning " + item.title.substring(0, 30), cat: "retirement", source: "trend" });
    }
    if ((t.includes("tax") || t.includes("irs") || t.includes("deduction")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "tax tips " + item.title.substring(0, 30), cat: "tax", source: "trend" });
    }
    if ((t.includes("invest") || t.includes("stock") || t.includes("market")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "investing " + item.title.substring(0, 30), cat: "investment", source: "trend" });
    }
    if ((t.includes("inflation") || t.includes("cpi") || t.includes("economy")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "inflation economy " + item.title.substring(0, 30), cat: "personal", source: "trend" });
    }
    if ((t.includes("debt") || t.includes("credit") || t.includes("student loan")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "debt " + item.title.substring(0, 30), cat: "loan", source: "trend" });
    }
  }

  // If no trending topic, pick from evergreen bank (avoid repeats)
  if (candidates.length === 0) {
    // Find evergreen topics not used in last 30 days
    const recent30 = new Date(Date.now() - 30 * 86400000);
    const recentUsed = used.dates.filter(d => new Date(d) > recent30).length;

    for (const t of EVERGREEN_TOPICS) {
      if (!used.titles.includes(t.title.substring(0, 50))) {
        candidates.push({ ...t, source: "evergreen" });
        break;
      }
    }

    // If all used, reset
    if (candidates.length === 0) {
      writeFileSync(TOPICS_FILE, JSON.stringify({ titles: [], dates: [] }));
      candidates = [EVERGREEN_TOPICS[Math.floor(Math.random() * EVERGREEN_TOPICS.length)]];
      candidates[0].source = "evergreen";
    }
  }

  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  // Mark as used
  used.titles.push(chosen.title.substring(0, 50));
  used.dates.push(new Date().toISOString());
  if (used.titles.length > 100) { used.titles = used.titles.slice(-50); used.dates = used.dates.slice(-50); }
  writeFileSync(TOPICS_FILE, JSON.stringify(used));

  return chosen;
}

// ─── Generate SEO blog post via DeepSeek ───
async function generateBlogPost(topic) {
  if (!DEEPSEEK_KEY) return null;

  const calc = CALC_MAP[topic.cat] || CALC_MAP.personal;

  const prompt = `Write a comprehensive, SEO-optimized blog post for QFINHUB (qfinhub.com), a financial calculators website.

TOPIC: ${topic.title}
TARGET KEYWORD: "${topic.kw}"
CATEGORY: ${topic.cat}
RELATED CALCULATOR: ${calc.name} (${BASE_URL}${calc.url})

REQUIREMENTS:
- 1200-1800 words
- SEO-optimized title (include target keyword naturally)
- Meta description (150-160 chars, include keyword)
- Proper structure: ## TL;DR, ## The Basics, ## Why It Matters, ## How to Calculate, ## Step-by-Step Guide, ## Common Mistakes, ## FAQ
- Include 3-5 internal links to QFINHUB calculators (format: ${BASE_URL}/calculators/SLUG)
- Include a helpful comparison table using markdown table format
- FAQ section with 4-5 questions (these also work as FAQ schema)
- Practical, actionable advice — not just theory
- Conversational but authoritative tone
- Important: At the end, add a "Ready to run the numbers?" call-to-action linking to the relevant calculator

OUTPUT EXACTLY THIS JSON:
{
  "title": "SEO title (50-60 chars, includes target keyword)",
  "metaDescription": "Meta description (150-160 chars)",
  "content": "Full HTML content using <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <strong> tags. At least 800 words of real content.",
  "readingTime": 8,
  "calculators": ["${calc.slug}", "budget", "savings-goal", "retirement"]
}

Return ONLY valid JSON. No markdown outside the JSON.`;

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";

    // Handle code fence wrapping
    const clean = raw.replace(/^```(?:json)?\s*/gm, "").replace(/```\s*$/gm, "").trim();
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON bounds");

    return JSON.parse(clean.substring(start, end + 1));
  } catch(e) {
    console.error(`  AI gen error: ${e.message}`);
    return null;
  }
}

// ─── Append to posts.ts ───
function publishToBlog(blogPost, topic) {
  try {
    const existing = readFileSync(POSTS_FILE, "utf-8");

    const slug = blogPost.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 80);

    if (existing.includes(`slug: "${slug}"`)) {
      console.log(`  ⏭️ Post already exists: ${slug}`);
      return null;
    }

    const calcs = (blogPost.calculators || []).map(c => `"${c}"`).join(", ");
    const today = new Date();

    const newEntry = `  {
    slug: "${slug}",
    title: "${blogPost.title.replace(/"/g, '\\"')}",
    description: "${(blogPost.metaDescription || "").replace(/"/g, '\\"')}",
    category: "${topic.cat}",
    publishedAt: new Date("${today.toISOString().split("T")[0]}"),
    readingTime: ${blogPost.readingTime || 8},
    relatedCalculators: [${calcs}],
    content: \`${blogPost.content}\`,
  },\n`;

    const insertPos = existing.lastIndexOf("];");
    if (insertPos === -1) return null;

    writeFileSync(POSTS_FILE, existing.substring(0, insertPos) + newEntry + existing.substring(insertPos), "utf-8");
    console.log(`  ✅ Published: /blog/${slug}`);
    return slug;
  } catch(e) {
    console.error(`  ❌ Append failed: ${e.message}`);
    return null;
  }
}

// ─── Log ───
function log(type, details) {
  let l = [];
  if (existsSync(LOG_FILE)) try { l = JSON.parse(readFileSync(LOG_FILE, "utf-8")); } catch(e) {}
  l.push({ ts: new Date().toISOString(), type, details });
  if (l.length > 365) l = l.slice(-365);
  writeFileSync(LOG_FILE, JSON.stringify(l, null, 2));
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  QFINHUB Blog Content Engine");
  console.log("  " + new Date().toISOString().split("T")[0]);
  console.log("═══════════════════════════════════════════\n");

  if (args.includes("--status")) {
    const used = existsSync(TOPICS_FILE) ? JSON.parse(readFileSync(TOPICS_FILE, "utf-8")) : {};
    const posts = existsSync(POSTS_FILE) ? readFileSync(POSTS_FILE, "utf-8") : "";
    const totalPosts = (posts.match(/slug:/g) || []).length;
    console.log(`📊 Blog Stats:`);
    console.log(`  Total blog posts: ${totalPosts}`);
    console.log(`  Topics used (ever): ${used.titles?.length || 0}`);
    console.log(`  Topics remaining (evergreen): ${EVERGREEN_TOPICS.length}`);
    return;
  }

  const isTest = args.includes("--test");

  // Step 1: Fetch trends
  console.log("📡 Fetching trending finance topics...");
  let allNews = [];
  for (const feed of TREND_FEEDS) {
    try {
      const xml = await fetchRSS(feed.url);
      const items = parseRSS(xml);
      allNews = allNews.concat(items.map(i => ({ ...i, source: feed.name })));
      console.log(`  ${feed.name}: ${items.length} items`);
    } catch(e) {
      console.log(`  ${feed.name}: ❌ ${e.message.substring(0, 30)}`);
    }
    await new Promise(r => setTimeout(r, 500));
  }

  // Step 2: Select topic
  console.log(`\n🎯 Selecting best topic...`);
  const topic = selectTopic(allNews);
  console.log(`  Topic: "${topic.title}"`);
  console.log(`  Keyword: "${topic.kw}"`);
  console.log(`  Category: ${topic.cat}`);
  console.log(`  Source: ${topic.source}`);

  if (isTest) {
    console.log(`\n🔷 TEST MODE — would generate & publish`);
    log("test", { topic: topic.title, kw: topic.kw, cat: topic.cat });
    return;
  }

  // Step 3: Generate
  console.log(`\n✍️ Generating SEO blog post...`);
  const blogPost = await generateBlogPost(topic);
  if (!blogPost) {
    console.log(`❌ Generation failed`);
    process.exit(1);
  }
  console.log(`  Title: ${blogPost.title}`);
  console.log(`  Content: ~${(blogPost.content || "").length} chars`);
  console.log(`  Reading time: ${blogPost.readingTime} min`);

  // Step 4: Publish
  console.log(`\n📝 Publishing to blog...`);
  const slug = publishToBlog(blogPost, topic);

  if (slug) {
    log("published", { slug, title: blogPost.title, cat: topic.cat, kw: topic.kw, source: topic.source });
    console.log(`\n✅ Blog post published!`);
    console.log(`   URL: ${BASE_URL}/blog/${slug}`);
    console.log(`   Run 'npm run build && vercel --prod' to deploy`);
  } else {
    console.log(`❌ Publishing failed`);
  }
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
