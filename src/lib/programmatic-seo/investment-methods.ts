/**
 * "How to Calculate Investment Return" — Original Methodology Cluster
 *
 * Targets high-intent queries like:
 *   "how to calculate investment return"          (17 imp/90d, pos 81)
 *   "calculate investment return"                (18 imp/90d, pos 87)
 *   "investment return calculator"               (28 imp/90d, pos 83)
 *   "rate of return investment calculator"       (13 imp/90d, pos 92)
 *   "annual return on investment calculator"      (7 imp/90d, pos 85)
 *
 * Each guide explains ONE specific method or concept in depth, with original
 * worked examples, formula derivations, common pitfalls, and when to use
 * which method. NOT templated — each page is hand-written expert content.
 *
 * Different from the existing /calculators/investment-return tool page,
 * which only shows results. These guides teach the methodology.
 */

export interface InvestmentMethodGuide {
  slug: string;
  method: string;
  title: string;
  description: string;
  h1: string;
  formula: string;
  formulaExplanation: string;
  whenToUse: string[];
  workedExamples: WorkedExample[];
  pitfalls: Pitfall[];
  faqs: { question: string; answer: string }[];
  relatedCalculatorSlug: string;
  relatedDecisionSlug: string;
}

export interface WorkedExample {
  scenario: string;
  given: { label: string; value: string }[];
  calculation: string[];
  result: string;
  insight: string;
}

export interface Pitfall {
  title: string;
  description: string;
  fix: string;
}

