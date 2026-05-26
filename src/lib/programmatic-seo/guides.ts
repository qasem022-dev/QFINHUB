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
  return `${calcTitle}: How to Calculate & Plan in 2026 — Free Guide`;
}

/** Generate a search-friendly meta description for a guide page */
export function generateGuideMetaDescription(calcTitle: string): string {
  return `Learn how to calculate your ${calcTitle.toLowerCase()} with our free 2026 guide. Step-by-step instructions, expert tips, and instant calculator. No signup needed — start now.`;
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
  return allCalculators.map((calc) => {
    const steps = generateHowToSteps(calc);

    return {
      slug: generateGuideSlug(calc.slug),
      title: `Free ${calc.title} Guide 2026 — Calculate in 30 Seconds (No Signup)`,
      description: `Master the ${calc.title} on QFINHUB. Free step-by-step instructions with instant results, expert tips, and common mistakes to avoid. No signup or email required.`,
      h1: `How to Use the ${calc.title} — Step by Step Guide`,
      calculatorId: calc.slug,
      steps,
      tips: [
        "Start with the default values to see how the calculator works before entering your own numbers",
        "Try different scenarios by changing one input at a time to understand its impact",
        "Use the sharing feature to save your results as an image or PDF for record keeping",
      ],
      commonMistakes: [
        "Using nominal rates instead of effective annual rates for investment calculations",
        "Forgetting to account for inflation when projecting long-term savings",
        "Not considering taxes on investment gains or retirement withdrawals",
      ],
      faqs: [
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
