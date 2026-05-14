#!/usr/bin/env node
/**
 * QFINHUB Widget Outreach Engine — Fully Automated
 * ==================================================
 *
 * TWO APPROACHES (running simultaneously):
 *   APPROACH A: Search + Scrape — finds finance blogs, extracts emails, sends pitches
 *   APPROACH B: Targeted — searches for blogs already mentioning calculators
 *
 * WORKFLOW:
 *   1. Search for finance blog targets (both approaches)
 *   2. Visit each blog to verify + extract contact info
 *   3. Detect their niche → pick best widget match
 *   4. Generate personalized email using DeepSeek
 *   5. Send via Gmail SMTP
 *   6. Log all activity
 *
 * USAGE:
 *   node scripts/widget-outreach.cjs            Full cycle
 *   node scripts/widget-outreach.cjs --test      Test mode (search only, no send)
 *   node scripts/widget-outreach.cjs --reset     Reset sent log (for fresh campaign)
 *   node scripts/widget-outreach.cjs --status    Show campaign stats
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const http = require("http");
const https = require("https");
const { URL } = require("url");

// ── Load .env.local ──
try {
  const env = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  env.split("\n").forEach(l => {
    const m = l.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch(e) {}

const DATA_DIR = resolve(__dirname, "..", ".widget-outreach");
const SENT_LOG = resolve(DATA_DIR, "sent-outreach.json");
const TARGETS_FILE = resolve(DATA_DIR, "targets.json");
const CAMPAIGN_LOG = resolve(DATA_DIR, "campaign-log.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const IMG_DIR = resolve(DATA_DIR, "images");
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";
const GMAIL_USER = process.env.GMAIL_ADDRESS || "";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || "";

const args = process.argv.slice(2);

// ─── Search Queries for Finding Finance Blogs ───
const SEARCH_QUERIES_A = [
  "top personal finance blogs 2025 2026",
  "best finance blogs mortgage calculator",
  "personal finance blogger contact email",
  "finance blog list free calculator",
  "money management blog contact",
  "best budgeting blogs financial tools",
  "real estate blog mortgage calculator widget",
  "retirement planning blog resources",
  "credit card advice blog debt calculator",
  "investing blog for beginners calculator",
  "tax preparation blog free resources",
  "savings blog money tools",
  "financial independence blog FIRE calculator",
  "student loan blog debt payoff tools",
  "small business finance blog resources",
];

const SEARCH_QUERIES_B = [
  '"mortgage calculator" "blog" "widget" OR "embed"',
  '"personal finance" "calculators" site:blogspot.com OR site:wordpress.com',
  '"how to calculate" mortgage OR retirement OR savings blog email',
  '"free financial tools" blog contact OR email',
  '"financial calculator" blog OR blogger OR writer',
  '"compound interest calculator" blog reference',
  '"retirement calculator" blog post widget',
  '"debt payoff calculator" blog personal finance',
  '"budget calculator" blog post finance',
  '"home affordability" blog calculator tool',
];

// ─── Calculator Topics (niche → widget mapping) ───
const CALCULATOR_MAP = {
  "mortgage": { slug: "mortgage-affordability", name: "Mortgage Affordability Calculator", url: "https://www.qfinhub.com/calculators/mortgage-affordability" },
  "real estate": { slug: "mortgage-affordability", name: "Mortgage Affordability Calculator", url: "https://www.qfinhub.com/calculators/mortgage-affordability" },
  "home buying": { slug: "mortgage-affordability", name: "Mortgage Affordability Calculator", url: "https://www.qfinhub.com/calculators/mortgage-affordability" },
  "investing": { slug: "compound-interest", name: "Compound Interest Calculator", url: "https://www.qfinhub.com/calculators/compound-interest" },
  "stock": { slug: "investment-growth", name: "Investment Growth Calculator", url: "https://www.qfinhub.com/calculators/investment-growth" },
  "retirement": { slug: "retirement", name: "Retirement Calculator", url: "https://www.qfinhub.com/calculators/retirement" },
  "debt": { slug: "credit-card-payoff", name: "Debt Payoff Calculator", url: "https://www.qfinhub.com/calculators/credit-card-payoff" },
  "credit": { slug: "credit-card-payoff", name: "Debt Payoff Calculator", url: "https://www.qfinhub.com/calculators/credit-card-payoff" },
  "tax": { slug: "tax", name: "Tax Calculator", url: "https://www.qfinhub.com/calculators/tax" },
  "savings": { slug: "savings-goal", name: "Savings Goal Calculator", url: "https://www.qfinhub.com/calculators/savings-goal" },
  "budget": { slug: "budget", name: "Budget Planner", url: "https://www.qfinhub.com/calculators/budget" },
  "loan": { slug: "loan", name: "Loan Calculator", url: "https://www.qfinhub.com/calculators/loan" },
  "personal finance": { slug: "budget", name: "Budget Planner", url: "https://www.qfinhub.com/calculators/budget" },
  "general": { slug: "compound-interest", name: "Compound Interest Calculator", url: "https://www.qfinhub.com/calculators/compound-interest" },
};

// ─── Generate Widget Embed Code ───
function generateEmbedCode(slug, calcName) {
  const base = "https://www.qfinhub.com";
  return [
    `<iframe src="${base}/api/widget/${slug}" title="${calcName}" width="100%" height="500" frameborder="0" loading="lazy" style="max-width:100%;border:none;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.1);"></iframe>`,
    `<p style="text-align:center;font-size:12px;color:#888;margin-top:4px;"><a href="${base}/calculators/${slug}" target="_blank" rel="noopener" style="color:#888;text-decoration:none;">Powered by QFINHUB — Free ${calcName}</a></p>`,
  ].join("\n");
}

// ─── Generate Widget Script Embed (auto-resizing) ───
function generateScriptEmbed(slug, calcName) {
  const base = "https://www.qfinhub.com";
  return [
    `<script async src="${base}/api/widget/${slug}/embed.js" data-widget="${slug}"></script>`,
  ].join("\n");
}

// ─── Simple HTTP GET with redirect following ───
function httpGet(urlStr, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error("Too many redirects"));
    try {
      const url = new URL(urlStr);
      const mod = url.protocol === "https:" ? https : http;
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: url.pathname + url.search,
        timeout: 10000,
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36", "Accept": "text/html" }
      };
      const req = mod.get(options, (res) => {
        // Follow redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = res.headers.location.startsWith("http") ? res.headers.location : `${url.protocol}//${url.host}${res.headers.location}`;
          return resolve(httpGet(redirectUrl, redirectCount + 1));
        }
        let data = "";
        res.on("data", chunk => { data += chunk; if (data.length > 100000) { data = data.substring(0, 100000); res.destroy(); } });
        res.on("end", () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      });
      req.on("error", reject);
      req.on("timeout", function() { this.destroy(); reject(new Error("timeout")); });
    } catch(e) { reject(e); }
  });
}

// ─── Search using Google (free, no API key) ───
async function searchGoogle(query) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&hl=en`;
    const res = await httpGet(url);
    if (res.status !== 200) return [];

    const results = [];
    // Extract result links from Google's HTML
    const linkRegex = /<a[^>]*href="\/url\?q=([^"&]+)[^"]*"[^>]*>(?:<br>)?([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkRegex.exec(res.body)) !== null) {
      const href = decodeURIComponent(match[1]);
      const title = match[2].replace(/<[^>]+>/g, "").replace(/<\/?[^>]+>/g, "").trim();
      if (href && title && href.startsWith("http") && !href.includes("google.com") && !href.includes("youtube.com") && !href.includes("facebook.com")) {
        const cleanUrl = href.split("&")[0];
        if (cleanUrl.startsWith("http")) {
          results.push({ url: cleanUrl, title });
        }
      }
    }

    // Fallback: try simpler extraction
    if (results.length === 0) {
      const simpleRegex = /<a[^>]*href="(https?:\/\/[^"&]+)"[^>]*>([\s\S]*?)<\/a>/gi;
      while ((match = simpleRegex.exec(res.body)) !== null) {
        const href = match[1];
        const title = match[2].replace(/<[^>]+>/g, "").trim();
        if (href && title && !href.includes("google.com") && !href.includes("accounts.google")) {
          results.push({ url: href.split("&")[0], title });
        }
      }
    }

    return results.slice(0, 8);
  } catch(e) {
    console.log(`  Search failed: ${e.message}`);
    return [];
  }
}

// ─── Extract email from page text ───
function extractEmails(text) {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const found = (text.match(emailRegex) || []);
  // Filter out common non-blog emails
  return found.filter(e => {
    const domain = e.split("@")[1]?.toLowerCase() || "";
    if (!domain || domain.includes("example") || domain.includes("domain")) return false;
    return true;
  });
}

// ─── Detect blog niche from page content ───
function detectNiche(text, title) {
  const lower = (text + " " + title).toLowerCase();
  const niches = Object.keys(CALCULATOR_MAP);
  const scores = {};
  
  for (const niche of niches) {
    scores[niche] = 0;
    const terms = niche.split(" ");
    for (const term of terms) {
      const regex = new RegExp(term, "gi");
      const matches = (lower.match(regex) || []).length;
      scores[niche] += matches;
    }
  }

  // Also check for "calculator" mentions
  if (lower.includes("calculator")) scores["personal finance"] += 3;

  let bestNiche = "general";
  let bestScore = 0;
  for (const [niche, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; bestNiche = niche; }
  }

  return bestNiche;
}

// ─── Generate email using DeepSeek AI ───
async function generateEmail(blog, niche) {
  if (!DEEPSEEK_KEY) {
    console.log("  No DeepSeek key, using template");
    return generateTemplateEmail(blog, niche);
  }

  const calc = CALCULATOR_MAP[niche] || CALCULATOR_MAP["general"];
  const embed = generateEmbedCode(calc.slug, calc.name);

  const prompt = `Write a short, friendly email pitch to a personal finance blogger. The goal is to offer them a free, embeddable calculator widget for their blog.

BLOG: "${blog.title}" (${blog.url})
THEIR NICHE: ${niche}
SUGGESTED WIDGET: ${calc.name} (${calc.url})
THE WIDGET: An embeddable HTML/iframe calculator that their readers can use right on their blog. Free forever, no sign-up required. Includes a small "Powered by QFINHUB" link.

Write 2-3 sentences max. Friendly tone, not salesy. Focus on value to their readers. End with "(Widget code included below)" at the very end after a line break.

Then include the widget embed code as a formatted code block.

OUTPUT FORMAT:
{
  "subject": "Subject line here (max 60 chars)",
  "body": "Email body here (not including the widget code - just the text)",
  "widgetCode": "HERE"
}

Return ONLY valid JSON.`;

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${DEEPSEEK_KEY}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
      }),
    });

    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON");

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      subject: parsed.subject || `Free ${calc.name} for your readers`,
      body: (parsed.body || "") + "\n\n" + parsed.widgetCode + "\n\n" + embed,
    };
  } catch(e) {
    console.log(`  AI gen failed: ${e.message}, using template`);
    return generateTemplateEmail(blog, niche);
  }
}

// ─── Template fallback email ───
function generateTemplateEmail(blog, niche) {
  const calc = CALCULATOR_MAP[niche] || CALCULATOR_MAP["general"];
  const embed = generateEmbedCode(calc.slug, calc.name);
  const scriptEmbed = generateScriptEmbed(calc.slug, calc.name);

  const templates = [
    {
      subject: `Free ${calc.name} for ${blog.title || "your blog"}`,
      body: `Hi there,\n\nI came across your blog and love the content you're putting out about ${niche}. I run QFINHUB.com — we build free financial calculators that bloggers can embed on their sites.\n\nI think your readers would love our ${calc.name}. It takes 30 seconds to use, no sign-up required, and you can embed it on your site in one click.\n\nHere's the embed code — completely free, forever:\n\n${embed}\n\nOr if you prefer a script version:\n\n${scriptEmbed}\n\nNo obligation — just a useful tool for your audience!\n\nBest,\nQasem\nQFINHUB.com`,
    },
  ];
  return templates[0];
}

// ─── Send email via Gmail SMTP ───
async function sendEmail(to, subject, body) {
  try {
    const nodemailer = require("nodemailer");
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: { user: GMAIL_USER, pass: GMAIL_PASS },
    });

    const info = await transporter.sendMail({
      from: `"QFINHUB" <${GMAIL_USER}>`,
      to: to,
      subject: subject.substring(0, 200),
      text: body,
    });

    return { success: true, messageId: info.messageId, accepted: info.accepted };
  } catch(e) {
    return { success: false, error: e.message };
  }
}

// ─── Log ───
function log(type, details) {
  let log = [];
  if (existsSync(CAMPAIGN_LOG)) try { log = JSON.parse(readFileSync(CAMPAIGN_LOG, "utf-8")); } catch(e) {}
  log.push({ ts: new Date().toISOString(), type, details });
  if (log.length > 2000) log = log.slice(-2000);
  writeFileSync(CAMPAIGN_LOG, JSON.stringify(log, null, 2));
}

// ─── Load sent log ───
function loadSent() {
  if (!existsSync(SENT_LOG)) return {};
  try { return JSON.parse(readFileSync(SENT_LOG, "utf-8")); } catch(e) { return {}; }
}

// ─── Find blogs via seed list + search ───
async function findBlogs() {
  console.log("\n🔍 Phase 1: Finding finance blogs...");

  // First: Load from seed list (pre-compiled, reliable)
  const SEED_FILE = resolve(__dirname, "..", ".widget-outreach", "seed-targets.json");
  let seedTargets = [];
  if (existsSync(SEED_FILE)) {
    try {
      seedTargets = JSON.parse(readFileSync(SEED_FILE, "utf-8"));
      console.log(`  📂 Loaded ${seedTargets.length} seed targets from seed list`);
    } catch(e) {
      console.log(`  ⚠️ Seed file read error: ${e.message}`);
    }
  }

  const allTargets = [...seedTargets];
  const seenUrls = new Set(allTargets.map(t => t.url.replace(/\/$/, "")));

  // Second: Try Google search as secondary source (best effort)
  console.log("  🔎 Also searching for more targets via web...");
  const queriesA = [...SEARCH_QUERIES_A].sort(() => Math.random() - 0.5).slice(0, 1);
  for (const q of queriesA) {
    try {
      const results = await searchGoogle(q);
      for (const r of results) {
        const url = r.url.replace(/\/$/, "").split("#")[0].split("?")[0];
        if (!seenUrls.has(url) && url.includes(".") && !url.includes("facebook.com") && !url.includes("twitter.com") && !url.includes("youtube.com")) {
          seenUrls.add(url);
          allTargets.push({ url, title: r.title, source: "search", niche: null, email: null, visited: false });
        }
      }
    } catch(e) { /* search best-effort */ }
  }

  // Save targets
  writeFileSync(TARGETS_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), targets: allTargets }, null, 2));
  console.log(`  Total: ${allTargets.length} target blogs (${seedTargets.length} from seed + ${allTargets.length - seedTargets.length} from search)`);

  return allTargets;
}

