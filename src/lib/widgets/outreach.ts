/**
 * Widget Email Outreach — Automated Distribution System
 * 
 * Generates personalized email pitches for finance bloggers
 * offering them free embeddable QFINHUB calculator widgets.
 * 
 * This is the distribution engine for the viral widget loop.
 */

import { getCalculatorBySlug, allCalculators } from "@/lib/calculators";
import { generateWidgetCode } from "./generator";
import { getCalculatorComponent } from "@/components/calculators/registry";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.qfinhub.com";

export interface OutreachCampaign {
  calculatorSlug: string;
  calculators: string[];
  subject: string;
  body: string;
  idealFor: string;
}

// ─── Finance Blog Niche Keywords for Auto-Detection ───

export const FINANCE_BLOG_NICHES = [
  { keyword: "mortgage", calculator: "mortgage-calculator", description: "mortgage rates and home buying" },
  { keyword: "real estate", calculator: "mortgage-calculator", description: "real estate investing" },
  { keyword: "home loan", calculator: "mortgage-calculator", description: "home loans" },
  { keyword: "personal finance", calculator: "budget-planner", description: "personal finance" },
  { keyword: "budget", calculator: "budget-planner", description: "budgeting" },
  { keyword: "debt", calculator: "debt-payoff", description: "debt management" },
  { keyword: "loan", calculator: "loan-calculator", description: "loans" },
  { keyword: "invest", calculator: "investment-return", description: "investment" },
  { keyword: "retirement", calculator: "retirement-planning", description: "retirement planning" },
  { keyword: "tax", calculator: "tax-calculator", description: "tax planning" },
  { keyword: "student loan", calculator: "student-loan", description: "student loans" },
  { keyword: "saving", calculator: "savings-goal", description: "savings" },
  { keyword: "credit", calculator: "loan-calculator", description: "credit and loans" },
  { keyword: "financial planning", calculator: "net-worth", description: "financial planning" },
];

// ─── Auto-Generated Pitches ───

/**
 * Generate a personalized outreach email for a blog that matches a niche.
 */
export function generateOutreachEmail(
  blogName: string,
  blogTopic: string,
  blogEmail: string,
  matchedCalculatorSlug: string
): OutreachCampaign | null {
  const calc = getCalculatorBySlug(matchedCalculatorSlug);
  if (!calc) return null;

  const widgetCode = generateWidgetCode(matchedCalculatorSlug);
  if (!widgetCode) return null;

  const embedUrl = `${BASE_URL}/calculators/${matchedCalculatorSlug}/embed`;

  const subject = `Free ${calc.title} widget for ${blogName} readers`;

  const body = [
    `Hi ${blogName} team,`,
    ``,
    `I came across your excellent content about ${blogTopic} and think an interactive ${calc.title} widget would be a great addition for your readers.`,
    ``,
    `I built QFINHUB (${BASE_URL}) — a free collection of 125+ financial calculators.`,
    `I'm offering you a free, embeddable ${calc.title} widget for your site:`,
    ``,
    `✨ Interactive — Your readers can calculate payments and scenarios right on your page`,
    `✨ Fully responsive — Works on mobile, tablet, and desktop`,
    `✨ No sign-up required — Just copy and paste the code`,
    `✨ Completely free — No ads, no API limits, no hidden fees`,
    `✨ Lightweight — Won't slow down your site`,
    ``,
    `Here's the embed page with the code ready to copy-paste:`,
    `${embedUrl}`,
    ``,
    `Just grab the iframe code and drop it into any page on ${blogName}. It works with WordPress, Squarespace, Wix, Webflow, and any CMS that supports HTML.`,
    ``,
    `No strings attached — it's free forever. If you find it useful for your readers, that's all I need.`,
    ``,
    `Best regards,`,
    `QFINHUB Team`,
  ].join("\n");

  return {
    calculatorSlug: matchedCalculatorSlug,
    calculators: [matchedCalculatorSlug],
    subject,
    body,
    idealFor: blogTopic,
  };
}

// ─── Blog Discovery Candidates ───

/**
 * Pre-vetted list of finance blogs that accept guest posts.
 * Each has the niche keyword that helps match the right calculator.
 */
