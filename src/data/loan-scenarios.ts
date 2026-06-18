import type { Metadata } from "next";

export interface LoanScenario {
  slug: string;
  h1: string;
  title: string;
  metaDescription: string;
  aboveFold: {
    monthlyPayment: string;
    totalInterest: string;
    totalRepayment: string;
    term: string;
    cta: string;
    highlight?: string;
  };
  assumptions: Array<{ label: string; value: string }>;
  whatThisMeans: string;
  whenItMakesSense: string;
  whenItIsRisky: string;
  comparisonTable: {
    title: string;
    rows: Array<{ scenario: string; monthly: string; totalInterest: string; totalCost: string }>;
    takeaway: string;
  };
  faq: Array<{ q: string; a: string }>;
  disclaimer: string;
  internalLinks: Array<{ url: string; anchor: string }>;
  extraSection?: { title: string; content: string };
}

export const loanScenarios: Record<string, LoanScenario> = {
  "small-emergency-loan-5000-15-percent": {
    slug: "small-emergency-loan-5000-15-percent",
    h1: "$5,000 Loan at 15%: Small Emergency Loan Monthly Payment Breakdown",
    title: "$5,000 Emergency Loan at 15% APR — Monthly Payment Calculator | QFINHUB",
    metaDescription:
      "Borrowing $5,000 at 15% APR for 3 years? Your monthly payment is $173. Compare rates, see total interest, and learn why small loans cost more. Free calculator with real-world context.",
    aboveFold: {
      monthlyPayment: "$173.00",
      totalInterest: "$1,228.00",
      totalRepayment: "$6,228.00",
      term: "36 months (3 years)",
      cta: "Try different amounts — free Loan Calculator",
    },
    assumptions: [
      { label: "Loan Amount", value: "$5,000" },
      { label: "Annual Interest Rate (APR)", value: "15%" },
      { label: "Loan Term", value: "3 years (36 months)" },
      { label: "Monthly Payment", value: "$173.00" },
      { label: "Total Interest Paid", value: "$1,228.00" },
      { label: "Total Amount Repaid", value: "$6,228.00" },
    ],
    whatThisMeans:
      "For every $100 you borrow, you'll pay back about $124.56 — the extra $24.56 is interest. Over 3 years, that means paying $1,228 in interest on a $5,000 loan. While 15% is higher than rates for larger loans (which can be 7-12%), it's common for small personal loans because lenders have minimum costs to process any loan — the same paperwork for $5K as $50K.",
    whenItMakesSense:
      "A small loan at 15% can make sense for: (1) A genuine emergency expense (car repair, medical bill) when you have no savings, (2) You can comfortably afford $173/month, (3) You have a plan to pay it off early — extra payments save interest. If you need a smaller amount, consider a $2,000-$3,000 loan instead — even at the same rate, total interest will be lower.",
    whenItIsRisky:
      "A 15% loan is expensive money. Avoid it for: (1) Non-essential purchases — saving up is cheaper, (2) If $173/month would strain your budget — defaulting damages credit for years, (3) If you qualify for better — check credit unions for rates as low as 8-10% on small loans, (4) If a 0% APR credit card is an option — even with a 3% balance transfer fee, you'd save vs 15% interest.",
    comparisonTable: {
      title: "Same $5,000 — How Your Credit Score Changes Everything",
      rows: [
        { scenario: "Excellent Credit (8% APR)", monthly: "$156.68", totalInterest: "$640.48", totalCost: "$5,640.48" },
        { scenario: "Good Credit (12% APR)", monthly: "$166.07", totalInterest: "$978.52", totalCost: "$5,978.52" },
        { scenario: "Fair Credit (15% APR) — THIS PAGE", monthly: "$173.00", totalInterest: "$1,228.00", totalCost: "$6,228.00" },
        { scenario: "Poor Credit (25% APR)", monthly: "$198.71", totalInterest: "$2,153.56", totalCost: "$7,153.56" },
      ],
      takeaway: "Improving your credit from fair to good saves $250 on a $5,000 loan. From poor to excellent saves $1,513.",
    },
    faq: [
      {
        q: "Is 15% a high rate for a $5,000 personal loan?",
        a: "15% is above average for personal loans in 2026. The average rate is around 12% for borrowers with good credit (670+). For small loans under $5K, rates tend to be higher (15-20%) because lenders have minimum processing costs. If you have good credit (680+), you may qualify for 10-12% on a $5K loan.",
      },
      {
        q: "Can I get a $5,000 loan with bad credit?",
        a: "Yes, but expect rates of 20-36%. At 25% APR, your payment would be $199/month and total interest would be $2,154. At 36% (the legal max in many states), you'd pay $229/month and $3,244 in interest. If you have bad credit, improving your score even 50 points before applying can save hundreds.",
      },
      {
        q: "Should I take a 3-year or 5-year loan for $5,000?",
        a: "A 3-year loan at 15% costs $173/month and $1,228 total interest. A 5-year loan at the same rate costs $119/month but $2,139 total interest — you pay $911 more for the convenience of lower payments. If you can afford $173/month, take the 3-year term.",
      },
    ],
    disclaimer:
      "This is an educational estimate, not financial advice. Actual loan terms depend on your credit score, lender, and state regulations. Rates shown are illustrative. Always compare offers from multiple lenders.",
    internalLinks: [
      { url: "/calculators/loan-calculator", anchor: "Try different amounts — free Loan Calculator" },
      { url: "/loan-payment-table", anchor: "See all loan scenarios compared" },
      { url: "/loan-scenarios/fair-credit-loan-20000-20-percent", anchor: "See what bad credit costs on a $20K loan" },
    ],
  },

  "good-credit-loan-20000-8-percent": {
    slug: "good-credit-loan-20000-8-percent",
    h1: "$20,000 Loan at 8% for 5 Years: Monthly Payment & Complete Cost Breakdown",
    title: "$20,000 Personal Loan at 8% APR — Good Credit Monthly Payment Calculator | QFINHUB",
    metaDescription:
      "A $20,000 loan at 8% APR for 5 years costs $405.53/month. See total interest, compare rates, and learn what credit score you need for an 8% rate. Free calculator with expert context.",
    aboveFold: {
      monthlyPayment: "$405.53",
      totalInterest: "$4,331.80",
      totalRepayment: "$24,331.80",
      term: "60 months (5 years)",
      cta: "Try different amounts and rates — free Loan Calculator",
    },
    assumptions: [
      { label: "Loan Amount", value: "$20,000" },
      { label: "Annual Interest Rate (APR)", value: "8%" },
      { label: "Loan Term", value: "5 years (60 months)" },
      { label: "Monthly Payment", value: "$405.53" },
      { label: "Total Interest Paid", value: "$4,331.80" },
      { label: "Total Amount Repaid", value: "$24,331.80" },
    ],
    whatThisMeans:
      "8% is an excellent rate for a personal loan. You'll pay about $4,332 in interest over 5 years — about 22% of the original $20,000. This is a benchmark: it's what borrowers with good-to-excellent credit (680-720+) can expect. If your credit is lower, you'll pay more — at 12% (average), the same loan costs $6,693 in interest (54% more).",
    whenItMakesSense:
      "An 8% personal loan is cost-effective for: (1) Debt consolidation — if your credit cards charge 20-25%, consolidating at 8% saves thousands, (2) Home improvement — adding $20K in value to your home with a loan costing $4.3K in interest can be a net positive, (3) Major life event — wedding, relocation, or medical when you have stable income. The key: you have the credit score (680+) and income to qualify for this tier.",
    whenItIsRisky:
      "Even at 8%, borrowing $20K is a significant commitment: (1) $405/month for 5 years is a long obligation — make sure your income is stable, (2) If you lose your job, the loan still needs to be paid — unlike federal student loans, personal loans have no income-based repayment, (3) Don't borrow $20K for depreciating assets (luxury items, vacations) — the interest expense compounds the loss.",
    comparisonTable: {
      title: "Same $20,000 — What Different Credit Tiers Pay",
      rows: [
        { scenario: "Excellent Credit (8% APR) — THIS PAGE", monthly: "$405.53", totalInterest: "$4,331.80", totalCost: "$24,331.80" },
        { scenario: "Good Credit (12% APR)", monthly: "$444.89", totalInterest: "$6,693.40", totalCost: "$26,693.40" },
        { scenario: "Fair Credit (20% APR)", monthly: "$529.88", totalInterest: "$11,792.80", totalCost: "$31,792.80" },
        { scenario: "Poor Credit (30% APR)", monthly: "$643.47", totalInterest: "$18,608.20", totalCost: "$38,608.20" },
      ],
      takeaway: "Good credit saves you $7,461 compared to fair credit, and $14,276 compared to poor credit — on the exact same $20,000 loan.",
    },
    faq: [
      {
        q: "What credit score do I need for an 8% personal loan?",
        a: "Generally 680-720+ for rates around 8%. Lenders also consider your income, debt-to-income ratio, and employment history. If your score is 650-679, expect rates of 10-14%. Below 650, expect 15-25% or higher.",
      },
      {
        q: "How does this compare to the existing $20K loan blog post on QFINHUB?",
        a: "Our blog post explains the math and concept of a $20K loan. This page is the interactive calculator-result page — it shows YOUR specific payment and lets you compare scenarios. Use this page to calculate, use the blog to understand the bigger picture.",
      },
      {
        q: "Should I take a 3-year or 5-year $20,000 loan at 8%?",
        a: "3-year: $626.73/month, $2,562 total interest (saves $1,770 vs 5-year). 5-year: $405.53/month, $4,332 total interest. If you can afford $627/month, take the 3-year — it saves $1,770. If that's too tight, the 5-year at $406/month is reasonable. You can always pay extra when you have it.",
      },
    ],
    disclaimer:
      "This is an educational estimate, not financial advice. Actual loan terms depend on your credit score, lender, and state regulations. Rates shown are illustrative for comparison purposes.",
    internalLinks: [
      { url: "/calculators/loan-calculator", anchor: "Calculate your exact loan payment" },
      { url: "/loan-payment-table", anchor: "Compare all loan scenarios" },
      { url: "/loan-scenarios/fair-credit-loan-20000-20-percent", anchor: "Same $20,000 at 20% — see the difference" },
    ],
  },

  "debt-consolidation-loan-25000-10-percent": {
    slug: "debt-consolidation-loan-25000-10-percent",
    h1: "$25,000 Debt Consolidation Loan at 10%: Should You Consolidate Your Credit Card Debt?",
    title: "Consolidate $25,000 Debt at 10% APR — Monthly Payment & Savings Calculator | QFINHUB",
    metaDescription:
      "Consolidating $25,000 in credit card debt at 10% APR saves ~$24,000 vs keeping it on cards at 25%. See your payment, total savings, and whether consolidation is right for you.",
    aboveFold: {
      monthlyPayment: "$415.19",
      totalInterest: "$9,876.00",
      totalRepayment: "$34,876.00",
      term: "84 months (7 years)",
      cta: "Calculate your exact consolidation savings — free Loan Calculator",
      highlight: "Saves ~$24,000 vs keeping $25K on credit cards at 25% APR",
    },
    assumptions: [
      { label: "Debt to Consolidate", value: "$25,000" },
      { label: "Consolidation Loan APR", value: "10%" },
      { label: "Loan Term", value: "7 years (84 months)" },
      { label: "Monthly Payment", value: "$415.19" },
      { label: "Total Interest", value: "$9,876.00" },
      { label: "Total If Kept on Cards at 25%", value: "~$59,000 (over 11+ years)" },
    ],
    whatThisMeans:
      "If you have $25,000 in credit card debt at 25% APR, you're paying about $521/month just in interest. A consolidation loan at 10% drops your effective rate dramatically. Over 7 years, you'll pay $9,876 in interest instead of potentially $34,000+ if you kept the debt on cards. That's a savings of ~$24,000 — about the cost of a new car.",
    whenItMakesSense:
      "Consolidation makes sense when: (1) Your credit card APRs are significantly higher than the consolidation loan rate (10% vs 20%+ is excellent), (2) You have stable income and can commit to $415/month for 7 years, (3) You're disciplined enough to stop using credit cards after consolidating, (4) You've addressed the root cause of the debt — consolidation without behavior change leads to double the debt.",
    whenItIsRisky:
      "The #1 risk: you consolidate credit card debt, free up your cards, and then run up NEW balances. Now you have the consolidation loan AND new credit card debt — doubling your problem. Before consolidating, commit to: (1) stop using cards for non-essentials, (2) build a $1,000 emergency fund so you don't need cards for surprises, (3) track spending for at least 6 months.",
    comparisonTable: {
      title: "Consolidation Loan vs Credit Cards — $25,000 Debt",
      rows: [
        { scenario: "Consolidation Loan (10%, 7yr)", monthly: "$415.19", totalInterest: "$9,876", totalCost: "$34,876" },
        { scenario: "Credit Cards — Minimum Payments (25%)", monthly: "$625+ (decreasing)", totalInterest: "$40,000+", totalCost: "$65,000+" },
        { scenario: "Credit Cards — Same $415/mo (25%)", monthly: "$415", totalInterest: "$34,000+", totalCost: "$59,000+" },
        { scenario: "Avalanche Method (pay highest first)", monthly: "varies", totalInterest: "$12K-18K", totalCost: "$37K-43K" },
      ],
      takeaway: "Consolidation at 10% saves $24,000+ compared to paying the same amount on credit cards. But ONLY if you stop using the cards.",
    },
    faq: [
      {
        q: "Will a debt consolidation loan hurt my credit score?",
        a: "Short-term: a small dip from the credit inquiry (5-10 points). Medium-term: your score may improve because (a) you're paying off credit cards (lowers utilization), (b) installment loans impact scores differently than revolving debt. Long-term: if you make on-time payments, your score will likely improve within 6-12 months.",
      },
      {
        q: "What's the biggest risk of debt consolidation?",
        a: "Running up new credit card balances after consolidating. This is the #1 reason consolidation fails. Before consolidating, commit to not using cards for 12 months. Track every expense. Build an emergency fund. Consolidation is a tool — it works only if paired with behavior change.",
      },
      {
        q: "Is 10% a good rate for a $25,000 consolidation loan?",
        a: "Yes. The average debt consolidation loan rate in 2026 is 10-14% for borrowers with good credit. At 10%, you're getting a competitive rate. Compare offers from at least 3 lenders — credit unions often have the best consolidation rates (8-12%).",
      },
    ],
    disclaimer:
      "This is an educational comparison, not financial advice. APR estimates for credit cards are illustrative. Actual terms depend on your credit profile and lender. Consolidation may not be right for everyone. Consider speaking with a non-profit credit counselor.",
    internalLinks: [
      { url: "/calculators/loan-calculator", anchor: "Calculate your consolidation payment" },
      { url: "/loan-payment-table", anchor: "See all loan scenarios" },
      { url: "/loan-scenarios/good-credit-loan-20000-8-percent", anchor: "See what good credit looks like on $20K" },
    ],
  },

  "fair-credit-loan-20000-20-percent": {
    slug: "fair-credit-loan-20000-20-percent",
    h1: "$20,000 Loan at 20%: The Fair Credit Reality Check — Is This Loan Worth It?",
    title: "$20,000 Personal Loan at 20% APR — Fair Credit Cost Calculator & Warning | QFINHUB",
    metaDescription:
      "A $20,000 loan at 20% APR costs $529.88/month and $11,793 in interest. See how much fair credit costs vs good credit, and learn alternatives to reduce your rate.",
    aboveFold: {
      monthlyPayment: "$529.88",
      totalInterest: "$11,792.80",
      totalRepayment: "$31,792.80",
      term: "60 months (5 years)",
      cta: "See what you'd pay with better credit — free Loan Calculator",
    },
    assumptions: [
      { label: "Loan Amount", value: "$20,000" },
      { label: "Annual Interest Rate (APR)", value: "20%" },
      { label: "Loan Term", value: "5 years (60 months)" },
      { label: "Monthly Payment", value: "$529.88" },
      { label: "Total Interest Paid", value: "$11,792.80" },
      { label: "Total Amount Repaid", value: "$31,792.80" },
    ],
    whatThisMeans:
      "At 20% APR, you're paying nearly 60% of the original loan amount in interest alone. For every $100 you borrow, you pay back $159. This is expensive money. The same $20,000 loan at 8% (good credit) would cost $405/month and $4,332 in interest — you're paying $7,461 more because of your credit tier.",
    whenItMakesSense:
      "A 20% loan may be necessary if: (1) It's a true emergency (medical, avoiding eviction, essential car repair), (2) You've exhausted lower-rate options, (3) You have a clear repayment plan. Consider borrowing LESS — reducing to $10,000 at 20% costs $265/month and $5,896 in interest, half the cost.",
    whenItIsRisky:
      "At 20%, this is expensive money. Before committing: (1) Can you wait 6-12 months and improve your credit? Moving from 620 to 680 could get you a 12-15% rate instead of 20%, saving $4,000+, (2) Is there a secured alternative? A co-signer with good credit could get you 8-12%, (3) Can you borrow less? Every $1,000 less borrowed saves $200+ in interest.",
    comparisonTable: {
      title: "What Your Credit Score Costs You — Same $20,000 Loan",
      rows: [
        { scenario: "Excellent (740+) — 8%", monthly: "$405.53", totalInterest: "$4,332", totalCost: "$24,332 (saves $7,461)" },
        { scenario: "Good (680-739) — 12%", monthly: "$444.89", totalInterest: "$6,693", totalCost: "$26,693 (saves $5,099)" },
        { scenario: "Fair (620-679) — 20% — THIS PAGE", monthly: "$529.88", totalInterest: "$11,793", totalCost: "$31,793 (baseline)" },
        { scenario: "Poor (580-619) — 30%", monthly: "$643.47", totalInterest: "$18,608", totalCost: "$38,608 (costs $6,815 more)" },
      ],
      takeaway: "Good credit saves $7,461 on the same $20,000 loan. If you can improve your credit from fair to good before borrowing, you could save more than the cost of the loan itself.",
    },
    faq: [
      {
        q: "Can I get a $20,000 loan with a 620 credit score?",
        a: "Yes, but expect rates of 18-25%. Some lenders specialize in fair-credit borrowers. You'll likely pay $500-550/month for a 5-year term. Before applying, check if a credit union will work with you — they sometimes offer lower rates to members with fair credit than online lenders.",
      },
      {
        q: "What's the fastest way to lower my rate from 20%?",
        a: "Three options: (1) Get a co-signer with good credit — this can drop your rate to 8-12% immediately, (2) Offer collateral (secured loan) — if you own a car outright, a secured auto equity loan may offer 8-12%, (3) Pay down credit cards — if your utilization is above 30%, paying it down can boost your score 30-50 points in 2-3 months, potentially qualifying you for 15-18% instead of 20%.",
      },
      {
        q: "Is it better to take a smaller loan or a longer term if I have fair credit?",
        a: "Better to take a SMALLER loan. A $10,000 loan at 20% costs $265/month and $5,896 total interest. A $20,000 loan at 20% for 7 years costs $434/month but $16,472 in interest. Reducing the amount saves more than extending the term. Only borrow what you absolutely need.",
      },
    ],
    disclaimer:
      "This is an educational estimate, not financial advice. Rates shown are illustrative based on typical lender tiers. Your actual rate depends on your full credit profile, income, and lender policies. Consider speaking with a non-profit credit counselor before taking high-interest debt.",
    extraSection: {
      title: "Credit Improvement Path — Save Thousands Before You Borrow",
      content: "If you can wait, here's what improves your credit fastest: (1) Pay all bills on time for 6 months — payment history is 35% of your score, (2) Pay down credit card balances below 30% of limits — this can boost your score 50+ points in 3 months, (3) Don't apply for new credit — inquiries drop your score 5-10 points each, (4) Check for errors on your credit report at annualcreditreport.com (free). Even a 40-point improvement (620→660) could save you 3-5% on your rate.",
    },
    internalLinks: [
      { url: "/calculators/loan-calculator", anchor: "See what you'd pay with better credit" },
      { url: "/loan-payment-table", anchor: "Compare all loan scenarios" },
      { url: "/loan-scenarios/good-credit-loan-20000-8-percent", anchor: "Same $20K with excellent credit — $405/month" },
    ],
  },
};

export function getLoanScenario(slug: string): LoanScenario | undefined {
  return loanScenarios[slug];
}

export const allLoanScenarioSlugs = Object.keys(loanScenarios);
