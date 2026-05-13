/**
 * Data Studies Engine — Automated Original Research
 * 
 * Fetches public datasets, analyzes for newsworthy trends,
 * writes data studies, and generates visualizations.
 * Each study targets high-authority backlinks from news sites.
 */

export interface DataStudy {
  id: string;
  title: string;
  description: string;
  slug: string;
  category: "mortgage" | "loan" | "investment" | "retirement" | "tax" | "personal";
  dataSource: string;
  dataUrl: string;
  publishDate: Date;
  keyFindings: string[];
  methodology: string;
  relatedCalculators: string[];
}

// ─── Data Sources ────────────────────────────────────────────

export interface DataSource {
  name: string;
  url: string;
  description: string;
  refreshRate: "monthly" | "quarterly" | "annual";
  lastFetched?: Date;
}

export const DATA_SOURCES: DataSource[] = [
  {
    name: "Federal Reserve Interest Rate",
    url: "https://www.federalreserve.gov/monetarypolicy/openmarket.htm",
    description: "Federal funds rate, prime rate, mortgage rates",
    refreshRate: "monthly",
  },
  {
    name: "Freddie Mac PMMS",
    url: "http://www.freddiemac.com/pmms/",
    description: "Weekly mortgage rate survey — 30yr, 15yr, 5/1 ARM",
    refreshRate: "monthly",
  },
  {
    name: "Bureau of Labor Statistics CPI",
    url: "https://www.bls.gov/cpi/",
    description: "Consumer Price Index — inflation data",
    refreshRate: "monthly",
  },
  {
    name: "Census Bureau Housing",
    url: "https://www.census.gov/housing/",
    description: "Median home prices, housing starts, new home sales",
    refreshRate: "quarterly",
  },
  {
    name: "Zillow Home Value Index",
    url: "https://www.zillow.com/research/data/",
    description: "Median home values by metro area",
    refreshRate: "monthly",
  },
  {
    name: "IRS Tax Statistics",
    url: "https://www.irs.gov/statistics",
    description: "Tax return data, brackets, deductions",
    refreshRate: "annual",
  },
  {
    name: "S&P 500 Historical Data",
    url: "https://www.spglobal.com/spdji/",
    description: "S&P 500 historical returns and valuations",
    refreshRate: "monthly",
  },
  {
    name: "National Association of Realtors",
    url: "https://www.nar.realtor/research-and-statistics",
    description: "Existing home sales, median prices, inventory",
    refreshRate: "monthly",
  },
  {
    name: "Bankrate Loan Data",
    url: "https://www.bankrate.com/",
    description: "Average loan rates by type and credit score",
    refreshRate: "monthly",
  },
  {
    name: "Social Security Administration",
    url: "https://www.ssa.gov/oact/",
    description: "Retirement benefit statistics, life expectancy",
    refreshRate: "annual",
  },
];

// ─── Study Templates ─────────────────────────────────────────

export interface StudyTemplate {
  id: string;
  title: string;
  description: string;
  dataSource: string;
  category: DataStudy["category"];
  relatedCalculators: string[];
  methodology: string;
  angleHint: string; // What makes this newsworthy
  keywords: string[]; // SEO target keywords
}

