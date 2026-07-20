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
      const totalGain = finalVal && init ? finalVal - init : 0;
      const totalReturnPct = init && finalVal ? ((finalVal - init) / init * 100).toFixed(1) : "0";
      const cagr = init && finalVal && yrs ? ((Math.pow(finalVal / init, 1 / yrs) - 1) * 100).toFixed(2) : "0";
      return (
        `1. **Initial Investment**: Enter ${fmt(init)} as the amount you originally invested.\n` +
        `2. **Final Value**: Input ${fmt(finalVal)} as the current or ending value of your investment.\n` +
        `3. **Time Period**: Set to ${yrs} years — the total holding period of your investment.\n` +
        `4. **Dividends Received**: Include any dividends or income distributions received during the holding period.\n\n` +
        `For your specific scenario, this is a ${totalReturnPct}% total return (gain of ${fmt(totalGain)}) over ${yrs} years, which works out to a CAGR of ${cagr}% per year. ` +
        `The calculator computes these metrics automatically. Compare against benchmarks: the S&P 500 has historically returned about 10% annually before inflation (~7% real return), so anything above that is excellent. ` +
        `Anything below 4-5% annually should make you question whether the investment risk is worth it.`
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
    case "debt-to-income": {
      const inc = params.income ?? params.annualIncome ?? 50000;
      const debt = params.monthlyDebt ?? 1500;
      const dti = inc > 0 ? ((debt * 12 / inc) * 100).toFixed(1) : "36.0";
      return (
        `1. **Annual Income**: Enter ${fmt(inc)} as your gross annual income before taxes. Lenders use gross income, not take-home, when calculating DTI.\n` +
        `2. **Monthly Debt Payments**: Input ${fmt(debt)} as your total monthly debt obligations including rent or mortgage, car loans, student loans, credit cards, and any other debt payments.\n` +
        `3. **Lender Type**: Most conventional lenders cap DTI at 43%; FHA loans allow up to 50% in some cases; VA loans are more flexible.\n\n` +
        `For this specific scenario, your calculated debt-to-income ratio is ${dti}%. ` +
        `Use our free debt-to-income calculator to compare against lender thresholds and identify how much additional debt capacity you have.`
      );
    }
    case "fire-calculator": {
      const exp = params.annualExpenses ?? 40000;
      const sr = params.savingsRate ?? 50;
      const inc = params.income ?? 100000;
      const sv = params.currentSavings ?? 50000;
      const rate = params.rate ?? 7;
      const fireNumber = exp * 25;
      const yrsToFi = sv > 0 && (rate/100) > 0 && (inc * sr/100) > 0
        ? Math.log(((fireNumber * rate/100) + (inc * sr/100)) / ((sv * rate/100) + (inc * sr/100))) / Math.log(1 + rate/100)
        : 0;
      return (
        `1. **Annual Expenses**: Enter ${fmt(exp)} as your expected annual spending in retirement. FIRE uses the 4% safe withdrawal rule, so multiply by 25.\n` +
        `2. **Current Savings**: Input ${fmt(sv)} as what you have already saved toward retirement.\n` +
        `3. **Annual Income**: Set ${fmt(inc)} as your gross annual income.\n` +
        `4. **Savings Rate**: ${sr}% means you save ${fmt(inc * sr / 100)} per year. The higher your savings rate, the faster you reach FIRE.\n` +
        `5. **Expected Return**: ${rate}% is the historical real return of the S&P 500. Use lower numbers for more conservative estimates.\n\n` +
        `Your FIRE target is ${fmt(fireNumber)} (25× your annual expenses). With a ${sr}% savings rate and ${fmt(sv)} already saved, the calculator projects approximately ${Math.max(1, Math.round(yrsToFi))} years until you reach financial independence. `
      );
    }
    case "financial-independence": {
      const exp = params.annualExpenses ?? 50000;
      const sr = params.savingsRate ?? 50;
      const sv = params.currentSavings ?? 100000;
      const fiNumber = exp * 25;
      const yearsToFi = sv > 0 && (sr * exp) > 0
        ? Math.log((fiNumber / sv)) / Math.log(1 + (sr / 100))
        : 0;
      return (
        `1. **Annual Expenses**: Enter ${fmt(exp)} as the lifestyle you want to maintain in retirement.\n` +
        `2. **Savings Rate**: ${sr}% puts you ahead of 90% of Americans; aim for 50%+ for early FI.\n` +
        `3. **Current Savings**: ${fmt(sv)} is your starting point.\n` +
        `4. **Investment Return**: Most FI calculators default to 7% (real return after inflation).\n\n` +
        `Your FI number is ${fmt(fiNumber)}. The calculator shows your projected timeline — approximately ${Math.max(1, Math.round(yearsToFi))} years at your current savings rate — based on your savings rate and current nest egg. `
      );
    }
    case "net-worth": {
      const assets = params.totalAssets ?? params.assets ?? 250000;
      const liab = params.totalLiabilities ?? params.liabilities ?? 100000;
      const nw = assets - liab;
      return (
        `1. **Total Assets**: Enter ${fmt(assets)} as the sum of all your assets — cash, investments, retirement accounts, real estate equity, vehicles, and other valuables.\n` +
        `2. **Total Liabilities**: Input ${fmt(liab)} as the sum of all your debts — mortgage, student loans, credit cards, car loans, and other obligations.\n` +
        `3. **Include or Exclude Home Equity**: Some net worth calculations include home equity; others exclude your primary residence. Both are valid.\n\n` +
        `Your current net worth is ${fmt(nw)}. The calculator tracks your progress over time as you pay down debt and grow assets.`
      );
    }
    case "emergency-fund": {
      const exp = params.monthlyExpenses ?? params.expenses ?? 3500;
      const mo = params.months ?? 6;
      const target = exp * mo;
      return (
        `1. **Monthly Expenses**: Enter ${fmt(exp)} as your essential monthly expenses (rent, food, utilities, insurance, minimum debt payments).\n` +
        `2. **Target Months**: Most financial planners recommend 3-6 months; freelancers and sole proprietors often need 9-12 months.\n` +
        `3. **Current Savings**: Input how much you already have set aside for emergencies.\n\n` +
        `Your emergency fund target is ${fmt(target)} (${mo} months × ${fmt(exp)}). Use our calculator to see how long it will take to reach this goal at your current savings rate.`
      );
    }
    case "budget-planner": {
      const inc = params.monthlyIncome ?? params.income ?? 5000;
      const housing = params.housingPct ?? 30;
      const food = params.foodPct ?? 12;
      const transport = params.transportPct ?? 10;
      const sav = params.savingsPct ?? 20;
      return (
        `1. **Monthly Income**: Enter ${fmt(inc)} as your take-home pay after taxes. Budgets work from actual deposits, not gross salary.\n` +
        `2. **Housing (${housing}%)**: ${fmt(inc * housing / 100)} — should be your largest category but ideally under 30%.\n` +
        `3. **Food (${food}%)**: ${fmt(inc * food / 100)} — split between groceries and dining out.\n` +
        `4. **Transportation (${transport}%)**: ${fmt(inc * transport / 100)} — includes car payment, gas, insurance, and transit.\n` +
        `5. **Savings (${sav}%)**: ${fmt(inc * sav / 100)} — pay yourself first. Aim for 20% minimum to build wealth.\n\n` +
        `The remaining ${fmt(inc * (100 - housing - food - transport - sav) / 100)} covers entertainment, clothing, subscriptions, and miscellaneous spending.`
      );
    }
    case "roi-calculator": {
      const init = params.initial ?? params.initialInvestment ?? 10000;
      const finalVal = params.final ?? params.finalValue ?? 12000;
      const gain = finalVal - init;
      const roi = init > 0 ? ((gain / init) * 100).toFixed(1) : "0";
      return (
        `1. **Initial Investment**: Enter ${fmt(init)} as your starting cost.\n` +
        `2. **Final Value**: Input ${fmt(finalVal)} as the total return including any proceeds.\n` +
        `3. **Time Period**: Set the duration of the investment for annualized ROI calculation.\n\n` +
        `For your scenario, ROI is ${roi}% (gain of ${fmt(gain)}). Use this calculator to compare investments side by side on an apples-to-apples annualized basis.`
      );
    }
    case "401k-calculator": {
      const inc = params.salary ?? params.annualIncome ?? 75000;
      const contrib = params.contributionPercent ?? params.contributionPct ?? 6;
      const employer = params.employerMatch ?? params.matchPercent ?? 50;
      const balance = params.currentBalance ?? 50000;
      return (
        `1. **Annual Salary**: Enter ${fmt(inc)} as your gross annual income.\n` +
        `2. **Your Contribution**: ${contrib}% = ${fmt(inc * contrib / 100)}/year contributed from your paycheck before taxes.\n` +
        `3. **Employer Match**: ${employer}% match on the first 6% you contribute (typical). At your salary, that means up to ${fmt(inc * 0.06 * employer / 100)} in free money.\n` +
        `4. **Current Balance**: ${fmt(balance)} is what you've already accumulated.\n\n` +
        `Always contribute at least enough to capture the full employer match — it's a 50-100% instant return on your contribution with zero risk.`
      );
    }
    case "annuity-calculator": {
      const pmt = params.payment ?? 1000;
      const rate = params.rate ?? 5;
      const yrs = params.years ?? 20;
      const pv = params.principal ?? 100000;
      return (
        `1. **Payment Amount**: ${fmt(pmt)} per period (monthly or annual) of your annuity contribution or withdrawal.\n` +
        `2. **Interest Rate**: ${rate}% annual yield.\n` +
        `3. **Term**: ${yrs} years.\n` +
        `4. **Starting Principal**: ${fmt(pv)} if you have an existing amount to apply to the annuity.\n\n` +
        `The calculator distinguishes between immediate annuities (start paying now) and deferred annuities (accumulate first, then pay out). Use this to compare annuity quotes against lump-sum alternatives.`
      );
    }
    case "auto-loan": {
      const price = params.vehiclePrice ?? 30000;
      const dp = params.downPayment ?? 5000;
      const rate = params.rate ?? 6.5;
      const term = params.term ?? 60;
      const loan = price - dp;
      const monthly = estimateMonthlyPayment(loan, rate, term / 12);
      return (
        `1. **Vehicle Price**: Enter ${fmt(price)} as the negotiated price of the car.\n` +
        `2. **Down Payment**: ${fmt(dp)} reduces your loan amount to ${fmt(loan)}.\n` +
        `3. **Interest Rate**: ${rate}% APR depends on your credit score. Excellent credit (740+) gets the best rates.\n` +
        `4. **Loan Term**: ${term} months (${(term / 12).toFixed(1)} years). Longer terms have lower monthly payments but cost more in total interest.\n\n` +
        `Your estimated monthly payment is ${fmt(monthly)}. A car payment above 15% of your monthly take-home pay is a common sign you're overspending on transportation.`
      );
    }
    case "car-loan": {
      const price = params.vehiclePrice ?? 25000;
      const rate = params.rate ?? 7;
      const term = params.term ?? 60;
      return (
        `1. **Loan Amount**: ${fmt(price)}.\n` +
        `2. **APR**: ${rate}%.\n` +
        `3. **Term**: ${term} months.\n\n` +
        `The calculator estimates your payment, total interest, and amortization. Useful when comparing dealer financing against bank or credit union loans.`
      );
    }
    case "credit-card-payoff": {
      const balance = params.balance ?? 5000;
      const rate = params.rate ?? 22;
      const pmt = params.payment ?? 200;
      const months = rate > 0 ? Math.ceil(-Math.log(1 - (balance * rate / 100 / 12) / pmt) / Math.log(1 + rate / 100 / 12)) : 999;
      return (
        `1. **Current Balance**: Enter ${fmt(balance)} as your total credit card debt.\n` +
        `2. **APR**: ${rate}% is typical for credit cards. Anything above 20% APR should be a top priority to pay off.\n` +
        `3. **Monthly Payment**: ${fmt(pmt)} — pay more than the minimum. Most cards have minimums of just 1-2% of the balance, which would take decades to pay off.\n\n` +
        `At ${fmt(pmt)}/month, you'll be debt-free in approximately ${months} months and pay roughly ${fmt(pmt * months - balance)} in interest. Pay ${fmt(pmt * 1.5)}/month and you'll finish in ${Math.ceil(months * 0.65)} months while saving hundreds in interest.`
      );
    }
    case "debt-payoff": {
      const debts = params.debts ?? 15000;
      const rate = params.rate ?? 8;
      const pmt = params.payment ?? 500;
      return (
        `1. **Total Debt**: Enter ${fmt(debts)} as the sum of all your debts (excluding mortgage).\n` +
        `2. **Average Interest Rate**: ${rate}% — higher for credit cards, lower for student loans.\n` +
        `3. **Monthly Payment**: ${fmt(pmt)} — how much you can put toward debt each month.\n\n` +
        `Choose snowball (smallest balance first) for psychological wins, or avalanche (highest rate first) to save the most money. The calculator shows both timelines.`
      );
    }
    case "roth-ira": {
      const inc = params.income ?? 75000;
      const contrib = params.contribution ?? 7000;
      const rate = params.rate ?? 7;
      const yrs = params.years ?? 30;
      return (
        `1. **Annual Income**: Enter ${fmt(inc)} — Roth IRA contribution eligibility phases out starting at $153,000 MAGI for single filers in 2026 ($240,000 for married filing jointly).\n` +
        `2. **Contribution**: ${fmt(contrib)}/year (the 2026 limit is $7,000; $8,000 if 50+).\n` +
        `3. **Expected Return**: ${rate}% annual.\n` +
        `4. **Time Horizon**: ${yrs} years until retirement.\n\n` +
        `Roth IRA growth is tax-free for both contributions and qualified withdrawals. Compare against a Traditional IRA, where you get a deduction now but pay taxes on withdrawals.`
      );
    }
    case "savings-goal": {
      const goal = params.goalAmount ?? 20000;
      const current = params.currentSavings ?? 5000;
      const pmt = params.monthlyContribution ?? 500;
      const yrs = params.years ?? 3;
      const needed = goal - current;
      return (
        `1. **Goal Amount**: Enter ${fmt(goal)} as your savings target (down payment, vacation, emergency fund, etc.).\n` +
        `2. **Current Savings**: ${fmt(current)} is what you have now.\n` +
        `3. **Monthly Contribution**: ${fmt(pmt)}/month.\n` +
        `4. **Timeframe**: ${yrs} years.\n\n` +
        `You need ${fmt(needed)} more. At ${fmt(pmt)}/month, you'll reach your goal in ${(needed / pmt).toFixed(1)} months (or ${(needed / pmt / 12).toFixed(1)} years). The calculator factors in interest earned on a high-yield savings account.`
      );
    }
    case "mortgage-affordability": {
      const inc = params.annualIncome ?? 80000;
      const dp = params.downPayment ?? 20000;
      const rate = params.rate ?? 6.5;
      const ratio = 0.28;
      const monthlyForHousing = inc / 12 * ratio;
      const maxLoan = (monthlyForHousing * 1000) / (rate * 1.2);
      return (
        `1. **Annual Income**: Enter ${fmt(inc)} gross annual income.\n` +
        `2. **Down Payment**: ${fmt(dp)} reduces the loan you need.\n` +
        `3. **Interest Rate**: ${rate}% — your credit score determines the actual rate you'll get.\n` +
        `4. **Other Debts**: Car payments, student loans, and credit card minimums reduce how much you can spend on housing.\n\n` +
        `Following the 28% front-end ratio rule, you can afford roughly ${fmt(monthlyForHousing)}/month on housing, which translates to approximately ${fmt(maxLoan)} in loan amount, or about ${fmt(maxLoan + dp)} home price.`
      );
    }
    case "refinance-calculator": {
      const balance = params.currentBalance ?? 250000;
      const curRate = params.currentRate ?? 7;
      const newRate = params.newRate ?? 6;
      const term = params.term ?? 30;
      const savings = balance * (curRate - newRate) / 10000 * term / 2;
      return (
        `1. **Current Loan Balance**: Enter ${fmt(balance)}.\n` +
        `2. **Current Rate**: ${curRate}%.\n` +
        `3. **New Rate**: ${newRate}%.\n` +
        `4. **Closing Costs**: Don't forget to include these — typically $2,000-$5,000 for a refi.\n\n` +
        `Your estimated monthly savings is roughly ${fmt(savings / (term * 12))}. The break-even point on closing costs determines whether refinancing makes sense.`
      );
    }
    case "future-value": {
      const pv = params.principal ?? 10000;
      const pmt = params.payment ?? 200;
      const rate = params.rate ?? 7;
      const yrs = params.years ?? 20;
      return (
        `1. **Present Value**: ${fmt(pv)} starting amount.\n` +
        `2. **Regular Payment**: ${fmt(pmt)} per period.\n` +
        `3. **Interest Rate**: ${rate}% annual.\n` +
        `4. **Periods**: ${yrs} years.\n\n` +
        `Future value combines compound interest with regular contributions. Use this for college savings, retirement projections, or any long-term savings goal.`
      );
    }
    case "present-value": {
      const fv = params.futureValue ?? 50000;
      const rate = params.rate ?? 5;
      const yrs = params.years ?? 10;
      const pv = fv / Math.pow(1 + rate / 100, yrs);
      return (
        `1. **Future Value**: ${fmt(fv)} you'll need in the future.\n` +
        `2. **Discount Rate**: ${rate}% — typically your expected investment return.\n` +
        `3. **Time Period**: ${yrs} years.\n\n` +
        `To have ${fmt(fv)} in ${yrs} years at a ${rate}% return, you need to invest approximately ${fmt(pv)} today.`
      );
    }
    case "retirement-savings": {
      const age = params.currentAge ?? 30;
      const ret = params.retirementAge ?? 65;
      const sv = params.currentSavings ?? 50000;
      const contrib = params.monthlyContribution ?? 500;
      return (
        `1. **Current Age**: ${age}.\n` +
        `2. **Retirement Age**: ${ret}.\n` +
        `3. **Current Savings**: ${fmt(sv)}.\n` +
        `4. **Monthly Contribution**: ${fmt(contrib)}.\n` +
        `5. **Expected Annual Return**: 7% is a typical assumption for a balanced portfolio.\n\n` +
        `You have ${ret - age} years until retirement. The calculator projects your balance at retirement, estimated annual income (using 4% rule), and whether you're on track.`
      );
    }
    default:
      return (
        `1. **Enter Your Values**: Use the input fields above to enter the relevant numbers for your scenario.\n` +
        `2. **Review Results**: Results update instantly as you change inputs — no submit button needed.\n` +
        `3. **Adjust and Compare**: Try different rates, terms, or amounts to see how they affect the outcome.\n\n` +
        `All calculations run locally in your browser. No data is sent to servers, your inputs stay private, and you can experiment freely without creating an account. ` +
        `For the most accurate answer, double-check your assumptions against current market data and consult a financial professional for personalized advice.`
      );
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
        `- **Prepayment**: If possible, consider paying extra each month or making lump-sum payments to reduce total interest and pay off the loan faster.\n` +
        `- **Origination Fees**: Many lenders charge 1-6% of the loan amount in origination fees. Factor this into your effective cost when comparing offers.`
      );
    }
    case "investment-return": {
      const init = params.initial ?? 10000;
      const finalVal = params.finalVal ?? 18000;
      const yrs = params.timeValue ?? 5;
      const totalGain = finalVal - init;
      const totalReturnPct = init > 0 ? ((totalGain / init) * 100).toFixed(1) : "0";
      const cagr = init > 0 && yrs > 0 ? ((Math.pow(finalVal / init, 1 / yrs) - 1) * 100).toFixed(2) : "0";
      return (
        `- **Total Return**: Your ${fmt(init)} → ${fmt(finalVal)} is a ${totalReturnPct}% total return (gain of ${fmt(totalGain)}) over ${yrs} years.\n` +
        `- **CAGR**: Annualized, that works out to ${cagr}% per year. Compare against the S&P 500's historical average of ~10% nominal (~7% real after inflation).\n` +
        `- **Inflation**: A ${cagr}% nominal return with 3% inflation means your real purchasing power grew by ${(parseFloat(cagr) - 3).toFixed(2)}% per year.\n` +
        `- **Taxes**: Capital gains tax applies to profitable sales. Long-term holdings (1+ year) get preferential tax rates of 0%, 15%, or 20% depending on income.\n` +
        `- **Reinvestment**: Returns compounded annually (reinvested) significantly outperform those taken as cash distributions over the same period.`
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
        `- **Standard Deduction**: The standard deduction reduces your taxable income. For 2026, this is $15,000 for single filers and $30,000 for married filing jointly.\n` +
        `- **Marginal vs Effective Rate**: Your marginal tax rate applies to your last dollar earned, but your effective tax rate (total tax / total income) is typically much lower due to progressive brackets and deductions.\n` +
        `- **Tax Planning**: Consider contributing to tax-advantaged accounts like 401(k)s, IRAs, and HSAs to reduce your taxable income.\n` +
        `- **Withholding**: Use this calculator to check if you're having the right amount withheld from your paycheck to avoid a large tax bill or refund.\n` +
        `- **State Taxes**: Federal brackets don't include state income taxes, which range from 0% (FL, TX, etc.) to over 13% (CA). Total tax burden is federal + state + FICA.`
      );
    }
    case "compound-interest": {
      const rate = params.rate;
      const yrs = params.years;
      const p = params.principal ?? 10000;
      const add = params.monthlyAdd ?? 0;
      // Calculate compounded value
      let balance = p;
      for (let i = 0; i < (yrs || 10); i++) {
        balance = balance * (1 + (rate || 0) / 100);
        if (add) balance += add * 12;
      }
      return (
        `- **The Power of Time**: At ${rate}% APY, your money doubles approximately every ${Math.round(72 / (rate || 1))} years (Rule of 72). The longer your investment horizon, the more dramatic the compounding effect.\n` +
        `- **Consistency Matters**: Regular contributions, even small ones, have an enormous impact over ${yrs} years due to compound growth.\n` +
        `- **Compounding Frequency**: More frequent compounding leads to slightly higher returns. Daily compounding yields marginally more than monthly or annual compounding.\n` +
        `- **Projected Balance**: At ${rate}% for ${yrs} years, your initial ${fmt(p)}${add ? ` plus ${fmt(add)}/month contributions` : ''} grows to approximately ${fmt(balance)}.\n` +
        `- **Tax Considerations**: Investment gains in tax-advantaged accounts (401k, IRA, HSA) compound tax-free, significantly boosting long-term returns compared to taxable accounts.`
      );
    }
    case "debt-to-income": {
      const inc = params.income ?? 50000;
      const dti = params.dti ?? 36;
      return (
        `- **Lender Thresholds**: Most conventional loans require DTI ≤ 43%. FHA allows up to 50%, and VA loans don't have a hard cap but prefer ≤ 41%.\n` +
        `- **Front-End vs Back-End**: Front-end ratio (housing only) ≤ 28% is preferred; back-end ratio (housing + all other debts) ≤ 36% is the traditional benchmark.\n` +
        `- **Income Calculation**: Lenders use gross income from W-2s, tax returns, and bank statements — not your stated take-home pay.\n` +
        `- **Credit Score Interaction**: A high DTI with excellent credit (740+) is more forgivable than the same DTI with poor credit. Improving your score can offset borderline DTI.\n` +
        `- **Reducing DTI**: Pay down small balances first, avoid new debt before applying, and consider a co-borrower if you have stable combined income.`
      );
    }
    case "fire-calculator": {
      const exp = params.annualExpenses ?? 40000;
      const fireNumber = exp * 25;
      return (
        `- **The 4% Rule**: FIRE is built on the Trinity Study finding that a portfolio invested 60/40 stocks/bonds can sustain 4% annual withdrawals for 30+ years without running out.\n` +
        `- **Your FIRE Number**: ${fmt(fireNumber)} (25× expenses) is your target. Multiply your expected annual expenses by 25 to get there.\n` +
        `- **Lean vs Fat vs Chubby FIRE**: Lean FIRE = extreme frugality (under $40k/yr expenses). Fat FIRE = comfortable lifestyle ($80k+). Chubby FIRE = in-between, ~$60-80k.\n` +
        `- **Coast FIRE**: If you have 2.5-3.5× your FIRE number invested now, you can stop saving and let compound growth handle the rest — you're "coasting" to FI.\n` +
        `- **Healthcare Gap**: Until age 65, FIRE requires bridging healthcare. ACA subsidies, employer coverage for a partner, or a part-time "barista FIRE" job help.`
      );
    }
    case "financial-independence": {
      const exp = params.annualExpenses ?? 50000;
      const fiNumber = exp * 25;
      return (
        `- **FI is Goal, FIRE is Path**: Financial Independence means your investments cover your expenses — it doesn't mean you stop working. Many FI people work because they want to, not because they have to.\n` +
        `- **Your FI Number**: ${fmt(fiNumber)}.\n` +
        `- **Sequence-of-Returns Risk**: In early retirement, a market crash can devastate your portfolio if you're withdrawing simultaneously. Hold 2-3 years of expenses in cash as a buffer.\n` +
        `- **Withdrawal Rate**: 4% is the historical safe withdrawal rate, buttressed by the Trinity Study. More conservative retirees use 3-3.5%.\n` +
        `- **Guaranteed Income Streams**: Social Security, pensions, and annuities reduce the portfolio size needed for FI. Factor in any expected benefits.`
      );
    }
    case "net-worth": {
      const nw = (params.totalAssets ?? 250000) - (params.totalLiabilities ?? 100000);
      return (
        `- **Liquid vs Illiquid Assets**: A high net worth tied up in home equity is different from the same number in cash or stocks. Liquidity matters for resilience.\n` +
        `- **Negative Net Worth Is Common**: Most Americans under 35 have negative net worth due to student loans. Recovery is the goal, not instantaneous profitability.\n` +
        `- **Track Quarterly**: Net worth is a metric — measure it consistently. Update quarterly with bank, brokerage, and loan statements.\n` +
        `- **Diversification**: Don't let one asset (like home equity or a single stock) dominate. Aim for diversification across asset classes.\n` +
        `- **Estate Planning**: As net worth grows, basic estate planning becomes essential — beneficiary designations, wills, and powers of attorney are foundational.`
      );
    }
    case "emergency-fund": {
      const exp = params.monthlyExpenses ?? 3500;
      const mo = params.months ?? 6;
      const target = exp * mo;
      return (
        `- **Why Cash, Not Investments**: Emergency funds must be liquid. Stocks can drop 20-30% in a year — the exact moment you might need the money.\n` +
        `- **Where to Keep It**: High-yield savings accounts (4-5% APY in 2026) are the standard. Money market accounts and short-term Treasury bills also work.\n` +
        `- **How Much**: Job stability and income predictability determine your target. ${mo} months of expenses (${fmt(target)}) is appropriate for most professionals; solo entrepreneurs often need 9-12.\n` +
        `- **Building Up**: Set up automatic transfers from checking. Even $50-100/week builds $5,000 in a year without thinking about it.\n` +
        `- **Insurance Connection**: Some emergencies are covered by insurance (health, auto, home) — but deductibles and gaps mean you still need cash.`
      );
    }
    case "budget-planner": {
      const inc = params.monthlyIncome ?? 5000;
      const housing = params.housingPct ?? 30;
      const sav = params.savingsPct ?? 20;
      return (
        `- **The 50/30/20 Rule**: 50% needs, 30% wants, 20% savings is the classic framework. Adapt the percentages to your cost of living and goals.\n` +
        `- **Housing: The Anchor**: ${housing}% of income on housing is the standard guideline. Anything above 30-35% stresses other budget categories.\n` +
        `- **Pay Yourself First**: ${sav}% savings (= ${fmt(inc * sav / 100)}/month) should transfer automatically on payday before you see the money.\n` +
        `- **Track Every Dollar**: A budget doesn't work if you don't know where money is going. Track for a month before setting targets.\n` +
        `- **Zero-Based Budget**: A zero-based budget assigns every dollar to a category so income minus expenses = $0. Forces intentionality, even when overspending.`
      );
    }
    case "roi-calculator": {
      const init = params.initial ?? params.initialInvestment ?? 10000;
      const finalVal = params.final ?? params.finalValue ?? 12000;
      const yrs = params.years ?? 1;
      const cagr = init > 0 && yrs > 0 ? ((Math.pow(finalVal / init, 1 / yrs) - 1) * 100).toFixed(1) : "20";
      return (
        `- **ROI vs IRR**: ROI is total return; IRR accounts for timing. For a simple buy-and-hold, ROI = IRR; for periodic cash flows, IRR is more accurate.\n` +
        `- **Annualized Return**: This calculator annualizes your ROI to compare against other investments. ${yrs}-year total return of ${init > 0 ? ((finalVal - init) / init * 100).toFixed(1) : 'N/A'}% equals ${cagr}% annually.\n` +
        `- **Risk-Adjusted Return**: A 20% ROI on a guaranteed CD is better than a 20% ROI on volatile meme stock, even though the numbers are identical.\n` +
        `- **Time vs Money**: ROI doesn't capture opportunity cost. Six months of your time tied up in a 5% return might have been better in an index fund earning 7% with no effort.\n` +
        `- **Tax Impact**: Pre-tax ROI overstates actual wealth gained. After-tax ROI (factoring capital gains, ordinary income, etc.) is what actually stays in your pocket.`
      );
    }
    case "401k-calculator": {
      const inc = params.salary ?? 75000;
      const contrib = params.contributionPercent ?? 6;
      const match = params.employerMatch ?? 50;
      const annualMatch = Math.min(inc * 0.06 * match / 100, inc * match * 0.06 / 100);
      return (
        `- **Always Capture the Full Match**: Contributing at least enough to get your employer's full match is a 50-100% instant return with zero risk. Skipping it is leaving free money on the table.\n` +
        `- **2026 Contribution Limits**: $24,500/year for under-50 employees; $32,500 for 50+ (includes $7,500 catch-up).\n` +
        `- **Traditional vs Roth 401(k)**: Traditional is pre-tax now, taxed at withdrawal. Roth is post-tax now, tax-free at withdrawal. Choose based on your current vs expected future tax brackets.\n` +
        `- **Match Vesting**: Many employers use graded or cliff vesting. If you leave before fully vested, you forfeit unvested match dollars.\n` +
        `- **Investment Options**: Most 401(k) plans have limited fund choices. Target-date funds are a solid default if you don't want to actively manage allocations.`
      );
    }
    case "annuity-calculator": {
      const yrs = params.years ?? 20;
      return (
        `- **Immediate vs Deferred**: Immediate annuities start paying out now; deferred annuities accumulate first. Deferred is more common for retirement planning.\n` +
        `- **Fixed vs Variable**: Fixed annuities guarantee a payment; variable payments depend on investment performance. Fixed means predictable income at the cost of upside.\n` +
        `- **Inflation Protection**: Most annuities don't adjust for inflation. A $50,000/year annuity in 20 years will feel much smaller. Cost-of-living riders help.\n` +
        `- **Fees**: Annuity fees are notoriously opaque. Surrender charges, M&E charges, and rider fees can erode 1-3% of your balance annually.\n` +
        `- **Compare Against Bonds**: Single-premium immediate annuities compete with bond ladders as a source of guaranteed retirement income.`
      );
    }
    case "auto-loan": {
      const term = params.term ?? 60;
      const rate = params.rate ?? 6.5;
      return (
        `- **Loan Term Length**: ${term} months (${(term / 12).toFixed(1)} years). 60 months is standard; 72+ months stretch payments but balloon interest costs.\n` +
        `- **New vs Used Rates**: New car loans typically run 0.5-1.5% below used car loans because depreciation favors new vehicles as collateral.\n` +
        `- **Total Cost vs Monthly Payment**: A low monthly payment on a long-term auto loan is often more expensive than a higher payment over fewer months.\n` +
        `- **Refinancing**: Auto loan rates can be refinanced. If your credit improved since purchase, shopping for a new rate often saves money.\n` +
        `- **GAP Insurance**: For low down payments or long terms, GAP insurance covers the difference if your car is totaled and the insurance payout doesn't cover the loan.`
      );
    }
    case "car-loan": {
      const term = params.term ?? 60;
      return (
        `- **Term Length**: ${term}-month auto loans stretch payments but increase total interest. The shortest term you can afford is usually cheapest.\n` +
        `- **Dealer Financing vs Bank/Credit Union**: Dealer financing offers convenience but credit unions often beat dealer rates by 0.5-1.5%. Always compare.\n` +
        `- **Pre-Approval**: Getting pre-approved before visiting the dealer gives negotiating leverage and clarifies what you can actually afford.\n` +
        `- **Total Cost Disclosure**: Ask the dealer for the total amount you'd pay over the loan term, not just the monthly payment — they're often vastly different in magnitude.\n` +
        `- **Refinancing**: Auto loans are commonly refinanced. If your credit improved after purchase, you can usually lower the rate.`
      );
    }
    case "credit-card-payoff": {
      const balance = params.balance ?? 5000;
      const rate = params.rate ?? 22;
      return (
        `- **Minimum Payment Trap**: A ${fmt(balance)} balance at ${rate}% APR with minimum payments (~${fmt(balance * 0.02)}/month) takes 27+ years and costs more than the original balance in interest.\n` +
        `- **Avalanche vs Snowball**: Avalanche = pay highest APR first (saves most money). Snowball = pay smallest balance first (wins motivation). Both work; choose the one you'll stick with.\n` +
        `- **Balance Transfer Cards**: 0% APR balance transfer offers can save thousands. Watch for transfer fees (typically 3-5%).\n` +
        `- **Negotiating APR**: Calling your issuer and asking for a rate reduction works more often than expected, especially with good payment history.\n` +
        `- **Stop Using the Card**: Cut up the card, freeze the account, or remove it from auto-fill while paying down. New charges compound the debt.`
      );
    }
    case "debt-payoff": {
      const debts = params.debts ?? 15000;
      const rate = params.rate ?? 8;
      return (
        `- **Order Matters**: Pay highest-rate debt first (avalanche) or smallest-balance first (snowball). Same total, different psychological impact.\n` +
        `- **Personal Loans for Consolidation**: A ${rate}% debt consolidation loan at lower rates reduces interest. Only worth it if you stop accumulating new debt.\n` +
        `- **401(k) Loans**: Borrowing from your 401(k) avoids credit checks but means lost growth AND you pay the loan back with after-tax dollars. Last resort.\n` +
        `- **Bankruptcy**: Chapter 7 discharge most unsecured debt; Chapter 13 reorganizes with a 3-5 year repayment plan. Severe credit impact for 7-10 years.\n` +
        `- **Credit Score Recovery**: After payoff, credit utilization drops, score rebounds. Don't close old accounts — length of history matters.`
      );
    }
    case "roth-ira": {
      const inc = params.income ?? 75000;
      const yrs = params.years ?? 30;
      return (
        `- **Income Limits**: Roth IRA contributions phase out at ${fmt(153000)}-${fmt(168000)} MAGI for single filers in 2026; ${fmt(240000)}-${fmt(258000)} for married filing jointly. Above the limit, you can use a backdoor Roth.\n` +
        `- **Backdoor Roth**: High earners contribute to a non-deductible Traditional IRA, then convert to Roth. No income limit; watch the pro-rata rule if you have other pre-tax IRA money.\n` +
        `- **5-Year Rule**: Roth earnings can be withdrawn tax-free only after the account has been open for 5+ tax years AND you're 59½.\n` +
        `- **$10,000 First-Time Homebuyer Exception**: Up to $10,000 in Roth IRA contributions (not earnings) can be withdrawn without penalty for a first home purchase.\n` +
        `- **Tax Diversification**: Having money in both pre-tax (Traditional) and post-tax (Roth) accounts gives flexibility to manage taxable income in retirement.`
      );
    }
    case "savings-goal": {
      const goal = params.goalAmount ?? 20000;
      const yrs = params.years ?? 3;
      return (
        `- **High-Yield Savings**: A 4-5% APY HYSA earns significantly more than a regular savings account. ${fmt(goal)} grows meaningfully faster in an HYSA.\n` +
        `- **Time vs Risk Tolerance**: If your goal is ${yrs} years out, a HYSA is safe. Goals within 1 year should be in cash to avoid sequence risk.\n` +
        `- **Inflation Erosion**: At 3% annual inflation, ${fmt(goal)} today will need $${Math.round(goal * Math.pow(1.03, yrs)).toLocaleString()} in ${yrs} years to maintain the same purchasing power.\n` +
        `- **Automation**: Set the monthly contribution to transfer automatically on payday. Automation eliminates decision fatigue.\n` +
        `- **Goal Stacking**: Multiple smaller goals (emergency fund + vacation + down payment) often beat one mega-goal psychologically — small wins build momentum.`
      );
    }
    case "mortgage-affordability": {
      const inc = params.annualIncome ?? 80000;
      const dp = params.downPayment ?? 20000;
      return (
        `- **28/36 Rule**: Lenders prefer housing ≤ 28% of gross income (front-end) and total debt ≤ 36% (back-end). FHA allows up to 50% back-end.\n` +
        `- **Income Type**: Salaried income is most lender-friendly. Self-employed, commissioned, and variable-income need 2-year averages and reserve documentation.\n` +
        `- **Credit Score Impact**: A 720+ score gets the best conventional rates; below 620 usually requires FHA or VA with stricter DTI checks.\n` +
        `- **All-In Cost**: Property taxes (0.5-2.5% of home value annually), insurance, HOA fees, and PMI if down payment < 20% add 30-50% to base mortgage payment.\n` +
        `- **Stretch Budget Reality**: Most lenders approve more than is comfortable. Plan for the unexpected by stress-testing at +1-2% interest rates.`
      );
    }
    case "refinance-calculator": {
      const curRate = params.currentRate ?? 7;
      const newRate = params.newRate ?? 6;
      return (
        `- **Break-Even Period**: Compare total closing costs to monthly savings. If break-even is 24+ months and you won't keep the loan that long, refinancing doesn't pay.\n` +
        `- **Closing Costs**: Typical refi closing costs are 2-5% of the loan amount (${fmt((params.currentBalance ?? 250000) * 0.03)} on a $250k loan). Some lenders offer no-closing-cost refis as a higher rate.\n` +
        `- **Term Reset Trap**: Many people refinance to a new 30-year loan, restarting the amortization clock. If you're 8 years into a 30-year, consider a 22-year refi to keep payoff date similar.\n` +
        `- **Rate Improvement Threshold**: A meaningful refi is typically 0.5-0.75% rate drop. Smaller drops don't recover closing costs fast enough to justify.\n` +
        `- **Cash-Out Refi**: Pulling equity out increases loan balance and total interest. Often worse than a HELOC for short-term borrowing.`
      );
    }
    case "future-value": {
      const yrs = params.years ?? 20;
      return (
        `- **Compound Growth**: Future value grows exponentially with time. Doubling the time horizon more than doubles the future value due to compounding.\n` +
        `- **Real vs Nominal**: Future value calculations typically use nominal returns. Subtract inflation (3% historical) to get purchasing power in today's dollars.\n` +
        `- **Contribution Timing**: Contributions made at the beginning of each period grow slightly more than end-of-period contributions (annuity due vs ordinary annuity).\n` +
        `- **Variability**: Actual returns vary year to year. The calculator shows expected values, not guaranteed outcomes.\n` +
        `- **Tax Drag**: In a taxable account, taxes on dividends and capital gains reduce your actual future value by 1-2% annually. Tax-advantaged accounts avoid this.`
      );
    }
    case "present-value": {
      const yrs = params.years ?? 10;
      return (
        `- **Discount Rate Sensitivity**: A higher discount rate reduces present value. If you're more risk-averse, use a higher discount rate.\n` +
        `- **Inflation-Adjusted**: When future values are already inflation-adjusted, use a real (after-inflation) discount rate. With non-adjusted values, use nominal rates.\n` +
        `- **Cash Flow Streams**: For ongoing payments, sum the present value of each individual payment to get the total present value.\n` +
        `- **Lump Sum Equivalents**: Knowing the present value of future obligations helps decide whether to take a lump sum or annuity payout.\n` +
        `- **Investment Decisions**: Compare present value of expected returns against investment cost. If PV of returns > cost, the investment is theoretically attractive.`
      );
    }
    case "retirement-savings": {
      const yrs = (params.retirementAge ?? 65) - (params.currentAge ?? 30);
      return (
        `- **Time Horizon Matters Most**: ${yrs} years of compounding makes even modest contributions substantial. Starting at 30 vs 40 makes a 2-3× difference in final balance.\n` +
        `- **Income Replacement**: Plan for 70-80% of pre-retirement income to maintain lifestyle. Healthcare costs rise faster than general inflation — budget accordingly.\n` +
        `- **Withdrawal Order**: Generally, withdraw from taxable accounts first, then tax-deferred (401k/Traditional IRA), then Roth last for tax efficiency.\n` +
        `- **Required Minimum Distributions**: At 73 (75 by 2033), traditional retirement accounts force withdrawals. Failing to take RMDs triggers a 25% penalty.\n` +
        `- **Healthcare Reserve**: Estimate $300,000+ for healthcare costs in retirement (Fidelity estimate), excluding long-term care. HSA savings help if invested aggressively.`
      );
    }
    default:
      return (
        `- **Double-Check Inputs**: Garbage in, garbage out. Verify your numbers match the question you're trying to answer.\n` +
        `- **Consider Real-World Friction**: Most real costs include fees, taxes, and rounding effects the calculator may not capture exactly.\n` +
        `- **Compare Multiple Scenarios**: Try variations of inputs to see how sensitive the answer is — small changes might reveal robustness or fragility in your plan.\n` +
        `- **Compound Effect**: Small adjustments compound dramatically over years. Even modest changes to fees, contribution timing, or return assumptions add up.\n` +
        `- **Consult a Professional**: For major financial decisions (buying a home, retirement planning, tax optimization), a fee-only financial advisor provides personalized expertise.`
      );
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
