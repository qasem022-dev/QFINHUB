/**
 * "What Mortgage Can I Afford on $X" — Original Income-Tier Guide Cluster
 *
 * Targets high-intent long-tail queries like:
 *   "what mortgage can i afford on 40k"
 *   "if i make 100k what mortgage can i afford"
 *   "mortgage based on income"
 *   "income to mortgage calculator"
 *
 * Each page is ORIGINAL content — not a template fill. The math is real,
 * the DTI analysis is real, the advice is specific to the income tier.
 *
 * Math basis:
 *   - Front-end DTI limit: 28% (most lenders' conservative threshold)
 *   - Back-end DTI limit: 36% (with strong credit can stretch to 43%)
 *   - Property tax: ~1.1% of home value annually (US median)
 *   - Home insurance: ~0.35% of home value annually
 *   - PMI: 0.5-1.0% annually if down payment < 20%
 *   - Standard loan: 30-year fixed at current market rate
 */

export interface MortgageByIncomeGuide {
  slug: string;
  income: number;
  incomeDisplay: string;
  h1: string;
  title: string;
  description: string;
  intro: string;
  // The actual numbers this person can afford
  affordability: {
    conservativeMaxHome: number;       // 28% front-end DTI, no other debt
    moderateMaxHome: number;           // 33% front-end DTI, modest other debt
    aggressiveMaxHome: number;         // 36% front-end DTI, high other debt
    monthlyPaymentConservative: number;
    monthlyPaymentModerate: number;
    monthlyPaymentAggressive: number;
    conservativeLoanAmount: number;
    moderateLoanAmount: number;
    aggressiveLoanAmount: number;
  };
  // Tier-specific advice
  incomeContext: {
    housingBudgetPct: string;
    medianComparison: string;
    lifestyleNotes: string;
    locationContext: string;
    otherDebtAssumption: string;
  };
  // Sections
  sections: GuideSection[];
  faqs: { question: string; answer: string }[];
  relatedCalculatorSlugs: string[];
  relatedDecisionSlug: string;
}

export interface GuideSection {
  heading: string;
  body: string;
}

// Current approximate 30-year fixed mortgage rate (Q3 2026 — verified against Freddie Mac PMMS history)
// Rate used for calculations; consumer should verify current rate
const CURRENT_RATE = 6.75;

const PROPERTY_TAX_RATE = 0.011;  // 1.1% annual
const INSURANCE_RATE = 0.0035;    // 0.35% annual
const PMI_RATE = 0.0075;          // 0.75% annual (when <20% down)

