/**
 * Newsjacking Bot — Automated Timely Content Engine
 * 
 * Monitors financial news RSS feeds 24/7. When breaking news happens
 * (Fed rate changes, housing data, tax law updates, etc.),
 * auto-generates and publishes a blog post within 1 hour.
 * 
 * Also auto-pitches to journalists and shares on social.
 */

export interface FinancialNewsEvent {
  id: string;
  title: string;
  description: string;
  source: string;
  sourceUrl: string;
  category: NewsCategory;
  severity: "low" | "medium" | "high" | "critical";
  publishedAt: Date;
  keywords: string[];
  relatedCalculators: string[];
  suggestedTitle: string;
}

export type NewsCategory =
  | "fed-rate"
  | "housing"
  | "tax"
  | "inflation"
  | "stock-market"
  | "student-loan"
  | "crypto"
  | "recession"
  | "personal-finance"
  | "real-estate";

// ─── RSS Feed Sources ─────────────────────────────────────────

export const NEWS_FEEDS: { name: string; url: string; category: NewsCategory; priority: number }[] = [
  // Federal Reserve
  { name: "Federal Reserve News", url: "https://www.federalreserve.gov/feeds/press_all.xml", category: "fed-rate", priority: 10 },
  { name: "Fed Speeches", url: "https://www.federalreserve.gov/feeds/speeches.xml", category: "fed-rate", priority: 8 },

  // Housing
  { name: "NAR Research", url: "https://www.nar.realtor/research-and-statistics/rss.xml", category: "housing", priority: 9 },
  { name: "Freddie Mac News", url: "https://freddiemac.gcs-web.com/news-releases/rss", category: "housing", priority: 7 },
  { name: "Housing Wire", url: "https://www.housingwire.com/feed/", category: "housing", priority: 8 },

  // General Finance
  { name: "CNBC Finance", url: "https://www.cnbc.com/id/100003114/device/rss/rss.html", category: "stock-market", priority: 7 },
  { name: "Bloomberg Markets", url: "https://feeds.bloomberg.com/markets/news.rss", category: "stock-market", priority: 7 },
  { name: "Reuters Money", url: "https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best&best-sectors=personal-finance", category: "personal-finance", priority: 6 },
  { name: "Yahoo Finance", url: "https://finance.yahoo.com/news/rssindex", category: "stock-market", priority: 5 },

  // Inflation / Economy
  { name: "BLS News", url: "https://www.bls.gov/feed/news.rss", category: "inflation", priority: 9 },
  { name: "BEA Economic Data", url: "https://www.bea.gov/rss/news.xml", category: "inflation", priority: 8 },

  // Real Estate
  { name: "Zillow Research", url: "https://www.zillow.com/research/feed/", category: "real-estate", priority: 8 },
  { name: "Realtor.com News", url: "https://www.realtor.com/news/feed/", category: "real-estate", priority: 7 },

  // Tax
  { name: "IRS Newsroom", url: "https://www.irs.gov/newsroom/rss.xml", category: "tax", priority: 9 },

  // Student Loans
  { name: "Student Aid News", url: "https://studentaid.gov/data-center/rss.xml", category: "student-loan", priority: 6 },
];

// ─── Event Templates ─────────────────────────────────────────

