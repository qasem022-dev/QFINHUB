#!/usr/bin/env node

// X/Twitter Auto-Poster for QFINHUB
// Usage:
//   node scripts/post-x.mjs --generate    Generate a fresh week of content (1 DeepSeek call)
//   node scripts/post-x.mjs --post        Post the best tweet for the current hour
//   (no flags)                            Check if it's time to post, then post if needed
// Run via cron every 3 hours:
//   0 */3 * * * node /path/to/scripts/post-x.mjs

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "..", ".env.local") });

const DATA_DIR = resolve(__dirname, "..", ".x-data");
const CONTENT_FILE = resolve(DATA_DIR, "weekly-content.json");
const LOG_FILE = resolve(DATA_DIR, "post-log.json");

// Ensure data directory exists
if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

const args = process.argv.slice(2);

async function main() {
  const { TwitterApi } = await import("twitter-api-v2");

  const apiKey = process.env.X_API_KEY!;
  const apiSecret = process.env.X_API_SECRET!;
  const accessToken = process.env.X_ACCESS_TOKEN!;
  const accessSecret = process.env.X_ACCESS_SECRET!;

  // OAuth 1.0a client
  const xClient = new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken: accessToken,
    accessSecret: accessSecret,
  });

  // --- Generate fresh content ---
  if (args.includes("--generate")) {
    const prompt = `Generate 14 tweets for QFINHUB (qfinhub.com), a free financial calculators platform with 124+ calculators.

Rules:
- Each tweet: 1-2 short sentences + link to qfinhub.com/calculators/[slug]
- Cover diverse topics: mortgages, loans, investing, retirement, taxes, debt, savings, compound interest
- Vary tone: helpful tips, questions, stats, comparisons
- Include "bestHour" (0-23 US East Coast peak time for posting)
- Max 220 chars per tweet text (leaves room for link)
- Natural, conversational English — no hashtags, no emoji overload

Output ONLY this JSON, no other text:
{"tweets":[{"text":"...","link":"https://www.qfinhub.com/calculators/...","bestHour":8,"topic":"mortgage"}]}`;

    const deepseekKey = process.env.DEEPSEEK_API_KEY!;
    if (!deepseekKey) {
      console.log("No DeepSeek key — using static pool");
      return;
    }

    console.log("Generating weekly content via DeepSeek...");
    const resp = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${deepseekKey}` },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    if (!resp.ok) {
      console.error(`DeepSeek error: ${resp.status}`);
      return;
    }

    const data = await resp.json();
    const raw = data.choices?.[0]?.message?.content || "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON in response");
      return;
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const tweets = parsed.tweets || [];

    // Add rotation tracking
    const content = { generated: new Date().toISOString(), tweets, postedIndex: 0 };
    writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
    console.log(`Generated ${tweets.length} tweets. Content saved.`);
    return;
  }

  // --- Post a tweet ---
  const now = new Date();
  const hour = (now.getUTCHours() - 5 + 24) % 24; // EST

  // Only post between 6 AM and 9 PM Eastern (prime hours)
  if (hour < 6 || hour > 21) {
    console.log(`Hour ${hour} — outside posting window (6-21 EST). Skipping.`);
    return;
  }

  // Load content
  if (!existsSync(CONTENT_FILE)) {
    console.log("No content file found. Run with --generate first or use static fallback.");
    // Use static fallback
    const staticTweets = [
      { text: "🏠 Calculate your monthly mortgage payment instantly — free, no sign-up.", link: "https://www.qfinhub.com/calculators/mortgage", bestHour: 7, topic: "mortgage" },
      { text: "💰 Compound interest is the 8th wonder of the world. See how your money grows over time.", link: "https://www.qfinhub.com/calculators/compound-interest", bestHour: 8, topic: "investing" },
      { text: "📊 Rent vs. Buy: which makes more financial sense for you? Run the numbers in 30 seconds.", link: "https://www.qfinhub.com/calculators/rent-vs-buy", bestHour: 12, topic: "real-estate" },
      { text: "💳 Credit card debt? Calculate exactly when you'll be debt-free with our payoff calculator.", link: "https://www.qfinhub.com/calculators/credit-card-payoff", bestHour: 10, topic: "debt" },
      { text: "📈 Planning for retirement? Our free calculator shows if you're on track. Adjust and see live results.", link: "https://www.qfinhub.com/calculators/retirement", bestHour: 18, topic: "retirement" },
      { text: "🏦 How much house can you afford? Our mortgage affordability calculator gives a clear answer.", link: "https://www.qfinhub.com/calculators/mortgage-affordability", bestHour: 7, topic: "mortgage" },
      { text: "🎯 Set a savings goal and see exactly how to reach it. Monthly contributions, interest, timeline.", link: "https://www.qfinhub.com/calculators/savings-goal", bestHour: 9, topic: "savings" },
    ];
    writeFileSync(CONTENT_FILE, JSON.stringify({ generated: now.toISOString(), tweets: staticTweets, postedIndex: 0 }, null, 2));
    console.log("Created static fallback content.");
  }

  const content = JSON.parse(readFileSync(CONTENT_FILE, "utf-8"));
  const tweets = content.tweets || [];

  if (tweets.length === 0) {
    console.log("No tweets in content file.");
    return;
  }

  // Find the best tweet for current hour (that hasn't been posted recently)
  const postedLog = existsSync(LOG_FILE) ? JSON.parse(readFileSync(LOG_FILE, "utf-8")) : { posted: [] };
  const recentIds = new Set(postedLog.posted.slice(-14).map((p: any) => p.id));

  const sorted = [...tweets].map((t: any, i: number) => ({
    ...t,
    index: i,
    score: Math.abs(t.bestHour - hour) * -1 + (recentIds.has(`tweet-${i}`) ? -24 : 0),
  })).sort((a: any, b: any) => b.score - a.score);

  const best = sorted[0];
  if (!best) {
    console.log("No suitable tweet found.");
    return;
  }

  // Post it
  const tweetText = best.link
    ? `${best.text}\n\n${best.link}`
    : best.text;

  try {
    const result = await xClient.v2.tweet(tweetText.slice(0, 4000));
    console.log(`✅ Posted: ${tweetText.slice(0, 60)}...`);
    console.log(`   ID: ${result.data.id}`);

    // Log the post
    postedLog.posted.push({ id: `tweet-${best.index}`, tweetId: result.data.id, text: best.text.slice(0, 80), time: now.toISOString() });
    writeFileSync(LOG_FILE, JSON.stringify(postedLog, null, 2));

    // Rotate content for next time
    content.postedIndex = (content.postedIndex + 1) % content.tweets.length;
    writeFileSync(CONTENT_FILE, JSON.stringify(content, null, 2));
  } catch (error: any) {
    console.error(`❌ Failed to post: ${error.message || error}`);
  }
}

main().catch(console.error);
