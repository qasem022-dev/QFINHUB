/**
 * "How to Use [Calculator]" Guide Pages Engine
 * 
 * Each calculator gets a dedicated tutorial/guide page targeting
 * "how to use X calculator" search queries.
 * These are high-intent searches from people ready to use the tool.
 */

import { allCalculators } from "@/lib/calculators";
import type { CalculatorConfig } from "@/types/calculator";

export interface HowToGuide {
  slug: string;
  title: string;
  description: string;
  h1: string;
  calculatorId: string;
  steps: HowToStep[];
  tips: string[];
  commonMistakes: string[];
  faqs: { question: string; answer: string }[];
}

export interface HowToStep {
  number: number;
  title: string;
  description: string;
}

/**
 * Generate a "how to use" guide slug.
 */
export function generateGuideSlug(calculatorSlug: string): string {
  return `how-to-use-${calculatorSlug}`;
}

/** Generate a search-friendly meta title for a guide page */
export function generateGuideMetaTitle(calcTitle: string): string {
  // Strip leading "Free " to avoid double "Free Free" in titles (pitfall #33)
  let clean = calcTitle.replace(/^Free\s+/i, "");
  // Phase 16.12G: Strip redundant "Guide [Year]", "[Year]", and "Calculator" suffixes
  // that clash with the generator's own "Step-by-Step Guide [Year]" suffix
  clean = clean.replace(/\s*—\s*Calculate in \d+ Seconds.*$/i, "");
  clean = clean.replace(/\s+Guide\s+\d{4}\s*$/i, "");
  clean = clean.replace(/\s+\d{4}\s*$/i, "");
  clean = clean.replace(/\s+Calculator\s*$/i, "");
  return `How to Use ${clean} — Step-by-Step Guide 2026 (Free Calculator)`;
}

/** Generate a search-friendly meta description for a guide page */
export function generateGuideMetaDescription(calcTitle: string): string {
  return `Master the ${calcTitle.toLowerCase()} in 3 easy steps. Free tool with instant results, expert tips, and common mistakes to avoid. Start calculating now — no email required, 100% free.`;
}

/**
 * Generate step-by-step instructions for each calculator type.
 * Steps are generated dynamically based on the calculator category.
 */
