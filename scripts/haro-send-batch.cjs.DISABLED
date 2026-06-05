#!/usr/bin/env node
/**
 * Targeted HARO batch sender for QFINHUB
 * Parses the fetched HARO email files, finds finance queries,
 * generates expert responses via DeepSeek, and sends via SMTP.
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve, basename } = require("path");
const nodemailer = require("nodemailer");

const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".haro-data");

// Load .env.local
const env = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
env.split("\n").forEach((line) => {
  const m = line.match(/^([^#=]+)=(.+)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
});

const GMAIL_USER = process.env.GMAIL_ADDRESS;
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

const EXPERT_IDENTITY = {
  name: "Qasem Mohammed",
  title: "AI & Software Engineer, Founder of QFINHUB",
  site: "https://www.qfinhub.com",
  bio: "QFINHUB provides 125 free financial calculators used by thousands. No sign-up required. Tools include mortgage, compound interest, retirement planning, tax, and investment calculators."
};

// ─── Parse HARO "X) Summary:" format ───
function parseHarFile(filePath) {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const queries = [];
  
  let i = 0;
  while (i < lines.length) {
    // Match "X) Summary: TITLE" pattern
    const m = lines[i].match(/^(\d+)\)\s+Summary:\s+(.+)/i);
    if (m) {
      const queryNum = m[1];
      const title = m[2].trim();
      let replyTo = "";
      let mediaOutlet = "";
      let deadline = "";
      let category = "";
      let name = "";
      let queryText = "";
      let noAI = false;
      
      // Scan forward for metadata
      let j = i + 1;
      while (j < lines.length && !lines[j].match(/^\d+\)\s+Summary:/) && j - i < 80) {
        const l = lines[j].trim();
        
        if (l.match(/^Email:\s+(.+)/i)) {
          replyTo = l.match(/^Email:\s+(.+)/i)[1].trim();
        } else if (l.match(/^Media Outlet:\s+(.+)/i)) {
          mediaOutlet = l.match(/^Media Outlet:\s+(.+)/i)[1].trim();
        } else if (l.match(/^Deadline:\s+(.+)/i)) {
          deadline = l.match(/^Deadline:\s+(.+)/i)[1].trim();
        } else if (l.match(/^Category:\s+(.+)/i)) {
          category = l.match(/^Category:\s+(.+)/i)[1].trim();
        } else if (l.match(/^Name:\s+(.+)/i)) {
          name = l.match(/^Name:\s+(.+)/i)[1].trim();
        } else if (l.match(/^No AI Pitches Considered/i)) {
          noAI = true;
        } else if (l === "Query:") {
          // Read query body until "Back to Top" or next section
          let k = j + 1;
          let bodyParts = [];
          while (k < lines.length && !lines[k].match(/^Back to Top/i) && !lines[k].match(/^\d+\)\s+Summary:/) && !lines[k].match(/^-{10,}/)) {
            const bl = lines[k].trim();
            // Skip hex-encoded AI traps (long hex strings)
            if (!bl.match(/^[0-9A-Fa-f]{50,}$/) && !bl.match(/^[A-Za-z0-9+\/=]{40,}$/)) {
              // Skip zero-width and spammy lines
              if (bl && bl.length > 2 && !bl.match(/^[‌⁣\u200b-\u200f\u2028-\u202f]+$/)) {
                bodyParts.push(bl);
              }
            }
            k++;
          }
          queryText = bodyParts.join(" ").replace(/\s+/g, " ").trim();
          j = k - 1;
        }
        j++;
      }
      
      if (replyTo && queryText) {
        queries.push({
          id: queryNum,
          title,
          replyTo,
          mediaOutlet,
          deadline,
          category,
          name,
          queryText: queryText.substring(0, 2000),
          noAI,
          sourceFile: basename(filePath)
        });
      }
      i = j;
    } else {
      i++;
    }
  }
  return queries;
}

// ─── Filter to finance-relevant ───
const FINANCE_KEYWORDS = [
  "mortgage", "home loan", "refinance", "real estate",
  "investing", "stock", "retirement", "401k", "ira", "roth",
  "compound interest", "savings", "budget", "debt",
  "credit score", "student loan", "auto loan", "personal loan",
  "tax", "tax bracket", "tax refund", "capital gains",
  "inflation", "interest rate", "fed rate", "federal reserve",
  "financial planning", "wealth", "net worth",
  "cryptocurrency", "bitcoin", "ethereum",
  "rent vs buy", "home affordability", "closing cost",
  "social security", "pension", "annuity",
  "dividend", "bond yield", "market return",
  "small business finance", "self employed tax",
  "salary", "wage", "income", "financial success",
  "credit card", "money trap", "spending", "lifestyle inflation",
  "emergency fund", "financial stability"
];

const EXCLUDED = [
  "entertainment", "sports", "fashion", "beauty", "food",
  "cooking", "travel", "gaming", "music", "movie", "celebrity",
  "parenting", "pets", "health", "fitness", "dating", "wedding",
  "gardening", "craft", "cannabis", "wimbledon", "ufo"
];

function isRelevant(q) {
  const text = (q.title + " " + q.queryText).toLowerCase();
  for (const ex of EXCLUDED) {
    if (text.includes(ex)) return false;
  }
  for (const kw of FINANCE_KEYWORDS) {
    if (text.includes(kw)) return true;
  }
  return false;
}

// ─── AI Response Generation ───
async function generateResponse(query) {
  const prompt = [
    'You are ' + EXPERT_IDENTITY.name + ', ' + EXPERT_IDENTITY.title + '.',
    EXPERT_IDENTITY.bio,
    '',
    'A journalist at ' + query.mediaOutlet + ' is looking for an expert quote on:',
    query.title,
    '',
    'Full query context: ' + query.queryText.substring(0, 800),
    '',
    'Write a BRIEF, quotable expert response (2-4 sentences, ~80-120 words).',
    'Include a SPECIFIC number or statistic (realistic financial data).',
    'Naturally mention QFINHUB if relevant (e.g., "our calculators at qfinhub.com show...").',
    'Be conversational and credible. Sound like a real human expert giving actionable advice.',
    'DO NOT use words like "delve", "tapestry", "landscape", "moreover", or "crucial".',
    'DO NOT use any unusual or rare vocabulary words. Keep language simple and direct.',
    '',
    'Output ONLY the quote text. No introduction, no signature.'
  ].join("\n");

  try {
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + DEEPSEEK_KEY,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text().catch(() => "");
      throw new Error("DeepSeek " + resp.status + ": " + err.substring(0, 150));
    }

    const data = await resp.json();
    const quote = data.choices?.[0]?.message?.content || "";
    return quote.trim().replace(/^"|"$/g, "");
  } catch (e) {
    console.error("  AI generation failed:", e.message.substring(0, 120));
    return null;
  }
}

// ─── SMTP Send ───
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_PASS },
  });
}

async function sendReply(transporter, to, query, quote) {
  const subject = "Re: HARO Query - " + query.title.substring(0, 80);
  
  const body = [
    "Hi " + (query.name || "there") + ",",
    "",
    quote,
    "",
    "Best regards,",
    EXPERT_IDENTITY.name,
    EXPERT_IDENTITY.title,
    "QFINHUB — 125 Free Financial Calculators",
    EXPERT_IDENTITY.site,
    "",
    "---",
    "Feel free to use my quote above. I'm happy to provide additional data or calculations from QFINHUB's 125 free calculators if helpful for your article.",
  ].join("\n");

  return transporter.sendMail({
    from: '"' + EXPERT_IDENTITY.name + '" <' + GMAIL_USER + ">",
    to: to,
    subject: subject,
    text: body,
  });
}

// ─── Main ───
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes("--dry-run");
  const maxSend = parseInt(args.find(a => a.startsWith("--max="))?.split("=")[1] || "5");

  console.log("=== QFINHUB HARO Batch Sender ===\n");
  
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.error("❌ Gmail credentials missing");
    process.exit(1);
  }
  if (!DEEPSEEK_KEY) {
    console.error("❌ DeepSeek API key missing");
    process.exit(1);
  }

  // Find HARO digest files
  const { readdirSync } = require("fs");
  const files = readdirSync(DATA_DIR)
    .filter(f => f.startsWith("haro-email-") && f.endsWith(".txt"))
    .sort()
    .reverse();

  console.log("📁 Found " + files.length + " HARO email files\n");

  // Parse all queries
  let allQueries = [];
  for (const f of files) {
    const queries = parseHarFile(resolve(DATA_DIR, f));
    allQueries.push(...queries);
  }

  console.log("📋 Parsed " + allQueries.length + " total queries\n");

  // Parse deadline to check if still active
  function isDeadlineActive(deadlineStr) {
    if (!deadlineStr) return true; // no deadline = assume active
    const m = deadlineStr.match(/(\d{1,2})\s*(AM|PM)\s*ET\s*[-–]\s*(\d{1,2})\s*(May|June|Jul)/i);
    if (!m) return true;
    const hour = parseInt(m[1]) + (m[2].toUpperCase() === "PM" && parseInt(m[1]) !== 12 ? 12 : 0) + (m[2].toUpperCase() === "AM" && parseInt(m[1]) === 12 ? -12 : 0);
    const day = parseInt(m[3]);
    const monthStr = m[4].toLowerCase();
    const monthMap = { may: 5, june: 6, jul: 7 };
    const month = monthMap[monthStr] || 5;
    const now = new Date();
    const deadlineDate = new Date(2026, month - 1, day, hour, 0, 0);
    return now < deadlineDate;
  }

  // Filter relevant
  const relevant = allQueries
    .filter(q => isRelevant(q) && !q.noAI && isDeadlineActive(q.deadline))
    .filter((q, i, arr) => {
      // Deduplicate by replyTo
      return arr.findIndex(x => x.replyTo === q.replyTo) === i;
    });

  console.log("🎯 Relevant finance queries (active deadlines): " + relevant.length + "\n");

  if (relevant.length === 0) {
    console.log("No matching queries found.");
    return;
  }

  // Load sent log
  const SENT_LOG = resolve(DATA_DIR, "sent-batch.json");
  let log = { sent: [], failed: [] };
  try {
    if (existsSync(SENT_LOG)) log = JSON.parse(readFileSync(SENT_LOG, "utf-8"));
  } catch (e) {}

  const sentIds = new Set(log.sent.map(s => s.replyTo));

  // Sort by relevance priority
  const priorityKeywords = ["retirement", "debt", "credit card", "budget", "investing", "mortgage", "compound interest", "savings", "tax"];
  relevant.sort((a, b) => {
    const aScore = priorityKeywords.filter(kw => (a.title + " " + a.queryText).toLowerCase().includes(kw)).length;
    const bScore = priorityKeywords.filter(kw => (b.title + " " + b.queryText).toLowerCase().includes(kw)).length;
    return bScore - aScore;
  });

  // Process
  let sentCount = 0;
  let skipCount = 0;
  const transporter = isDryRun ? null : createTransporter();

  for (const query of relevant) {
    if (sentCount >= maxSend) break;
    
    if (sentIds.has(query.replyTo)) {
      console.log("  ⏭ Skip (already sent): " + query.title.substring(0, 70));
      skipCount++;
      continue;
    }

    console.log("─".repeat(60));
    console.log("  📰 " + query.mediaOutlet);
    console.log("  📝 " + query.title.substring(0, 100));
    console.log("  📧 " + query.replyTo);
    console.log("  ⏰ " + (query.deadline || "unknown"));
    console.log("  🤖 Generating response...");

    const quote = await generateResponse(query);
    if (!quote) {
      console.log("  ❌ Failed to generate");
      log.failed.push({ replyTo: query.replyTo, title: query.title, time: new Date().toISOString() });
      continue;
    }

    console.log("  💬 " + quote.substring(0, 120) + "...");

    if (!isDryRun) {
      try {
        await sendReply(transporter, query.replyTo, query, quote);
        console.log("  ✅ SENT!");
        log.sent.push({
          replyTo: query.replyTo,
          title: query.title,
          mediaOutlet: query.mediaOutlet,
          deadline: query.deadline,
          quote: quote.substring(0, 500),
          time: new Date().toISOString()
        });
        sentCount++;
      } catch (e) {
        console.log("  ❌ Send failed: " + e.message.substring(0, 100));
        log.failed.push({ replyTo: query.replyTo, title: query.title, error: e.message.substring(0, 200), time: new Date().toISOString() });
      }
    } else {
      console.log("  🔷 DRY RUN — would send");
      sentCount++;
    }

    writeFileSync(SENT_LOG, JSON.stringify(log, null, 2));

    // Rate limit
    if (sentCount < maxSend && !isDryRun) {
      console.log("  ⏳ Waiting 30s...");
      await new Promise(r => setTimeout(r, 30000));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("=== Summary ===");
  console.log("  Total parsed: " + allQueries.length);
  console.log("  Relevant: " + relevant.length);
  console.log("  Sent: " + sentCount + (isDryRun ? " (dry run)" : ""));
  console.log("  Skipped: " + skipCount);
  console.log("  Failed: " + log.failed.length);
  console.log("");

  // Print what was sent
  for (const s of log.sent.slice(-maxSend)) {
    console.log("  ✅ " + s.mediaOutlet + " — " + s.title.substring(0, 70));
  }
}

main().catch(err => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