// ─── Method 1: CAGR (Compound Annual Growth Rate) ───────────────
const CAGR_GUIDE: InvestmentMethodGuide = {
  slug: "how-to-calculate-cagr",
  method: "CAGR",
  title: "How to Calculate CAGR (Compound Annual Growth Rate)",
  description: "Step-by-step guide to calculating CAGR with worked examples. Learn when to use CAGR, its formula, common pitfalls, and how it differs from average return. Free, no signup.",
  h1: "How to Calculate CAGR (Compound Annual Growth Rate)",
  formula: "CAGR = (End Value / Start Value)^(1 / years) − 1",
  formulaExplanation:
    "CAGR is the constant annual rate at which an investment would have grown if it had grown at the same rate every year. It smooths out volatility to give you a single comparable number — like saying 'this investment returned 9.6% per year on average, compounded annually'.",
  whenToUse: [
    "Comparing performance of two investments over different time periods",
    "Evaluating whether an investment met a benchmark (e.g., S&P 500 average)",
    "Projecting future values based on historical returns",
    "Reporting investment performance in standardized form (IRRs use CAGR for benchmarking)",
  ],
  workedExamples: [
    {
      scenario: "Example 1: Stock investment 2015-2025",
      given: [
        { label: "Bought January 2015", value: "$10,000 (50 shares at $200)" },
        { label: "Sold December 2025", value: "$25,000 (50 shares at $500)" },
        { label: "No dividends reinvested", value: "—" },
      ],
      calculation: [
        "End Value / Start Value = $25,000 / $10,000 = 2.5",
        "Years = 2025 − 2015 = 10 years",
        "CAGR = 2.5^(1/10) − 1 = 1.0960 − 1 = 0.0960",
      ],
      result: "CAGR = 9.60% per year",
      insight: "Your investment grew 150% total, but the annualized rate is 9.60% — not 15% (which would be the simple average). The compounding effect makes a big difference over 10 years.",
    },
    {
      scenario: "Example 2: 401(k) account with contributions",
      given: [
        { label: "Starting balance January 2020", value: "$50,000" },
        { label: "Ending balance December 2024", value: "$120,000" },
        { label: "Total contributions over 5 years", value: "$30,000" },
      ],
      calculation: [
        "Note: CAGR assumes a single lump sum. For accounts with ongoing contributions, this calculation understates true return because it ignores the new money.",
        "For comparison purposes only: ($120,000 / $50,000)^(1/5) − 1 = 1.0914 − 1 = 0.0914",
      ],
      result: "Apparent CAGR = 9.14% per year (but actual return is higher because contributions also grew)",
      insight: "For investment accounts with periodic contributions, use the XIRR function in Excel or Google Sheets instead. CAGR is misleading when cash flows happen mid-period.",
    },
    {
      scenario: "Example 3: Negative return scenario",
      given: [
        { label: "Bought January 2022", value: "$100,000" },
        { label: "Sold December 2024 (after market decline)", value: "$82,000" },
        { label: "Period length", value: "3 years" },
      ],
      calculation: [
        "$82,000 / $100,000 = 0.82",
        "0.82^(1/3) = 0.9381",
        "0.9381 − 1 = −0.0619",
      ],
      result: "CAGR = −6.19% per year",
      insight: "A 'loss of 18%' over 3 years is actually only a 6.19% annualized loss. This is the recovery power of compound growth — and why holding through downturns often pays off.",
    },
  ],
  pitfalls: [
    {
      title: "Pitfall 1: Using CAGR for accounts with regular contributions",
      description: "CAGR assumes a single lump-sum investment at the start. For 401(k)s, IRAs, or any account with periodic contributions, CAGR understates the true return because it ignores the new money.",
      fix: "Use XIRR (Extended Internal Rate of Return) in Excel/Google Sheets. It accounts for the timing of each cash flow. Our investment return calculator uses a simplified XIRR-style calculation.",
    },
    {
      title: "Pitfall 2: Comparing CAGR across different time periods",
      description: "An S&P 500 CAGR of 10% from 2010-2020 (a bull market) is not directly comparable to a 10% CAGR from 2000-2010 (which included the dot-com crash and 2008 financial crisis).",
      fix: "Always state the time period when comparing CAGRs. A 10% CAGR over 5 years during a bull market ≠ 10% CAGR over 20 years including recessions.",
    },
    {
      title: "Pitfall 3: Ignoring dividends and fees",
      description: "If your investment returned 7% in price appreciation but paid 2% in dividends, your total return CAGR is 9%, not 7%. Similarly, a 1% expense ratio reduces your real CAGR by 1% per year.",
      fix: "Use total return (price + dividends) and subtract fees. For S&P 500, the historical CAGR is ~10% with dividends reinvested, not the 7% price-only number.",
    },
    {
      title: "Pitfall 4: Believing CAGR predicts future returns",
      description: "CAGR is backward-looking. The S&P 500's 10% historical CAGR does NOT mean it will return 10% over the next 10 years. Future returns depend on valuations, economic conditions, and corporate earnings.",
      fix: "Use historical CAGR as one input among many. For projections, use Monte Carlo simulations with a range of possible returns (e.g., 5%, 8%, 11%, 14%) rather than a single point estimate.",
    },
  ],
  faqs: [
    {
      question: "What is a good CAGR for an investment?",
      answer: "The S&P 500 has historically returned ~10% CAGR (with dividends reinvested) over long periods. A 'good' CAGR depends on the asset class: stocks 7-10%, bonds 3-5%, real estate 4-8%, savings accounts 1-5%. Risk-adjusted returns (Sharpe ratio) matter more than raw CAGR.",
    },
    {
      question: "How does CAGR differ from average return?",
      answer: "Average return is the arithmetic mean of yearly returns. CAGR is the geometric mean (compounded). Example: +100% year 1, −50% year 2 = 0% average, but −29.3% CAGR. CAGR is always lower than average return for volatile investments. CAGR is the correct measure of actual growth.",
    },
    {
      question: "Can CAGR be negative?",
      answer: "Yes. A negative CAGR means the investment lost value on an annualized basis. Example: a stock that drops from $100 to $50 over 3 years has a CAGR of −20.6%. A stock that drops from $100 to $90 over 1 year has a CAGR of −10%.",
    },
    {
      question: "What's the difference between CAGR and APY?",
      answer: "CAGR describes investment growth over multiple years. APY (Annual Percentage Yield) describes the annualized return on a deposit or loan, including compounding. CAGR is typically calculated for investments with buy/sell dates; APY is given for savings accounts, CDs, and loans.",
    },
    {
      question: "How do I calculate CAGR in Excel?",
      answer: "Formula: =(End Value / Start Value)^(1 / years) − 1. Example: =((25000/10000)^(1/10))-1 returns 0.0960 (9.60%). For accounts with periodic contributions, use the XIRR function with dates and cash flows.",
    },
    {
      question: "Should I use CAGR or IRR?",
      answer: "Use CAGR for lump-sum investments you can hold throughout the period. Use IRR (or XIRR) for investments with multiple cash flows — like a 401(k) with monthly contributions, a rental property with ongoing expenses, or a business investment. IRR handles the timing of each cash flow, which is critical for accurate returns.",
    },
    {
      question: "Why does CAGR matter for retirement planning?",
      answer: "Compounding is the engine of retirement wealth. A 1% higher CAGR over 30 years can mean 30%+ more retirement savings. If you start with $10K, contribute $500/month for 30 years: at 7% CAGR you have ~$680K; at 8% CAGR you have ~$890K. That's a $210K difference from one percentage point of return.",
    },
  ],
  relatedCalculatorSlug: "investment-10k-10yr",
  relatedDecisionSlug: "pay-off-debt-or-invest",
};

