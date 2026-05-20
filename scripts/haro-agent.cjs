#!/usr/bin/env node
/**
 * QFINHUB HARO Auto-Responder Agent
 * 
 * 1. Connects to Gmail via IMAP
 * 2. Finds unread HARO digest emails
 * 3. Parses journalist queries
 * 4. Classifies by topic relevance
 * 5. AI-generates expert responses using DeepSeek
 * 6. Sends replies via SMTP
 * 7. Logs everything
 * 
 * Usage:
 *   node scripts/haro-agent.cjs              Run normal cycle
 *   node scripts/haro-agent.cjs --test     Test connection only
 *   node scripts/haro-agent.cjs --dry-run  Show matches but don't send
 */

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const { simpleParser } = require("mailparser");
const Imap = require("imap");
const nodemailer = require("nodemailer");

// ─── Config ───
const ROOT = resolve(__dirname, "..");
const DATA_DIR = resolve(ROOT, ".haro-data");
const LOG_FILE = resolve(DATA_DIR, "haro-log.json");
const SENT_LOG = resolve(DATA_DIR, "sent-responses.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

// Load .env.local
try {
  const env = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
  env.split("\n").forEach((line) => {
    const m = line.match(/^([^#=]+)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  });
} catch (e) {}

const GMAIL_USER = process.env.GMAIL_ADDRESS || "";
const GMAIL_PASS = process.env.GMAIL_APP_PASSWORD || "";
const HARO_EMAIL = process.env.HARO_EMAIL || GMAIL_USER;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY || "";

// ─── Finance Keywords (what we look for) ───
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
  "salary", "wage", "income",
];

// ─── EXCLUDED categories (not finance) ───
const EXCLUDED_CATEGORIES = [
  "entertainment", "sports", "fashion", "beauty",
  "food", "cooking", "travel", "gaming",
  "music", "movie", "celebrity", "parenting",
  "pets", "health", "fitness", "dating",
  "wedding", "gardening", "craft",
];

// ─── AIM: Who we represent ───
const EXPERT_IDENTITY = {
  name: "Qasem Mohammed",
  title: "Founder of QFINHUB",
  site: "https://www.qfinhub.com",
  expertise: ["personal finance", "mortgages", "investing", "retirement", "tax", "debt management"],
  bio: "Financial calculator expert. Founder of QFINHUB, a free platform with 124+ financial calculators covering mortgages, investing, retirement, taxes, and debt."
};

// ─── Gmail IMAP Connection ───
function connectImap() {
  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user: GMAIL_USER,
      password: GMAIL_PASS,
      host: "imap.gmail.com",
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    imap.once("ready", () => resolve(imap));
    imap.once("error", (err) => reject(err));
    imap.connect();
  });
}

function searchEmails(imap, daysBack) {
  return new Promise((resolve, reject) => {
    const since = new Date();
    since.setDate(since.getDate() - (daysBack || 2));
    
    imap.openBox("INBOX", true, (err, box) => {
      if (err) return reject(err);
      
      imap.search(["UNSEEN", ["SINCE", since.toISOString()]], (err2, results) => {
        if (err2) return reject(err2);
        resolve(results || []);
      });
    });
  });
}

function fetchEmail(imap, uid) {
  return new Promise((resolve, reject) => {
    const f = imap.fetch(uid, { bodies: "" });
    let buffer = "";
    
    f.on("message", (msg) => {
      msg.on("body", (stream) => {
        stream.on("data", (chunk) => (buffer += chunk.toString()));
      });
    });
    
    f.on("end", () => resolve(buffer));
    f.on("error", (err) => reject(err));
  });
}

// ─── Email Parser ───
async function parseHarEmails(rawEmails) {
  const queries = [];
  
  for (const raw of rawEmails) {
    try {
      const parsed = await simpleParser(raw);
      const subject = parsed.subject || "";
      const from = parsed.from?.text || "";
      const body = parsed.text || "";
      
      // Only process HARO emails
      if (!subject.includes("HARO") && !from.includes("helpareporter")) {
        if (!body.toLowerCase().includes("haro")) continue;
      }
      
      // Extract individual queries from the email body
      const extracted = extractQueries(body, subject);
      queries.push(...extracted);
      
    } catch (e) {
      console.error("Parse error:", e.message.substring(0, 80));
    }
  }
  
  return queries;
}

function extractQueries(body, subject) {
  const results = [];
  
  // Try to find numbered queries (1. 2. 3. pattern)
  // HARO emails typically list queries like:
  // 1. HEADLINE
  //    Description...
  //    Reply to: email
  // 2. NEXT HEADLINE
  //    ...
  
  const lines = body.split("\n");
  let currentQuery = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match numbered items like "1." or "1)" or "1:" or "Query 1:"
    const numMatch = line.match(/^(?:Query\s*)?(\d+)[.)!:]?\s+(.+)/i);
    
    if (numMatch) {
      // Save previous
      if (currentQuery && currentQuery.text) {
        results.push(currentQuery);
      }
      
      currentQuery = {
        id: numMatch[1],
        headline: numMatch[2].substring(0, 200),
        text: numMatch[2],
        category: guessCategory(numMatch[2]),
        deadline: "",
        replyTo: "",
        sourceLines: [numMatch[2]],
      };
      continue;
    }
    
    if (currentQuery) {
      // Check for reply info
      const replyMatch = line.match(/reply\s*(?:to|at)?:?\s*([\w.@-]+)/i);
      if (replyMatch) {
        currentQuery.replyTo = replyMatch[1];
        continue;
      }
      
      const deadlineMatch = line.match(/(?:deadline|due|by)\s*:?\s*(.+)/i);
      if (deadlineMatch) {
        currentQuery.deadline = deadlineMatch[1].substring(0, 100);
        continue;
      }
      
      // Skip empty or separator lines
      if (line && !line.match(/^[-_=*]{3,}$/) && !line.match(/^(https?:\/\/)/)) {
        currentQuery.text += " " + line;
        currentQuery.sourceLines.push(line);
        
        // Update headline context
        const lower = line.toLowerCase();
        if (lower.includes("need") || lower.includes("looking for") || 
            lower.includes("seeking") || lower.includes("want") ||
            lower.includes("require") || lower.includes("anyone")) {
          currentQuery.context = (currentQuery.context || "") + " " + line;
        }
      }
    }
  }
  
  // Push last query
  if (currentQuery && currentQuery.text) {
    results.push(currentQuery);
  }
  
  // If no structured queries found, treat the whole email as one query
  if (results.length === 0 && body.length > 50) {
    results.push({
      id: "1",
      headline: subject || "HARO Query",
      text: body.substring(0, 1000),
      category: guessCategory(subject + " " + body.substring(0, 500)),
      deadline: "",
      replyTo: "",
      sourceLines: [subject],
    });
  }
  
  return results;
}

function guessCategory(text) {
  const t = text.toLowerCase();
  if (t.match(/mortgage|home loan|refinance|house|real estate/)) return "mortgage";
  if (t.match(/invest|stock|401k|ira|roth|retirement|pension/)) return "investing";
  if (t.match(/tax|irs|write.?off|deduction/)) return "tax";
  if (t.match(/debt|credit|loan|student|borrow/)) return "debt";
  if (t.match(/budget|savings|save|emergency fund|net worth/)) return "savings";
  if (t.match(/crypto|bitcoin|blockchain/)) return "crypto";
  if (t.match(/inflation|interest rate|fed|federal reserve/)) return "economy";
  return "other";
}

function isRelevant(query) {
  const text = (query.text + " " + query.headline + " " + (query.context || "")).toLowerCase();
  
  // Check category exclusion
  for (const ex of EXCLUDED_CATEGORIES) {
    if (text.includes(ex)) return false;
  }
  
  // Check keyword match
  for (const kw of FINANCE_KEYWORDS) {
    if (text.includes(kw)) return true;
  }
  
  return false;
}

// ─── AI Response Generation (DeepSeek) ───
async function generateResponse(query) {
  const prompt = [
    'You are ' + EXPERT_IDENTITY.name + ', ' + EXPERT_IDENTITY.title + ' at ' + EXPERT_IDENTITY.site + '.',
    '',
    'A journalist is looking for an expert quote on this topic:',
    '',
    'QUERY: ' + query.text.substring(0, 800),
    '',
    'Write a BRIEF, quotable expert response (2-4 sentences max, ~100 words).',
    'Include a SPECIFIC number or statistic to add credibility (use realistic financial data).',
    'Mention QFINHUB naturally if relevant (e.g., "according to our calculator at qfinhub.com...").',
    'Be conversational, not salesy. Sound like a real human expert giving advice.',
    '',
    'Output ONLY the quote text, nothing else.',
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
      throw new Error("DeepSeek " + resp.status + ": " + err.substring(0, 100));
    }

    const data = await resp.json();
    const quote = data.choices?.[0]?.message?.content || "";
    return quote.trim().replace(/^"|"$/g, "");
  } catch (e) {
    console.error("  AI generation failed:", e.message.substring(0, 80));
    return null;
  }
}