export const STUDY_TEMPLATES: StudyTemplate[] = [
  {
    id: "mortgage-payment-by-state",
    title: "Average Mortgage Payment in Every US State (2026)",
    description: "Comprehensive analysis of monthly mortgage payments across all 50 states, based on median home prices and current interest rates.",
    dataSource: "Zillow Home Value Index",
    category: "mortgage",
    relatedCalculators: ["mortgage-calculator", "mortgage-affordability"],
    methodology: "Calculated monthly payment for median-priced home in each state using current 30-year fixed mortgage rate, assuming 20% down payment. Includes estimated property taxes and insurance.",
    angleHint: "Housing affordability crisis — shows how much income needed in each state",
    keywords: ["mortgage payment by state", "average mortgage payment", "housing affordability 2026", "monthly mortgage cost by state"],
  },
  {
    id: "fed-rate-impact",
    title: "How the Fed Rate Affects Your Mortgage Payment",
    description: "Analysis of how Federal Reserve interest rate changes impact monthly mortgage payments at different home price points.",
    dataSource: "Federal Reserve Interest Rate",
    category: "mortgage",
    relatedCalculators: ["mortgage-calculator"],
    methodology: "Modeled monthly payment changes across 0.25% to 2% rate changes for home prices from $200K to $1M.",
    angleHint: "Every Fed meeting could cost homeowners thousands",
    keywords: ["fed rate mortgage impact", "interest rate monthly payment", "federal reserve housing"],
  },
  {
    id: "rent-vs-buy-2026",
    title: "Rent vs Buy Analysis 2026: Which Is Cheaper in Your State?",
    description: "State-by-state comparison of renting versus buying a home, factoring in current mortgage rates, rent prices, and tax benefits.",
    dataSource: "Zillow Home Value Index",
    category: "mortgage",
    relatedCalculators: ["rent-vs-buy", "mortgage-calculator"],
    methodology: "Compared median rent vs 30-year mortgage payment for median-priced home in each state, including tax benefits and maintenance costs.",
    angleHint: "In some states renting is 40% cheaper — surprising findings",
    keywords: ["rent vs buy 2026", "is renting cheaper than buying", "buy vs rent calculator"],
  },
  {
    id: "student-loan-statistics",
    title: "Student Loan Debt Statistics 2026: Total, Average, and Trends",
    description: "Updated analysis of student loan debt in America, including total debt, average per borrower, and repayment trends.",
    dataSource: "Bankrate Loan Data",
    category: "loan",
    relatedCalculators: ["student-loan", "loan-calculator"],
    methodology: "Compiled data from Federal Student Aid, Fed Reserve, and Bankrate for comprehensive student loan analysis.",
    angleHint: "Student loan forgiveness impact — how many borrowers actually benefit",
    keywords: ["student loan statistics 2026", "average student loan debt", "student loan crisis"],
  },
  {
    id: "credit-card-debt",
    title: "Credit Card Debt in America 2026: Average Balance by State",
    description: "Analysis of credit card debt across US states, showing average balances, interest costs, and payoff timelines.",
    dataSource: "Federal Reserve Interest Rate",
    category: "loan",
    relatedCalculators: ["debt-payoff", "debt-snowball", "debt-avalanche"],
    methodology: "Analyzed Fed Reserve consumer credit data and TransUnion/Experian reports for state-level credit card debt.",
    angleHint: "At current APR rates, minimum payments mean decades of debt",
    keywords: ["credit card debt 2026", "average credit card balance", "credit card debt by state"],
  },
  {
    id: "retirement-savings-gap",
    title: "The Retirement Savings Gap: How Much You Need vs. How Much You Have",
    description: "Analysis comparing recommended retirement savings targets against actual savings across different age groups and income levels.",
    dataSource: "Social Security Administration",
    category: "retirement",
    relatedCalculators: ["retirement-planning", "401k-calculator", "roth-ira"],
    methodology: "Compared Fidelity/industry retirement guidelines (10x salary by 67) against actual median savings from Fed Survey of Consumer Finances.",
    angleHint: "The average 50-year-old has only saved a fraction of what they need",
    keywords: ["retirement savings gap", "how much do I need for retirement", "retirement savings by age"],
  },
  {
    id: "tax-burden-by-state",
    title: "Total Tax Burden by State 2026: Income, Property, and Sales Tax Combined",
    description: "Comprehensive comparison of total tax burden across all 50 states, combining federal, state, and local taxes.",
    dataSource: "IRS Tax Statistics",
    category: "tax",
    relatedCalculators: ["tax-calculator", "effective-tax-rate"],
    methodology: "Calculated combined tax burden for median income household in each state, including federal income tax, state income tax, property tax, and sales tax.",
    angleHint: "Moving to the wrong state could cost you $20K+/year in taxes",
    keywords: ["tax burden by state", "state tax comparison", "lowest tax states 2026"],
  },
  {
    id: "inflation-purchasing-power",
    title: "How Inflation Is Eating Your Savings: Purchasing Power Analysis",
    description: "Analysis of how recent inflation has eroded purchasing power across different saving and investment strategies.",
    dataSource: "Bureau of Labor Statistics CPI",
    category: "investment",
    relatedCalculators: ["inflation-calculator", "compound-interest", "savings-goal"],
    methodology: "Compared CPI inflation data against savings account rates, bond yields, and stock market returns over 1, 3, 5, and 10 year periods.",
    angleHint: "Money in a regular savings account lost 15% purchasing power since 2022",
    keywords: ["inflation purchasing power", "inflation savings impact", "investing during inflation"],
  },
];

// ─── Study Generation ────────────────────────────────────────

/**
 * Get all study templates that are ready for generation.
 */
export function getReadyStudies(): StudyTemplate[] {
  return STUDY_TEMPLATES;
}

/**
 * Generate the blog post content structure for a data study.
 * The actual content is generated by the AI content engine using DeepSeek.
 */
export function getStudyBlogStructure(study: StudyTemplate): {
  title: string;
  slug: string;
  sections: string[];
  keyData: string[];
  relatedInternalLinks: string[];
} {
  const slug = study.id;

  return {
    title: study.title,
    slug: `blog/${slug}`,
    sections: [
      `## Executive Summary`,
      `## Key Findings`,
      `## Methodology`,
      `## State-by-State Analysis`,
      `## Comparison With Previous Years`,
      `## What This Means For You`,
      `## Frequently Asked Questions`,
    ],
    keyData: [
      `Data source: ${study.dataSource}`,
      `Analysis period: Current as of ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
      `Calculator used: ${study.relatedCalculators.join(", ")}`,
    ],
    relatedInternalLinks: study.relatedCalculators.map(
      (calc) => `/calculators/${calc}`
    ),
  };
}

/**
 * Generate HARO-ready pitch text for a data study.
 * Used by the outreach agent to pitch journalists.
 */
export function generateHAROPitch(study: StudyTemplate): string {
  return [
    `Hi [Journalist Name],`,
    ``,
    `I saw you're covering [topic related to ${study.category}].`,
    `I run QFINHUB.com (a financial calculator platform) and we just published a new data study:`,
    ``,
    `"${study.title}"`,
    ``,
    `${study.description}`,
    ``,
    `${study.angleHint}`,
    ``,
    `I can provide:`,
    `- A full data set in spreadsheet format`,
    `- Custom queries for specific states or demographics`,
    `- Interactive embeddable chart/calculator for your article`,
    `- Expert commentary on the methodology and findings`,
    ``,
    `The study is published at: https://qfinhub.com/blog/${study.id}`,
    ``,
    `Would you be interested in featuring this data in your story?`,
    ``,
    `Best,`,
    `QFINHUB Team`,
  ].join("\n");
}