// ─── Method 2: Total Return (Simple) ───────────────────────────
const TOTAL_RETURN_GUIDE: InvestmentMethodGuide = {
  slug: "how-to-calculate-total-return",
  method: "Total Return",
  title: "How to Calculate Total Return on Investment (With Examples)",
  description: "Total return = price appreciation + dividends + interest. Learn the simple formula, when to use it, and the common mistake of measuring price-only returns. Free, with worked examples.",
  h1: "How to Calculate Total Return on an Investment",
  formula: "Total Return % = ((End Value − Start Value) + Income) / Start Value × 100",
  formulaExplanation:
    "Total return captures the full picture of what an investment earned: both the change in price AND any income it generated (dividends, interest, distributions). It's the most honest measure of investment performance.",
  whenToUse: [
    "Measuring actual return on dividend-paying stocks, REITs, or bond funds",
    "Comparing two investments with different income profiles",
    "Calculating realized return after selling an investment",
    "Performance reporting for any portfolio",
  ],
  workedExamples: [
    {
      scenario: "Example 1: Stock with dividends",
      given: [
        { label: "Bought 100 shares at $50", value: "$5,000 invested" },
        { label: "Sold 100 shares at $58", value: "$5,800 proceeds" },
        { label: "Dividends received over holding period", value: "$200" },
      ],
      calculation: [
        "Price change: $5,800 − $5,000 = $800 gain",
        "Total earnings: $800 + $200 = $1,000",
        "Total return = $1,000 / $5,000 = 0.20",
      ],
      result: "Total return = 20%",
      insight: "If you only counted price appreciation ($800 / $5,000), you'd say 16% return. The dividends added 4 percentage points. Over 30 years, that 4% annual difference compounds to a massive gap.",
    },
    {
      scenario: "Example 2: REIT investment",
      given: [
        { label: "Bought $20,000 of REIT", value: "$20,000" },
        { label: "Current value", value: "$18,000 (price down 10%)" },
        { label: "Dividends received over 2 years", value: "$2,400 (12% of original)" },
      ],
      calculation: [
        "Price return: ($18,000 − $20,000) / $20,000 = −10%",
        "Income return: $2,400 / $20,000 = 12%",
        "Total return: −10% + 12% = +2%",
      ],
      result: "Total return = +2% (even though price dropped 10%)",
      insight: "This is why REITs appeal to income investors. The 12% dividend yield more than offset the price decline. Price-only analysis would have shown a loss; total return shows the actual gain.",
    },
  ],
  pitfalls: [
    {
      title: "Pitfall 1: Counting only price change",
      description: "Looking at your brokerage statement and seeing the share price dropped doesn't mean you lost money. If dividends were paid, total return may be positive.",
      fix: "Always add back dividends, interest, and distributions to your price-change calculation.",
    },
    {
      title: "Pitfall 2: Ignoring reinvestment",
      description: "Dividends paid in cash and sitting in your brokerage earn nothing (or minimal interest). Reinvested dividends buy more shares that compound.",
      fix: "Enable dividend reinvestment (DRIP) for long-term holdings. Reinvested dividends are a major driver of total return over decades.",
    },
    {
      title: "Pitfall 3: Not subtracting fees",
      description: "A 1% expense ratio on a fund earning 8% gross leaves you with 7% net. Over 30 years, that's a 25%+ reduction in final portfolio value.",
      fix: "Look for low-cost index funds (expense ratios under 0.10%). Every basis point of fee compounds against you.",
    },
  ],
  faqs: [
    {
      question: "Is total return the same as CAGR?",
      answer: "No. Total return is the percentage gain over the entire holding period. CAGR is the annualized equivalent. A 100% total return over 10 years = 7.18% CAGR. A 20% total return over 1 year = 20% CAGR.",
    },
    {
      question: "Do I include taxes in total return?",
      answer: "It depends. Pre-tax total return is what's typically reported. After-tax total return subtracts capital gains tax and dividend tax. For taxable accounts, after-tax return is what you actually keep. Tax-deferred accounts (401k, IRA) report pre-tax total return because you haven't paid tax yet.",
    },
    {
      question: "What if I bought the investment at multiple prices?",
      answer: "Use the dollar-weighted average cost basis. Sum all purchases (shares × price) and divide by total shares. Then apply the total return formula using this average cost as the 'Start Value'. For more precision, use XIRR which accounts for each purchase date.",
    },
  ],
  relatedCalculatorSlug: "investment-10k-10yr",
  relatedDecisionSlug: "pay-off-debt-or-invest",
};

