import type { CalculatorVariant } from "./types";
import { variantTemplates, getAllTemplates } from "./variant-templates";
import {
  generateVariantSlug,
  generateMetaTitle,
  generateMetaDescription,
  generateIntroParagraph,
  generateH1,
  generateFAQs,
  generateRelatedLinks,
} from "./seo-utils";

/**
 * Generates ALL variant data for programmatic SEO pages.
 * Returns structured data that can be used for sitemap generation and page rendering.
 * Produces 1000+ variants total.
 */
export function generateAllVariants(): CalculatorVariant[] {
  const templates = getAllTemplates();
  const allVariants: CalculatorVariant[] = [];

  for (const category of templates) {
    for (const tpl of category.templates) {
      const slug = tpl.slug;
      const params = { ...tpl.params, calculatorId: category.calculatorId };

      const metaTitle = generateMetaTitle(category.calculatorName, tpl.params);
      const metaDescription = generateMetaDescription(category.calculatorName, tpl.params);
      const h1 = generateH1(category.calculatorName, tpl.params);
      const intro = generateIntroParagraph(category.calculatorName, tpl.params);
      const faqs = generateFAQs(category.calculatorName, tpl.params);

      // Build the full content with intro + FAQ + helpful info
      const content = buildFullContent(category.calculatorName, tpl.params, intro, faqs);

      // Generate schema
      const schema = generateSchema(category, slug, metaTitle, metaDescription, faqs);

      const variant: CalculatorVariant = {
        slug,
        title: tpl.title,
        description: tpl.description,
        h1,
        content,
        calculatorId: category.calculatorId,
        params,
        meta: {
          title: metaTitle,
          description: metaDescription,
        },
        faqs,
        relatedLinks: [], // Will be populated after all variants are generated
        schema,
      };

      allVariants.push(variant);
    }
  }

  // Second pass: populate related links now that all variants exist
  for (const variant of allVariants) {
    variant.relatedLinks = generateRelatedLinks(
      variant.calculatorId,
      variant.params,
      allVariants,
    );
  }

  return allVariants;
}

/**
 * Cache for generated variants (enables reuse across build)
 */
let cachedVariants: CalculatorVariant[] | null = null;

export function getAllVariantPages(): CalculatorVariant[] {
  if (!cachedVariants) {
    cachedVariants = generateAllVariants();
  }
  return cachedVariants;
}

export function getVariantBySlug(slug: string): CalculatorVariant | undefined {
  const variants = getAllVariantPages();
  return variants.find((v) => v.slug === slug);
}

// ─── Build Full Content ─────────────────────────────────────────

function buildFullContent(
  calculatorName: string,
  params: Record<string, any>,
  intro: string,
  faqs: { question: string; answer: string }[],
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(n);

  let body = intro + "\n\n";

  // Add a "How to Use" section specific to this scenario
  body += `## How to Use This ${getShortName(calculatorName)}\n\n`;
  body += getHowToUseSection(calculatorName, params, fmt);
  body += "\n\n";

  // Add key considerations
  body += `## Key Considerations for This Scenario\n\n`;
  body += getKeyConsiderations(calculatorName, params, fmt);
  body += "\n\n";

  // Add FAQ section
  if (faqs.length > 0) {
    body += `## Frequently Asked Questions\n\n`;
    for (const faq of faqs) {
      body += `### ${faq.question}\n\n`;
      body += `${faq.answer}\n\n`;
    }
  }

  return body;
}

function getShortName(calcId: string): string {
  const map: Record<string, string> = {
    "mortgage-calculator": "Mortgage Calculator",
    "loan-calculator": "Loan Calculator",
    "investment-return": "Investment Return Calculator",
    "retirement-planning": "Retirement Planner",
    "tax-calculator": "Tax Calculator",
    "compound-interest": "Compound Interest Calculator",
  };
  return map[calcId] || calcId;
}

