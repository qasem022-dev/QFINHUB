#!/usr/bin/env node
/**
 * QFINHUB HARO Auto-Responder Agent
 * 
 * 1. Connects to Gmail via IMAP (lightweight net/tls client)
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
const net = require("net");
const tls = require("tls");
const { simpleParser } = require("mailparser");
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

// ─── Lightweight IMAP Client ───
class IMAPClient {
  constructor() {
    this.sock = null;
    this.tagCounter = 0;
    this.pending = new Map();
    this.buffer = "";
    this.ready = false;
    this.capabilities = [];
  }

  async connect(host, port) {
    // TCP connect
    const rawSocket = await new Promise((resolve, reject) => {
      const s = net.createConnection({ host, port });
      s.once("connect", () => resolve(s));
      s.once("error", reject);
      s.once("timeout", () => { s.destroy(); reject(new Error("TCP connect timeout")); });
    });
    rawSocket.setTimeout(30000);

    // TLS upgrade
    const tlsSocket = await new Promise((resolve, reject) => {
      const ts = tls.connect({
        socket: rawSocket,
        host,
        servername: host,
        rejectUnauthorized: false,
      }, () => resolve(ts));
      ts.once("error", reject);
    });
    tlsSocket.setTimeout(30000);

    this.sock = tlsSocket;

    // Capture greeting BEFORE setting up the permanent _onData listener
    const greeting = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("IMAP greeting timeout")), 15000);
      const onData = (chunk) => {
        this.buffer += chunk.toString();
        const idx = this.buffer.indexOf("\r\n");
        if (idx !== -1) {
          clearTimeout(timer);
          tlsSocket.removeListener("data", onData);
          const line = this.buffer.substring(0, idx);
          this.buffer = this.buffer.substring(idx + 2);
          resolve(line);
        }
      };
      tlsSocket.on("data", onData);
    });

    if (!greeting.startsWith("* OK")) {
      throw new Error("IMAP greeting failure: " + greeting.substring(0, 100));
    }

    // Now set up permanent _onData listener for subsequent commands
    // (any leftover data in this.buffer will be processed by _onData)
    this.sock.on("data", (chunk) => this._onData(chunk.toString()));
    this.sock.on("error", (err) => { /* swallow */ });
    this.sock.on("close", () => { this.ready = false; });
    this.ready = true;
  }

  async login(user, pass) {
    // IMAP LOGIN requires quoting for passwords with spaces/special chars
    const quotedPass = '"' + pass.replace(/\\/g, "\\\\").replace(/"/g, '\\"') + '"';
    const resp = await this._command(`LOGIN ${user} ${quotedPass}`);
    // Gmail responds with "OK ... authenticated (Success)" not "OK LOGIN"
    if (!resp.some(l => l.includes("OK") && (l.includes("authenticated") || l.includes("LOGIN") || l.includes("Logged")))) {
      throw new Error("LOGIN failed: " + resp.join(" ").substring(0, 100));
    }
  }

  async select(mailbox) {
    const resp = await this._command(`SELECT "${mailbox}"`);
    const status = resp.find(l => l.includes("OK [READ-"));
    return status || resp.join("\n");
  }

  async search(criteria) {
    const resp = await this._command(`SEARCH ${criteria}`);
    // Response looks like: * SEARCH 1 2 3
    for (const line of resp) {
      if (line.startsWith("* SEARCH")) {
        const nums = line.replace("* SEARCH", "").trim();
        return nums ? nums.split(/\s+/).map(Number) : [];
      }
    }
    return [];
  }

  async fetchRaw(uid) {
    const tag = this._nextTag();
    // Use BODY.PEEK[] to fetch without marking emails as \Seen
    const cmd = `${tag} UID FETCH ${uid} BODY.PEEK[]\r\n`;
    
    return new Promise((resolve, reject) => {
      let state = "header"; // header → literal → trailer
      let literalSize = 0;
      let literalBuf = Buffer.alloc(0);
      let rawAccum = Buffer.alloc(0); // accumulate raw bytes for header scanning
      let trailerStr = "";

      const timer = setTimeout(() => {
        this.sock.removeListener("data", dataHandler);
        reject(new Error("FETCH timeout after 30s"));
      }, 30000);

      const _resolve = (val) => { clearTimeout(timer); resolve(val); };
      const _reject = (err) => { clearTimeout(timer); reject(err); };

      const dataHandler = (chunk) => {
        if (state === "header") {
          rawAccum = Buffer.concat([rawAccum, chunk]);
          // Search for the literal size marker {N}\r\n in the raw bytes
          const str = rawAccum.toString("utf-8");
          const litMatch = str.match(/\{(\d+)\}\r\n/);
          if (litMatch) {
            literalSize = parseInt(litMatch[1], 10);
            state = "literal";
            // Find the byte offset of the marker end
            const markerEnd = rawAccum.indexOf("}\r\n") + 3;
            if (markerEnd < rawAccum.length) {
              literalBuf = rawAccum.slice(markerEnd);
              if (literalBuf.length >= literalSize) {
                const overflow = literalBuf.slice(literalSize);
                trailerStr = overflow.toString("latin1");
                literalBuf = literalBuf.slice(0, literalSize);
                state = "trailer";
                // Check immediately — the completion tag may be in this overflow
                if (trailerStr.includes(`${tag} OK`)) {
                  this.sock.removeListener("data", dataHandler);
                  _resolve(literalBuf);
                  return;
                }
              }
            }
            rawAccum = Buffer.alloc(0); // free memory
          }
          return;
        }

        if (state === "literal") {
          literalBuf = Buffer.concat([literalBuf, chunk]);
          if (literalBuf.length >= literalSize) {
            const overflow = literalBuf.slice(literalSize);
            trailerStr = overflow.toString("latin1");
            literalBuf = literalBuf.slice(0, literalSize);
            state = "trailer";
            // Check immediately — the completion tag may be in this overflow
            if (trailerStr.includes(`${tag} OK`)) {
              this.sock.removeListener("data", dataHandler);
              _resolve(literalBuf);
              return;
            }
          }
          return;
        }

        if (state === "trailer") {
          trailerStr += chunk.toString("utf-8");
          if (trailerStr.includes(`${tag} OK`)) {
            this.sock.removeListener("data", dataHandler);
            _resolve(literalBuf);
          } else if (trailerStr.includes(`${tag} BAD`) || trailerStr.includes(`${tag} NO`)) {
            this.sock.removeListener("data", dataHandler);
            _reject(new Error("FETCH failed: " + trailerStr.substring(0, 100)));
          }
        }
      };

      this.sock.on("data", dataHandler);
      this.sock.write(cmd);
    });
  }

  async logout() {
    try {
      await this._command("LOGOUT");
    } catch (e) {}
    try { this.sock.end(); } catch (e) {}
  }

  _nextTag() {
    return "A" + (++this.tagCounter);
  }

  _command(cmd) {
    const tag = this._nextTag();
    const line = `${tag} ${cmd}\r\n`;

    return new Promise((resolve, reject) => {
      const lines = [];
      const handler = (respLine) => {
        lines.push(respLine);
        if (respLine.startsWith(tag + " OK")) {
          this.pending.delete(tag);
          resolve(lines);
        } else if (respLine.startsWith(tag + " BAD") || respLine.startsWith(tag + " NO")) {
          this.pending.delete(tag);
          reject(new Error(cmd.split(" ")[0] + " failed: " + respLine.substring(0, 100)));
        }
      };
      this.pending.set(tag, handler);
      this.sock.write(line);
    });
  }

  _onData(chunk) {
    this.buffer += chunk;
    // Process complete lines
    let idx;
    while ((idx = this.buffer.indexOf("\r\n")) !== -1) {
      const line = this.buffer.substring(0, idx);
      this.buffer = this.buffer.substring(idx + 2);

      // Route to pending commands
      for (const [tag, handler] of this.pending) {
        if (line.startsWith(tag + " ") || line.startsWith("* ") || line.startsWith("+ ")) {
          handler(line);
        }
      }
    }
  }

  _readResponse() {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("IMAP greeting timeout")), 15000);
      const onData = (chunk) => {
        this.buffer += chunk.toString();
        const idx = this.buffer.indexOf("\r\n");
        if (idx !== -1) {
          clearTimeout(timer);
          this.sock.removeListener("data", onData);
          const line = this.buffer.substring(0, idx);
          this.buffer = this.buffer.substring(idx + 2);
          resolve(line);
        }
      };
      this.sock.on("data", onData);
    });
  }
}

