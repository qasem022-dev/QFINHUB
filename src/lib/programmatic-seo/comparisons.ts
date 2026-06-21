/**
 * Calculator Comparison Pages Engine
 * Auto-generates "X vs Y" comparison pages targeting competitive keywords.
 * These are high-search-volume, low-competition queries.
 */

export interface CalculatorComparison {
  slug: string;
  title: string;
  description: string;
  calculatorA: string;
  calculatorB: string;
  h1: string;
  comparisonPoints: string[];
  faqs: { question: string; answer: string }[];
}

// All pairwise comparisons
const COMPARISON_PAIRS: { a: string; b: string; title: string; description: string }[] = [
  // Mortgage comparisons
  { a: "mortgage-calculator", b: "rent-vs-buy", title: "Mortgage vs Rent Calculator", description: "Compare buying a home vs renting with our side-by-side calculators" },
  { a: "mortgage-calculator", b: "mortgage-affordability", title: "Mortgage Payment vs Affordability Calculator", description: "Compare how much house you can afford with actual monthly payments" },
  { a: "30yr-fixed", b: "15yr-fixed", title: "30-Year vs 15-Year Mortgage Calculator", description: "Compare 30-year fixed vs 15-year fixed mortgage payments and total interest" },
  
  // Loan comparisons
  { a: "loan-calculator", b: "amortization-schedule", title: "Loan Calculator vs Amortization Schedule", description: "Compare loan payments with full amortization breakdown side by side" },
  { a: "auto-loan", b: "personal-loan", title: "Auto Loan vs Personal Loan Calculator", description: "Compare auto loan rates against personal loan options for vehicle financing" },
  { a: "student-loan", b: "personal-loan", title: "Student Loan vs Personal Loan Calculator", description: "Compare student loan consolidation vs personal loan refinancing options" },
  { a: "debt-snowball", b: "debt-avalanche", title: "Debt Snowball vs Avalanche Calculator", description: "Compare two debt payoff methods to see which saves you more money" },
  
  // Investment comparisons
  { a: "compound-interest", b: "simple-interest", title: "Compound vs Simple Interest Calculator", description: "Compare how compound interest grows against simple interest over time" },
  { a: "investment-return", b: "compound-interest", title: "Investment Return vs Compound Interest Calculator", description: "Compare investment returns with compound growth calculations" },
  { a: "roth-ira", b: "traditional-ira", title: "Roth IRA vs Traditional IRA Calculator", description: "Compare Roth vs Traditional IRA tax advantages and retirement savings" },
  { a: "401k-calculator", b: "roth-ira", title: "401(k) vs Roth IRA Calculator", description: "Compare 401(k) employer match benefits against Roth IRA tax-free growth" },
  
  // Retirement comparisons
  { a: "retirement-planning", b: "early-retirement", title: "Traditional vs Early Retirement Calculator", description: "Compare standard retirement age with early retirement FIRE strategies" },
  { a: "social-security", b: "retirement-income", title: "Social Security vs Retirement Income Calculator", description: "Compare Social Security benefits against total retirement income needs" },
  
  // Tax comparisons
  { a: "tax-calculator", b: "effective-tax-rate", title: "Tax Calculator vs Effective Tax Rate", description: "Compare your total tax bill with your effective tax rate across brackets" },
  { a: "tax-bracket", b: "effective-tax-rate", title: "Tax Bracket vs Effective Tax Rate Calculator", description: "Compare marginal tax brackets against your actual effective tax rate" },
  { a: "capital-gains-tax", b: "tax-calculator", title: "Capital Gains vs Income Tax Calculator", description: "Compare capital gains tax rates against ordinary income tax rates" },
  
  // Business comparisons
  { a: "break-even", b: "roi-calculator", title: "Break-Even vs ROI Calculator", description: "Compare when you'll break even against your total return on investment" },
  { a: "npv-calculator", b: "irr-calculator", title: "NPV vs IRR Calculator", description: "Compare Net Present Value against Internal Rate of Return for investments" },
  { a: "lease-vs-buy", b: "rent-vs-buy", title: "Lease vs Buy vs Rent Calculator", description: "Compare leasing, buying, and renting options for vehicles and homes" },
  
  // Personal finance
  { a: "budget-planner", b: "savings-goal", title: "Budget Planner vs Savings Goal Calculator", description: "Compare your budget against your savings goals to see if you're on track" },
  { a: "net-worth", b: "budget-planner", title: "Net Worth vs Budget Calculator", description: "Compare your total net worth against your monthly budget allocation" },
  { a: "debt-consolidation", b: "loan-comparison", title: "Debt Consolidation vs Loan Comparison Calculator", description: "Compare debt consolidation loans against keeping separate debts" },
  { a: "inflation-calculator", b: "future-value", title: "Inflation vs Future Value Calculator", description: "Compare how inflation erodes value against future investment growth" },
  { a: "dollar-cost-average", b: "lump-sum", title: "Dollar-Cost Average vs Lump Sum Calculator", description: "Compare DCA strategy against lump sum investing over time" },
  { a: "dividend-calculator", b: "stock-return", title: "Dividend vs Stock Return Calculator", description: "Compare dividend income against total stock market returns" },
  // Portfolio comparisons
  { a: "portfolio-allocator", b: "sharpe-ratio", title: "Portfolio Allocation vs Sharpe Ratio Calculator", description: "Compare asset allocation strategies with risk-adjusted returns" },
  { a: "capm-calculator", b: "sharpe-ratio", title: "CAPM vs Sharpe Ratio Calculator", description: "Compare expected returns from CAPM against risk-adjusted performance" },
];