// ─── Visit blogs to extract emails and detect niches ───
async function visitBlogs(targets, limit) {
  console.log(`\n🔎 Phase 2: Visiting blogs (${Math.min(limit || targets.length, targets.length)})...`);
  const enriched = [];
  const batchSize = Math.min(limit || 2, 2); // Visit max 2 per run to fit within cron 120s timeout

  for (let i = 0; i < Math.min(batchSize, targets.length); i++) {
    const target = targets[i];
    process.stdout.write(`  [${i+1}/${batchSize}] ${target.url.substring(0, 60)}... `);

    try {
      const res = await httpGet(target.url);
      if (res.status === 200) {
        const emails = extractEmails(res.body);
        // Filter out Gmail/Yahoo/etc (we want blog owner's email)
        const blogEmails = emails.filter(e => {
          const domain = e.split("@")[1];
          return domain && !["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com", "protonmail.com", "icloud.com", "mail.com"].includes(domain);
        });

        const niche = detectNiche(res.body, target.title);

        target.email = blogEmails[0] || null;
        target.niche = niche;
        target.visited = true;
        target.hasCalculatorMention = res.body.toLowerCase().includes("calculator");

        if (target.email) {
          console.log(`✅ Email: ${target.email} | Niche: ${niche}`);
        } else {
          // Try contact page
          console.log(`⚠️ No email on homepage, checking contact page...`);
          try {
            const contactRes = await httpGet(target.url.replace(/\/$/, "") + "/contact");
            if (contactRes.status === 200) {
              const contactEmails = extractEmails(contactRes.body);
              const blogContactEmails = contactEmails.filter(e => {
                const domain = e.split("@")[1];
                return domain && !["gmail.com", "yahoo.com", "hotmail.com"].includes(domain);
              });
              target.email = blogContactEmails[0] || null;
              if (target.email) console.log(`  ✅ Contact page: ${target.email}`);
              else console.log(`  ❌ No email found`);
            } else {
              console.log(`  ❌ No contact page`);
            }
          } catch(e) {
            console.log(`  ❌ Contact page error: ${e.message.substring(0, 30)}`);
          }
        }

        enriched.push(target);
      } else {
        console.log(`❌ HTTP ${res.status}`);
      }
    } catch(e) {
      console.log(`❌ ${e.message.substring(0, 40)}`);
    }

    // Polite delay between requests (0.5-1.5s to fit cron 120s timeout)
    await new Promise(r => setTimeout(r, 500 + Math.random() * 1000));
  }

  // Save updated targets
  writeFileSync(TARGETS_FILE, JSON.stringify({ fetchedAt: new Date().toISOString(), targets: [...targets] }, null, 2));

  const withEmails = enriched.filter(t => t.email);
  console.log(`\n  Visited: ${enriched.length} | With emails: ${withEmails.length}`);

  return enriched;
}

