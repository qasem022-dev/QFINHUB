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
  { a: "present-value", b: "future-value", title: "Present Value vs Future Value Calculator", description: "Compare the time value of money with present and future value calculations" },
  { a: "portfolio-allocator", b: "sharpe-ratio", title: "Portfolio Allocation vs Sharpe Ratio Calculator", description: "Compare asset allocation strategies with risk-adjusted returns" },
  { a: "capm-calculator", b: "sharpe-ratio", title: "CAPM vs Sharpe Ratio Calculator", description: "Compare expected returns from CAPM against risk-adjusted performance" },
];

/**
 * Get all comparison page data.
 */
export function getAllComparisons(): CalculatorComparison[] {
  return COMPARISON_PAIRS.map((pair) => ({
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
        answer: `Yes. Both calculators use standard financial formulas and provide professional-grade results. You can verify by running the same inputs through both tools.`,
      },
    ],
  }));
}

/**
 * Generate comparison slug from calculator IDs.
 */
export function generateComparisonSlug(calcA: string, calcB: string): string {
  return `compare-${calcA}-vs-${calcB}`;
}