// ═══════════════════════════════════════════════════════════════
// "Best Calculator" Pages — target high-volume search queries
// People search "best mortgage calculator 2026" — these pages
// compare QFINHUB's tool against top competitors.
// ═══════════════════════════════════════════════════════════════
const BEST_CALCULATOR_PAGES: { slug: string; title: string; description: string; calculatorSlug: string; competitors: string[] }[] = [
  {
    slug: "best-mortgage-calculator",
    title: "Best Mortgage Calculator 2026 — Free, Fast & Accurate",
    description: "Compare QFINHUB's free mortgage calculator vs Bankrate, NerdWallet, and Zillow. See side-by-side features, accuracy, and which is best for your home buying needs.",
    calculatorSlug: "mortgage-calculator",
    competitors: ["Bankrate Mortgage Calculator", "NerdWallet Mortgage Calculator", "Zillow Home Loan Calculator", "Calculator.net Mortgage Calculator"],
  },
  {
    slug: "best-compound-interest-calculator",
    title: "Best Compound Interest Calculator 2026 — See Your Money Grow",
    description: "Compare QFINHUB's compound interest calculator vs Investor.gov, NerdWallet, and Bankrate. Interactive charts, monthly contributions, and export features compared.",
    calculatorSlug: "compound-interest",
    competitors: ["Investor.gov Compound Interest Calculator", "NerdWallet Compound Interest Calculator", "Bankrate Compound Interest Calculator"],
  },
  {
    slug: "best-retirement-calculator",
    title: "Best Retirement Calculator 2026 — Plan Your Future Free",
    description: "Compare QFINHUB's retirement calculator vs Fidelity, Vanguard, and NerdWallet. Side-by-side comparison of features, assumptions, and accuracy for retirement planning.",
    calculatorSlug: "retirement-planning",
    competitors: ["Fidelity Retirement Calculator", "Vanguard Retirement Calculator", "NerdWallet Retirement Calculator", "AARP Retirement Calculator"],
  },
  {
    slug: "best-loan-calculator",
    title: "Best Loan Calculator 2026 — Free Amortization & Payment Tool",
    description: "Compare QFINHUB's loan calculator vs Bankrate, Calculator.net, and NerdWallet. See which has the best amortization schedule, payment breakdown, and features.",
    calculatorSlug: "loan-calculator",
    competitors: ["Bankrate Loan Calculator", "Calculator.net Loan Calculator", "NerdWallet Loan Calculator"],
  },
  {
    slug: "best-401k-calculator",
    title: "Best 401(k) Calculator 2026 — Maximize Your Employer Match",
    description: "Compare QFINHUB's 401(k) calculator vs Bankrate, NerdWallet, and SmartAsset. See which tool helps you maximize employer match and retirement savings.",
    calculatorSlug: "401k-calculator",
    competitors: ["Bankrate 401(k) Calculator", "NerdWallet 401(k) Calculator", "SmartAsset 401(k) Calculator"],
  },
  {
    slug: "best-tax-calculator",
    title: "Best Tax Calculator 2026 — Estimate Your Refund Free",
    description: "Compare QFINHUB's tax calculator vs TurboTax, H&R Block, and SmartAsset. Free income tax estimation, bracket visualization, and deduction analysis.",
    calculatorSlug: "tax-calculator",
    competitors: ["TurboTax TaxCaster", "H&R Block Tax Calculator", "SmartAsset Tax Calculator", "eFile.com Tax Calculator"],
  },
  {
    slug: "best-investment-calculator",
    title: "Best Investment Calculator 2026 — ROI, CAGR & Portfolio Tools",
    description: "Compare QFINHUB's investment calculator vs Bankrate, NerdWallet, and Calculator.net. See ROI, CAGR, dividend, and portfolio analysis features compared.",
    calculatorSlug: "roi-calculator",
    competitors: ["Bankrate Investment Calculator", "NerdWallet Investment Calculator", "Calculator.net Investment Calculator"],
  },
  {
    slug: "best-budget-calculator",
    title: "Best Budget Calculator 2026 — Free Monthly Budget Planner",
    description: "Compare QFINHUB's budget calculator vs Mint, YNAB, and NerdWallet. Free budget planning with category breakdowns and savings goal tracking.",
    calculatorSlug: "budget-planner",
    competitors: ["Mint Budget Calculator", "NerdWallet Budget Calculator", "EveryDollar Budget Calculator"],
  },
];

