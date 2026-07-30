#!/usr/bin/env node
/**
 * QFINHUB Blog Content Engine v2 — Quality-First
 * =================================================
 *
 * Replaces the old blog-agent.cjs (which generated AI-pattern obvious posts
 * like "Investing Why is NRx Pharma a top penny stock").
 *
 * KEY CHANGES vs v1:
 * - EVERGREEN topics are now the DEFAULT (was: trending first)
 * - Trending is only a fallback when evergreen bank is exhausted
 * - Hard filters block stock-picks, news-jacking, penny-stock patterns
 * - Quality rules in the DeepSeek prompt: specific dollar examples,
 *   conversational voice, no AI-isms, no specific stock tickers
 * - --quality-check mode validates a draft against QFINHUB standards
 * - --preview mode shows the post body before commit/push
 *
 * USAGE:
 *   node scripts/blog-agent.cjs              Generate + publish today's post (gated)
 *   node scripts/blog-agent.cjs --test       Show topic only, no publish
 *   node scripts/blog-agent.cjs --preview    Generate + show full post before commit
 *   node scripts/blog-agent.cjs --status     Show blog stats + recent posts
 *   node scripts/blog-agent.cjs --quality-check FILE  Score an existing draft
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const https = require("https");

const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".blog-agent");
const LOG_FILE = resolve(DATA_DIR, "activity-log.json");
const TOPICS_FILE = resolve(DATA_DIR, "used-topics.json");
const POSTS_FILE = resolve(ROOT, "src/lib/blog/posts.ts");

// Load .env.local manually (no dotenv dependency)
function loadEnv() {
  const envPath = resolve(ROOT, ".env.local");
  if (existsSync(envPath)) {
    const txt = readFileSync(envPath, "utf-8");
    for (const line of txt.split("\n")) {
      const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
      if (m && !process.env[m[1]]) {
        process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
      }
    }
  }
}
loadEnv();
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_PRO_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.qfinhub.com";

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// ─── Hard-block patterns (trending news we will NEVER use) ───
const FORBIDDEN_TITLE_PATTERNS = [
  /\b(NRx|NRXP|penny stock|stock pick|top stock|ticker)\b/i,
  /\b(buy now|hot stock|meme stock|to the moon)\b/i,
  /\b(007|james bond|first light|metacritic|game review)\b/i,  // the old nonsense
  /\b(nasdaq|dow|s&p)\s+(today|live|now|jumps?|falls?|rebound)/i,
  /\bwhy\b.*\b(is|are)\b.*\b(surging|crashing|rallying)\b/i,
  /\b(elon musk|trump|biden)\b/i,  // political/news-jacking — YMYL risk
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

// ─── Evergreen Topic Bank v2 (DEFAULT — quality > quantity) ───
// Every title is specific, actionable, free of stock-picks + AI-isms.
const EVERGREEN_TOPICS = [
  { title: "How to Calculate Your Mortgage Payment Step by Step", kw: "mortgage payment calculation", cat: "mortgage" },
  { title: "Compound Interest Explained: Why $1,000 Becomes $10,000", kw: "compound interest explained", cat: "investment" },
  { title: "Retirement Planning in Your 30s: A Concrete 30-Year Plan", kw: "retirement planning 30s guide", cat: "retirement" },
  { title: "Credit Card Debt Snowball vs Avalanche: Which Saves More?", kw: "debt snowball avalanche comparison", cat: "loan" },
  { title: "How Much Emergency Fund Do You Need in 2026?", kw: "emergency fund amount 2026", cat: "personal" },
  { title: "Rent vs Buy: The Real Numbers Behind the Decision", kw: "rent vs buy decision framework", cat: "mortgage" },
  { title: "Tax Brackets 2026: What Your Actual Tax Rate Is", kw: "tax brackets 2026 explained", cat: "tax" },
  { title: "How to Budget Using the 50/30/20 Rule (With Examples)", kw: "50 30 20 budget rule guide", cat: "personal" },
  { title: "First-Time Home Buyer Guide: What to Know in 2026", kw: "first time home buyer guide 2026", cat: "mortgage" },
  { title: "Student Loan Repayment: Which Federal Plan Fits You?", kw: "student loan repayment strategy comparison", cat: "loan" },
  { title: "Net Worth by Age: Where Should You Be in Your 30s, 40s, 50s?", kw: "net worth by age comparison", cat: "personal" },
  { title: "Simple vs Compound Interest: The Difference That Builds Wealth", kw: "simple vs compound interest difference", cat: "investment" },
  { title: "How Much House Can I Afford? The 28/36 Rule With Examples", kw: "how much house can i afford rule", cat: "mortgage" },
  { title: "CD vs High-Yield Savings: Where to Park Cash in 2026", kw: "CD vs savings account comparison", cat: "personal" },
  { title: "401(k) vs IRA: Which Retirement Account Wins for You?", kw: "401k vs IRA comparison guide", cat: "retirement" },
  { title: "Home Equity Loan vs HELOC: Costs, Risks, and Use Cases", kw: "home equity loan vs HELOC", cat: "mortgage" },
  { title: "How Inflation Quietly Eats $50,000 of Savings (And the Fix)", kw: "inflation impact on savings", cat: "personal" },
  { title: "The 4% Rule for Retirement: Does It Still Work in 2026?", kw: "4 percent rule retirement 2026", cat: "retirement" },
  { title: "Capital Gains Tax: What You Pay When You Sell Stocks or Funds", kw: "capital gains tax explained 2026", cat: "tax" },
  { title: "Zero-Based Budget: A Step-by-Step Method That Actually Works", kw: "zero based budget method explained", cat: "personal" },
  { title: "Mortgage Pre-Approval vs Pre-Qualified: Don't Confuse These", kw: "mortgage pre-approval vs pre-qualification", cat: "mortgage" },
  { title: "Dollar-Cost Averaging: How Slower Investing Often Wins", kw: "dollar cost averaging explained investing", cat: "investment" },
  { title: "How to Pay Off $10,000 in Credit Card Debt: 3 Real Plans", kw: "pay off 10000 credit card debt strategy", cat: "loan" },
  { title: "Roth IRA vs Traditional IRA: A Tax-by-Tax Comparison", kw: "Roth IRA vs traditional IRA comparison", cat: "retirement" },
  { title: "How to Calculate Your Net Worth (With a Free Template)", kw: "calculate net worth template", cat: "personal" },
  { title: "What Happens to Your Debt When You Die (And How to Prepare)", kw: "what happens to debt when you die", cat: "personal" },
  { title: "How Long Will $1 Million Last in Retirement? By State", kw: "how long will 1 million last in retirement", cat: "retirement" },
  { title: "Mortgage Refinance Break-Even: When It Pays Off (And When It Doesn't)", kw: "mortgage refinance break even calculator", cat: "mortgage" },
  { title: "Tax-Loss Harvesting: How to Turn 2026 Losses Into a 2027 Refund", kw: "tax loss harvesting explained 2026", cat: "tax" },
  { title: "Biweekly vs Monthly Mortgage Payments: The Math Behind the Savings", kw: "biweekly vs monthly mortgage payments", cat: "mortgage" },
];

// ─── RSS sources — used ONLY as fallback content seeds ───
const RSS_FEEDS = [
  { name: "Google Trends Finance", url: "https://trends.google.com/trending/rss?geo=US&category=finance" },
  { name: "CNBC Finance", url: "https://www.cnbc.com/id/10000664/device/rss/rss.xml" },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex" },
  { name: "Housing Wire", url: "https://www.housingwire.com/feed/" },
  { name: "Realtor.com", url: "https://www.realtor.com/news/feed/" },
];

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
    } catch (e) { reject(e); }
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

// ─── Quality check: reject forbidden patterns ───
function isForbiddenTopic(title) {
  return FORBIDDEN_TITLE_PATTERNS.some(p => p.test(title));
}

// ─── Select topic — EVERGREEN FIRST ───
function selectTopic(newsItems) {
  const used = existsSync(TOPICS_FILE) ? JSON.parse(readFileSync(TOPICS_FILE, "utf-8")) : { titles: [], dates: [] };

  // STEP 1: Try evergreen topics (DEFAULT — quality over recency)
  const recentEvergreenUsed = new Set(
    used.titles
      .filter((_, i) => new Date(used.dates[i] || 0) > new Date(Date.now() - 60 * 86400000))
  );
  for (const t of EVERGREEN_TOPICS) {
    const sig = t.title.substring(0, 50);
    if (!recentEvergreenUsed.has(sig)) {
      return { ...t, source: "evergreen" };
    }
  }

  // STEP 2: Only if evergreen exhausted, try trending news
  // AND only pick non-forbidden topics that fit a calculator category
  let candidates = [];
  for (const item of newsItems) {
    if (isForbiddenTopic(item.title)) continue;  // hard filter
    const t = item.title.toLowerCase();

    if ((t.includes("mortgage") || t.includes("rate") || t.includes("housing")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "mortgage rates 2026 " + item.title.substring(0, 30), cat: "mortgage", source: "trend" });
    }
    if ((t.includes("retire") || t.includes("401k") || t.includes("social security")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "retirement planning " + item.title.substring(0, 30), cat: "retirement", source: "trend" });
    }
    if ((t.includes("tax") || t.includes("irs") || t.includes("deduction")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "tax tips 2026 " + item.title.substring(0, 30), cat: "tax", source: "trend" });
    }
    // NO investment/stock-market trend candidates (too noisy)
    if ((t.includes("inflation") || t.includes("cpi") || t.includes("economy")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "inflation 2026 " + item.title.substring(0, 30), cat: "personal", source: "trend" });
    }
    if ((t.includes("debt") || t.includes("credit") || t.includes("student loan")) && !used.titles.includes(t.substring(0, 40))) {
      candidates.push({ title: item.title, kw: "debt payoff " + item.title.substring(0, 30), cat: "loan", source: "trend" });
    }
  }

  if (candidates.length > 0) {
    return candidates[Math.floor(Math.random() * candidates.length)];
  }

  // STEP 3: Last resort — reset and pick random evergreen
  writeFileSync(TOPICS_FILE, JSON.stringify({ titles: [], dates: [] }));
  return { ...EVERGREEN_TOPICS[Math.floor(Math.random() * EVERGREEN_TOPICS.length)], source: "evergreen" };
}

function markTopicUsed(chosen) {
  const used = existsSync(TOPICS_FILE) ? JSON.parse(readFileSync(TOPICS_FILE, "utf-8")) : { titles: [], dates: [] };
  used.titles.push(chosen.title.substring(0, 50));
  used.dates.push(new Date().toISOString());
  if (used.titles.length > 100) { used.titles = used.titles.slice(-50); used.dates = used.dates.slice(-50); }
  writeFileSync(TOPICS_FILE, JSON.stringify(used));
}

// ─── Quality-First Generation (Gemini preferred for content per memory) ───
async function generateBlogPostGemini(topic, prompt, retries = 2) {
  if (!GEMINI_KEY) return null;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8000 },
        }),
      });
      if (resp.status === 503 && attempt < retries) {
        const wait = 2 + attempt * 3;  // 2s, 5s, 8s
        console.log(`  Gemini 503 (attempt ${attempt+1}/${retries+1}), retrying in ${wait}s...`);
        await new Promise(r => setTimeout(r, wait * 1000));
        continue;
      }
      if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${(await resp.text()).substring(0, 200)}`);
      const data = await resp.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch (e) {
      if (attempt === retries) {
        console.error(`  Gemini gen error: ${e.message}`);
        return null;
      }
    }
  }
  return null;
}

async function generateBlogPostDeepSeek(topic, prompt) {
  if (!DEEPSEEK_KEY) return null;
  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.65,
        max_tokens: 4500,
      }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    return data.choices?.[0]?.message?.content || "";
  } catch (e) {
    console.error(`  DeepSeek gen error: ${e.message}`);
    return null;
  }
}

async function generateBlogPost(topic) {
  if (!GEMINI_KEY && !DEEPSEEK_KEY) {
    console.error("  No AI provider configured (GEMINI_API_KEY or DEEPSEEK_API_KEY required)");
    return null;
  }

  const calc = CALC_MAP[topic.cat] || CALC_MAP.personal;

  const prompt = `Write a QFINHUB blog post. QFINHUB is a financial calculators website at qfinhub.com — calm, authoritative, conversational voice.

TOPIC: ${topic.title}
TARGET KEYWORD: "${topic.kw}"
CATEGORY: ${topic.cat}
RELATED CALCULATOR: ${calc.name} (${BASE_URL}${calc.url})

VOICE & STYLE (HARD RULES — every rule is enforced):
- Write like a friendly financial planner talking to a smart friend. No "delve into", no "navigate the complexities", no "in today's fast-paced world".
- Use SPECIFIC 2026 dollar examples throughout (e.g. "$1,000 invested at 7% for 30 years becomes $7,612", not "over time").
- Show the math. Numbers > adjectives.
- Short paragraphs (2-4 sentences). White space matters.
- No emojis. No exclamation points except in quoted user questions.
- NEVER recommend specific stocks, tickers, or crypto. NEVER use "buy", "sell", "top pick".
- NEVER mention politicians, elections, or current events as news.
- 1200-1600 words total.

STRUCTURE (exact sections in this order):

<h2>Quick Answer</h2>
<p>[3-4 sentences]</p>

<h2>The Basics</h2>
<p>[4-6 short paragraphs]</p>

<h2>The Math</h2>
<p>[worked example with real 2026 numbers, max 200 words]</p>

<h2>Step-by-Step</h2>
<ol>
  <li>[step 1]</li>
  <li>[step 2]</li>
  <li>[step 3]</li>
  <li>[step 4]</li>
</ol>

<h2>Common Mistakes</h2>
<p>[3 specific mistakes with the fix]</p>

<h2>Frequently Asked Questions</h2>
<h3>What is [question ending with ?]</h3>
<p>[2-3 sentence answer]</p>
<h3>How does [question ending with ?]</h3>
<p>[2-3 sentence answer]</p>
<h3>When should [question ending with ?]</h3>
<p>[2-3 sentence answer]</p>
<h3>Is [question ending with ?]</h3>
<p>[2-3 sentence answer]</p>

The FAQ section MUST use <h2>Frequently Asked Questions</h2> followed by 4 <h3> sub-headings ending in "?". Plain text questions in <p> tags are also accepted but <h3> questions are preferred (Google extracts these for featured snippets).

TOTAL TARGET: 800-1200 words (NOT 1200-1600 — Gemini truncates longer output).

CRITICAL: Keep the content HTML concise. Each section should be tight. Do NOT pad with filler sentences.

LINKS:
- Include 4-6 internal links to QFINHUB calculators (format: ${BASE_URL}/calculators/SLUG)
- Include exactly ONE comparison table

CTA: At the end, a single line: "Run the numbers yourself: [calculator link]"

OUTPUT EXACTLY THIS JSON (no markdown outside the JSON, no code fences, no preamble):
{
  "title": "60-char SEO title including target keyword",
  "metaDescription": "150-160 char meta description (STRICT — must be 150-160 chars, not longer)",
  "content": "Full HTML using <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <strong>. 800-1200 words. MUST include the FAQ section in the exact format shown above.",
  "readingTime": 6,
  "calculators": ["${calc.slug}", "budget", "savings-goal", "retirement"]
}`;

  // Try Gemini first (preferred for content)
  let raw = await generateBlogPostGemini(topic, prompt);
  let provider = "gemini";
  if (!raw) {
    console.log("  Gemini failed, trying DeepSeek fallback...");
    raw = await generateBlogPostDeepSeek(topic, prompt);
    provider = "deepseek";
  }
  if (!raw) {
    console.error("  All AI providers failed.");
    return null;
  }
  console.log(`  Generated by: ${provider}`);

  try {
    // More aggressive JSON extraction (Gemini sometimes wraps in fences + preamble)
    let clean = raw.trim();
    // Strip leading/trailing code fences
    clean = clean.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "").trim();
    // If still no JSON bounds, try to find them
    let start = clean.indexOf("{");
    let end = clean.lastIndexOf("}");
    if (start === -1 || end === -1) {
      // Last resort: try to find the JSON object within prose
      console.error("  Raw (first 300):", raw.substring(0, 300));
      console.error("  Raw (last 300):", raw.substring(raw.length - 300));
      throw new Error("No JSON bounds");
    }
    const post = JSON.parse(clean.substring(start, end + 1));
    post._provider = provider;
    return post;
  } catch (e) {
    console.error(`  Parse error: ${e.message}`);
    console.error(`  Raw length: ${raw.length}`);
    return null;
  }
}

// ─── Quality gate before publish ───
//
// Authoritative source (2026-07-30):
//   - Google RETIRED FAQ rich result in Aug 2023
//     (https://developers.google.com/search/blog → FAQ no longer in feature list).
//   - FAQPage JSON-LD schema is still technically valid but produces NO rich result.
//   - Google rewards: visible Q&A HTML sections (Google extracts them for snippets),
//     Article structured data, and original/first-hand expertise (Helpful Content).
//
// This gate validates:
//   1. Q&A section EXISTS as visible HTML (heading + 3+ Q&A pairs).
//   2. Heading matches Google's accepted phrasing (FAQ / Questions / Q&A /
//      Common questions / Frequently asked).
//   3. Real Q&A pairs detected — at minimum 3 question marks in headings or
//      <strong> tags after the Q&A section heading.
function validateFAQSection(content) {
  const issues = [];
  // Strip the <table>...</table> from consideration so table cells with "?"
  // don't false-positive.
  const stripped = content.replace(/<table[\s\S]*?<\/table>/gi, "");

  // 1. Find an H2/H3 that matches an accepted FAQ heading
  const headingRe = /<h([23])[^>]*>([^<]*(?:FAQ|Frequently[\s\xa0]Asked|Common\s+Questions?|Questions?|Q\s*&\s*A|F\s*A\s*Q)[^<]*)<\/h\1>/i;
  const headingMatch = stripped.match(headingRe);

  if (!headingMatch) {
    issues.push(
      "Missing FAQ section. Need an H2/H3 with one of: " +
      "'FAQ', 'Frequently Asked Questions', 'Common Questions', 'Questions', " +
      "'Q&A'. Google extracts visible Q&A for featured snippets."
    );
    return { issues, faqFound: false, qaPairs: 0, headingText: null };
  }

  const headingLevel = headingMatch[1];
  const headingText = headingMatch[2].trim();
  const startIdx = headingMatch.index + headingMatch[0].length;

  // 2. Slice content from after the heading to end (or to next same-level H2)
  const nextHeadingRe = new RegExp(`<h${headingLevel}[\\s>][^<]*</h${headingLevel}>`, "i");
  const afterFaq = stripped.substring(startIdx);
  const endMatch = afterFaq.match(nextHeadingRe);
  const faqBody = endMatch ? afterFaq.substring(0, endMatch.index) : afterFaq;

  // 3. Count question-answer pairs:
  //    - Each <strong>...</strong> ending in "?" = one Q
  //    - Each <h3>/<h4> ending in "?" = one Q
  //    - Plain-text question (sentence ending in "?") inside <p> = one Q
  //    - Filter out false positives: rhetorical, table cells already excluded.
  const strongQuestions = (faqBody.match(/<strong[^>]*>[^<]*\?<\/strong>/gi) || []).length;
  const subHeadingQuestions = (faqBody.match(/<h[34][^>]*>[^<]*\?<\/h[34]>/gi) || []).length;
  // Plain-text question marks in <p> blocks (excluding those already counted
  // as <strong> or <h3>/<h4>)
  const inlineText = faqBody
    .replace(/<strong[^>]*>[^<]*\?<\/strong>/gi, "")
    .replace(/<h[34][^>]*>[^<]*\?<\/h[34]>/gi, "");
  const paraQuestions = (inlineText.match(/<p[^>]*>[^<]*\?/gi) || []).length;
  const qaPairs = strongQuestions + subHeadingQuestions + paraQuestions;

  if (qaPairs < 3) {
    issues.push(
      `FAQ section has only ${qaPairs} question(s) (need 3+). ` +
      "Google's Helpful Content guidelines reward Q&A density for featured snippets."
    );
  }

  return { issues, faqFound: true, qaPairs, headingText };
}

function qualityCheck(post) {
  const issues = [];
  const wordCount = (post.content || "").replace(/<[^>]+>/g, " ").split(/\s+/).length;
  // 2026-07-30: tightened to 800+ words (matches prompt's actual target) and
  // raised the ceiling to 2000 since Gemini occasionally overshoots with rich HTML.
  if (wordCount < 800) issues.push(`Too short: ${wordCount} words (need 800+)`);
  if (wordCount > 2000) issues.push(`Too long: ${wordCount} words (max 2000)`);

  // AI-isms (hard reject)
  const aiisms = [
    "delve into", "navigate the complexities", "in today's", "fast-paced",
    "it's important to note", "dive deep", "unlock the power",
    "in this article we will", "let's explore", "without further ado",
    "in the world of", "game-changer", "game changer",
  ];
  for (const aiism of aiisms) {
    if (post.content.toLowerCase().includes(aiism)) issues.push(`AI-ism detected: "${aiism}"`);
  }

  // Internal links — at least 4 to calculators
  const linkCount = (post.content.match(/qfinhub\.com\/calculators\//g) || []).length;
  if (linkCount < 4) issues.push(`Only ${linkCount} internal links to /calculators/ (need 4-6)`);

  // Comparison table — at least one
  if (!post.content.includes("<table")) issues.push("Missing comparison table");

  // FAQ section — visible HTML, 3+ Q&A pairs, valid heading phrasing
  const faqResult = validateFAQSection(post.content);
  issues.push(...faqResult.issues);

  // Title length (Google typically truncates > 60 chars in SERPs)
  if (post.title.length > 65) issues.push(`Title too long: ${post.title.length} chars (max 65)`);

  // Meta description (Google typically truncates at ~155-160 chars on mobile,
  // but desktop can show up to ~170. 140-170 is the practical safe range.)
  if (post.metaDescription && (post.metaDescription.length < 140 || post.metaDescription.length > 170)) {
    issues.push(`Meta description: ${post.metaDescription.length} chars (target 150-160, max 170)`);
  }

  return {
    passed: issues.length === 0,
    issues,
    wordCount,
    linkCount,
    faqFound: faqResult.faqFound,
    qaPairs: faqResult.qaPairs,
  };
}

// ─── Publish ───
function publishToBlog(blogPost, topic) {
  try {
    const existing = readFileSync(POSTS_FILE, "utf-8");

    const slug = blogPost.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 80);

    if (existing.includes(`slug: "${slug}"`)) {
      console.log(`  ⏭ Post already exists: ${slug}`);
      return null;
    }

    const calcs = (blogPost.calculators || []).map(c => `"${c}"`).join(", ");

    const newEntry = `  {
    slug: "${slug}",
    title: ${JSON.stringify(blogPost.title)},
    description: ${JSON.stringify(blogPost.metaDescription)},
    category: "${topic.cat}",
    publishedAt: new Date("${new Date().toISOString().split("T")[0]}"),
    readingTime: ${blogPost.readingTime || 8},
    content: \`<div>${blogPost.content.replace(/`/g, "\\`")}</div>\`,
    calculators: [${calcs}],
  },`;

    // Insert before the closing ];
    const updated = existing.replace(/(\];?\s*)$/, `${newEntry}\n$1`);
    writeFileSync(POSTS_FILE, updated);
    return slug;
  } catch (e) {
    console.error(`  Publish error: ${e.message}`);
    return null;
  }
}

// ─── Logging ───
function logActivity(entry) {
  let log = [];
  if (existsSync(LOG_FILE)) log = JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  log.push({ ts: new Date().toISOString(), ...entry });
  if (log.length > 100) log = log.slice(-100);
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
}

// ─── Status ───
function showStatus() {
  if (!existsSync(LOG_FILE)) {
    console.log("No activity log yet.");
    return;
  }
  const log = JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  console.log(`Total posts generated: ${log.filter(e => e.type === "published").length}`);
  console.log(`Total rejections (quality): ${log.filter(e => e.type === "quality_rejected").length}`);
  console.log("\nRecent 5 posts:");
  for (const e of log.slice(-5).reverse()) {
    console.log(`  ${e.ts.substring(0, 10)} [${e.type}] ${e.details?.slug || "-"}`);
  }
}

// ─── Main ───
async function main() {
  const args = process.argv.slice(2);
  if (args.includes("--status")) return showStatus();

  console.log("═══════════════════════════════════════════");
  console.log("  QFINHUB Blog Content Engine v2 (Quality-First)");
  console.log("  " + new Date().toISOString().substring(0, 10));
  console.log("═══════════════════════════════════════════\n");

  console.log("📡 Fetching trending finance topics (fallback only)...");
  let allNews = [];
  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchRSS(feed.url);
      const items = parseRSS(xml);
      allNews = allNews.concat(items.map(i => ({ ...i, source: feed.name })));
      console.log(`  ${feed.name}: ${items.length} items`);
    } catch (e) {
      console.log(`  ${feed.name}: ERROR ${e.message}`);
    }
  }

  console.log("\n🎯 Selecting topic (evergreen first)...");
  const topic = selectTopic(allNews);
  console.log(`  Topic: "${topic.title}"`);
  console.log(`  Keyword: "${topic.kw}"`);
  console.log(`  Category: ${topic.cat}`);
  console.log(`  Source: ${topic.source}`);

  if (args.includes("--test")) {
    console.log("\n🔷 TEST MODE — would generate & publish");
    return;
  }

  console.log("\n✍️ Generating blog post via DeepSeek...");
  const post = await generateBlogPost(topic);
  if (!post) {
    console.error("❌ Generation failed.");
    logActivity({ type: "generation_failed", details: { kw: topic.kw } });
    process.exit(1);
  }

  // Quality gate
  const qc = qualityCheck(post);
  console.log(`\n🔍 Quality check: ${qc.passed ? "✅ PASS" : "❌ FAIL"} (${qc.wordCount} words, ${qc.linkCount} links)`);
  if (!qc.passed) {
    for (const issue of qc.issues) console.log(`  - ${issue}`);
    logActivity({ type: "quality_rejected", details: { kw: topic.kw, issues: qc.issues } });
    console.log("\n❌ Quality gate failed — not publishing.");
    process.exit(1);
  }

  if (args.includes("--preview")) {
    console.log("\n📄 PREVIEW MODE — content not committed\n");
    console.log(`Title: ${post.title}`);
    console.log(`Meta: ${post.metaDescription} (${post.metaDescription.length} chars)`);
    console.log(`\nContent (first 500 chars):\n${post.content.substring(0, 500)}...`);
    return;
  }

  console.log("\n📤 Publishing to posts.ts...");
  const slug = publishToBlog(post, topic);
  if (!slug) {
    logActivity({ type: "publish_failed", details: { kw: topic.kw } });
    process.exit(1);
  }

  markTopicUsed(topic);
  logActivity({ type: "published", details: { slug, kw: topic.kw, cat: topic.cat, source: topic.source, wordCount: qc.wordCount } });
  console.log(`\n✅ Published: ${slug}`);
}

if (require.main === module) main();

module.exports = { generateBlogPost, selectTopic, qualityCheck, isForbiddenTopic, EVERGREEN_TOPICS };