// ─── SMTP Sending ───
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS,
    },
  });
}

function sendReply(transporter, to, query, quote) {
  const subject = "Re: HARO Query - " + query.headline.substring(0, 60);
  
  const body = [
    "Hi there,",
    "",
    quote,
    "",
    "Best regards,",
    EXPERT_IDENTITY.name,
    EXPERT_IDENTITY.title,
    EXPERT_IDENTITY.site,
    "",
    "---",
    "Feel free to use my quote above. Happy to provide additional data or calculations from QFINHUB if needed.",
  ].join("\n");

  return transporter.sendMail({
    from: '"' + EXPERT_IDENTITY.name + '" <' + GMAIL_USER + ">",
    to: to,
    subject: subject.substring(0, 100),
    text: body,
  });
}

// ─── Logging ───
function loadLog() {
  try {
    if (existsSync(SENT_LOG)) return JSON.parse(readFileSync(SENT_LOG, "utf-8"));
  } catch (e) {}
  return { sent: [], failed: [], totalProcessed: 0 };
}

function saveLog(log) {
  writeFileSync(SENT_LOG, JSON.stringify(log, null, 2));
}

// ─── Main ───
async function main() {
  const args = process.argv.slice(2);
  const isTest = args.includes("--test");
  const isDryRun = args.includes("--dry-run");

  console.log("=== QFINHUB HARO Auto-Responder ===");
  console.log("");

  // Validate credentials
  if (!GMAIL_USER || !GMAIL_PASS) {
    console.error("❌ Gmail credentials not configured in .env.local");
    console.log("  Set: GMAIL_ADDRESS and GMAIL_APP_PASSWORD");
    process.exit(1);
  }

  if (!DEEPSEEK_KEY) {
    console.error("❌ DeepSeek API key not configured");
    process.exit(1);
  }

  console.log("📧 Gmail: " + GMAIL_USER);
  console.log("🤖 AI: DeepSeek");
  console.log("");

  // ── Test mode ──
  if (isTest) {
    console.log("Testing IMAP connection...");
    try {
      const imap = await connectImap();
      console.log("✅ IMAP connected successfully");
      
      const ids = await searchEmails(imap, 7);
      console.log("📬 Unread emails in last 7 days: " + ids.length);
      
      imap.end();
      console.log("✅ Connection closed");
    } catch (e) {
      console.error("❌ IMAP connection failed:", e.message);
      process.exit(1);
    }
    return;
  }

  // ── Normal run ──
  console.log("🔍 Connecting to Gmail IMAP...");
  let imap;
  try {
    imap = await connectImap();
    console.log("✅ Connected");
  } catch (e) {
    console.error("❌ Connection failed:", e.message);
    console.log("   Check that GMAIL_APP_PASSWORD is correct");
    console.log("   Ensure 2-Step Verification is ON & App Password was generated");
    process.exit(1);
  }

  try {
    console.log("📬 Searching for unread HARO emails...");
    const uids = await searchEmails(imap, 1);  // 1 day — runs 3x/day, avoids duplicates
    console.log("   Found " + uids.length + " unread emails");

    if (uids.length === 0) {
      console.log("   No new emails to process.");
      imap.end();
      return;
    }

    // Fetch email content
    const rawEmails = [];
    for (const uid of uids) {
      const raw = await fetchEmail(imap, uid);
      rawEmails.push(raw);
    }
    console.log("   Fetched " + rawEmails.length + " emails");

    // Parse emails
    const allQueries = await parseHarEmails(rawEmails);
    console.log("   Parsed " + allQueries.length + " total queries");

    // Filter relevant
    const relevant = allQueries.filter(isRelevant);
    console.log("   Relevant finance queries: " + relevant.length);

    if (relevant.length === 0) {
      console.log("   No matching queries found this cycle.");
      imap.end();
      return;
    }

    // Show found queries
    relevant.forEach((q, i) => {
      console.log("");
      console.log("  [" + (i + 1) + "/" + relevant.length + "] " + q.category.toUpperCase());
      console.log("      " + q.headline.substring(0, 100));
      if (q.replyTo) console.log("      Reply: " + q.replyTo);
    });
    console.log("");

    // Load sent log to avoid duplicates
    const log = loadLog();
    const sentIds = new Set(log.sent.map((s) => s.queryId));

    // ── Process each query ──
    let sentCount = 0;
    let skipCount = 0;

    for (const query of relevant) {
      const queryId = query.id + ":" + (query.replyTo || "unknown");

      if (sentIds.has(queryId)) {
        console.log("  ⏭ Skipping (already sent): " + query.headline.substring(0, 50));
        skipCount++;
        continue;
      }

      console.log("  🤖 Generating response for: " + query.headline.substring(0, 60));

      const quote = await generateResponse(query);
      if (!quote) {
        console.log("     ❌ Failed to generate response");
        log.failed.push({ queryId, headline: query.headline, error: "AI generation failed", time: new Date().toISOString() });
        continue;
      }

      console.log("     💬 Quote: " + quote.substring(0, 100) + "...");

      // Find reply address
      const replyTo = query.replyTo || HARO_EMAIL;
      
      if (!isDryRun) {
        try {
          const transporter = createTransporter();
          await sendReply(transporter, replyTo, query, quote);
          console.log("     ✅ Sent to: " + replyTo);

          log.sent.push({
            queryId,
            headline: query.headline.substring(0, 200),
            category: query.category,
            replyTo,
            quote: quote.substring(0, 500),
            time: new Date().toISOString(),
          });
          sentCount++;
        } catch (e) {
          console.log("     ❌ Send failed: " + e.message.substring(0, 80));
          log.failed.push({ queryId, headline: query.headline, error: e.message.substring(0, 200), time: new Date().toISOString() });
        }
      } else {
        console.log("     🔷 DRY RUN — would send to: " + replyTo);
        sentCount++;
      }

      log.totalProcessed = (log.totalProcessed || 0) + 1;
      saveLog(log);

      // Rate limit between sends (30 seconds to avoid looking like spam)
      if (!isDryRun && relevant.indexOf(query) < relevant.length - 1) {
        console.log("     ⏳ Waiting 30s before next...");
        await new Promise((r) => setTimeout(r, 30000));
      }
    }

    console.log("");
    console.log("=== Summary ===");
    console.log("  Total queries: " + allQueries.length);
    console.log("  Relevant: " + relevant.length);
    console.log("  Sent: " + sentCount + (isDryRun ? " (dry run)" : ""));
    console.log("  Skipped (already sent): " + skipCount);
    console.log("  Failed: " + log.failed.length);

  } catch (e) {
    console.error("Error during processing:", e.message);
  } finally {
    try { imap.end(); } catch (e) {}
  }
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