export function generateHowToSteps(calculator: CalculatorConfig): HowToStep[] {
  const category = calculator.category;

  const baseSteps: HowToStep[] = [
    {
      number: 1,
      title: "Enter Your Numbers",
      description: `Fill in the input fields on the ${calculator.title.toLowerCase()}. Start with the default values shown, then adjust them to match your specific situation.`,
    },
    {
      number: 2,
      title: "Adjust Parameters",
      description: `Fine-tune the parameters to match your scenario. Try different values to see how changes affect your results.`,
    },
    {
      number: 3,
      title: "Review Results",
      description: `Your results update instantly as you change inputs. Key results are highlighted for easy reading. Review the main numbers and detailed breakdown.`,
    },
    {
      number: 4,
      title: "Visualize with Charts",
      description: `Interactive charts show how values change over time or across different scenarios. Hover over data points for exact values.`,
    },
  ];

  // Category-specific steps
  switch (category) {
    case "mortgage":
      return [
        ...baseSteps.slice(0, 2),
        {
          number: 3,
          title: "Compare Scenarios",
          description: `Try different down payments, interest rates, and loan terms to see how your monthly payment changes. A 15-year term costs more monthly but saves thousands in interest.`,
        },
        {
          number: 4,
          title: "Review Amortization",
          description: `The amortization table shows exactly how much goes to principal vs interest each month. This helps you understand equity building over time.`,
        },
        {
          number: 5,
          title: "Share or Save Results",
          description: `Download your results as an image or PDF to share with your real estate agent or lender. Save to your QFINHUB dashboard for future reference.`,
        },
      ];
    case "investment":
      return [
        ...baseSteps.slice(0, 2),
        {
          number: 3,
          title: "Analyze Growth",
          description: `View the growth chart to see how your investment compounds over time. The area chart shows total value versus contributions.`,
        },
        {
          number: 4,
          title: "Check Returns",
          description: `Review key metrics like total return, annualized return, and compound annual growth rate (CAGR). These show your investment performance.`,
        },
        {
          number: 5,
          title: "Export Data",
          description: `Download the year-by-year table as a spreadsheet or PDF. Use this data for financial planning or to share with your financial advisor.`,
        },
      ];
    case "retirement":
      return [
        {
          number: 1,
          title: "Enter Your Current Age and Savings",
          description: `Start with your current age, current retirement savings, and monthly contribution. The calculator uses these to project your future balance.`,
        },
        {
          number: 2,
          title: "Set Retirement Goals",
          description: `Enter your desired retirement age and estimated annual expenses in retirement. This helps determine if you're on track.`,
        },
        {
          number: 3,
          title: "Adjust Return Expectations",
          description: `Set your expected annual return rate. A conservative estimate (5-6%) is safer for long-term planning than optimistic projections.`,
        },
        {
          number: 4,
          title: "Review the Projection",
          description: `The chart shows your savings growing over time. The red line shows your target — you want your savings line to be above it at retirement.`,
        },
        {
          number: 5,
          title: "Adjust and Optimize",
          description: `Try increasing your monthly contribution or working a few more years. Small changes can significantly improve your retirement outlook.`,
        },
      ];
    case "tax":
      return [
        {
          number: 1,
          title: "Enter Your Income",
          description: `Input your annual income, filing status, and any deductions you qualify for. The calculator uses current tax brackets for accurate estimates.`,
        },
        {
          number: 2,
          title: "Add Deductions",
          description: `Enter itemized deductions or use the standard deduction. Include mortgage interest, charitable contributions, and state/local taxes.`,
        },
        {
          number: 3,
          title: "Review Tax Breakdown",
          description: `See your tax broken down by bracket. The effective tax rate shows your true average rate — usually lower than your marginal bracket.`,
        },
        {
          number: 4,
          title: "Plan Withholdings",
          description: `Use the results to adjust your W-4 withholdings. Getting closer to your actual tax bill means a bigger paycheck and no surprise tax bill.`,
        },
      ];
    case "loan":
      return [
        ...baseSteps.slice(0, 2),
        {
          number: 3,
          title: "Compare Loan Terms",
          description: `Try different loan amounts, interest rates, and repayment periods. A longer term means lower payments but more total interest.`,
        },
        {
          number: 4,
          title: "Review Full Amortization",
          description: `The payment schedule shows every payment broken down by principal and interest. See exactly when you'll pay off the loan.`,
        },
        {
          number: 5,
          title: "Explore Payoff Options",
          description: `Try making extra payments to see how much interest you save and how much sooner you'll be debt-free.`,
        },
      ];
    default:
      return baseSteps;
  }
}

/**
 * Generate all "how to use" guide data for all calculators.
 */
