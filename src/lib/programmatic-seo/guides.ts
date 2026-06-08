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
    }
  };

  return allCalculators.map((calc) => {
    const steps = generateHowToSteps(calc);
    const unique = UNIQUE_CONTENT[calc.slug];

    return {
      slug: generateGuideSlug(calc.slug),
      title: `Free ${calc.title} Guide 2026 — Calculate in 30 Seconds (No Signup)`,
      description: `Master the ${calc.title} on QFINHUB. Free step-by-step instructions with instant results, expert tips, and common mistakes to avoid. No signup or email required.`,
      h1: `How to Use the ${calc.title} — Step by Step Guide`,
      calculatorId: calc.slug,
      steps,
      tips: unique?.tips || [
        "Start with the default values to see how the calculator works before entering your own numbers",
        "Try different scenarios by changing one input at a time to understand its impact",
        "Use the sharing feature to save your results as an image or PDF for record keeping",
      ],
      commonMistakes: unique?.commonMistakes || [
        "Using nominal rates instead of effective annual rates for investment calculations",
        "Forgetting to account for inflation when projecting long-term savings",
        "Not considering taxes on investment gains or retirement withdrawals",
      ],
      faqs: unique?.faqs || [
        {
          question: `Is the ${calc.title} free to use?`,
          answer: `Yes, absolutely. All QFINHUB calculators are 100% free with no sign-up required. No limits on usage.`,
        },
        {
          question: `Are the calculations accurate?`,
          answer: `Yes. Our calculators use standard financial formulas and are regularly tested for accuracy. Results are for educational purposes — consult a financial professional for specific advice.`,
        },
        {
          question: `Can I save my calculations?`,
          answer: `Yes! You can download results as images or PDFs. If you create a free account, you can save calculations to your personal dashboard.`,
        },
      ],
    };
  });
}

/**
 * Get total number of guide pages.
 */
export function getTotalGuides(): number {
  return allCalculators.length;
}