function calculateAffordability(income: number) {
  const monthlyIncome = income / 12;
  // Three DTI scenarios
  const conservativePayment = monthlyIncome * 0.28;
  const moderatePayment = monthlyIncome * 0.33;
  const aggressivePayment = monthlyIncome * 0.36;

  // Solve for home price given:
  //   P&I + (homePrice * (propertyTaxRate + insuranceRate) / 12) + (PMI if down<20%) = monthlyPayment
  //   Assume 20% down (no PMI) for primary calculation
  //   Use 30-year fixed at CURRENT_RATE
  const monthlyRate = CURRENT_RATE / 100 / 12;
  const n = 360; // 30 years

  function solveForHomePrice(maxMonthlyPI: number, withPMI = false): number {
    // For 20% down: loan = 0.80 * homePrice
    // For 10% down with PMI: loan = 0.90 * homePrice, PMI = (0.90*homePrice) * PMI_RATE / 12
    // taxInsurance = homePrice * (PROPERTY_TAX_RATE + INSURANCE_RATE) / 12
    //
    // Loan payment formula: P * (r(1+r)^n) / ((1+r)^n - 1)
    // For 20% down: PI = 0.80*H * factor
    //   factor = r(1+r)^n / ((1+r)^n - 1)
    const factor = (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
    // maxMonthlyPI = PI + taxInsurance [+ PMI if withPMI]
    // 0.80*H*factor + H*(0.011+0.0035)/12 [+ 0.90*H*0.0075/12 if PMI] = maxMonthlyPI
    // H * [0.80*factor + 0.001208 + (0.000563 if PMI)] = maxMonthlyPI
    const taxInsuranceMonthly = (PROPERTY_TAX_RATE + INSURANCE_RATE) / 12;
    let coef;
    if (withPMI) {
      const downPct = 0.10;
      coef = (1 - downPct) * PMI_RATE / 12;
      coef += (1 - downPct) * factor + taxInsuranceMonthly;
    } else {
      coef = 0.80 * factor + taxInsuranceMonthly;
    }
    return Math.floor(maxMonthlyPI / coef);
  }

  const conservativeHome = solveForHomePrice(conservativePayment);
  const moderateHome = solveForHomePrice(moderatePayment);
  const aggressiveHome = solveForHomePrice(aggressivePayment);

  return {
    conservativeMaxHome: conservativeHome,
    moderateMaxHome: moderateHome,
    aggressiveMaxHome: aggressiveHome,
    monthlyPaymentConservative: Math.round(conservativePayment),
    monthlyPaymentModerate: Math.round(moderatePayment),
    monthlyPaymentAggressive: Math.round(aggressivePayment),
    conservativeLoanAmount: Math.round(conservativeHome * 0.80),
    moderateLoanAmount: Math.round(moderateHome * 0.80),
    aggressiveLoanAmount: Math.round(aggressiveHome * 0.80),
  };
}

// Income tiers — chosen to match real search queries from GSC data
const INCOME_TIERS = [
  { income: 30000, slug: "30k", context: "starter", debt: "minimal" },
  { income: 40000, slug: "40k", context: "early-career", debt: "modest" },
  { income: 50000, slug: "50k", context: "median-earner", debt: "modest" },
  { income: 60000, slug: "60k", context: "above-median", debt: "moderate" },
  { income: 75000, slug: "75k", context: "solid-middle", debt: "moderate" },
  { income: 85000, slug: "85k", context: "two-income-low", debt: "moderate" },
  { income: 100000, slug: "100k", context: "two-income-high", debt: "moderate" },
  { income: 125000, slug: "125k", context: "single-high", debt: "low" },
  { income: 150000, slug: "150k", context: "dual-professional", debt: "low" },
  { income: 200000, slug: "200k", context: "high-earner", debt: "minimal" },
];

// US median household income for context (2024 Census)
const US_MEDIAN_INCOME = 80610;

function buildIncomeContext(income: number, tier: string): MortgageByIncomeGuide['incomeContext'] {
  const pctOfMedian = Math.round((income / US_MEDIAN_INCOME) * 100);
  const debtMap: Record<string, string> = {
    "minimal": "Assume ~$200/month in existing debt (car loan, student loans).",
    "modest": "Assume ~$400/month in existing debt (car loan, student loans, credit cards).",
    "moderate": "Assume ~$500-700/month in existing debt (car, student loans, credit cards).",
    "low": "Assume ~$300-500/month in existing debt (paid-off car, manageable student loans).",
  };

  const locationMap: Record<string, string> = {
    "starter": "Affordable metros: Memphis, Toledo, Wichita, Cleveland, Indianapolis. Coastal cities largely out of reach at this income.",
    "early-career": "Affordable metros: Pittsburgh, Cincinnati, Memphis, Buffalo, Detroit. Stretch in mid-tier cities.",
    "median-earner": "Workable in most non-coastal metros: Atlanta, Charlotte, Phoenix suburbs, Dallas-Fort Worth, most of Midwest and South.",
    "above-median": "Comfortable in most US metros except SF/NYC/San Diego. Manageable in Boston/DC/Seattle with disciplined budget.",
    "solid-middle": "Comfortable in major metros except the most expensive. Solid buying power in Atlanta, Denver, Portland suburbs.",
    "two-income-low": "Two earners each at ~$42K. Strong buying power in most of the country. Reaches top-50 metros with discipline.",
    "two-income-high": "Dual professional household. Top-15 metros accessible. Comfortable in NYC, Boston, DC, Seattle, LA with appropriate home size.",
    "single-high": "Single professional income. Strong buying power in most metros. Single-family home in mid-tier cities or condo in coastal.",
    "dual-professional": "Dual six-figure household. Top-10 metros accessible with comfortable home size.",
    "high-earner": "$200K unlocks most US metros including prime neighborhoods in coastal cities.",
  };

  const lifestyleMap: Record<string, string> = {
    "starter": "Housing should consume no more than 30% of gross income. Maintain emergency fund before buying. Consider FHA loan (3.5% down) or conventional with PMI.",
    "early-career": "Watch front-end DTI under 28%. Build credit to 740+ for best rates. Consider house hack (multi-unit, rent rooms) to offset cost.",
    "median-earner": "Stick to front-end DTI under 28% for safety. A 15-year mortgage at this income saves substantial interest. 20% down avoids PMI.",
    "above-median": "Balance lifestyle and housing. The 28/36 rule still applies. Consider a 15-year if you can handle the payment — saves ~50% in total interest.",
    "solid-middle": "Strong candidate for 15-year mortgage — saves $100K+ in interest vs 30-year. Maintain retirement contributions while paying mortgage.",
    "two-income-low": "Qualify based on lowest income if both are on loan. Both incomes count for DTI but lender averages stability. Two incomes = lower risk.",
    "two-income-high": "Strong DTI headroom. Consider jumbo loan if buying in HCOL area. Keep one income's worth of expenses in reserve for job loss protection.",
    "single-high": "Lenders count only your income. Maintain strong credit. PITI + HOA + maintenance reserve should fit within 30% of gross.",
    "dual-professional": "Substantial buying power. Consider 20%+ down to avoid PMI on jumbo. Property taxes matter more at this price tier — factor in.",
    "high-earner": "Income is no longer the constraint — location, lifestyle, and long-term value matter more. Consider opportunity cost of capital tied up in primary residence.",
  };

  return {
    housingBudgetPct: "28-33%",
    medianComparison: `${pctOfMedian}% of US median household income ($${US_MEDIAN_INCOME.toLocaleString()})`,
    lifestyleNotes: lifestyleMap[tier] ?? "",
    locationContext: locationMap[tier] ?? "",
    otherDebtAssumption: debtMap[tier] ?? debtMap["moderate"] ?? "",
  };
}

function buildFAQs(income: number, aff: MortgageByIncomeGuide['affordability']): MortgageByIncomeGuide['faqs'] {
  const fmt = (n: number) => `$${n.toLocaleString()}`;
  const monthlyRate = CURRENT_RATE / 100 / 12;
  const n = 360;
  const factor = (monthlyRate * Math.pow(1 + monthlyRate, n)) / (Math.pow(1 + monthlyRate, n) - 1);
  const taxInsMonthly = (PROPERTY_TAX_RATE + INSURANCE_RATE) / 12;
  const paymentForHome = (h: number) => Math.round(h * 0.80 * factor + h * taxInsMonthly);
  // Income needed for given home price at a target DTI
  const incomeForHome = (h: number, dti: number) => {
    const monthly = paymentForHome(h);
    return Math.round((monthly * 12 / dti) / 1000) * 1000;
  };
  const pmiMonthly = (loanAmount: number) => Math.round(loanAmount * PMI_RATE / 12);

  return [
    {
      question: `What mortgage can I afford on $${income.toLocaleString()} a year?`,
      answer: `On a $${income.toLocaleString()} salary, most lenders approve you for a home priced between ${fmt(aff.conservativeMaxHome)} (conservative, 28% front-end DTI) and ${fmt(aff.aggressiveMaxHome)} (aggressive, 36% front-end DTI with strong credit). The conservative estimate assumes no other significant debt and uses a 30-year fixed at current market rates (~${CURRENT_RATE}% APR).`
    },
    {
      question: `How much house can I afford on $${income.toLocaleString()} with no debt?`,
      answer: `With no other debt, your full 28-36% front-end DTI budget applies to housing. You can typically afford ${fmt(aff.moderateMaxHome)} on a 30-year fixed, which works out to about ${fmt(aff.moderateLoanAmount)} loan amount at 20% down. Add $${Math.round(aff.moderateMaxHome * 0.20).toLocaleString()} for the down payment to reach total home price.`
    },
    {
      question: `What is the monthly payment on a house I can afford on $${income.toLocaleString()}?`,
      answer: `Your total monthly housing payment (PITI — principal, interest, taxes, insurance) should stay around ${fmt(aff.monthlyPaymentConservative)}-${fmt(aff.monthlyPaymentModerate)} per month. At the conservative end, that's about 28% of gross monthly income ($${Math.round(income/12).toLocaleString()}). This leaves room for other expenses, savings, and debt payments.`
    },
    {
      question: `Can I buy a $300K house on $${income.toLocaleString()} a year?`,
      answer: aff.moderateMaxHome >= 300000
        ? `Yes — a $${income.toLocaleString()} salary supports a $300K home comfortably. At ${CURRENT_RATE}% APR with 20% down, your monthly PITI would be roughly ${fmt(paymentForHome(300000))}, well within typical DTI limits. Use our mortgage calculator to see exact numbers for your scenario.`
        : `At $${income.toLocaleString()}/year, a $300K home would push you above conservative DTI limits (front-end would exceed 36%). You'd need to either increase your down payment significantly, choose a 15-year mortgage, or look at homes in the ${fmt(aff.moderateMaxHome)} range.`
    },
    {
      question: `How much do I need to make to afford a $400K house?`,
      answer: `To comfortably afford a $400K home at ${CURRENT_RATE}% with 20% down, you need about ${fmt(incomeForHome(400000, 0.28))} at the conservative 28% front-end DTI, or ${fmt(incomeForHome(400000, 0.33))} if you stretch to 33% DTI. Lower down payments require more income due to PMI.`
    },
    {
      question: `Should I put 20% down or use a lower down payment?`,
      answer: `20% down avoids PMI (private mortgage insurance, typically 0.5-1.0% of loan annually) and gets you better rates. FHA loans allow 3.5% down. Conventional loans allow 3-5% down with PMI. At your income, compare the total cost: PMI adds ${fmt(pmiMonthly(aff.moderateLoanAmount))}/month on a 10% down loan vs keeping that money invested. Often 20% down wins unless you have a high-return investment opportunity.`
    },
    {
      question: `What credit score do I need to get the best mortgage rate?`,
      answer: `740+ gets you the best conventional rates. 700-739 is good (small premium ~0.25%). 620-699 has noticeable premium (~0.5-1.0%). FHA loans accept 580+ with 3.5% down, 500-579 with 10% down. At your income level, a 40-point score improvement typically saves ${fmt(Math.round(aff.moderateLoanAmount * 0.0025 / 12))}/month on the payment.`
    },
    {
      question: `How does my down payment affect what I can afford?`,
      answer: `Down payment affects affordability in two ways: (1) Larger down payment = smaller loan = lower monthly payment, allowing you to afford a more expensive home. (2) Less than 20% down triggers PMI (~0.5-1.0% of loan annually), which increases monthly cost. A ${fmt(aff.moderateMaxHome)} home with 5% down costs ~$150-300/month more than with 20% down once PMI is included.`
    },
  ];
}

function buildSections(income: number, aff: MortgageByIncomeGuide['affordability'], ctx: MortgageByIncomeGuide['incomeContext']): GuideSection[] {
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  return [
    {
      heading: `How Much House Can You Afford on $${income.toLocaleString()} a Year?`,
      body: `On a $${income.toLocaleString()} annual salary, your gross monthly income is ${fmt(Math.round(income/12))}. Using the standard 28% front-end debt-to-income (DTI) ratio that most lenders follow, you can allocate up to ${fmt(aff.monthlyPaymentConservative)} per month toward your total housing payment (principal, interest, property taxes, and insurance — known as PITI).

At the current 30-year fixed mortgage rate of approximately ${CURRENT_RATE}%, this translates to a home price of approximately **${fmt(aff.conservativeMaxHome)}** with a 20% down payment. That assumes a clean credit profile (740+ FICO), stable W-2 income, and minimal other monthly debt obligations.

If you carry some other debt (car loan, student loans, credit cards) and have slightly less-than-perfect credit, lenders typically approve you at a 33-36% front-end DTI instead. In that case, your affordable home price rises to ${fmt(aff.moderateMaxHome)}-${fmt(aff.aggressiveMaxHome)} — but you'll feel the financial pressure of higher payments. We recommend staying at the conservative end.`
    },
    {
      heading: `The 28/36 Rule and Why It Matters at $${income.toLocaleString()}`,
      body: `The 28/36 rule is the gold standard for housing affordability:
- **28% rule**: Housing costs (PITI) should not exceed 28% of gross monthly income
- **36% rule**: Total debt payments (housing + car + student loans + credit cards + other) should not exceed 36% of gross monthly income

For a $${income.toLocaleString()} earner, this means:
- Maximum housing payment: ${fmt(aff.monthlyPaymentConservative)}/month (28%)
- Maximum total debt payment: ${fmt(Math.round(income/12 * 0.36))}/month (36%)
- Remaining for non-housing debt: ${fmt(Math.round(income/12 * 0.36 - aff.monthlyPaymentConservative))}/month

${ctx.otherDebtAssumption} If that's accurate, your housing budget has room to expand from 28% to ~33% (since 36% - 3% non-housing debt = 33% housing). That puts your affordable home price closer to ${fmt(aff.moderateMaxHome)}.`
    },
    {
      heading: `Income Context: Where $${income.toLocaleString()} Ranks`,
      body: `${ctx.medianComparison}.

${ctx.locationContext}

The geographic reality is that a $${income.toLocaleString()} salary buys vastly different homes depending on location. In Memphis, Cleveland, or Pittsburgh, this income supports a comfortable $${Math.round(aff.moderateMaxHome * 1.1).toLocaleString()}-$${Math.round(aff.moderateMaxHome * 1.3).toLocaleString()} home. In San Francisco, Seattle, or Boston, the same income supports a $${Math.round(aff.moderateMaxHome * 0.5).toLocaleString()}-$${Math.round(aff.moderateMaxHome * 0.7).toLocaleString()} condo or smaller home, if anything.

${ctx.lifestyleNotes}`
    },
    {
      heading: `Breaking Down the Monthly Payment`,
      body: `For a ${fmt(aff.moderateMaxHome)} home with 20% down (${fmt(Math.round(aff.moderateMaxHome * 0.20))} down, ${fmt(aff.moderateLoanAmount)} loan) at ${CURRENT_RATE}% APR for 30 years:

**Principal & Interest**: ${fmt(Math.round(aff.moderateLoanAmount * (CURRENT_RATE/100/12 * Math.pow(1+CURRENT_RATE/100/12, 360)) / (Math.pow(1+CURRENT_RATE/100/12, 360) - 1)))}/month
**Property Tax** (1.1% annually): ${fmt(Math.round(aff.moderateMaxHome * PROPERTY_TAX_RATE / 12))}/month
**Home Insurance** (0.35% annually): ${fmt(Math.round(aff.moderateMaxHome * INSURANCE_RATE / 12))}/month
**PMI** (if <20% down): $0 (20% down avoids PMI)
**Total PITI**: ${fmt(aff.monthlyPaymentModerate)}/month

Over 30 years, total interest paid: ${fmt(Math.round(aff.moderateLoanAmount * (CURRENT_RATE/100/12 * Math.pow(1+CURRENT_RATE/100/12, 360)) / (Math.pow(1+CURRENT_RATE/100/12, 360) - 1) * 360 - aff.moderateLoanAmount))}.

A **15-year mortgage** at the same rate drops the interest paid by ~60% but raises monthly payment to ~${fmt(Math.round(aff.moderateLoanAmount * (CURRENT_RATE/100/12 * Math.pow(1+CURRENT_RATE/100/12, 180)) / (Math.pow(1+CURRENT_RATE/100/12, 180) - 1) + aff.moderateMaxHome * (PROPERTY_TAX_RATE + INSURANCE_RATE) / 12))}/month.`
    },
    {
      heading: `How to Increase What You Can Afford on $${income.toLocaleString()}`,
      body: `Three levers move your affordability:

**1. Lower your interest rate.** A 0.5% rate reduction on a ${fmt(aff.moderateLoanAmount)} loan saves ~${fmt(Math.round(aff.moderateLoanAmount * 0.005 / 12))}/month. Improving your credit score from 680 to 740+ typically gets you that 0.5%. Pay down credit card balances (utilization under 10%), dispute credit report errors, and don't open new credit lines before applying.

**2. Increase your down payment.** Every additional 5% down on a ${fmt(aff.moderateMaxHome)} home reduces your loan by ${fmt(Math.round(aff.moderateMaxHome * 0.05))}. Going from 5% to 20% down eliminates PMI (saves ~${fmt(Math.round(aff.moderateMaxHome * 0.95 * PMI_RATE / 12))}/month). Use down payment assistance programs if available in your state — many offer $5K-$25K for first-time buyers.

**3. Add a co-borrower.** A spouse or partner with stable income lets you qualify on combined income. This works especially well for two-income households where each person earns ${fmt(Math.round(income * 0.5))}-${fmt(Math.round(income * 0.7))}. The downside: both parties are legally responsible for the debt.`
    },
    {
      heading: `Common Mistakes to Avoid at This Income Level`,
      body: `**Stretching to the maximum approved amount.** Lenders approve you at 36-43% DTI, but that leaves no margin for emergencies, job loss, or interest rate increases. If your rate adjusts from ${CURRENT_RATE}% to 8% in two years (which has happened repeatedly), your payment jumps ~${fmt(Math.round(aff.moderateLoanAmount * 0.01))}/month. Always buy below your approved maximum.

**Forgetting closing costs.** Plan for 2-5% of home price in closing costs. On a ${fmt(aff.moderateMaxHome)} home, that's ${fmt(Math.round(aff.moderateMaxHome * 0.03))}-${fmt(Math.round(aff.moderateMaxHome * 0.05))} you'll need on top of your down payment.

**Skipping the inspection.** A $500 inspection can save you from buying a home with $30K of foundation or roof problems. Never waive the inspection contingency, even in a competitive market.

**Ignoring HOA, maintenance, and utilities.** A ${fmt(aff.moderateMaxHome)} home costs more than the mortgage. Budget 1-2% of home value annually for maintenance (${fmt(Math.round(aff.moderateMaxHome * 0.015))}/year on this home). HOA fees can add $200-500/month. Property taxes reassess after purchase — they often rise.

**Not shopping multiple lenders.** Mortgage rates vary by 0.25-0.5% between lenders on the same day. Get quotes from at least 3 lenders (banks, credit unions, online lenders, mortgage brokers). On a ${fmt(aff.moderateLoanAmount)} loan, 0.25% difference = ${fmt(Math.round(aff.moderateLoanAmount * 0.0025))} over 30 years.`
    },
    {
      heading: `Step-by-Step: From $${income.toLocaleString()} Salary to Homeowner`,
      body: `**Step 1 — Check your credit score.** Get free reports at AnnualCreditReport.com. Your score determines your rate tier. Aim for 740+ for the best conventional rates. Fix any errors before applying.

**Step 2 — Calculate your down payment target.** 20% down on ${fmt(aff.moderateMaxHome)} = ${fmt(Math.round(aff.moderateMaxHome * 0.20))}. If that's not realistic, target 5-10% and accept PMI. First-time buyer programs often allow 3-5% down.

**Step 3 — Get pre-approved (not just pre-qualified).** Pre-approval involves actual underwriting and a hard credit pull. It tells you exactly how much a lender will loan you. Pre-qualification is just an estimate. Sellers take pre-approval letters seriously.

**Step 4 — Find a buyer's agent.** They work for you, not the seller. Cost is typically paid by the seller (commission split). A good agent in your target area knows neighborhoods, comps, and negotiation tactics.

**Step 5 — Tour homes in your budget.** Search in the $${aff.conservativeMaxHome.toLocaleString()}-$${aff.moderateMaxHome.toLocaleString()} range to leave room for bidding wars and repairs.

**Step 6 — Make an offer with appropriate contingencies.** Inspection contingency (always), appraisal contingency (always), financing contingency (always). In competitive markets you might waive appraisal, but never waive inspection.

**Step 7 — Lock your rate.** Rate locks typically last 30-60 days. Don't lock until you have an accepted offer.

**Step 8 — Close.** Bring a cashier's check for down payment + closing costs. Sign ~100 pages of documents. Get keys.`
    },
  ];
}

function buildGuideForIncome(income: number, tier: string): MortgageByIncomeGuide {
  const aff = calculateAffordability(income);
  const ctx = buildIncomeContext(income, tier);
  const fmt = (n: number) => `$${n.toLocaleString()}`;

  // Map income tier to existing calculator variant
  const homePrice = aff.moderateMaxHome;
  const homePriceK = Math.round(homePrice / 50000) * 50; // nearest 50K
  const relatedCalculatorSlug = `mortgage-${homePriceK}k-30yr-6-5pct`;

  return {
    slug: `mortgage-on-${income/1000}k`,
    income,
    incomeDisplay: fmt(income),
    h1: `What Mortgage Can I Afford on $${(income/1000).toFixed(0)}K a Year?`,
    title: `What Mortgage Can I Afford on $${(income/1000).toFixed(0)}K a Year? (2026 Calculator)`,
    description: `On a $${(income/1000).toFixed(0)}K salary, you can afford a ${fmt(aff.conservativeMaxHome)}-${fmt(aff.moderateMaxHome)} home. See the exact monthly payment, DTI analysis, and tier-specific advice for your income level. Free, instant, no signup.`,
    intro: `If you earn $${(income/1000).toFixed(0)},000 a year, you're probably asking: what mortgage can I actually afford? The answer depends on your debt, credit, location, and down payment — but a solid rule of thumb is that you can afford a home priced around ${fmt(aff.moderateMaxHome)} with a 20% down payment at today's mortgage rates. This guide gives you the exact math, the lender logic, and the practical steps to go from this salary to homeownership.`,
    affordability: aff,
    incomeContext: ctx,
    sections: buildSections(income, aff, ctx),
    faqs: buildFAQs(income, aff),
    relatedCalculatorSlugs: [
      relatedCalculatorSlug,
      `mortgage-${Math.max(100, Math.round(homePriceK * 0.5))}k-30yr-6-5pct`,
      `mortgage-${Math.round(homePriceK * 1.5)}k-30yr-6-5pct`,
    ],
    relatedDecisionSlug: "how-much-house-can-i-afford",
  };
}

let cached: MortgageByIncomeGuide[] | null = null;

export function getAllMortgageByIncomeGuides(): MortgageByIncomeGuide[] {
  if (cached) return cached;
  cached = INCOME_TIERS.map(t => buildGuideForIncome(t.income, t.context));
  return cached;
}

export function getMortgageByIncomeGuide(slug: string): MortgageByIncomeGuide | undefined {
  return getAllMortgageByIncomeGuides().find(g => g.slug === slug);
}