// ─── Method 3: Real Return (Inflation-Adjusted) ───────────────
const REAL_RETURN_GUIDE: InvestmentMethodGuide = {
  slug: "how-to-calculate-real-return",
  method: "Real Return",
  title: "How to Calculate Real Return on Investment (Inflation-Adjusted)",
  description: "Real return strips out inflation to show what your investment actually earned in purchasing power. Includes the exact Fisher equation, examples, and why nominal returns lie.",
  h1: "How to Calculate Real Return (Inflation-Adjusted Return)",
  formula: "Real Return ≈ Nominal Return − Inflation Rate (simple)  |  Real Return = (1 + Nominal) / (1 + Inflation) − 1 (Fisher exact)",
  formulaExplanation:
    "A 7% nominal return sounds great — until you realize inflation is 4%. Your real return (what your purchasing power actually grew by) is only ~2.9%. The simple subtraction formula understates real returns slightly; the Fisher equation is exact.",
  whenToUse: [
    "Comparing returns across time periods with different inflation",
    "Setting retirement savings targets in today's dollars",
    "Evaluating whether your investments are actually growing wealth",
    "International comparisons (different countries have different inflation)",
  ],
  workedExamples: [
    {
      scenario: "Example 1: 401(k) with 7% nominal return, 3% inflation",
      given: [
        { label: "Nominal return", value: "7%" },
        { label: "Inflation", value: "3%" },
      ],
      calculation: [
        "Simple: 7% − 3% = 4%",
        "Fisher exact: (1.07 / 1.03) − 1 = 1.0388 − 1 = 3.88%",
      ],
      result: "Real return ≈ 3.88% per year",
      insight: "Your investment grew 7% in dollar terms but only 3.88% in purchasing power. That 3.88% is what you can actually spend more of each year without eating into principal.",
    },
    {
      scenario: "Example 2: 1980s high-inflation period",
      given: [
        { label: "Nominal return (1981-1990)", value: "~14% (stocks)" },
        { label: "Inflation (1981-1990)", value: "~6%" },
      ],
      calculation: [
        "Fisher: (1.14 / 1.06) − 1 = 1.0755 − 1 = 7.55%",
      ],
      result: "Real return ≈ 7.55% per year",
      insight: "Stocks in the 1980s felt amazing (14% returns) but high inflation ate 6 percentage points. Real returns were ~7.5% — still good, but not as spectacular as the nominal number suggests.",
    },
  ],
  pitfalls: [
    {
      title: "Pitfall 1: Reporting nominal returns to compare across decades",
      description: "The S&P 500 returned 10% nominal in the 1970s (high inflation) and 10% nominal in the 2010s (low inflation). Real returns were vastly different.",
      fix: "Always state whether returns are nominal or real. For long-term planning, use real returns to avoid overstating wealth growth.",
    },
    {
      title: "Pitfall 2: Forgetting inflation in retirement projections",
      description: "If you plan to spend $50K/year in retirement and assume a 7% nominal return, you'll think you're set. But $50K in 30 years will only buy $30K worth of today's goods.",
      fix: "Project retirement spending in today's dollars and use a conservative real return assumption (3-4%) for planning.",
    },
    {
      title: "Pitfall 3: Using CPI incorrectly",
      description: "The Consumer Price Index measures urban consumer inflation. Your personal inflation may differ — healthcare costs rise faster than CPI, while electronics get cheaper.",
      fix: "Use CPI for broad planning. For specific categories (healthcare, education, housing), research category-specific inflation rates.",
    },
  ],
  faqs: [
    {
      question: "What is a good real return on investment?",
      answer: "The S&P 500 has returned ~7% real annually over the last 100 years. Bonds return ~2% real. Savings accounts often return 0% or negative real return after inflation. A 'good' real return is one that exceeds your personal inflation rate by enough to grow wealth in real terms.",
    },
    {
      question: "What's the difference between nominal and real return?",
      answer: "Nominal return is the percentage gain in dollar terms. Real return is the percentage gain in purchasing power (after inflation). Example: 8% nominal with 3% inflation = 4.9% real. Always think in real terms for long-term planning.",
    },
    {
      question: "Which inflation rate should I use?",
      answer: "Use the long-term average (~3%) for general planning. The Fed's target is 2%. Recent years (2021-2023) saw 4-9% inflation. For high-net-worth planning or specific scenarios, research the appropriate time period's actual inflation.",
    },
    {
      question: "Do I report real returns to the IRS?",
      answer: "No. The IRS requires nominal returns (dividends + capital gains in dollar terms). Inflation is not considered for tax purposes. This creates the 'inflation tax' — you pay tax on gains that are merely keeping up with inflation, not real wealth growth.",
    },
  ],
  relatedCalculatorSlug: "investment-10k-10yr",
  relatedDecisionSlug: "pay-off-debt-or-invest",
};

