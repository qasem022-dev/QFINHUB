#!/usr/bin/env node
// X/Twitter Auto-Poster for QFINHUB — with infographic images
// Usage:
//   node scripts/post-x.cjs --generate    Generate weekly content (1 DeepSeek call)
//   node scripts/post-x.cjs               Post best tweet for current hour + infographic
// Cron: 0 */3 * * * node /path/to/scripts/post-x.cjs

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");
const { randomBytes } = require("crypto");

// Manually load .env.local
try {
  var envContent = readFileSync(resolve(__dirname, "..", ".env.local"), "utf-8");
  envContent.split("\n").forEach(function(line) {
    var match = line.match(/^([^#=]+)=(.+)$/);
    if (match) {
      var key = match[1].trim();
      var val = match[2].trim().replace(/^["']|["']$/g, "");
      process.env[key] = val;
    }
  });
} catch(e) {
  console.error("Could not load .env.local");
}

const DATA_DIR = resolve(__dirname, "..", ".x-data");
const IMG_DIR = resolve(DATA_DIR, "images");
const CONTENT_FILE = resolve(DATA_DIR, "weekly-content.json");
const LOG_FILE = resolve(DATA_DIR, "post-log.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
if (!existsSync(IMG_DIR)) mkdirSync(IMG_DIR, { recursive: true });

const args = process.argv.slice(2);

// ─── Infographic SVGs (inline, no deps) ───
function generateComparisonTableSVG(title, columns, rows) {
  var w = 800, h = 418, colW = Math.floor((w - 40) / columns.length), rowH = 32, startY = 90;
  
  var headers = columns.map(function(col, i) {
    var x = 20 + i * colW;
    return '<text x="' + (x + colW / 2) + '" y="' + (startY - 10) + '" text-anchor="middle" font-size="12" font-weight="600" fill="#1e40af">' + col + '</text>';
  }).join("");
  
  var rowsEl = rows.map(function(row, i) {
    var y = startY + i * rowH;
    var bg = row.highlight ? "#f3f4f6" : (i % 2 === 1 ? "#f3f4f6" : "transparent");
    var cells = row.values.map(function(val, j) {
      var x = 20 + j * colW;
      var color = j === 0 ? "#1f2937" : "#1e40af";
      var weight = j === 0 ? "500" : "700";
      return '<text x="' + (x + colW / 2) + '" y="' + (y + 20) + '" text-anchor="middle" font-size="13" font-weight="' + weight + '" fill="' + color + '">' + val + '</text>';
    }).join("");
    return '<rect x="20" y="' + y + '" width="' + (w - 40) + '" height="' + rowH + '" rx="4" fill="' + bg + '"/>' + cells;
  }).join("");
  
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<rect width="' + w + '" height="' + h + '" rx="16" fill="#ffffff"/>' +
    '<rect x="0" y="0" width="' + w + '" height="48" rx="16" fill="#1e40af"/>' +
    '<rect x="0" y="16" width="' + w + '" height="32" fill="#1e40af"/>' +
    '<text x="20" y="32" font-size="13" font-weight="700" fill="white">QFINHUB</text>' +
    '<text x="' + (w - 20) + '" y="32" text-anchor="end" font-size="12" fill="rgba(255,255,255,0.8)">Free Financial Calculators</text>' +
    '<text x="400" y="72" text-anchor="middle" font-size="16" font-weight="700" fill="#1f2937">' + title + '</text>' +
    headers + '<line x1="20" y1="' + startY + '" x2="' + (w - 20) + '" y2="' + startY + '" stroke="#e5e7eb" stroke-width="1"/>' +
    rowsEl + '</svg>';
}

function generateStatCardSVG(title, stat, description) {
  var w = 800, h = 418;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '">' +
    '<defs><linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">' +
    '<stop offset="0%" stop-color="#1e40af"/><stop offset="100%" stop-color="#6366f1"/></linearGradient></defs>' +
    '<rect width="' + w + '" height="' + h + '" rx="16" fill="url(#bgGrad)"/>' +
    '<text x="30" y="50" font-size="13" font-weight="700" fill="rgba(255,255,255,0.7)">QFINHUB</text>' +
    '<text x="400" y="120" text-anchor="middle" font-size="22" font-weight="700" fill="white">' + title + '</text>' +
    '<text x="400" y="230" text-anchor="middle" font-size="64" font-weight="800" fill="white">' + stat + '</text>' +
    '<text x="400" y="270" text-anchor="middle" font-size="15" fill="rgba(255,255,255,0.85)">' + description + '</text>' +
    '<text x="400" y="360" text-anchor="middle" font-size="12" fill="rgba(255,255,255,0.6)">Try it free at qfinhub.com</text></svg>';
}

function getRandomInfographicSVG() {
  var infographics = [
    generateComparisonTableSVG("30-Year Fixed vs 15-Year Fixed vs 5/1 ARM",
      ["Loan Type", "Rate", "Monthly", "Total Interest"],
      [{label:"30-Year Fixed",values:["30-Year Fixed","6.875%","$1,969","$308,800"]},
       {label:"15-Year Fixed",values:["15-Year Fixed","5.990%","$2,531","$155,700"],highlight:true},
       {label:"5/1 ARM",values:["5/1 ARM","6.375%","$1,872","$273,900"]}]
    ),
    generateComparisonTableSVG("$10,000 Invested Over 30 Years",
      ["Return Rate", "Final Value", "Total Gain"],
      [{label:"3%",values:["3%","$24,273","$14,273"]},
       {label:"7%",values:["7%","$76,123","$66,123"],highlight:true},
       {label:"10%",values:["10%","$174,494","$164,494"]}]
    ),
    generateStatCardSVG("Did You Know?","$308,800","Average total interest on a 30-year $300k mortgage at 6.875%"),
    generateStatCardSVG("Compound Interest","$76,122","What $10,000 grows to in 30 years at 7% — without adding a penny more"),
    generateStatCardSVG("Rent vs Buy","$235,000","Average home equity gained after 10 years of owning vs renting"),
    generateComparisonTableSVG("Credit Card Payoff: Snowball vs Avalanche",
      ["Strategy", "Months to Pay", "Total Interest", "Savings"],
      [{label:"Snowball",values:["Snowball","38 months","$4,820","$980"]},
       {label:"Avalanche",values:["Avalanche","35 months","$4,120","$1,680"],highlight:true}]
    ),
  ];
  return infographics[Math.floor(Math.random() * infographics.length)];
}

// ─── SVG to PNG using sharp ───
async function svgToPng(svgContent) {
  try {
    var sharp = require("sharp");
    var filename = "infographic-" + randomBytes(4).toString("hex") + ".png";
    var filepath = resolve(IMG_DIR, filename);
    
    await sharp(Buffer.from(svgContent))
      .resize(800, 418)
      .png()
      .toFile(filepath);
    
    return filepath;
  } catch(e) {
    console.error("SVG→PNG failed:", e.message);
    return null;
  }
}

// ─── Main ───
async function main() {
  var { TwitterApi } = require("twitter-api-v2");

  var apiKey = process.env.X_API_KEY || "";
  var apiSecret = process.env.X_API_SECRET || "";
  var accessToken = process.env.X_ACCESS_TOKEN || "";
  var accessSecret = process.env.X_ACCESS_SECRET || "";

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.error("X API credentials not configured in .env.local");
    if (!existsSync("./dummy")) {}
    return;
  }

  var xClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  // ── Generate weekly content ──
  if (args.includes("--generate")) {
    var prompt = 'Generate 14 tweets for QFINHUB (qfinhub.com), a free financial calculators platform.\n\nRules:\n- 1-2 short sentences + link\n- Topics: mortgages, loans, investing, retirement, taxes, debt, savings\n- Include "bestHour" (0-23 US East Coast peak time)\n- Max 220 chars per tweet text\n- No hashtags\n\nOutput ONLY this JSON:\n{"tweets":[{"text":"...","link":"https://www.qfinhub.com/calculators/...","bestHour":8,"topic":"mortgage"}]}';

    var deepseekKey = process.env.DEEPSEEK_API_KEY || "";
    if (!deepseekKey) {
      console.log("No DeepSeek key.");
      return;
    }

    console.log("Generating weekly content...");
    var resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + deepseekKey },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      console.error("DeepSeek error:", resp.status);
      return;
    }

    var data = await resp.json();
    var raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
    var match = raw.match(/\{[\s\S]*\}/);
    if (!match) { console.error("No JSON"); return; }

    var parsed = JSON.parse(match[0]);
    var tweets = parsed.tweets || [];
    writeFileSync(CONTENT_FILE, JSON.stringify({ generated: new Date().toISOString(), tweets: tweets, postedIndex: 0 }, null, 2));
    console.log("Generated " + tweets.length + " tweets. Saved.");
    return;
  }

  // ── Post a tweet ──
  var now = new Date();
  var hour = (now.getUTCHours() - 5 + 24) % 24;
  if (hour < 6 || hour > 21) {
    console.log("Hour " + hour + " — outside 6-21 EST. Skipping.");
    return;
  }

  // Load/create content
  var tweets;
  if (existsSync(CONTENT_FILE)) {
    var contentData = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));
    tweets = contentData.tweets || [];
  }

  if (!tweets || tweets.length === 0) {
    tweets = [
      { text: "Calculate your monthly mortgage payment instantly. Free, no sign-up.", link: "https://www.qfinhub.com/calculators/mortgage", bestHour: 7 },
      { text: "Compound interest is the 8th wonder. See how your money grows over time.", link: "https://www.qfinhub.com/calculators/compound-interest", bestHour: 8 },
      { text: "Rent vs Buy: which makes more sense? Run the numbers in 30 seconds.", link: "https://www.qfinhub.com/calculators/rent-vs-buy", bestHour: 12 },
      { text: "Credit card debt? Calculate when you'll be debt-free.", link: "https://www.qfinhub.com/calculators/credit-card-payoff", bestHour: 10 },
      { text: "Planning retirement? Our free calculator shows if you're on track.", link: "https://www.qfinhub.com/calculators/retirement", bestHour: 18 },
      { text: "How much house can you afford? Get a clear answer in seconds.", link: "https://www.qfinhub.com/calculators/mortgage-affordability", bestHour: 7 },
      { text: "Set a savings goal and see exactly how to reach it.", link: "https://www.qfinhub.com/calculators/savings-goal", bestHour: 9 },
      { text: "Debt avalanche vs snowball — which saves you more? Compare both.", link: "https://www.qfinhub.com/compare/debt-avalanche-vs-debt-snowball", bestHour: 11 },
      { text: "124 free financial calculators. Mortgages, loans, investing, taxes, retirement.", link: "https://www.qfinhub.com/calculators", bestHour: 15 },
    ];
    writeFileSync(CONTENT_FILE, JSON.stringify({ generated: now.toISOString(), tweets: tweets, postedIndex: 0 }, null, 2));
  }

  // Post-log tracking
  var postedLog = { posted: [] };
  if (existsSync(LOG_FILE)) {
    try { postedLog = JSON.parse(readFileSync(LOG_FILE, "utf-8")); } catch(e) {}
  }
  var recentIds = new Set();
  var logPosts = postedLog.posted || [];
  for (var i = Math.max(0, logPosts.length - 14); i < logPosts.length; i++) {
    recentIds.add(logPosts[i].id);
  }

  // Score by bestHour proximity + avoid repeats
  var scored = tweets.map(function(t, idx) {
    return {
      index: idx,
      score: Math.abs(t.bestHour - hour) * -1 + (recentIds.has("tweet-" + idx) ? -24 : 0)
    };
  });
  scored.sort(function(a, b) { return b.score - a.score; });

  var best = scored[0];
  if (!best) { console.log("No tweet found."); return; }

  var tweet = tweets[best.index];
  var content = tweet.text;
  if (tweet.link) content += "\n\n" + tweet.link;
  content = content.substring(0, 4000);

  // ── Generate and attach infographic ──
  var mediaId = null;
  try {
    console.log("Generating infographic...");
    var svg = getRandomInfographicSVG();
    var pngPath = await svgToPng(svg);
    
    if (pngPath) {
      console.log("Uploading image:", pngPath);
      var mediaUpload = await xClient.v1.uploadMedia(pngPath);
      mediaId = mediaUpload;
      console.log("Image uploaded, media ID:", mediaId);
    }
  } catch(e) {
    console.log("Image gen failed (non-critical):", e.message);
  }

  // ── Post tweet ──
  try {
    var tweetParams = { text: content };
    if (mediaId) {
      tweetParams.media = { media_ids: [mediaId] };
    }
    
    var result = await xClient.v2.tweet(tweetParams);
    console.log("Posted: " + content.substring(0, 80) + (mediaId ? " [WITH IMAGE]" : ""));
    console.log("Tweet ID: " + result.data.id);

    postedLog.posted.push({
      id: "tweet-" + best.index,
      tweetId: result.data.id,
      text: tweet.text.substring(0, 80),
      hadImage: !!mediaId,
      time: now.toISOString()
    });
    writeFileSync(LOG_FILE, JSON.stringify(postedLog, null, 2));
  } catch(err) {
    console.error("Post failed: " + (err.message || err));
    // Retry without image if image caused the issue
    if (mediaId && err.message && err.message.includes("media")) {
      console.log("Retrying without image...");
      try {
        var result2 = await xClient.v2.tweet(content);
        console.log("Posted (no image): " + content.substring(0, 60));
        console.log("Tweet ID: " + result2.data.id);
        postedLog.posted.push({ id: "tweet-" + best.index, tweetId: result2.data.id, text: tweet.text.substring(0, 80), time: now.toISOString() });
        writeFileSync(LOG_FILE, JSON.stringify(postedLog, null, 2));
      } catch(e2) {
        console.error("Retry also failed:", e2.message);
      }
    }
  }
}

main().catch(function(err) { console.error(err); });