// ─── IMAP operations using lightweight client ───
async function connectAndSearch(daysBack) {
  const client = new IMAPClient();
  await client.connect("imap.gmail.com", 993);
  await client.login(GMAIL_USER, GMAIL_PASS);
  
  // Gmail requires SELECT before SEARCH
  await client.select("INBOX");
  
  const since = new Date();
  since.setDate(since.getDate() - (daysBack || 1));
  // Format: DD-Mon-YYYY for IMAP SINCE
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dateStr = `${String(since.getDate()).padStart(2,"0")}-${months[since.getMonth()]}-${since.getFullYear()}`;
  
  const uids = await client.search(`UNSEEN SINCE ${dateStr}`);
  
  console.log("   Search SINCE " + dateStr + " found " + uids.length + " candidates");
  const rawEmails = [];
  for (const uid of uids) {
    try {
      const raw = await client.fetchRaw(uid);
      rawEmails.push(raw);
    } catch (e) {
      console.error(`  Fetch error for UID ${uid}:`, e.message.substring(0, 60));
    }
  }
  
  await client.logout();
  return { uids, rawEmails };
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
      // Check for reply info — handle multiple phrasings
      let replyMatch = line.match(/reply\s+with\s+(?:your\s+)?(?:answer|response|pitch)\s+(?:to|at)\s+(\S+@\S+)/i);
      if (!replyMatch) replyMatch = line.match(/reply\s+(?:to|at):?\s*(\S+@\S+)/i);
      if (!replyMatch) replyMatch = line.match(/reply\s*:?\s*(\S+@\S+)/i);
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
  
  for (const ex of EXCLUDED_CATEGORIES) {
    if (text.includes(ex)) return false;
  }
  
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

function saveRunLog(entry) {
  let log = [];
  try {
    if (existsSync(LOG_FILE)) log = JSON.parse(readFileSync(LOG_FILE, "utf-8"));
  } catch (e) {}
  log.push(entry);
  writeFileSync(LOG_FILE, JSON.stringify(log, null, 2));
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
      const { uids, rawEmails } = await connectAndSearch(7);
      console.log("✅ IMAP connected successfully");
      console.log("📬 Unread emails in last 7 days: " + uids.length);
      console.log("✅ Connection closed");
    } catch (e) {
      console.error("❌ IMAP connection failed:", e.message);
      process.exit(1);
    }
    return;
  }

  // ── Normal run ──
  const runEntry = {
    timestamp: new Date().toISOString(),
    runType: "scheduled-cron",
    edition: "afternoon",
    emailsFound: 0,
    haroDigests: 0,
    queriesParsed: 0,
    relevant: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    notes: "",
  };

  console.log("🔍 Connecting to Gmail IMAP...");
  let uids, rawEmails;
  try {
    const result = await connectAndSearch(1); // 1 day window
    uids = result.uids;
    rawEmails = result.rawEmails;
    console.log("✅ Connected — " + uids.length + " unread emails");
    runEntry.emailsFound = uids.length;
  } catch (e) {
    console.error("❌ Connection failed:", e.message);
    runEntry.notes = "IMAP connection failed: " + e.message.substring(0, 200);
    saveRunLog(runEntry);
    process.exit(1);
  }

  if (uids.length === 0) {
    console.log("   No new emails to process.");
    runEntry.notes = "No new unread emails.";
    saveRunLog(runEntry);
    return;
  }

  // Parse emails
  const allQueries = await parseHarEmails(rawEmails);
  runEntry.queriesParsed = allQueries.length;
  runEntry.haroDigests = allQueries.length > 0 ? 1 : 0;
  console.log("   Parsed " + allQueries.length + " total queries from HARO digests");

  // Filter relevant
  const relevant = allQueries.filter(isRelevant);
  runEntry.relevant = relevant.length;
  console.log("   Relevant finance queries: " + relevant.length);

  if (relevant.length === 0) {
    console.log("   No matching queries found this cycle.");
    runEntry.notes = "No finance-relevant queries in " + allQueries.length + " total.";
    saveRunLog(runEntry);
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
  let failCount = 0;

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
      failCount++;
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
        failCount++;
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
  console.log("  Failed: " + failCount);

  runEntry.sent = sentCount;
  runEntry.skipped = skipCount;
  runEntry.failed = failCount;
  runEntry.notes = `Sent ${sentCount}, skipped ${skipCount}, failed ${failCount} of ${relevant.length} relevant.`;
  saveRunLog(runEntry);
}

main().catch((err) => {
  console.error("Fatal:", err.message);
  process.exit(1);
});