// ─── Method 4: After-Tax Return ────────────────────────────────
const AFTER_TAX_RETURN_GUIDE: InvestmentMethodGuide = {
  slug: "how-to-calculate-after-tax-return",
  method: "After-Tax Return",
  title: "How to Calculate After-Tax Return on Investment",
  description: "Your 8% return isn't really 8% — the IRS takes a cut. Learn exactly how to calculate after-tax return for taxable accounts, 401(k)s, and Roth IRAs.",
  h1: "How to Calculate After-Tax Return on Investment",
  formula: "After-Tax Return = Nominal Return − Tax on Gains − Tax on Dividends",
  formulaExplanation:
    "Investment returns get taxed at different rates depending on account type and holding period. A 7% return in a taxable account might be only 5.5% after federal tax on dividends and capital gains. The same return in a Roth IRA is fully yours.",
  whenToUse: [
    "Comparing taxable vs tax-advantaged account returns",
    "Deciding whether to hold investments in taxable or 401(k)/IRA",
    "Calculating your true spendable retirement income",
    "Roth conversion analysis",
  ],
  workedExamples: [
    {
      scenario: "Example 1: Stock in taxable account (held > 1 year)",
      given: [
        { label: "Nominal return", value: "8%" },
        { label: "Qualified dividend yield", value: "2% (taxed at LTCG)" },
        { label: "Long-term capital gains rate", value: "15%" },
        { label: "Stock price appreciation", value: "6% (unrealized, no tax until sold)" },
      ],
      calculation: [
        "Tax on dividends: 2% × 15% = 0.30% drag per year (assuming DRIP)",
        "If you sell at year-end: 8% × 15% = 1.20% one-time tax on full gain",
        "Average annual tax drag (assuming you sell after many years): ~0.5-1% per year",
      ],
      result: "After-tax return ≈ 7-7.5% per year (vs 8% nominal)",
      insight: "Tax-efficient fund placement matters. Hold tax-inefficient investments (bonds, REITs) in 401(k)/IRA; hold tax-efficient investments (broad stock index funds) in taxable accounts.",
    },
    {
      scenario: "Example 2: Tax-deferred 401(k)",
      given: [
        { label: "Nominal return", value: "8%" },
        { label: "Tax bracket (in retirement)", value: "22% federal" },
      ],
      calculation: [
        "Tax paid on withdrawal: 8% × 22% = 1.76% drag",
        "But all growth is tax-deferred — you only pay tax on withdrawal",
      ],
      result: "Effective after-tax return ≈ 6.24% per year (assuming same 22% rate in retirement)",
      insight: "The drag looks similar to taxable accounts, but 401(k) has advantages: pre-tax contributions reduce current-year taxes, and gains compound tax-deferred until withdrawal.",
    },
  ],
  pitfalls: [
    {
      title: "Pitfall 1: Ignoring tax drag in portfolio performance",
      description: "A taxable account tracking an index fund might show 8% gross return but only 6.5% net return after taxes. Over 30 years, this 1.5% drag compounds to a 35%+ reduction in final wealth.",
      fix: "Track after-tax returns, not just gross returns. Use tax-loss harvesting and asset location (tax-efficient funds in taxable accounts).",
    },
    {
      title: "Pitfall 2: Assuming tax rates stay constant",
      description: "Current LTCG rate is 15% for most taxpayers. If you retire in a higher bracket, you'll pay 20% on gains. If tax laws change, all bets are off.",
      fix: "For retirement planning, use conservative tax rate assumptions (20-25%) regardless of current rates.",
    },
    {
      title: "Pitfall 3: Confusing account types",
      description: "Traditional IRA withdrawals are taxed as ordinary income. Roth IRA withdrawals are tax-free. 401(k) is taxed as ordinary income. HSA withdrawals for medical are tax-free.",
      fix: "Keep a clear chart of which accounts are taxable, tax-deferred, and tax-free at withdrawal. Plan withdrawals strategically to minimize lifetime tax.",
    },
  ],
  faqs: [
    {
      question: "How much does tax drag cost long-term?",
      answer: "Roughly 1-2% per year for a typical taxable investment account. Over 30 years, a 1.5% drag on an 8% return reduces your final portfolio from $906K (pre-tax) to $603K (after-tax). That's a $300K+ difference for a $500/month contribution.",
    },
    {
      question: "Which investments are most tax-efficient?",
      answer: "Broad stock index funds (VTI, VOO, FXAIX) are highly tax-efficient — low turnover, qualified dividends, low distributions. Municipal bonds are tax-efficient because their interest is federally tax-free. Tax-inefficient investments include REITs (high ordinary dividends), bonds (ordinary interest), and actively managed funds (high turnover).",
    },
    {
      question: "Is a Roth IRA always better than a Traditional IRA?",
      answer: "Not always. If your tax bracket will be much lower in retirement than today, Traditional wins. If same or higher, Roth wins. For most people in their 20s-30s (in a lower bracket now than they'll be in retirement), Roth is usually better. Run numbers both ways.",
    },
  ],
  relatedCalculatorSlug: "investment-10k-10yr",
  relatedDecisionSlug: "pay-off-debt-or-invest",
};