// ─── Send outreach emails ───
async function sendOutreach(targets) {
  console.log(`\n📧 Phase 3: Sending outreach emails...`);

  const sent = loadSent();
  let sentCount = 0;
  let skipCount = 0;
  let failCount = 0;

  const toSend = targets.filter(t => t.email && !sent[t.email] && t.visited);

  if (toSend.length === 0) {
    console.log("  No new targets to contact.");
    console.log("  (all contacted or none with emails)");
    return;
  }

  console.log(`  Targets to email: ${toSend.length}`);

  for (const target of toSend.slice(0, 1)) { // Max 1 per run to fit within cron 120s timeout
    console.log(`\n  [${sentCount + 1}] ${target.email} (${target.url.substring(0, 50)}...)`);

    const email = await generateEmail(target, target.niche || "general");
    console.log(`  Subject: ${email.subject}`);

    const result = await sendEmail(target.email, email.subject, email.body);

    if (result.success) {
      console.log(`  ✅ Sent!`);
      sent[target.email] = {
        sentAt: new Date().toISOString(),
        url: target.url,
        niche: target.niche,
        subject: email.subject,
        messageId: result.messageId,
      };
      sentCount++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      failCount++;
    }

    writeFileSync(SENT_LOG, JSON.stringify(sent, null, 2));

    // Delay between sends (avoid rate limiting)
    if (sentCount + failCount < toSend.length) {
      const delay = 3000 + Math.random() * 2000; // 3-5 seconds to fit within cron 120s timeout
      console.log(`  ⏳ Waiting ${Math.round(delay / 1000)}s...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }

  log("outreach-batch", { sent: sentCount, skipped: skipCount, failed: failCount, total: toSend.length });

  console.log(`\n  📊 Batch complete: ${sentCount} sent, ${skipCount} skipped, ${failCount} failed`);
  return sentCount;
}

// ─── Show campaign stats ───
function showStatus() {
  const sent = loadSent();
  const targets = existsSync(TARGETS_FILE) ? JSON.parse(readFileSync(TARGETS_FILE, "utf-8")).targets || [] : [];

  const withEmails = targets.filter(t => t.email);
  const withNiche = targets.filter(t => t.niche);

  console.log("\n📊 Widget Outreach Campaign Status:");
  console.log(`  Total targets found:     ${targets.length}`);
  console.log(`  With emails extracted:   ${withEmails.length}`);
  console.log(`  With niche detected:     ${withNiche.length}`);
  console.log(`  Emails sent:             ${Object.keys(sent).length}`);
  console.log(`  Remaining to contact:    ${targets.filter(t => t.email && !sent[t.email]).length}`);

  const niches = {};
  withNiche.forEach(t => { niches[t.niche] = (niches[t.niche] || 0) + 1; });
  if (Object.keys(niches).length > 0) {
    console.log(`\n  Niche breakdown:`);
    Object.entries(niches).sort((a, b) => b[1] - a[1]).slice(0, 5).forEach(([n, c]) => {
      console.log(`    ${n}: ${c}`);
    });
  }
}

// ─── RESET ───
function reset() {
  writeFileSync(SENT_LOG, JSON.stringify({}));
  writeFileSync(TARGETS_FILE, JSON.stringify({ fetchedAt: null, targets: [] }));
  log("reset", { time: new Date().toISOString() });
  console.log("✅ Outreach data reset. Fresh start.");
}

// ═══════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════
async function main() {
  console.log("═══════════════════════════════════════════");
  console.log("  QFINHUB Widget Outreach Engine");
  console.log("  " + new Date().toISOString().split("T")[0]);
  console.log("═══════════════════════════════════════════");

  if (args.includes("--status")) { showStatus(); return; }
  if (args.includes("--reset")) { reset(); return; }
  if (args.includes("--test")) { console.log("TEST MODE: Will search but NOT send emails."); }

  // Phase 1: Find blogs
  let targets = [];
  if (existsSync(TARGETS_FILE) && !args.includes("--fresh")) {
    const cached = JSON.parse(readFileSync(TARGETS_FILE, "utf-8"));
    const cacheAge = Date.now() - (cached.fetchedAt ? new Date(cached.fetchedAt).getTime() : 0);
    if (cacheAge < 7 * 24 * 60 * 60 * 1000) { // Cache valid for 7 days
      targets = cached.targets || [];
      console.log(`\n📂 Loaded ${targets.length} cached targets (${Math.round(cacheAge / 86400000)} days old)`);
    }
  }

  if (targets.length === 0) {
    targets = await findBlogs();
  }

  // Phase 2: Visit blogs for emails/niches
  const unvisited = targets.filter(t => !t.visited).slice(0, 15);
  let enriched = [];

  if (unvisited.length > 0) {
    enriched = await visitBlogs(unvisited);
  } else {
    console.log("\n🔎 All targets already visited.");
    enriched = targets.filter(t => t.visited);
  }

  // Phase 3: Send emails (skip in test mode)
  if (args.includes("--test")) {
    console.log("\n🧪 TEST MODE SUMMARY:");
    const readyToSend = targets.filter(t => t.email && t.visited);
    console.log(`  ${readyToSend.length} targets ready to email`);
    readyToSend.slice(0, 5).forEach(t => {
      console.log(`  - ${t.email} (${t.niche}) @ ${t.url.substring(0, 50)}`);
    });
    if (readyToSend.length > 5) console.log(`  ... and ${readyToSend.length - 5} more`);
    return;
  }

  const sentCount = await sendOutreach(targets);

  console.log(`\n✅ Campaign run complete. Total sent this batch: ${sentCount}`);
  console.log(`   Next run will find more targets and contact them.`);
}

main().catch(e => { console.error("FATAL:", e); process.exit(1); });
