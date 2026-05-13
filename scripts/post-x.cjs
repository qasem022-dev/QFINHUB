#!/usr/bin/env node
// X/Twitter Auto-Poster for QFINHUB
// Usage:
//   node scripts/post-x.cjs --generate    Generate weekly content (1 DeepSeek call)
//   node scripts/post-x.cjs               Post best tweet for current hour
// Cron: 0 */3 * * * node /path/to/scripts/post-x.cjs

const { readFileSync, writeFileSync, existsSync, mkdirSync } = require("fs");
const { resolve } = require("path");

// Manually load .env.local (dotenv not installed)
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
const CONTENT_FILE = resolve(DATA_DIR, "weekly-content.json");
const LOG_FILE = resolve(DATA_DIR, "post-log.json");

if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const args = process.argv.slice(2);

async function main() {
  const { TwitterApi } = require("twitter-api-v2");

  const apiKey = process.env.X_API_KEY || "";
  const apiSecret = process.env.X_API_SECRET || "";
  const accessToken = process.env.X_ACCESS_TOKEN || "";
  const accessSecret = process.env.X_ACCESS_SECRET || "";

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    console.error("X API credentials not configured in .env.local");
    process.exit(1);
  }

  const xClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  // --- Generate fresh weekly content ---
  if (args.includes("--generate")) {
    const prompt = `Generate 14 tweets for QFINHUB (qfinhub.com), a free financial calculators platform with 124+ calculators.

Rules:
- Each tweet: 1-2 short sentences + link to qfinhub.com/calculators/[slug]
- Cover: mortgages, loans, investing, retirement, taxes, debt, savings
- Vary tone: helpful tips, questions, stats, comparisons
- Include "bestHour" (0-23 US East Coast peak time)
- Max 220 chars per tweet text
- No hashtags. Natural English.

Output ONLY this JSON:
{"tweets":[{"text":"...","link":"https://www.qfinhub.com/calculators/...","bestHour":8,"topic":"mortgage"}]}`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY || "";
    if (!deepseekKey) {
      console.log("No DeepSeek key. Use static fallback.");
      return;
    }

    console.log("Generating weekly content via DeepSeek...");
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + deepseekKey },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      console.error("DeepSeek error:", resp.status, await resp.text().catch(function(){return ""}));
      return;
    }

    const data = await resp.json();
    const raw = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
    var jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON in DeepSeek response");
      return;
    }

    var parsed = JSON.parse(jsonMatch[0]);
    var tweets = parsed.tweets || [];
    var content = { generated: new Date().toISOString(), tweets: tweets, postedIndex: 0 };
    writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
    console.log("Generated " + tweets.length + " tweets. Saved.");
    return;
  }

  // --- Post a tweet ---
  var now = new Date();
  var hour = (now.getUTCHours() - 5 + 24) % 24;

  // Only post 6AM-9PM Eastern
  if (hour < 6 || hour > 21) {
    console.log("Hour " + hour + " — outside 6-21 EST. Skipping.");
    return;
  }

  // Load or create content
  var tweets;
  if (existsSync(CONTENT_FILE)) {
    var content = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));
    tweets = content.tweets || [];
  }

  if (!tweets || tweets.length === 0) {
    // Static fallback
    tweets = [
      { text: "Calculate your monthly mortgage payment instantly. Free, no sign-up.", link: "https://www.qfinhub.com/calculators/mortgage", bestHour: 7, topic: "mortgage" },
      { text: "Compound interest is the 8th wonder of the world. See how your money grows.", link: "https://www.qfinhub.com/calculators/compound-interest", bestHour: 8, topic: "investing" },
      { text: "Rent vs. Buy: which makes more sense for you? Run the numbers in 30 seconds.", link: "https://www.qfinhub.com/calculators/rent-vs-buy", bestHour: 12, topic: "real-estate" },
      { text: "Credit card debt? Calculate when you'll be debt-free with our payoff calculator.", link: "https://www.qfinhub.com/calculators/credit-card-payoff", bestHour: 10, topic: "debt" },
      { text: "Planning retirement? Our free calculator shows if you're on track. Adjust and see.", link: "https://www.qfinhub.com/calculators/retirement", bestHour: 18, topic: "retirement" },
      { text: "How much house can you afford? Get a clear answer in seconds.", link: "https://www.qfinhub.com/calculators/mortgage-affordability", bestHour: 7, topic: "mortgage" },
      { text: "Set a savings goal and see how to reach it. Monthly contributions + interest.", link: "https://www.qfinhub.com/calculators/savings-goal", bestHour: 9, topic: "savings" },
      { text: "Debt avalanche vs snowball — which saves you more? Compare both strategies.", link: "https://www.qfinhub.com/compare/debt-avalanche-vs-debt-snowball", bestHour: 11, topic: "debt" },
      { text: "What would a 1% rate change cost you? Our loan calculator breaks it down.", link: "https://www.qfinhub.com/calculators/loan", bestHour: 13, topic: "loans" },
      { text: "124 free financial calculators. Mortgages, loans, investing, taxes, retirement.", link: "https://www.qfinhub.com/calculators", bestHour: 15, topic: "general" },
    ];
    var content = { generated: now.toISOString(), tweets: tweets, postedIndex: 0 };
    writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
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

  // Score each tweet by bestHour proximity + penalty if recently posted
  var scored = tweets.map(function(t, idx) {
    var timeScore = Math.abs(t.bestHour - hour) * -1;
    var repeatPenalty = recentIds.has("tweet-" + idx) ? -24 : 0;
    return { tweet: t, index: idx, score: timeScore + repeatPenalty };
  });
  scored.sort(function(a, b) { return b.score - a.score; });

  var best = scored[0];
  if (!best) {
    console.log("No suitable tweet found.");
    return;
  }

  var tweetText = best.tweet.link
    ? best.tweet.text + "\n\n" + best.tweet.link
    : best.tweet.text;

  try {
    var result = await xClient.v2.tweet(tweetText.substring(0, 4000));
    console.log("Posted: " + tweetText.substring(0, 80) + "...");
    console.log("Tweet ID: " + result.data.id);

    if (!postedLog.posted) postedLog.posted = [];
    postedLog.posted.push({
      id: "tweet-" + best.index,
      tweetId: result.data.id,
      text: best.tweet.text.substring(0, 80),
      time: now.toISOString()
    });
    writeFileSync(LOG_FILE, JSON.stringify(postedLog, null, 2));
  } catch (err) {
    console.error("Failed to post: " + (err.message || err));
  }
}

main().catch(function(err) { console.error(err); });