// ─── Method 5: Rate of Return (Time-Weighted vs Money-Weighted) ─
const ROR_GUIDE: InvestmentMethodGuide = {
  slug: "how-to-calculate-rate-of-return",
  method: "Rate of Return",
  title: "How to Calculate Rate of Return (Time-Weighted & Money-Weighted)",
  description: "Two ways to measure investment performance. Time-weighted strips out contribution timing (used by mutual funds). Money-weighted includes it (XIRR — what you actually earned). When to use each.",
  h1: "How to Calculate Rate of Return (TWR vs MWR)",
  formula: "TWR = Product of (1 + sub-period return) − 1   |   MWR (XIRR) = rate where NPV of all cash flows = 0",
  formulaExplanation:
    "Time-weighted return (TWR) measures how well the investment itself performed, ignoring your deposit/withdrawal timing. Money-weighted return (MWR/XIRR) measures YOUR actual return, including the impact of when you added or removed money. Mutual funds report TWR; your personal portfolio's actual return is MWR.",
  whenToUse: [
    "TWR: comparing fund managers or investment options",
    "TWR: benchmarking against an index",
    "MWR (XIRR): measuring your personal portfolio performance",
    "MWR (XIRR): evaluating whether your investment choices beat a savings account",
  ],
  workedExamples: [
    {
      scenario: "Example 1: Fund with mixed annual returns",
      given: [
        { label: "Year 1 return", value: "+20%" },
        { label: "Year 2 return", value: "−10%" },
        { label: "Year 3 return", value: "+15%" },
      ],
      calculation: [
        "TWR = (1.20 × 0.90 × 1.15) − 1 = 1.242 − 1 = 0.242 = 24.2% total",
        "Or annualized: 1.242^(1/3) − 1 = 7.49% CAGR",
        "Simple average return: (20 − 10 + 15) / 3 = 8.33%",
      ],
      result: "TWR = 24.2% total (7.49% CAGR) — NOT 8.33% average",
      insight: "The simple average (8.33%) is wrong because it doesn't account for compounding. TWR (7.49% CAGR) is the correct annualized figure. The difference grows with volatility.",
    },
    {
      scenario: "Example 2: Your 401(k) with monthly contributions (MWR)",
      given: [
        { label: "Started January 2020", value: "$10,000 balance" },
        { label: "Added $500/month for 5 years", value: "$30,000 contributions" },
        { label: "Ending balance December 2024", value: "$85,000" },
      ],
      calculation: [
        "XIRR: rate r such that 10000 + Σ 500/(1+r)^t − 85000/(1+r)^5 = 0",
        "Iterative solution: r ≈ 11.2% per year",
      ],
      result: "Money-weighted return (XIRR) = 11.2% per year",
      insight: "If you had calculated CAGR ($85K / $40K basis)^(1/5) − 1, you'd get ~16.3% — but that's wrong because CAGR ignores the timing of contributions. XIRR gives your true annualized return.",
    },
  ],
  pitfalls: [
    {
      title: "Pitfall 1: Using simple average instead of TWR",
      description: "Returns of +20%, −10%, +15% averaged as '8.33% per year' overstates actual compounding. Use TWR or CAGR instead.",
      fix: "Always compound returns: (1+r1) × (1+r2) × ... − 1. Or use CAGR = (End/Start)^(1/years) − 1.",
    },
    {
      title: "Pitfall 2: Using CAGR for accounts with cash flows",
      description: "CAGR assumes a single lump sum. For 401(k)s, brokerages with periodic buys, or any account with cash flows, CAGR gives wrong answers.",
      fix: "Use XIRR (Excel function) or Google Sheets' XIRR. It accounts for each cash flow's timing. Most modern investment tracking apps (Personal Capital, M1, Fidelity) compute XIRR automatically.",
    },
    {
      title: "Pitfall 3: Comparing TWR to MWR",
      description: "A fund with 10% TWR might give an investor only 7% MWR if they bought high and sold low. TWR measures the fund; MWR measures you.",
      fix: "Use TWR to evaluate fund selection. Use MWR (XIRR) to evaluate your own timing and decisions.",
    },
  ],
  faqs: [
    {
      question: "What is XIRR in Excel/Google Sheets?",
      answer: "XIRR calculates the internal rate of return for a series of cash flows that aren't necessarily periodic. Syntax: =XIRR(values, dates, [guess]). Values are your cash flows (negative for money out, positive for money in); dates are when each happened. Returns the annualized rate of return.",
    },
    {
      question: "Is TWR or MWR better for personal portfolios?",
      answer: "MWR (XIRR) for personal portfolios because your actual return depends on when you added/removed money. TWR is better for fund comparison because it removes the impact of cash flow timing.",
    },
    {
      question: "How do I get XIRR for my brokerage account?",
      answer: "Export transaction history (CSV) with dates and amounts. In Google Sheets, list each transaction: negative for buys, positive for sells/dividends. Add a final row with current balance (positive). Apply =XIRR(A:A, B:B) where A is amounts and B is dates.",
    },
  ],
  relatedCalculatorSlug: "investment-10k-10yr",
  relatedDecisionSlug: "pay-off-debt-or-invest",
};