export const OUTREACH_TARGETS: {
  name: string;
  url: string;
  email: string | null;
  niche: string;
  topic: string;
}[] = [
  // High-authority finance blogs that commonly accept widgets/tools
  { name: "Money Crashers", url: "https://www.moneycrashers.com", email: null, niche: "personal finance", topic: "personal finance tips" },
  { name: "The Balance", url: "https://www.thebalancemoney.com", email: null, niche: "personal finance", topic: "personal finance" },
  { name: "Good Financial Cents", url: "https://www.goodfinancialcents.com", email: null, niche: "financial planning", topic: "financial planning" },
  { name: "Making Sense of Cents", url: "https://www.makingsenseofcents.com", email: null, niche: "budget", topic: "budgeting and saving" },
  { name: "Millennial Money", url: "https://www.millennialmoney.com", email: null, niche: "invest", topic: "investing for millennials" },
  { name: "My Money Blog", url: "https://www.mymoneyblog.com", email: null, niche: "personal finance", topic: "personal finance" },
  { name: "TwentySomething Finance", url: "https://www.twentysomethingfinance.com", email: null, niche: "budget", topic: "budgeting" },
  { name: "Mortgage Reports", url: "https://themortgagereports.com", email: null, niche: "mortgage", topic: "mortgage rates" },
  { name: "Housing Wire", url: "https://www.housingwire.com", email: null, niche: "mortgage", topic: "mortgage and housing" },
  { name: "The Truth About Mortgage", url: "https://www.thetruthaboutmortgage.com", email: null, niche: "mortgage", topic: "mortgage guides" },
  { name: "Bankrate", url: "https://www.bankrate.com", email: null, niche: "mortgage", topic: "mortgage and loans" },
  { name: "NerdWallet", url: "https://www.nerdwallet.com", email: null, niche: "personal finance", topic: "personal finance" },
  { name: "Investopedia", url: "https://www.investopedia.com", email: null, niche: "invest", topic: "investing" },
  { name: "SmartAsset", url: "https://smartasset.com", email: null, niche: "financial planning", topic: "financial planning" },
  { name: "Credit Karma", url: "https://www.creditkarma.com", email: null, niche: "credit", topic: "credit and loans" },
  { name: "Student Loan Planner", url: "https://www.studentloanplanner.com", email: null, niche: "student loan", topic: "student loans" },
  { name: "Debt.org", url: "https://www.debt.org", email: null, niche: "debt", topic: "debt management" },
  { name: "Get Rich Slowly", url: "https://www.getrichslowly.com", email: null, niche: "saving", topic: "saving money" },
  { name: "Frugalwoods", url: "https://www.frugalwoods.com", email: null, niche: "budget", topic: "frugal living" },
  { name: "The College Investor", url: "https://thecollegeinvestor.com", email: null, niche: "student loan", topic: "student loans and investing" },
  { name: "Physician on FIRE", url: "https://www.physicianonfire.com", email: null, niche: "retirement", topic: "early retirement" },
  { name: "Financial Samurai", url: "https://www.financialsamurai.com", email: null, niche: "invest", topic: "investing" },
  { name: "Retire by 40", url: "https://www.retireby40.org", email: null, niche: "retirement", topic: "retirement planning" },
  { name: "The Retirement Manifesto", url: "https://www.theretirementmanifesto.com", email: null, niche: "retirement", topic: "retirement" },
  { name: "Dough Roller", url: "https://www.doughroller.net", email: null, niche: "personal finance", topic: "personal finance" },
  { name: "PT Money", url: "https://www.ptmoney.com", email: null, niche: "personal finance", topic: "personal finance" },
  { name: "Money Wizard", url: "https://www.moneywizard.com", email: null, niche: "invest", topic: "investing" },
  { name: "Dividend Growth Investor", url: "https://www.dividendgrowthinvestor.com", email: null, niche: "invest", topic: "dividend investing" },
  { name: "Simply Safe Dividends", url: "https://www.simplysafedividends.com", email: null, niche: "invest", topic: "dividend investing" },
  { name: "Small Business Trends", url: "https://smallbiztrends.com", email: null, niche: "personal finance", topic: "small business finance" },
];

/**
 * Get the best matching calculator for a given niche keyword.
 */
export function getCalculatorForNiche(niche: string): string {
  const match = FINANCE_BLOG_NICHES.find((n) =>
    niche.toLowerCase().includes(n.keyword.toLowerCase())
  );
  return match?.calculator ?? "loan-calculator";
}

/**
 * Get working calculators that can be offered as widgets.
 */
export function getWidgetCandidateCalculators() {
  return allCalculators.filter((calc) => !!getCalculatorComponent(calc.slug));
}