function getHowToUseSection(
  calcId: string,
  params: Record<string, any>,
  fmt: (n: number) => string,
): string {
  switch (calcId) {
    case "mortgage-calculator": {
      const hp = params.homePrice;
      const dp = params.downPct ?? 20;
      const rate = params.rate;
      const term = params.term;
      const loanAmt = hp ? hp * (1 - dp / 100) : 0;
      return (
        `1. **Home Price**: Enter ${hp ? fmt(hp) : "the home price"} as the purchase price of the home you're considering.\n` +
        `2. **Down Payment**: Set to ${dp}% (${fmt(hp * dp / 100)}), which means your loan amount is ${fmt(loanAmt)}.\n` +
        `3. **Interest Rate**: Input ${rate}% as your expected mortgage rate. Current market rates vary by credit score and loan type.\n` +
        `4. **Loan Term**: Choose ${term} years. A ${term}-year term balances affordable monthly payments with total interest costs.\n` +
        `5. **Taxes & Insurance**: Enter estimated annual property taxes and homeowners insurance for your area.\n\n` +
        `The calculator will instantly show your estimated monthly payment, including principal and interest, property taxes, insurance, and PMI if applicable.`
      );
    }
    case "loan-calculator": {
      const la = params.loanAmount;
      const rate = params.rate;
      const term = params.term;
      return (
        `1. **Loan Amount**: Enter ${fmt(la)} as the amount you plan to borrow.\n` +
        `2. **Interest Rate**: Input ${rate}% APR, which reflects the annual cost of borrowing.\n` +
        `3. **Loan Term**: Set to ${term} years. The term length significantly affects both your monthly payment and total interest.\n\n` +
        `The calculator will show your monthly payment, total interest paid over the life of the loan, and a complete amortization schedule breaking down each payment into principal and interest portions.`
      );
    }
    case "investment-return": {
      const init = params.initial;
      const finalVal = params.finalVal;
      const yrs = params.timeValue;
      return (
        `1. **Initial Investment**: Enter ${fmt(init)} as the amount you originally invested.\n` +
        `2. **Final Value**: Input ${fmt(finalVal)} as the current or ending value of your investment.\n` +
        `3. **Time Period**: Set to ${yrs} years — the total holding period of your investment.\n` +
        `4. **Dividends Received**: Include any dividends or income distributions received during the holding period.\n\n` +
        `The calculator computes your Total Return, Absolute Return Percentage, and Compound Annual Growth Rate (CAGR), giving you a complete picture of investment performance.`
      );
    }
    case "retirement-planning": {
      const age = params.currentAge;
      const sv = params.currentSavings;
      const inc = params.currentIncome;
      return (
        `1. **Current Age**: Enter ${age} as your current age. This sets the starting point for projections.\n` +
        `2. **Current Savings**: Input ${fmt(sv)} as your total retirement savings to date.\n` +
        `3. **Monthly Contribution**: Set your planned monthly retirement contribution.\n` +
        `4. **Expected Return**: Choose your expected annual return rate based on your investment strategy.\n` +
        `5. **Current Income**: Enter ${fmt(inc)} — this is used to calculate your income replacement ratio in retirement.\n` +
        `6. **Years to Retirement**: Set how many years until you plan to retire.\n\n` +
        `The calculator projects your retirement savings, estimates retirement income using the 4% withdrawal rule, and shows your income replacement percentage.`
      );
    }
    case "tax-calculator": {
      const inc = params.income;
      const fs = params.filingStatus;
      return (
        `1. **Annual Income**: Enter ${fmt(inc)} as your total taxable income for 2025.\n` +
        `2. **Filing Status**: Select "${fs?.replace(/-/g, " ")}" as your tax filing status.\n\n` +
        `The calculator estimates your federal income tax liability, marginal tax rate, effective tax rate, and after-tax income. It applies the standard deduction and 2025 marginal tax brackets to provide an accurate estimate.`
      );
    }
    case "compound-interest": {
      const p = params.principal;
      const rate = params.rate;
      const yrs = params.years;
      const add = params.monthlyAdd;
      return (
        `1. **Principal Amount**: Enter ${fmt(p)} as your initial investment or savings.\n` +
        `2. **Annual Rate**: Input ${rate}% as the expected annual interest rate or investment return.\n` +
        `3. **Time Period**: Set to ${yrs} years for the growth projection.\n` +
        `${add ? `4. **Monthly Addition**: Enter ${fmt(add)} as your regular monthly contributions.\n` : ""}` +
        `5. **Compound Frequency**: Choose how often interest compounds (monthly, quarterly, annually, etc.).\n\n` +
        `Watch your money grow with detailed year-by-year projections showing the power of compound interest.`
      );
    }
    default:
      return "Enter your values in the calculator fields above to get instant results.";
  }
}

