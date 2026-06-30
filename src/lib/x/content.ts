/**
 * X/Twitter content generator for QFINHUB.
 * Uses DeepSeek Flash once/week to batch-generate all tweets.
 */

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || "";

interface TweetContent {
  text: string;
  link?: string;
  bestHour: number; // 0-23 hour to post
  topic: string;
}

// Pre-written content pools to use as fallback (zero API cost)
const STATIC_TWEETS: TweetContent[] = [
  { text: "🏠 Calculate your monthly mortgage payment instantly — free, no sign-up.\nTry it: compound interest, loan payoff, refinance, and more.", link: "https://www.qfinhub.com/calculators/mortgage", bestHour: 7, topic: "mortgage" },
  { text: "💰 Compound interest is the 8th wonder of the world. See how your money grows over time with our free calculator.", link: "https://www.qfinhub.com/calculators/compound-interest", bestHour: 8, topic: "investing" },
  { text: "📊 Rent vs. Buy: which makes more financial sense for you? Run the numbers in 30 seconds with our free tool.", link: "https://www.qfinhub.com/calculators/rent-vs-buy", bestHour: 12, topic: "real-estate" },
  { text: "💳 Credit card debt stressing you out? Calculate exactly when you'll be debt-free with our payoff calculator.", link: "https://www.qfinhub.com/calculators/credit-card-payoff", bestHour: 10, topic: "debt" },
  { text: "📈 Planning for retirement? Our free calculator shows you if you're on track. Adjust age, savings, and returns live.", link: "https://www.qfinhub.com/calculators/retirement", bestHour: 18, topic: "retirement" },
  { text: "🏦 How much house can you afford? Our mortgage affordability calculator gives you a clear answer in seconds.", link: "https://www.qfinhub.com/calculators/mortgage-affordability", bestHour: 7, topic: "mortgage" },
  { text: "🎯 Set a savings goal and see exactly how to reach it. Monthly contributions, interest, timeline — all calculated free.", link: "https://www.qfinhub.com/calculators/savings-goal", bestHour: 9, topic: "savings" },
  { text: "📉 Debt avalanche vs. snowball — which saves you more money? Compare both strategies side by side.", link: "https://www.qfinhub.com/compare/debt-avalanche-vs-debt-snowball", bestHour: 11, topic: "debt" },
  { text: "💼 What would a 1% rate change cost you? Our loan calculator breaks down every scenario. 100% free, 100% accurate.", link: "https://www.qfinhub.com/calculators/loan", bestHour: 13, topic: "loans" },
  { text: "📊 125 free financial calculators. Mortgages, loans, investments, taxes, retirement, and more. All free. No sign-up.", link: "https://www.qfinhub.com/calculators", bestHour: 15, topic: "general" },
  { text: "🔢 The Rule of 72: divide 72 by your annual return to find out how fast your money doubles. Try our calculator.", link: "https://www.qfinhub.com/calculators/rule-of-72", bestHour: 10, topic: "investing" },
  { text: "🏠 First-time homebuyer? Use our complete mortgage calculator to see total costs, PMI, taxes & insurance.", link: "https://www.qfinhub.com/calculators/mortgage", bestHour: 6, topic: "mortgage" },
  { text: "🧮 Free financial tools for loans, mortgages, investments, taxes, retirement, and more. No account required. Just clean, fast math.", link: "https://www.qfinhub.com", bestHour: 14, topic: "general" },
  { text: "💰 Thinking about investing? Start with our free investment calculator. See potential returns with any contribution schedule.", link: "https://www.qfinhub.com/calculators/investment", bestHour: 16, topic: "investing" },
  { text: "📋 W-4 withholding too much or too little? Our free calculator helps you optimize your tax withholding.", link: "https://www.qfinhub.com/calculators/w4", bestHour: 12, topic: "taxes" },
  { text: "📈 S&P 500 historical returns calculator: see what $10,000 invested 20 years ago would be worth today.", link: "https://www.qfinhub.com/calculators/investment", bestHour: 9, topic: "investing" },
  { text: "💳 Pay off your credit cards faster. Our debt snowball calculator shows the optimal payoff order and timeline.", link: "https://www.qfinhub.com/calculators/debt-snowball", bestHour: 11, topic: "debt" },
  { text: "🏡 Refinancing your mortgage? Calculate your break-even point and total interest savings instantly.", link: "https://www.qfinhub.com/calculators/mortgage", bestHour: 7, topic: "mortgage" },
  { text: "📊 Self-employed? Our 1099 calculator estimates your tax burden so you're never surprised at filing time.", link: "https://www.qfinhub.com/calculators/1099", bestHour: 14, topic: "taxes" },
  { text: "🌍 QFINHUB available in 33 languages. Financial calculators for everyone, everywhere.", link: "https://www.qfinhub.com", bestHour: 20, topic: "general" },
];

/**
 * Generate a week's worth of tweets using DeepSeek (1 API call → 14 tweets).
 * Falls back to static content pool if DeepSeek call fails.
 */
export async function generateWeeklyContent(): Promise<TweetContent[]> {
  try {
    if (!DEEPSEEK_API_KEY) {
      console.log("[X Content] No DeepSeek key, using static pool");
      return getStaticWeeklyRotation();
    }

    const prompt = `Generate 14 tweets for QFINHUB (qfinhub.com), a free financial calculators platform.

Rules:
- Each tweet: 1-2 short sentences + link to qfinhub.com calculator
- Cover: mortgages, loans, investing, retirement, taxes, debt, savings
- Vary the tone: helpful, data-driven, question-based, comparison
- Include a "bestHour" (0-23 US East Coast peak time) per tweet
- No hashtags. No emoji overload. Natural language.
- Total text per tweet: max 220 chars (leaves room for link)

Output EXACTLY this JSON format, no other text:
{"tweets":[{"text":"...","link":"https://www.qfinhub.com/calculators/...","bestHour":8,"topic":"mortgage"}]}`;

    const response = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.8,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      console.warn(`[X Content] DeepSeek returned ${response.status}, using static pool`);
      return getStaticWeeklyRotation();
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("[X Content] No JSON in DeepSeek response, using static pool");
      return getStaticWeeklyRotation();
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const tweets: TweetContent[] = parsed.tweets || [];

    if (tweets.length < 7) {
      console.warn("[X Content] Too few tweets, supplementing with static pool");
      return [...tweets, ...getStaticWeeklyRotation().slice(tweets.length)];
    }

    console.log(`[X Content] Generated ${tweets.length} tweets via DeepSeek (1 API call)`);
    return tweets;
  } catch (error) {
    console.error("[X Content] Generation failed:", error);
    return getStaticWeeklyRotation();
  }
}

/**
 * Rotate through static pool — zero API cost.
 */
function getStaticWeeklyRotation(): TweetContent[] {
  // Pick 14 unique tweets from the static pool
  const shuffled = [...STATIC_TWEETS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 14);
}

/**
 * Pick the best tweet to post right now based on current hour.
 */
export function getTweetForNow(tweets: TweetContent[]): TweetContent | null {
  const hour = new Date().getUTCHours() - 5; // US East Coast (approximate)
  const normalizedHour = ((hour % 24) + 24) % 24;

  // Find tweets closest to this hour
  const sorted = [...tweets].sort(
    (a, b) =>
      Math.abs(a.bestHour - normalizedHour) -
      Math.abs(b.bestHour - normalizedHour)
  );

  return sorted[0] || null;
}