// ─── Method 6: Annualized Return (Quick Reference) ───────────
const ANNUAL_RETURN_GUIDE: InvestmentMethodGuide = {
  slug: "how-to-calculate-annual-return",
  method: "Annual Return",
  title: "How to Calculate Annual Return on Investment",
  description: "The simplest version: take the year's percentage gain (including reinvested dividends) and that's your annual return. Examples, pitfalls, and how annual differs from annualized.",
  h1: "How to Calculate Annual Return on Investment",
  formula: "Annual Return = (End of Year Value − Start of Year Value + Distributions) / Start of Year Value × 100",
  formulaExplanation:
    "Annual return measures the percentage gain during a single calendar year. It's the most common number you see quoted (e.g., 'the S&P 500 returned 26% in 2023'). Simple to calculate, but volatile year-to-year.",
  whenToUse: [
    "Comparing year-over-year performance",
    "Tax-loss harvesting decisions (compare to current year)",
    "Reading fund fact sheets and benchmarks",
    "Quick performance check on a single year",
  ],
  workedExamples: [
    {
      scenario: "Example: S&P 500 in 2023",
      given: [
        { label: "S&P 500 close Dec 30, 2022", value: "3,839" },
        { label: "S&P 500 close Dec 29, 2023", value: "4,769" },
        { label: "Dividends paid during 2023", value: "~1.5% of starting value" },
      ],
      calculation: [
        "Price return: (4,769 − 3,839) / 3,839 = 24.2%",
        "Dividend return: 1.5%",
        "Total annual return: 24.2% + 1.5% = 25.7%",
      ],
      result: "Annual return 2023 = ~25.7%",
      insight: "Reported '26% return' in news headlines refers to this. Note: this is one year. S&P averages ~10% annually over long periods — 2023 was a strong year.",
    },
  ],
  pitfalls: [
    {
      title: "Pitfall 1: Using only price return",
      description: "S&P 500 returned 25.7% in 2023 but the price-only return was 24.2%. Stocks like REITs returned 11% price but 15%+ total. Always include distributions.",
      fix: "Look at 'total return' numbers, not just price. Most financial sites report both. Use total return for accurate comparisons.",
    },
    {
      title: "Pitfall 2: Cherry-picking years",
      description: "S&P returned +26% in 2023. S&P returned −18% in 2022. Picking the good year and ignoring the bad year is misleading.",
      fix: "Always look at multi-year returns (3, 5, 10 years) for context. Single-year returns are noisy.",
    },
  ],
  faqs: [
    {
      question: "What's a good annual return?",
      answer: "For a diversified US stock portfolio, 7-10% per year is historically average. Anything above 12% is excellent; below 4% is poor. For bonds, 3-5% is normal. Cash equivalents (savings, CDs, T-bills): 1-5% in current rates.",
    },
    {
      question: "Is annual return the same as CAGR?",
      answer: "No. Annual return is for ONE year. CAGR is the average annualized return over MULTIPLE years. You can have annual returns of +30%, −15%, +20% — averaging to 11.67% per year, but CAGR of 10.16% per year. CAGR is the more useful multi-year metric.",
    },
    {
      question: "What was the S&P 500's average annual return?",
      answer: "Since 1928, the S&P 500 has averaged about 10% per year (with dividends reinvested). Adjusted for inflation, that's about 7% real return. Recent decades: 1990s ~15%/yr, 2000s ~0%/yr (including two crashes), 2010s ~14%/yr.",
    },
  ],
  relatedCalculatorSlug: "investment-10k-10yr",
  relatedDecisionSlug: "pay-off-debt-or-invest",
};

const ALL_GUIDES = [
  CAGR_GUIDE,
  TOTAL_RETURN_GUIDE,
  REAL_RETURN_GUIDE,
  AFTER_TAX_RETURN_GUIDE,
  ROR_GUIDE,
  ANNUAL_RETURN_GUIDE,
];

let cached: InvestmentMethodGuide[] | null = null;

export function getAllInvestmentMethodGuides(): InvestmentMethodGuide[] {
  if (cached) return cached;
  cached = ALL_GUIDES;
  return cached;
}

export function getInvestmentMethodGuide(slug: string): InvestmentMethodGuide | undefined {
  return getAllInvestmentMethodGuides().find(g => g.slug === slug);
}