function getKeyConsiderations(
  calcId: string,
  params: Record<string, any>,
  fmt: (n: number) => string,
): string {
  switch (calcId) {
    case "mortgage-calculator": {
      const hp = params.homePrice;
      const dp = params.downPct ?? 20;
      const rate = params.rate;
      const term = params.term;
      return (
        `- **Down Payment**: A ${dp}% down payment on a ${fmt(hp)} home means you need ${fmt(hp * dp / 100)} upfront. ${dp < 20 ? "Since your down payment is under 20%, you'll also pay Private Mortgage Insurance (PMI)." : "With 20% or more down, you avoid PMI and may get better rates."}\n` +
        `- **Interest Rate Impact**: At ${rate}%, even a small rate change can significantly affect your monthly payment and total interest over ${term} years.\n` +
        `- **Total Cost**: Remember to factor in closing costs (typically 2-5% of the purchase price), moving expenses, and ongoing maintenance costs (usually 1% of home value annually).\n` +
        `- **Rate Shopping**: Compare rates from multiple lenders. A difference of 0.25% can save thousands over the life of your loan.\n` +
        `- **Extra Payments**: Making even one extra payment per year can shorten your loan term by several years and save thousands in interest.`
      );
    }
    case "loan-calculator": {
      const la = params.loanAmount;
      const rate = params.rate;
      const term = params.term;
      const monthlyEst = estimateMonthlyPayment(la, rate, term);
      const totalInt = monthlyEst * term * 12 - la;
      return (
        `- **Monthly Payment**: Your estimated monthly payment is approximately ${fmt(monthlyEst)}, which fits within the general guideline of keeping total debt payments below 36% of gross income.\n` +
        `- **Total Interest**: Over ${term} years, you'll pay approximately ${fmt(totalInt)} in total interest — ${((totalInt / la) * 100).toFixed(0)}% of your loan amount.\n` +
        `- **Credit Score Impact**: Your credit score significantly affects your interest rate. Improving your score by 50-100 points could save you thousands.\n` +
        `- **Prepayment**: If possible, consider paying extra each month or making lump-sum payments to reduce total interest and pay off the loan faster.`
      );
    }
    case "retirement-planning": {
      const age = params.currentAge;
      const inc = params.currentIncome;
      const sv = params.currentSavings;
      return (
        `- **Start Early**: Starting at age ${age} gives your investments decades to compound. Time is your greatest asset in retirement planning.\n` +
        `- **Income Replacement**: Financial planners typically recommend targeting 70-80% of your pre-retirement income in retirement. Your current income of ${fmt(inc)} means targeting ${fmt(inc * 0.75)} per year in retirement income.\n` +
        `- **Investment Allocation**: Your asset allocation should become more conservative as you approach retirement. Consider shifting from stocks to bonds over time.\n` +
        `- **Inflation**: Remember that $1 today will be worth less in the future. Factor in an average inflation rate of 2-3% when projecting your retirement needs.\n` +
        `- **Social Security**: Don't forget to factor in Social Security benefits, which can replace about 40% of pre-retirement income for average earners.`
      );
    }
    case "tax-calculator": {
      const inc = params.income;
      return (
        `- **Standard Deduction**: The standard deduction reduces your taxable income. For 2025, this is $14,600 for single filers and $29,200 for married filing jointly.\n` +
        `- **Marginal vs Effective Rate**: Your marginal tax rate applies to your last dollar earned, but your effective tax rate (total tax / total income) is typically much lower due to progressive brackets and deductions.\n` +
        `- **Tax Planning**: Consider contributing to tax-advantaged accounts like 401(k)s, IRAs, and HSAs to reduce your taxable income.\n` +
        `- **Withholding**: Use this calculator to check if you're having the right amount withheld from your paycheck to avoid a large tax bill or refund.`
      );
    }
    case "compound-interest": {
      const rate = params.rate;
      const yrs = params.years;
      return (
        `- **The Power of Time**: At ${rate}% APY, your money doubles approximately every ${Math.round(72 / rate)} years (Rule of 72). The longer your investment horizon, the more dramatic the compounding effect.\n` +
        `- **Consistency Matters**: Regular contributions, even small ones, have an enormous impact over ${yrs} years due to compound growth.\n` +
        `- **Compounding Frequency**: More frequent compounding leads to slightly higher returns. Daily compounding yields marginally more than monthly or annual compounding.\n` +
        `- **Tax Considerations**: Investment gains in tax-advantaged accounts (401k, IRA, HSA) compound tax-free, significantly boosting long-term returns compared to taxable accounts.`
      );
    }
    default:
      return "Consider consulting with a financial advisor for personalized advice tailored to your situation.";
  }
}

function estimateMonthlyPayment(
  principal: number,
  annualRate: number,
  termYears: number,
): number {
  const r = annualRate / 100 / 12;
  const n = termYears * 12;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ─── Schema Generation ──────────────────────────────────────────

function generateSchema(
  category: { calculatorId: string; calculatorSlug: string; calculatorName: string },
  slug: string,
  title: string,
  description: string,
  faqs: { question: string; answer: string }[],
): Record<string, any> {
  const url = `https://www.qfinhub.com/tools/${slug}`;

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: title,
    description: description,
    applicationCategory: "FinanceApplication",
    operatingSystem: "All",
    url: url,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Organization",
      name: "QFINHUB",
    },
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to Use the ${title}`,
    description: `Step-by-step guide to using the ${category.calculatorName} for your specific financial scenario.`,
    step: [
      {
        "@type": "HowToStep",
        position: 1,
        name: "Enter your financial details",
        text: `Input your specific numbers into the ${category.calculatorName} fields above.`,
      },
      {
        "@type": "HowToStep",
        position: 2,
        name: "Review your results",
        text: "The calculator will instantly show your results including monthly payments, totals, and detailed breakdowns.",
      },
      {
        "@type": "HowToStep",
        position: 3,
        name: "Adjust scenarios",
        text: "Modify any input to compare different rates, terms, or amounts and find the best option for your situation.",
      },
    ],
  };

  const faqPageSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.slice(0, 5).map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return { webAppSchema, howToSchema, faqPageSchema };
}