/**
 * Get all comparison page data — both vs comparisons and best-calculator pages.
 */
export function getAllComparisons(): CalculatorComparison[] {
  const vsPages = COMPARISON_PAIRS.map((pair) => ({
    slug: `compare-${pair.a}-vs-${pair.b}`,
    title: pair.title,
    description: pair.description,
    calculatorA: pair.a,
    calculatorB: pair.b,
    h1: pair.title,
    comparisonPoints: [
      `Compare features and calculations side by side`,
      `See which option saves you more money`,
      `Use both calculators to run your specific numbers`,
      `Get a clear recommendation based on your situation`,
    ],
    faqs: [
      {
        question: `Which calculator should I use?`,
        answer: `It depends on your specific situation. Start with the calculator that most closely matches your scenario, then try the other to compare results. Both tools are free and require no sign-up.`,
      },
      {
        question: `Are the calculations accurate?`,
        answer: `Yes. Both calculators use standard financial formulas. You can verify by running the same inputs through both tools.`,
      },
    ],
  }));

  const bestPages = BEST_CALCULATOR_PAGES.map((b) => ({
    slug: b.slug,
    title: b.title,
    description: b.description,
    calculatorA: b.calculatorSlug,
    calculatorB: b.competitors[0] || "",
    h1: b.title,
    comparisonPoints: b.competitors.map((c) => `QFINHUB vs ${c}: Compare features, speed, accuracy, and ease of use for real financial decisions`),
    faqs: [
      {
        question: `Why is QFINHUB's ${b.title.split(" ").slice(1, 4).join(" ")} the best choice?`,
        answer: `QFINHUB offers completely free, no-sign-up calculators with interactive charts, PDF export, and multi-language support — features that ${b.competitors.slice(0, 2).join(" and ")} often require accounts or payment for.`,
      },
      {
        question: `How accurate is this calculator compared to paid tools?`,
        answer: `Our calculators use the same standard financial formulas as professional software. The results are identical to paid tools — we just don't charge for them.`,
      },
    ],
  }));

  return [...vsPages, ...bestPages];
}

/**
 * Generate comparison slug from calculator IDs.
 */
export function generateComparisonSlug(calcA: string, calcB: string): string {
  return `compare-${calcA}-vs-${calcB}`;
}