// Keywords that trigger specific response templates
export const TRIGGER_KEYWORDS: Record<string, { category: NewsCategory; calculators: string[]; angle: string }> = {
  // Fed rate keywords
  "federal reserve rate": {
    category: "fed-rate",
    calculators: ["mortgage-calculator", "loan-calculator", "mortgage-affordability"],
    angle: "How the Fed rate change affects your mortgage, loan, and savings",
  },
  "interest rate hike": {
    category: "fed-rate",
    calculators: ["mortgage-calculator", "loan-calculator"],
    angle: "What an interest rate hike means for home buyers and borrowers",
  },
  "interest rate cut": {
    category: "fed-rate",
    calculators: ["mortgage-calculator", "loan-calculator", "refinancing"],
    angle: "How the rate cut affects your monthly payments and refinancing options",
  },
  "fed rate decision": {
    category: "fed-rate",
    calculators: ["mortgage-calculator", "loan-calculator", "savings-goal"],
    angle: "Breaking down the Fed rate decision: winners and losers",
  },
  "prime rate": {
    category: "fed-rate",
    calculators: ["loan-calculator", "mortgage-calculator"],
    angle: "Prime rate changes and what they mean for your credit cards and loans",
  },

  // Housing keywords
  "home prices": {
    category: "housing",
    calculators: ["mortgage-calculator", "mortgage-affordability", "rent-vs-buy"],
    angle: "How changing home prices affect mortgage payments and affordability",
  },
  "housing market": {
    category: "housing",
    calculators: ["mortgage-calculator", "mortgage-affordability"],
    angle: "What the latest housing market data means for buyers and sellers",
  },
  "mortgage rates": {
    category: "housing",
    calculators: ["mortgage-calculator", "mortgage-affordability", "refinancing"],
    angle: "Mortgage rate movements and their impact on your monthly payment",
  },
  "home sales": {
    category: "housing",
    calculators: ["mortgage-calculator", "mortgage-affordability"],
    angle: "Home sales data shows where the market is heading",
  },
  "existing home sales": {
    category: "housing",
    calculators: ["mortgage-calculator", "rent-vs-buy"],
    angle: "Existing home sales trends and what they mean for your next move",
  },
  "new home sales": {
    category: "housing",
    calculators: ["mortgage-calculator"],
    angle: "New home construction and sales: what the data reveals",
  },

  // Inflation keywords
  "cpi": {
    category: "inflation",
    calculators: ["inflation-calculator", "savings-goal", "retirement-planning"],
    angle: "How the latest CPI reading affects your savings and spending",
  },
  inflation: {
    category: "inflation",
    calculators: ["inflation-calculator", "savings-goal"],
    angle: "Inflation update: protecting your purchasing power",
  },
  "consumer price index": {
    category: "inflation",
    calculators: ["inflation-calculator", "retirement-planning"],
    angle: "CPI breakdown: which costs are rising and how to adjust",
  },

  // Student loan keywords
  "student loan forgiveness": {
    category: "student-loan",
    calculators: ["student-loan", "loan-calculator"],
    angle: "Student loan forgiveness update: who qualifies and how much",
  },
  "student loan payment": {
    category: "student-loan",
    calculators: ["student-loan", "loan-calculator"],
    angle: "Student loan payments restarting: what to expect",
  },

  // Tax keywords
  "tax deadline": {
    category: "tax",
    calculators: ["tax-calculator", "effective-tax-rate"],
    angle: "Tax deadline approaching: last-minute tips and calculators",
  },
  "tax bracket": {
    category: "tax",
    calculators: ["tax-calculator", "tax-bracket", "effective-tax-rate"],
    angle: "Tax bracket changes: how your income is affected",
  },
  "standard deduction": {
    category: "tax",
    calculators: ["tax-calculator", "effective-tax-rate"],
    angle: "Standard deduction update: how much you can deduct this year",
  },
  "irs": {
    category: "tax",
    calculators: ["tax-calculator"],
    angle: "IRS updates and changes: what taxpayers need to know",
  },

  // Recession keywords
  recession: {
    category: "recession",
    calculators: ["retirement-planning", "budget-planner", "savings-goal"],
    angle: "Recession concerns: how to prepare your finances",
  },
  "economic downturn": {
    category: "recession",
    calculators: ["budget-planner", "savings-goal", "retirement-planning"],
    angle: "Navigating an economic downturn: practical financial steps",
  },
  gdp: {
    category: "recession",
    calculators: ["investment-return", "retirement-planning"],
    angle: "GDP report analysis and what it means for your investments",
  },

  // Investment keywords
  "stock market": {
    category: "stock-market",
    calculators: ["investment-return", "compound-interest", "retirement-planning"],
    angle: "Stock market movements and their impact on your retirement and investments",
  },
  "s&p 500": {
    category: "stock-market",
    calculators: ["investment-return", "401k-calculator"],
    angle: "S&P 500 performance analysis and long-term outlook",
  },
  "dow jones": {
    category: "stock-market",
    calculators: ["investment-return"],
    angle: "Market milestone: what the Dow's movement means for investors",
  },
};

// ─── Blog Post Template ─────────────────────────────────────

export function getNewsjackingTemplate(
  event: {
    title: string;
    description: string;
    category: NewsCategory;
    keywords: string[];
    relatedCalculators: string[];
  }
): { title: string; sections: string[]; internalLinks: string[] } {
  const calcLinks = event.relatedCalculators.map(
    (calc) => `/calculators/${calc}`
  );

  return {
    title: event.title,
    sections: [
      `## What Happened`,
      `## Why It Matters For Your Finances`,
      `## How to Calculate the Impact`,
      `## What To Do Next`,
      `## Frequently Asked Questions`,
    ],
    internalLinks: calcLinks,
  };
}

/**
 * Generate a Twitter/X-ready headline for a newsjacking post.
 */
export function generateSocialHeadline(
  title: string,
  category: NewsCategory
): string {
  const hooks: Record<string, string[]> = {
    "fed-rate": [
      "💰 The Fed just made a move. Here's how much more you'll pay (or save).",
      "Breaking: Fed rate decision drops. Calculate your new payment:",
    ],
    housing: [
      "🏠 Housing market just changed. See how it affects YOUR monthly payment:",
      "New housing data is out. Is it a buyer's market or seller's market?",
    ],
    inflation: [
      "📈 CPI numbers are out. Find out if your savings are keeping up:",
      "Inflation update: How much purchasing power have you lost?",
    ],
    tax: [
      "📋 Tax changes are here. Use this to calculate exactly what you owe:",
      "New tax brackets announced. See where you fall:",
    ],
    "student-loan": [
      "🎓 Student loan news just dropped. Calculate your new payment:",
      "Student loan update: What it means for your monthly budget:",
    ],
    "stock-market": [
      "📊 Market update. See how it affects your retirement:",
      "Stock market alert: Calculate the impact on your portfolio:",
    ],
  };

  const categoryHooks = hooks[category] ?? [
    "💰 Breaking financial news. Calculate how it affects you:",
  ];

  return `${categoryHooks[Math.floor(Math.random() * categoryHooks.length)]} https://qfinhub.com/blog/latest`;
}

/**
 * Check if an article title/keywords match any trigger.
 */
export function matchNewsTrigger(
  title: string,
  description: string
): { matched: boolean; category: NewsCategory; calculators: string[]; angle: string } | null {
  const combined = `${title} ${description}`.toLowerCase();

  for (const [keyword, config] of Object.entries(TRIGGER_KEYWORDS)) {
    if (combined.includes(keyword.toLowerCase())) {
      return {
        matched: true,
        category: config.category,
        calculators: config.calculators,
        angle: config.angle,
      };
    }
  }

  return null;
}