export function getAllHowToGuides(): HowToGuide[] {
  // Phase 18.2: Calculator-specific unique content for high-value guides
  const UNIQUE_CONTENT: Record<string, {
    tips: string[];
    commonMistakes: string[];
    faqs: { question: string; answer: string }[];
  }> = {
    "emergency-fund": {
      tips: [
        "Aim for 3-6 months of essential expenses — but if you're a freelancer or have variable income, target 9-12 months",
        "Keep your emergency fund in a high-yield savings account (HYSA) so it earns ~4% interest while staying liquid",
        "Start small: $1,000 is a solid first milestone before you tackle 3-month coverage"
      ],
      commonMistakes: [
        "Keeping too much cash: anything beyond 12 months of expenses could be invested for better returns",
        "Not adjusting for life changes: marriage, kids, or a mortgage should trigger a recalculation of your emergency fund target",
        "Using the fund for non-emergencies: a vacation or new TV is not an emergency — replenish immediately if you dip in"
      ],
      faqs: [
        { question: "How much emergency fund do I need?", answer: "Most experts recommend 3-6 months of essential living expenses. For example, if your monthly essentials (rent, food, utilities, minimum debt payments) are $3,500, aim for $10,500-$21,000. Freelancers and single-income households should target 9-12 months." },
        { question: "Where should I keep my emergency fund?", answer: "A high-yield savings account (HYSA) is ideal — currently earning ~4% APY with FDIC insurance. Avoid stocks or bonds for emergency funds; the money must be accessible within 1-2 business days without risk of loss." },
        { question: "Should I pay off debt or build an emergency fund first?", answer: "Build a small $1,000 emergency fund first, then aggressively pay down high-interest debt (credit cards, payday loans). Once high-interest debt is gone, build your full 3-6 month emergency fund before investing." }
      ]
    },
    "debt-to-income": {
      tips: [
        "Lenders typically want your front-end DTI (housing only) under 28% and back-end DTI (all debts) under 36%",
        "Before applying for a mortgage, pay down credit cards and auto loans to lower your DTI — even a $200/month reduction can qualify you for $30,000 more home",
        "Use the 50/30/20 budget alongside your DTI: 50% needs, 30% wants, 20% savings/debt payoff"
      ],
      commonMistakes: [
        "Only looking at front-end DTI: lenders care more about back-end DTI, which includes student loans, car payments, credit cards, and personal loans",
        "Forgetting irregular debts: child support, alimony, and tax payment plans all count toward DTI",
        "Using gross income for your personal budget: always use net (take-home) pay for actual affordability decisions"
      ],
      faqs: [
        { question: "What is a good debt-to-income ratio?", answer: "A DTI under 36% is considered good by most lenders. Under 28% for housing alone (front-end) is ideal. For example, at $75,000 income ($6,250/month), keep housing under $1,750 and total debt payments under $2,250." },
        { question: "How do I lower my DTI ratio?", answer: "Three ways: (1) Increase income — a side gig or raise helps. (2) Pay down debt — focus on the highest monthly payment first for maximum DTI impact. (3) Refinance high-interest loans to lower monthly payments. Reducing a $400/month car payment to $300 saves $100/month in DTI." },
        { question: "Does rent count toward DTI?", answer: "Current rent does NOT count toward DTI for mortgage applications — only the projected future mortgage payment counts. However, lenders look at your rental payment history as evidence you can handle housing costs." }
      ]
    },
    "mortgage-affordability": {
      tips: [
        "The 28/36 rule is a lender guideline, not your personal budget: many homeowners are comfortable at 25% or even 20% of income",
        "Don't forget closing costs: budget 2-5% of the home price for closing, separate from your down payment",
        "Get pre-approved with 2-3 lenders — rates can vary by 0.5% or more, which means thousands in buying power"
      ],
      commonMistakes: [
        "Buying at the max the bank approves: banks lend based on gross income, not your actual lifestyle expenses like childcare, travel, or hobbies",
        "Forgetting property taxes and insurance: these typically add 25-35% to your principal+interest payment",
        "Underestimating maintenance: budget 1-2% of the home's value per year for repairs and upkeep"
      ],
      faqs: [
        { question: "How much house can I afford with a $100,000 salary?", answer: "At $100,000 income ($8,333/month), the 28% rule allows ~$2,333/month for housing (PITI). With 20% down at 6.5% interest, you can afford roughly a $325,000-$375,000 home. With 5% down, this drops to ~$275,000 because of PMI and a larger loan amount." },
        { question: "What down payment do I need?", answer: "Conventional loans accept 3-5% down, but under 20% requires PMI (~$100-200/month). FHA loans allow 3.5% down but PMI lasts the life of the loan. 20% down eliminates PMI and gives you the best rate. First-time homebuyer programs may offer down payment assistance." },
        { question: "How do interest rates affect what I can afford?", answer: "A 1% rate increase (6.5% → 7.5%) reduces your buying power by ~10%. At $100K income, that's roughly $35,000 less home. This is why rate shopping with multiple lenders is critical — even 0.25% difference matters." }
      ]
    },
    "compound-interest": {
      tips: [
        "Time is your biggest advantage: $10,000 invested at 8% for 30 years becomes $100,627 — but if you wait 10 years, it only grows to $46,610",
        "Small monthly additions add up: adding just $200/month to that $10,000 over 30 years at 8% grows your total to over $370,000",
        "Use annual compounding for long-term projections and monthly compounding for savings accounts to get the most accurate estimate"
      ],
      commonMistakes: [
        "Confusing APY with APR: APY includes compounding, APR does not. Always use APY for savings and CD comparisons",
        "Forgetting about inflation: a 8% return with 3% inflation means your real return is only ~5%",
        "Using unrealistic return assumptions: the S&P 500 averages ~10% nominally but ~7% after inflation — don't plan retirement on 12% returns"
      ],
      faqs: [
        { question: "What's the difference between simple and compound interest?", answer: "Simple interest earns only on the principal. Compound interest earns on principal PLUS accumulated interest. Example: $10,000 at 5% simple interest for 10 years = $15,000. With annual compounding = $16,289. The difference grows exponentially over time." },
        { question: "How often is interest compounded?", answer: "It depends on the account. Savings accounts typically compound daily or monthly. CDs may compound quarterly or annually. Bonds compound semi-annually. The more frequent the compounding, the more you earn — but the difference between daily and monthly is small." },
        { question: "How can I double my money with compound interest?", answer: "Use the Rule of 72: divide 72 by your interest rate to find years to double. At 8%, money doubles in ~9 years (72/8). At 6%, it takes 12 years. This rule works for any compound growth rate." }
      ]
    },
    "retirement-planning": {
      tips: [
        "The 4% rule: you can safely withdraw 4% of your retirement savings annually. So if you need $50,000/year, aim for $1.25 million saved",
        "Catch-up contributions after age 50 can accelerate your savings: $7,500 extra for 401(k) and $1,000 extra for IRA annually",
        "Social Security replaces about 40% of pre-retirement income for average earners — plan for the other 60% from savings and investments"
      ],
      commonMistakes: [
        "Starting too late: every decade you delay retirement saving roughly doubles the monthly contribution needed to catch up",
        "Being too conservative near retirement: you may need 20-30 years of growth in retirement — keeping everything in bonds at 60 may leave you short",
        "Forgetting healthcare costs: the average 65-year-old couple needs ~$315,000 for healthcare in retirement (not including long-term care)"
      ],
      faqs: [
        { question: "How much do I need to retire?", answer: "A common rule: multiply your desired annual retirement income by 25 (the inverse of the 4% rule). If you want $60,000/year from savings, aim for $1.5 million. Subtract any pension or Social Security from the target. Our retirement calculator lets you enter your exact numbers." },
        { question: "What's the best age to retire?", answer: "Full Social Security retirement age is 67 for those born after 1960. Claiming at 62 reduces benefits by ~30%. Waiting until 70 increases benefits by ~24% (8% per year after full retirement age). The 'best' age depends on your health, savings, and desired lifestyle." },
        { question: "Should I use a Roth or Traditional 401(k)/IRA?", answer: "Traditional: tax deduction now, pay taxes in retirement. Roth: pay taxes now, tax-free withdrawals later. Generally: if you expect to be in a higher tax bracket in retirement, use Roth. If lower, use Traditional. Many people split contributions to hedge. See our Roth vs Traditional decision tool." }
      ]
    },
    "401k-calculator": {
      tips: [
        "Max out your 401(k) to at least the employer match — that's free money. The 2026 contribution limit is $23,500 (under 50) or $31,000 (50+)",
        "Check your fund fees: a 1% fee difference over 30 years can cost you hundreds of thousands in lost compound growth",
        "Use target-date funds if you want a hands-off approach — they automatically rebalance as you near retirement"
      ],
      commonMistakes: [
        "Cashing out when changing jobs: a $50,000 401(k) cashed out at 30 costs ~$15,000 in taxes/penalties AND loses ~$500,000 in future compound growth",
        "Only contributing enough to get the match: the match is the minimum, not the goal. Aim for 15% of income",
        "Forgetting about Required Minimum Distributions (RMDs): starting at age 73, you must withdraw from traditional 401(k)s or face 25% penalties"
      ],
      faqs: [
        { question: "How much should I contribute to my 401(k)?", answer: "At minimum, contribute enough to get the full employer match. Beyond that, aim for 15% of your gross income. At $75,000 salary, that's $11,250/year or ~$938/month. Use our 401(k) calculator to see your projected balance at retirement." },
        { question: "Traditional 401(k) vs Roth 401(k) — which is better?", answer: "Traditional: pre-tax contributions, taxed in retirement. Roth: after-tax contributions, tax-free withdrawals. If you expect to be in a higher tax bracket later, Roth wins. If lower later, Traditional wins. Many employers now offer both — you can split contributions." },
        { question: "What happens to my 401(k) when I leave my job?", answer: "Four options: (1) Leave it with your old employer, (2) Roll it into your new employer's plan, (3) Roll it into an IRA, (4) Cash out (NOT recommended — taxes + 10% penalty if under 59½). Rolling into an IRA usually gives you the most investment options and lowest fees." }
      ]
    },
    "credit-card-payoff": {
      tips: [
        "The avalanche method (highest APR first) saves the most money. The snowball method (smallest balance first) builds momentum. Both work — pick the one you'll stick with",
        "A balance transfer to a 0% APR card can save you hundreds in interest, but watch for the 3-5% transfer fee and make sure you can pay it off before the intro period ends",
        "Even an extra $50/month toward your credit card debt can cut your payoff time by months and save hundreds in interest"
      ],
      commonMistakes: [
        "Only paying the minimum: a $5,000 balance at 22% APR with minimum payments takes 15+ years to pay off and costs $6,000+ in interest",
        "Closing cards after paying them off: this can hurt your credit score by reducing your available credit and average account age",
        "Consolidating debt then running up new balances: consolidation only works if you stop using the cards you paid off"
      ],
      faqs: [
        { question: "What's the fastest way to pay off credit card debt?", answer: "The avalanche method: list all cards by APR (highest first), pay minimums on all, and throw every extra dollar at the highest-rate card. Mathematically, this saves the most interest. Use our credit card payoff calculator to see exactly when you'll be debt-free." },
        { question: "Should I use a personal loan to pay off credit cards?", answer: "If you can get a personal loan at 8-12% APR vs 22%+ on credit cards, yes — you'll save significantly. But close the paid-off cards or freeze them so you don't run up new balances. A $10,000 consolidation at 10% saves ~$6,000 in interest vs 22% over 3 years." },
        { question: "How does a balance transfer work?", answer: "You transfer existing credit card balances to a new card with a 0% introductory APR (typically 12-18 months). You pay a 3-5% transfer fee upfront. Then you have the intro period to pay off the balance interest-free. Key: have a plan to pay it off before the intro rate expires and the regular APR kicks in." }
      ]
    },
    "loan-calculator": {
      tips: [
        "Always compare APR, not just the interest rate — APR includes fees and gives you the true cost of borrowing",
        "A shorter loan term means higher monthly payments but dramatically less total interest. A 3-year $20,000 loan at 8% costs $2,566 in interest vs $9,038 over 6 years",
        "Use the loan calculator to test different down payment amounts — a larger down payment reduces your loan amount and monthly payment"
      ],
      commonMistakes: [
        "Focusing only on the monthly payment: dealers and lenders often extend the term to lower the payment, but you pay much more in total interest",
        "Not checking for prepayment penalties: some loans charge a fee if you pay them off early — always ask before signing",
        "Forgetting about fees: origination fees (1-6%), late payment fees, and documentation fees can add hundreds to your loan cost"
      ],
      faqs: [
        { question: "How do I calculate my monthly loan payment?", answer: "Use the formula: M = P[r(1+r)^n]/[(1+r)^n-1] where P=principal, r=monthly interest rate, n=number of payments. Example: $20,000 at 8% for 5 years = $405/month. Our loan calculator does this instantly — just enter your amount, rate, and term." },
        { question: "What's a good interest rate for a personal loan?", answer: "As of 2026, excellent credit (720+) can get rates around 7-12%. Good credit (660-719): 12-18%. Fair credit (600-659): 18-25%. Anything above 25% is predatory — avoid payday loans and title loans at all costs." },
        { question: "Should I get a fixed or variable rate loan?", answer: "Fixed rate: your payment stays the same for the life of the loan. Best for most borrowers. Variable rate: starts lower but can increase based on market rates. Only choose variable if you can afford the maximum possible payment and plan to pay off the loan quickly." }
      ]
    },
    "budget-planner": {
      tips: [
        "The 50/30/20 rule: 50% needs, 30% wants, 20% savings/debt payoff. This is a starting point — adjust based on your goals",
        "Track every expense for 30 days before setting your budget. Most people underestimate spending by 20-30% when guessing",
        "Use the budget planner monthly — your expenses change with seasons, life events, and inflation"
      ],
      commonMistakes: [
        "Setting an unrealistically tight budget: if you cut too much too fast, you'll abandon the budget within weeks. Start with small changes",
        "Forgetting irregular expenses: car repairs, medical bills, gifts, and annual subscriptions need to be budgeted monthly (divide annual cost by 12)",
        "Not giving yourself any fun money: a budget that has zero room for entertainment or hobbies is unsustainable. Budget for joy, not just survival"
      ],
      faqs: [
        { question: "How do I create a budget that I'll actually stick to?", answer: "Start with the 50/30/20 framework. Track your actual spending for 30 days first. Then set realistic limits — if you currently spend $600/month on dining out, don't cut to $100 overnight. Reduce by $100/month until you hit your target. Use our budget planner to visualize where your money goes." },
        { question: "What's the difference between fixed and variable expenses?", answer: "Fixed: rent, mortgage, car payment, insurance, subscriptions — same amount every month. Variable: groceries, gas, dining out, entertainment — changes monthly. Budget fixed expenses first, then set realistic caps for variable categories." },
        { question: "How much should I save each month?", answer: "Aim for 20% of gross income following the 50/30/20 rule. At $60,000 salary, that's $1,000/month. If 20% is too much, start with 10% and increase 1% every 3 months. Priority order: $1,000 emergency fund → employer 401(k) match → high-interest debt → full emergency fund → max retirement accounts." }
      ]
    },
    "investment-return": {
      tips: [
        "The S&P 500 has returned ~10% annually before inflation (~7% after) over the long term, but any single year can be -30% or +30%",
        "Fees matter enormously: a 2% annual fee vs 0.1% on $100,000 invested for 30 years at 7% costs you $190,000 in lost growth",
        "Dollar-cost averaging (investing the same amount regularly) reduces the risk of buying at market peaks"
      ],
      commonMistakes: [
        "Chasing past performance: last year's top fund is rarely this year's top fund. Past returns don't predict future results",
        "Panic-selling during market drops: investors who stayed invested through the 2008 crash recovered all losses within 3 years. Those who sold at the bottom locked in permanent losses",
        "Ignoring taxes: capital gains taxes can take 15-20% of your investment profits. Use tax-advantaged accounts (IRA, 401k) when possible"
      ],
      faqs: [
        { question: "What's a good annual return on investment?", answer: "The historical average for the S&P 500 is ~10% nominal (7% after inflation). A 'good' return depends on your risk tolerance. Conservative portfolios (bonds) may earn 3-5%. Aggressive portfolios (stocks) may earn 8-12% long-term. Use our investment return calculator to model different scenarios." },
        { question: "How do I calculate my investment return?", answer: "ROI = (Current Value - Initial Investment) / Initial Investment × 100. Example: $10,000 grows to $13,000 = 30% total return. For annualized return: use CAGR = (Ending Value / Starting Value)^(1/years) - 1. Our calculator does both instantly." },
        { question: "What's the difference between nominal and real return?", answer: "Nominal return is the raw percentage gain. Real return adjusts for inflation. Example: 8% nominal return with 3% inflation = ~5% real return. Always plan retirement using real (inflation-adjusted) returns — your future expenses will be in future dollars." }
      ]
    }
  };

  return allCalculators.map((calc) => {
    const steps = generateHowToSteps(calc);
    const unique = UNIQUE_CONTENT[calc.slug];

    // Build generic content that scales with the calculator's category for unique value
    const genericTips = [
      `Start with sensible default values, then adjust them to match your actual scenario — defaults are calibrated to common cases but your situation matters most`,
      `Compare multiple scenarios side-by-side by changing one variable at a time; this isolates which factor drives the biggest impact on your results`,
      `Export or screenshot your results before making any major financial commitment so you have a record to reference when talking to lenders, advisors, or accountants`,
      `Always cross-check the calculator's assumptions against current market data — interest rates, tax brackets, and contribution limits change every year`,
      `For recurring decisions, save your inputs somewhere so you can re-run the same scenario 30, 60, or 90 days later to track how your numbers are evolving`,
    ];
    const genericMistakes = [
      `Using nominal interest rates when real (inflation-adjusted) rates are needed for long-term planning — a 7% nominal return with 3% inflation is only a 4% real return`,
      `Forgetting to account for taxes — gains, income, and distributions all face different tax treatments, and pre-calculator numbers can overstate actual wealth gained`,
      `Ignoring fees and transaction costs — annual fees of 1% vs 0.1% compound into a six-figure difference over a 30-year investment horizon`,
      `Treating the calculator as a substitute for professional advice — these tools help you think clearly, but qualified advisors handle nuance the formulas cannot capture`,
      `Plugging in optimistic return assumptions — use conservative-to-moderate rates (5-7%) for retirement planning rather than best-case scenarios (10-12%)`,
    ];
    const genericFaqs = (() => {
      const name = calc.title.toLowerCase();
      return [
        {
          question: `Is this ${name} accurate for 2026?`,
          answer: `Yes. Our ${calc.title.toLowerCase()} uses current 2026 tax brackets, contribution limits, IRS publication references, and BLS/IRS data refreshed annually. The underlying math is the same formulas used by financial professionals, banks, and tax software — verified against authoritative sources. For tax-specific decisions, however, always confirm with the IRS, your state's department of revenue, or a CPA because individual circumstances vary widely.`,
        },
        {
          question: `Can I use the ${calc.title.toLowerCase()} on my phone?`,
          answer: `Yes. Our ${calc.title.toLowerCase()} is fully responsive on phones, tablets, and desktop. All calculations run client-side in your browser, so you can use it offline once the page has loaded. Bookmark the result page or save the URL with parameters to revisit your specific scenario from any device.`,
        },
        {
          question: `Does my data stay private when I use this calculator?`,
          answer: `Yes. All calculations run locally in your browser; the numbers you type into the ${calc.title.toLowerCase()} never leave your device and are never sent to our servers. We collect only anonymized, aggregated metrics about which calculators are popular. No login required, no payment required, and no account needed to use the tool.`,
        },
        {
          question: `How do I share my ${name} results?`,
          answer: `Every ${calc.title.toLowerCase()} result can be exported as a PDF or image for sharing with family members, financial advisors, or lenders. The URL itself contains your input parameters, so you can copy and share a link that auto-fills the calculator with your specific scenario when reopened.`,
        },
        {
          question: `When should I not rely on this ${name}?`,
          answer: `Use this ${calc.title.toLowerCase()} as a starting point for research and planning, not as a substitute for professional advice in matters involving complex tax situations, large estate planning, business entity selection, or state-specific regulations. For major financial decisions — particularly those involving six-figure sums, retirement accounts, real estate transactions, or tax optimization — consult a qualified CFP®, CPA, tax attorney, or estate planning attorney in your jurisdiction.`,
        },
      ];
    })();

    return {
      slug: generateGuideSlug(calc.slug),
      title: `Free ${calc.title} Guide 2026 — Calculate in 30 Seconds (No Signup)`,
      description: `Master the ${calc.title} on QFINHUB. Free step-by-step instructions with instant results, expert tips, and common mistakes to avoid. No signup or email required.`,
      h1: `How to Use the ${calc.title} — Step by Step Guide`,
      calculatorId: calc.slug,
      steps,
      tips: unique?.tips || genericTips,
      commonMistakes: unique?.commonMistakes || genericMistakes,
      faqs: unique?.faqs || genericFaqs,
    };
  });
}

/**
 * Get total number of guide pages.
 */
export function getTotalGuides(): number {
  return allCalculators.length;
}
