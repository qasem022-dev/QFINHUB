import type { VariantParams, CalculatorVariant } from "./types";

const BASE_URL = "https://www.qfinhub.com";

// ─── Slug Parsing ───────────────────────────────────────────────

export function parseVariantSlug(slug: string): {
  calculatorId: string;
  params: Record<string, string>;
} | null {
  // Patterns:
  // mortgage-200k-30yr-6.5pct
  // loan-50k-5yr-8pct
  // investment-10k-5yr
  // retirement-30-100k-7pct
  // tax-100k-single

  const parts = slug.split("-");

  // Determine calculator type from first segment
  const calcMap: Record<string, string> = {
    mortgage: "mortgage-calculator",
    loan: "loan-calculator",
    investment: "investment-return",
    retirement: "retirement-planning",
    compound: "compound-interest",
    tax: "tax-calculator",
    amortization: "amortization-schedule",
  };

  const calcKey: string = parts[0] ?? "";
  const calculatorId = calcMap[calcKey as keyof typeof calcMap];

  if (!calculatorId) return null;

  const params: Record<string, string> = {};
  const rest = parts.slice(1);

  switch (calcKey) {
    case "mortgage":
    case "loan": {
      let i = 0;
      while (i < rest.length) {
        const seg = rest[i]?.toLowerCase() ?? "";
        if (seg.endsWith("k")) {
          const num = parseInt(seg.replace("k", "")) * 1000;
          params[calcKey === "mortgage" ? "homePrice" : "loanAmount"] = String(num);
          i++;
        } else if (seg.endsWith("yr")) {
          params.term = String(parseInt(seg.replace("yr", "")));
          i++;
        } else if (seg.endsWith("pct")) {
          params.rate = String(parseFloat(seg.replace("pct", "")));
          i++;
        } else if (seg.endsWith("dp")) {
          params.downPct = String(parseInt(seg.replace("dp", "")));
          i++;
        } else {
          i++;
        }
      }
      break;
    }
    case "investment": {
      let i = 0;
      while (i < rest.length) {
        const seg = rest[i]?.toLowerCase() ?? "";
        if (seg.endsWith("k")) {
          if (!params.initial) {
            params.initial = String(parseInt(seg.replace("k", "")) * 1000);
          } else {
            params.finalVal = String(parseInt(seg.replace("k", "")) * 1000);
          }
          i++;
        } else if (seg.endsWith("yr")) {
          params.timeValue = String(parseInt(seg.replace("yr", "")));
          i++;
        } else if (seg.endsWith("pct")) {
          // Could be return rate - store as dividends percentage hint
          i++;
        } else {
          i++;
        }
      }
      if (!params.finalVal && params.initial) {
        // Default: assume ~80% gain
        params.finalVal = String(Math.round(parseInt(params.initial) * 1.8));
        params.dividends = String(Math.round(parseInt(params.initial) * 0.1));
      }
      break;
    }
    case "retirement": {
      let i = 0;
      while (i < rest.length) {
        const seg = rest[i]?.toLowerCase() ?? "";
        if (seg.endsWith("k")) {
          if (!params.currentSavings) {
            params.currentSavings = String(parseInt(seg.replace("k", "")) * 1000);
          } else {
            params.currentIncome = String(parseInt(seg.replace("k", "")) * 1000);
          }
          i++;
        } else if (seg.endsWith("yr")) {
          params.yearsToRetire = String(parseInt(seg.replace("yr", "")));
          i++;
        } else if (seg.endsWith("pct")) {
          params.expectedReturn = String(parseFloat(seg.replace("pct", "")));
          i++;
        } else if (/^\d+$/.test(seg)) {
          params.currentAge = seg;
          i++;
        } else {
          i++;
        }
      }
      break;
    }
    case "tax": {
      let i = 0;
      while (i < rest.length) {
        const seg = rest[i]?.toLowerCase() ?? "";
        if (seg.endsWith("k")) {
          params.income = String(parseInt(seg.replace("k", "")) * 1000);
          i++;
        } else if (seg === "single" || seg === "married-joint" || seg === "head-of-household" || seg === "married-separate") {
          params.filingStatus = seg;
          i++;
        } else {
          i++;
        }
      }
      break;
    }
    case "compound": {
      let i = 0;
      while (i < rest.length) {
        const seg = rest[i]?.toLowerCase() ?? "";
        if (seg.endsWith("k")) {
          if (!params.principal) {
            params.principal = String(parseInt(seg.replace("k", "")) * 1000);
          } else {
            params.monthlyAdd = String(parseInt(seg.replace("k", "")) * 1000);
          }
          i++;
        } else if (seg.endsWith("yr")) {
          params.years = String(parseInt(seg.replace("yr", "")));
          i++;
        } else if (seg.endsWith("pct")) {
          params.rate = String(parseFloat(seg.replace("pct", "")));
          i++;
        } else {
          i++;
        }
      }
      break;
    }
  }

  return { calculatorId, params };
}

// ─── Slug Generation ────────────────────────────────────────────

export function generateVariantSlug(
  params: VariantParams & { calculatorId: string },
): string {
  const { calculatorId, ...rest } = params;

  const calcPrefix = calculatorId.replace("-calculator", "").replace("-return", "").replace("-planning", "");

  const parts: string[] = [calcPrefix];

  switch (calculatorId) {
    case "mortgage-calculator": {
      const hp = rest.homePrice as number;
      if (hp) parts.push(formatAmountShort(hp));
      const term = rest.term as number;
      if (term) parts.push(`${term}yr`);
      const rate = rest.rate as number;
      if (rate) parts.push(`${rate}pct`.replace(".", "-"));
      break;
    }
    case "loan-calculator": {
      const la = rest.loanAmount as number;
      if (la) parts.push(formatAmountShort(la));
      const term = rest.term as number;
      if (term) parts.push(`${term}yr`);
      const rate = rest.rate as number;
      if (rate) parts.push(`${rate}pct`.replace(".", "-"));
      break;
    }
    case "investment-return": {
      const inv = rest.initial as number;
      if (inv) parts.push(formatAmountShort(inv));
      const yrs = rest.timeValue as number;
      if (yrs) parts.push(`${yrs}yr`);
      break;
    }
    case "retirement-planning": {
      const age = rest.currentAge as number;
      if (age) parts.push(String(age));
      const sv = rest.currentSavings as number;
      if (sv) parts.push(formatAmountShort(sv));
      const ret = rest.expectedReturn as number;
      if (ret) parts.push(`${ret}pct`.replace(".", "-"));
      break;
    }
    case "tax-calculator": {
      const inc = rest.income as number;
      if (inc) parts.push(formatAmountShort(inc));
      const fs = rest.filingStatus as string;
      if (fs) parts.push(fs);
      break;
    }
    case "compound-interest": {
      const p = rest.principal as number;
      if (p) parts.push(formatAmountShort(p));
      const yrs = rest.years as number;
      if (yrs) parts.push(`${yrs}yr`);
      const rate = rest.rate as number;
      if (rate) parts.push(`${rate}pct`.replace(".", "-"));
      break;
    }
  }

  return parts.join("-");
}

function formatAmountShort(val: number): string {
  if (val >= 1000000) return `${val / 1000000}M`;
  if (val >= 1000) return `${val / 1000}k`;
  return String(val);
}

// ─── Title & Meta Generation ────────────────────────────────────

export function generateMetaTitle(
  calculatorName: string,
  params: Record<string, any>,
): string {
  const parts: string[] = [];

  switch (calculatorName) {
    case "mortgage-calculator":
    case "Mortgage Calculator": {
      const hp = params.homePrice;
      const term = params.term;
      const rate = params.rate;
      if (hp) parts.push(`$${formatAmountWithCommas(hp)}`);
      parts.push("Mortgage:");
      if (rate) parts.push(`${rate}%`);
      if (term) parts.push(`${term}-Year`);
      parts.push("— Calculate YOUR Payment");
      return parts.filter(Boolean).join(" ");
    }
    case "loan-calculator":
    case "Loan Calculator": {
      const la = params.loanAmount;
      const term = params.term;
      const rate = params.rate;
      if (la) parts.push(`$${formatAmountWithCommas(la)}`);
      parts.push("Loan:");
      if (rate) parts.push(`${rate}% APR`);
      if (term) parts.push(`${term}-Year`);
      parts.push("— What's YOUR Payment?");
      return parts.filter(Boolean).join(" ");
    }
    case "investment-return":
    case "Investment Return": {
      const inv = params.initial;
      const yrs = params.timeValue;
      if (inv) parts.push(`$${formatAmountWithCommas(inv)}`);
      if (yrs) parts.push(`for ${yrs} Years:`);
      parts.push("See YOUR Investment Returns");
      return parts.filter(Boolean).join(" ") + " | ROI & CAGR";
    }
    case "retirement-planning":
    case "Retirement Planning": {
      const age = params.currentAge;
      const sv = params.currentSavings;
      if (age) parts.push(`Age ${age}`);
      if (sv) parts.push(`$${formatAmountWithCommas(sv)} Saved`);
      parts.push("Retirement Calculator");
      return parts.filter(Boolean).join(" ") + " | Plan Your Future";
    }
    case "tax-calculator":
    case "Tax Calculator": {
      const inc = params.income;
      const fs = params.filingStatus;
      if (inc) parts.push(`$${formatAmountWithCommas(inc)}`);
      if (fs) parts.push(formatFilingStatus(fs));
      parts.push("Tax Calculator");
      return parts.filter(Boolean).join(" ") + " | 2025 Income Tax";
    }
    case "compound-interest":
    case "Compound Interest": {
      const p = params.principal;
      const yrs = params.years;
      const rate = params.rate;
      if (p) parts.push(`$${formatAmountWithCommas(p)}`);
      if (rate) parts.push(`at ${rate}%`);
      if (yrs) parts.push(`for ${yrs} Years?`);
      parts.push("See YOUR Compound Growth");
      return parts.filter(Boolean).join(" ");
    }
    default:
      // Try to match by known calculator names
      if (calculatorName === "Mortgage Affordability") {
        const inc = params.income;
        const dp = params.downPayment;
        const rate = params.interestRate;
        if (inc) parts.push(`$${formatAmountWithCommas(inc)} Income`);
        if (dp) parts.push(`$${formatAmountWithCommas(dp)} Down`);
        if (rate) parts.push(`${rate}% Rate`);
        parts.push("Mortgage Affordability Calculator 2026");
        return parts.filter(Boolean).join(" ") + " — Free Home Price Estimate";
      }
      return `${calculatorName} - Free Online Calculator | QFINHUB`;
  }
}

export function generateMetaDescription(
  calculatorName: string,
  params: Record<string, any>,
): string {
  switch (calculatorName) {
    case "mortgage-calculator":
    case "Mortgage Calculator": {
      const hp = params.homePrice;
      const term = params.term;
      const rate = params.rate;
      const dp = params.downPct;
      let desc = `What's YOUR monthly payment for a`;
      if (hp) desc += ` $${formatAmountWithCommas(hp)}`;
      desc += ` home`;
      if (dp) desc += ` with ${dp}% down`;
      if (rate) desc += ` at ${rate}% interest`;
      if (term) desc += ` over ${term} years`;
      desc += `? Get a personalized calculation in 30 seconds. Includes amortization, taxes, and insurance. No signup required.`;
      return desc;
    }
    case "loan-calculator":
    case "Loan Calculator": {
      const la = params.loanAmount;
      const term = params.term;
      const rate = params.rate;
      let desc = `Find out YOUR exact monthly payment for a`;
      if (la) desc += ` $${formatAmountWithCommas(la)}`;
      desc += ` loan`;
      if (rate) desc += ` at ${rate}% APR`;
      if (term) desc += ` over ${term} years`;
      desc += `. See amortization schedule, total interest, and compare different terms. Instant results — 100% free, no signup.`;
      return desc;
    }
    case "investment-return":
    case "Investment Return": {
      const inv = params.initial;
      const yrs = params.timeValue;
      let desc = `Calculate YOUR exact investment return for a`;
      if (inv) desc += ` $${formatAmountWithCommas(inv)}`;
      desc += ` investment`;
      if (yrs) desc += ` over ${yrs} years`;
      desc += `. See CAGR, absolute return, annualized performance, and compare against benchmarks. Free investment return calculator — instant results.`;
      return desc;
    }
    case "retirement-planning":
    case "Retirement Planning": {
      const age = params.currentAge;
      const sv = params.currentSavings;
      const inc = params.currentIncome;
      let desc = `Plan your retirement`;
      if (age) desc += ` starting at age ${age}`;
      if (sv) desc += ` with $${formatAmountWithCommas(sv)} in savings`;
      if (inc) desc += ` and a $${formatAmountWithCommas(inc)} income`;
      desc += `. See projected retirement savings, income replacement ratio, and contribution strategies. Free retirement calculator.`;
      return desc;
    }
    case "tax-calculator":
    case "Tax Calculator": {
      const inc = params.income;
      const fs = params.filingStatus;
      let desc = `Calculate your 2025 income tax`;
      if (inc) desc += ` on $${formatAmountWithCommas(inc)}`;
      if (fs) desc += ` as a ${formatFilingStatus(fs)} filer`;
      desc += `. See your marginal tax rate, effective tax rate, tax brackets, and take-home pay. Free income tax calculator.`;
      return desc;
    }
    case "compound-interest":
    case "Compound Interest": {
      const p = params.principal;
      const rate = params.rate;
      const yrs = params.years;
      const add = params.monthlyAdd;
      let desc = `How much will`;
      if (p) desc += ` $${formatAmountWithCommas(p)}`;
      desc += ` grow`;
      if (rate) desc += ` at ${rate}% APY`;
      if (yrs) desc += ` over ${yrs} years`;
      if (add) desc += ` with $${formatAmountWithCommas(add)} monthly contributions`;
      desc += `? See YOUR personalized compound growth projection with year-by-year breakdown. Instant results — 100% free.`;
      return desc;
    }
    default:
      if (calculatorName === "Mortgage Affordability") {
        const inc = params.income;
        const dp = params.downPayment;
        const rate = params.interestRate;
        const debts = params.debts;
        let desc = `Free mortgage affordability calculator for`;
        if (inc) desc += ` $${formatAmountWithCommas(inc)} income`;
        if (dp) desc += ` with $${formatAmountWithCommas(dp)} down`;
        if (rate) desc += ` at ${rate}% interest`;
        if (debts) desc += ` and $${formatAmountWithCommas(debts)}/mo debts`;
        desc += `. See how much house you can afford instantly — no email, no signup.`;
        return desc;
      }
      return `Use our free ${calculatorName} to get instant, accurate results. See your exact numbers with detailed breakdown, formula, and expert tips. No signup needed — try it now.`;
  }
}

// ─── Content Generation ─────────────────────────────────────────

export function generateIntroParagraph(
  calculatorName: string,
  params: Record<string, any>,
): string {
  const locale = "en-US";
  const fmt = (n: number) =>
    new Intl.NumberFormat(locale, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  switch (calculatorName) {
    case "mortgage-calculator":
    case "Mortgage Calculator": {
      const hp = params.homePrice;
      const term = params.term;
      const rate = params.rate;
      const dp = params.downPct ?? 20;
      let para = `Are you looking to buy a home`;
      if (hp) para += ` priced at ${fmt(hp)}`;
      para += `? Our mortgage calculator helps you understand exactly what your monthly payments would look like`;
      if (rate) para += ` with today's interest rates around ${rate}%`;
      if (term) para += ` over a ${term}-year loan term`;
      if (dp) para += ` and a ${dp}% down payment`;
      para += `. Whether you're a first-time homebuyer or looking to refinance, this tool provides a complete picture of your housing costs, including principal, interest, taxes, insurance, and PMI if applicable. Simply adjust the inputs to match your specific scenario and see instant results.`;
      return para;
    }
    case "loan-calculator":
    case "Loan Calculator": {
      const la = params.loanAmount;
      const rate = params.rate;
      const term = params.term;
      let para = `Need to borrow money`;
      if (la) para += ` — specifically ${fmt(la)}`;
      para += `? Our loan calculator shows you the true cost of borrowing`;
      if (rate) para += ` at a ${rate}% APR`;
      if (term) para += ` over a ${term}-year repayment period`;
      para += `. Get a detailed breakdown of your monthly payments, total interest charges, and a complete amortization schedule. This tool works for personal loans, auto loans, debt consolidation, or any fixed-rate loan. Know exactly what you're signing up for before you borrow.`;
      return para;
    }
    case "investment-return":
    case "Investment Return": {
      const inv = params.initial;
      const finalVal = params.finalVal;
      const yrs = params.timeValue;
      let para = `How well has your investment performed`;
      if (inv) para += ` of ${fmt(inv)}`;
      if (finalVal) para += ` that's now worth ${fmt(finalVal)}`;
      if (yrs) para += ` over the past ${yrs} years`;
      para += `? Our investment return calculator computes the total return, absolute percentage gain, and Compound Annual Growth Rate (CAGR) for any investment. Whether you're evaluating a stock, real estate, or a business venture, this tool gives you the key metrics you need to assess performance and make informed decisions about your portfolio.`;
      return para;
    }
    case "retirement-planning":
    case "Retirement Planning": {
      const age = params.currentAge;
      const sv = params.currentSavings;
      const inc = params.currentIncome;
      let para = `Planning for retirement is one of the most important financial decisions you'll ever make`;
      if (age) para += `. If you're ${age} years old`;
      if (sv) para += ` with ${fmt(sv)} already saved`;
      if (inc) para += ` and an annual income of ${fmt(inc)}`;
      para += `, our retirement calculator can show you exactly what your future could look like. It projects your savings growth, estimates your retirement income using the 4% withdrawal rule, and calculates your income replacement ratio. See how different contribution amounts and return rates affect your retirement readiness.`;
      return para;
    }
    case "tax-calculator":
    case "Tax Calculator": {
      const inc = params.income;
      const fs = params.filingStatus;
      let para = `Wondering how much you'll owe in taxes this year`;
      if (inc) para += ` on your income of ${fmt(inc)}`;
      if (fs) para += ` as a ${formatFilingStatus(fs)} filer`;
      para += `? Our tax calculator uses the latest 2025 federal income tax brackets to estimate your tax liability. See your marginal tax rate, effective tax rate, total tax bill, and after-tax income. Whether you're doing tax planning, estimating quarterly payments, or just curious where you fall in the tax brackets, this tool gives you clarity.`;
      return para;
    }
    case "compound-interest":
    case "Compound Interest": {
      const p = params.principal;
      const rate = params.rate;
      const yrs = params.years;
      const add = params.monthlyAdd;
      let para = `See the incredible power of compound interest`;
      if (p) para += ` starting with ${fmt(p)}`;
      if (add) para += ` and adding ${fmt(add)} monthly`;
      para += `, earning ${rate || "a"}% APY`;
      if (yrs) para += ` over ${yrs} years`;
      para += `. Our compound interest calculator shows you exactly how your money grows over time, with detailed year-by-year projections. Whether you're saving for retirement, a child's education, or building wealth, understanding compound interest is the key to achieving your financial goals.`;
      return para;
    }
    default:
      return `Use our ${calculatorName} to analyze your financial scenario. Enter your numbers and get instant, accurate results.`;
  }
}

export function generateH1(
  calculatorName: string,
  params: Record<string, any>,
): string {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);

  switch (calculatorName) {
    case "mortgage-calculator":
    case "Mortgage Calculator": {
      const hp = params.homePrice;
      const term = params.term;
      const rate = params.rate;
      let h1 = `Mortgage Payment Calculator`;
      if (hp) h1 += ` for ${fmt(hp)}`;
      if (rate) h1 += ` at ${rate}%`;
      return h1;
    }
    case "loan-calculator":
    case "Loan Calculator": {
      const la = params.loanAmount;
      const term = params.term;
      let h1 = `Loan Payment Calculator`;
      if (la) h1 += ` — ${fmt(la)}`;
      if (term) h1 += ` for ${term} Years`;
      return h1;
    }
    case "investment-return":
    case "Investment Return": {
      const inv = params.initial;
      const yrs = params.timeValue;
      let h1 = `Investment Return Calculator`;
      if (inv) h1 += ` — ${fmt(inv)}`;
      if (yrs) h1 += ` Over ${yrs} Years`;
      return h1;
    }
    case "retirement-planning":
    case "Retirement Planning": {
      const age = params.currentAge;
      const sv = params.currentSavings;
      let h1 = `Retirement Calculator`;
      if (age) h1 += ` for Age ${age}`;
      if (sv) h1 += ` with ${fmt(sv)} Saved`;
      return h1;
    }
    case "tax-calculator":
    case "Tax Calculator": {
      const inc = params.income;
      const fs = params.filingStatus;
      let h1 = `Tax Calculator`;
      if (inc) h1 += ` for ${fmt(inc)}`;
      if (fs) h1 += ` (${formatFilingStatus(fs)})`;
      return h1;
    }
    case "compound-interest":
    case "Compound Interest": {
      const p = params.principal;
      const rate = params.rate;
      let h1 = `Compound Interest Calculator`;
      if (p) h1 += ` — ${fmt(p)}`;
      if (rate) h1 += ` at ${rate}%`;
      return h1;
    }
    default:
      return `${calculatorName} — Free Online Tool`;
  }
}

// ─── FAQ Generation ─────────────────────────────────────────────

export function generateFAQs(
  calculatorName: string,
  params: Record<string, any>,
): { question: string; answer: string }[] {
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
  const fmtDollar = (n: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

  switch (calculatorName) {
    case "mortgage-calculator":
    case "Mortgage Calculator": {
      const hp = params.homePrice;
      const rate = params.rate;
      const term = params.term;
      const dp = params.downPct ?? 20;
      return [
        {
          question: `What is the monthly payment on a ${fmt(hp || 300000)} mortgage?`,
          answer: `The monthly payment depends on your interest rate and loan term. For a ${fmt(hp || 300000)} home with ${dp}% down (${fmt((hp || 300000) * dp / 100)}), the loan amount would be ${fmt((hp || 300000) * (1 - dp / 100))}. At a ${rate || 6.5}% interest rate over ${term || 30} years, your monthly principal and interest payment will be calculated by the tool above. This doesn't include taxes and insurance, which typically add 20-35% to your total monthly payment. Use the calculator above for a precise estimate adjusted to your specific situation.`,
        },
        {
          question: `How much down payment do I need for a ${fmt(hp || 300000)} house?`,
          answer: `A 20% down payment (${fmt((hp || 300000) * 0.2)}) is ideal because it eliminates the need for Private Mortgage Insurance (PMI). However, many loan programs allow as little as 3-5% down. FHA loans require just 3.5% down, and VA loans may require no down payment at all. With less than 20% down, you'll pay PMI until you reach 20% equity.`,
        },
        {
          question: `How does the interest rate affect my ${fmt(hp || 300000)} mortgage payment?`,
          answer: `The interest rate significantly impacts your monthly payment and total interest cost. For a ${fmt(hp || 300000)} home with ${dp}% down, every 0.5% change in rate can add or save thousands over the life of the loan. At ${rate || 6.5}%, you'll pay significantly more in interest over ${term || 30} years than you would at a lower rate. Use our calculator to compare different rate scenarios.`,
        },
        {
          question: `Should I choose a 15-year or 30-year mortgage for a ${fmt(hp || 300000)} home?`,
          answer: `A 15-year mortgage typically has a lower interest rate (often 0.5-1% less than 30-year rates) but much higher monthly payments. For a ${fmt(hp || 300000)} home, the 15-year term saves tens of thousands in total interest but requires a higher monthly commitment. A 30-year term offers lower payments and more flexibility but costs more in total interest. Choose based on your budget and financial goals.`,
        },
        {
          question: `What's included in my total monthly mortgage payment?`,
          answer: `Your total monthly mortgage payment (often called PITI) typically includes: Principal (paying down the loan balance), Interest (the cost of borrowing), Taxes (property taxes), and Insurance (homeowners insurance). If your down payment is less than 20%, you'll also pay Private Mortgage Insurance (PMI). Our calculator breaks down each component so you know exactly where your money is going.`,
        },
      ];
    }
    case "loan-calculator":
    case "Loan Calculator": {
      const la = params.loanAmount;
      const rate = params.rate;
      const term = params.term;
      return [
        {
          question: `What's the monthly payment on a ${fmt(la || 25000)} loan at ${rate || 7}%?`,
          answer: `For a ${fmt(la || 25000)} loan at ${rate || 7}% APR over ${term || 5} years, your monthly payment is calculated by the tool above. The total cost of the loan depends on the interest rate and term length — longer terms mean lower payments but more total interest. Use the calculator above to see the exact monthly payment and full amortization schedule for your specific loan amount and rate.`,
        },
        {
          question: `How can I lower my monthly loan payment?`,
          answer: `You can lower your monthly payment by: extending the loan term (but this increases total interest), negotiating a lower interest rate, making a larger down payment, improving your credit score before applying, or shopping around with multiple lenders. Even a 1% reduction in APR can save hundreds per year.`,
        },
        {
          question: `What's the difference between APR and interest rate?`,
          answer: `The interest rate is the cost of borrowing the principal, while APR (Annual Percentage Rate) includes the interest rate plus any fees or other charges associated with the loan. APR gives you a more complete picture of the true cost of borrowing. Our calculator uses the interest rate for monthly payment calculations.`,
        },
        {
          question: `How does the loan term affect my total cost?`,
          answer: `A shorter loan term means higher monthly payments but significantly less total interest. A longer term lowers your monthly payment but increases the total interest paid over the life of the loan. For example, a ${fmt(la || 25000)} loan at ${rate || 7}% over 3 years costs less in total interest than the same loan over 7 years.`,
        },
        {
          question: `What types of loans can I calculate with this tool?`,
          answer: `This loan calculator works for virtually any fixed-rate loan: personal loans, auto loans, student loans, debt consolidation loans, home improvement loans, business loans, and more. Simply enter your loan amount, interest rate, and term to see your monthly payment and total cost.`,
        },
      ];
    }
    case "retirement-planning":
    case "Retirement Planning": {
      const age = params.currentAge;
      const sv = params.currentSavings;
      const inc = params.currentIncome;
      return [
        {
          question: `How much do I need to save for retirement starting at age ${age || 30}?`,
          answer: `The amount you need depends on your desired retirement lifestyle, expected returns, and retirement age. A general rule of thumb is to have 10-12 times your final salary saved by retirement age ${parseInt(String(age || 30)) + parseInt(String(params.yearsToRetire || 35))}. With ${fmt(sv || 50000)} currently saved and contributing regularly, our calculator shows your projected savings and whether you're on track.`,
        },
        {
          question: `What is the 4% rule in retirement planning?`,
          answer: `The 4% rule suggests that you can withdraw 4% of your retirement savings in the first year of retirement, and adjust that amount for inflation each subsequent year, with a high probability that your savings will last 30 years. For example, if you have ${fmt(1000000)} saved, you could withdraw ${fmt(40000)} in your first year of retirement.`,
        },
        {
          question: `How much should I contribute to retirement each month?`,
          answer: `Financial experts typically recommend saving 10-15% of your gross income for retirement. If you earn ${fmt(inc || 75000)} per year, that means contributing ${fmt((inc || 75000) * 0.1 / 12)} to ${fmt((inc || 75000) * 0.15 / 12)} per month. If you started later or have less saved, you may need to save a higher percentage. Use our calculator to find the right contribution amount for your goals.`,
        },
        {
          question: `What return rate should I expect on my retirement savings?`,
          answer: `A conservative estimate is 4-5% annual return, a moderate estimate is 6-7%, and an aggressive estimate is 8-10%. For retirement planning, most experts recommend using 6-7% as a reasonable long-term average for a balanced portfolio of stocks and bonds. Our calculator lets you adjust this rate to see how different return assumptions affect your retirement outlook.`,
        },
        {
          question: `Can I retire early with ${fmt(sv || 100000)} in savings?`,
          answer: `Early retirement requires more savings because you have fewer years to contribute and more years to withdraw. ${fmt(sv || 100000)} is a great start, but early retirement typically requires at least ${fmt(1000000)} or more depending on your lifestyle. Use our retirement calculator to see how increasing your contributions and choosing the right investment strategy can accelerate your retirement timeline.`,
        },
      ];
    }
    case "tax-calculator":
    case "Tax Calculator": {
      const inc = params.income;
      const fs = params.filingStatus;
      return [
        {
          question: `How much tax will I pay on ${fmt(inc || 80000)} as a ${formatFilingStatus(fs || "single")} filer?`,
          answer: `For ${fmt(inc || 80000)} in taxable income as a ${formatFilingStatus(fs || "single")} filer in 2025, your tax is calculated using marginal tax brackets. You don't pay the highest rate on all your income — only on the portion that falls within each bracket. The actual effective tax rate is typically lower than your marginal rate. Use our calculator above for an accurate estimate.`,
        },
        {
          question: `What's the difference between marginal and effective tax rate?`,
          answer: `Your marginal tax rate is the rate you pay on your last dollar of income — it determines the tax on any additional income you earn. Your effective tax rate is the average rate you pay on your total income (total tax divided by total income). For most people, the effective rate is much lower than the marginal rate. For example, someone in the 22% bracket might have an effective rate of only 12-15%.`,
        },
        {
          question: `How do tax brackets work for ${formatFilingStatus(fs || "single")} filers?`,
          answer: `Tax brackets are progressive — you pay different rates on different portions of your income. For 2025, the rates are 10%, 12%, 22%, 24%, 32%, 35%, and 37%. Each bracket applies only to income within that range. For example, a single filer earning ${fmt(inc || 100000)} pays 10% on the first $11,925, 12% on income from $11,926 to $48,475, and 22% on income from $48,476 to $103,350.`,
        },
        {
          question: `What deductions can reduce my taxable income?`,
          answer: `Common deductions include the standard deduction (${formatDeduction(fs || "single")} for ${formatFilingStatus(fs || "single")} filers in 2025), student loan interest, mortgage interest, charitable donations, medical expenses, HSA contributions, and retirement account contributions. You can choose between taking the standard deduction or itemizing your deductions — whichever gives you the larger reduction.`,
        },
        {
          question: `How does the standard deduction affect my taxes?`,
          answer: `The standard deduction reduces your taxable income before tax brackets are applied. For 2025, the standard deduction is ${formatDeduction(fs || "single")} for ${formatFilingStatus(fs || "single")} filers. If you earn ${fmt(inc || 80000)}, your taxable income is reduced to ${fmt(Math.max(0, (inc || 80000) - getStandardDeduction(fs || "single")))} after the standard deduction, meaning you only pay tax on that reduced amount.`,
        },
      ];
    }
    case "compound-interest":
    case "Compound Interest": {
      const p = params.principal;
      const rate = params.rate;
      const yrs = params.years;
      const add = params.monthlyAdd;
      return [
        {
          question: `How much will ${fmt(p || 10000)} grow in ${yrs || 10} years at ${rate || 7}% compound interest?`,
          answer: `With ${fmt(p || 10000)} at ${rate || 7}% APY compounded monthly${add ? ` with ${fmt(add)} added monthly` : ""}${yrs ? ` over ${yrs} years` : ""}, your investment would grow significantly thanks to compound interest. The exact amount depends on the compounding frequency — more frequent compounding means more growth. Use our compound interest calculator to see the exact numbers and a year-by-year breakdown.`,
        },
        {
          question: `What's the difference between simple and compound interest?`,
          answer: `Simple interest is calculated only on the principal amount. Compound interest is calculated on the principal plus any accumulated interest — meaning you earn "interest on interest." This compounding effect makes a dramatic difference over time. For example, ${fmt(p || 10000)} at ${rate || 7}% over ${yrs || 30} years grows much more with compound interest than with simple interest.`,
        },
        {
          question: `How does compounding frequency affect my returns?`,
          answer: `More frequent compounding leads to higher returns. Daily compounding yields slightly more than monthly, which yields more than quarterly or annual compounding. The difference becomes more significant over longer periods and with larger balances. Most savings accounts compound daily, while CDs might compound monthly or quarterly.`,
        },
        {
          question: `What is the Rule of 72?`,
          answer: `The Rule of 72 is a quick way to estimate how long it takes to double your money. Divide 72 by your annual interest rate. For example, at ${rate || 7}%, it would take approximately ${Math.round(72 / (rate || 7))} years to double your money. So ${fmt(p || 10000)} would grow to approximately ${fmt((p || 10000) * 2)} in about ${Math.round(72 / (rate || 7))} years without additional contributions.`,
        },
        {
          question: `How important are regular contributions to compound growth?`,
          answer: `Regular contributions dramatically accelerate compound growth. ${add ? `Adding ${fmt(add)} monthly to ${fmt(p || 10000)} at ${rate || 7}% over ${yrs || 10} years can increase your final balance substantially compared to a one-time investment alone.` : `Even small regular contributions make a huge difference over time due to compound interest. The earlier you start contributing regularly, the more time your money has to grow.`}`,
        },
      ];
    }
    default:
      return [
        { question: "How does this calculator work?", answer: "Simply enter your financial details and the calculator will provide instant results based on standard financial formulas." },
        { question: "Is this calculator free to use?", answer: "Yes, all calculators on QFINHUB are completely free to use with no registration required." },
        { question: "Can I share my calculation results?", answer: "Yes, you can share your results using the share button. The URL contains your input values so others can see the same calculation." },
      ];
  }
}

// ─── Related Links Generation ───────────────────────────────────

export function generateRelatedLinks(
  calculatorName: string,
  params: Record<string, any>,
  allVariants: CalculatorVariant[],
): { href: string; label: string }[] {
  const sameCalcVariants = allVariants.filter(
    (v) => v.params.calculatorId === params.calculatorId && v.slug !== slugFromParams(params),
  );

  const links: { href: string; label: string }[] = [];

  switch (calculatorName) {
    case "mortgage-calculator":
    case "Mortgage Calculator": {
      const hp = params.homePrice;
      const term = params.term;
      const rate = params.rate;
      // Find related: same price different term, same term different price, etc.
      const samePrice = sameCalcVariants.filter(
        (v) => v.params.homePrice === hp && v.slug !== slugFromParams(params),
      );
      const sameTerm = sameCalcVariants.filter(
        (v) => v.params.term === term && v.params.homePrice !== hp,
      );
      const diffRate = sameCalcVariants.filter(
        (v) => v.params.rate !== rate && v.params.homePrice !== hp,
      );

      const pick = (arr: typeof sameCalcVariants, count: number) =>
        arr.slice(0, count);

      const selected = [
        ...pick(samePrice, 1),
        ...pick(sameTerm, 2),
        ...pick(diffRate, 2),
      ].slice(0, 5);

      return selected.map((v) => ({
        href: `/tools/${v.slug}`,
        label: v.title || v.slug.replace(/-/g, " "),
      }));
    }
    case "loan-calculator":
    case "Loan Calculator": {
      const la = params.loanAmount;
      const term = params.term;
      const sameAmount = sameCalcVariants.filter(
        (v) => v.params.loanAmount === la && v.params.term !== term,
      );
      const sameTerm = sameCalcVariants.filter(
        (v) => v.params.term === term && v.params.loanAmount !== la,
      );
      const selected = [...sameAmount.slice(0, 2), ...sameTerm.slice(0, 3)].slice(0, 5);
      return selected.map((v) => ({
        href: `/tools/${v.slug}`,
        label: v.title || v.slug.replace(/-/g, " "),
      }));
    }
    default: {
      const selected = sameCalcVariants.slice(0, 5);
      return selected.map((v) => ({
        href: `/tools/${v.slug}`,
        label: v.title || v.slug.replace(/-/g, " "),
      }));
    }
  }
}

// ─── Helpers ────────────────────────────────────────────────────

function formatAmountWithCommas(val: number): string {
  return new Intl.NumberFormat("en-US").format(val);
}

function formatFilingStatus(status: string): string {
  const map: Record<string, string> = {
    single: "Single",
    "married-joint": "Married Filing Jointly",
    "married-separate": "Married Filing Separately",
    "head-of-household": "Head of Household",
    "qualifying-widow": "Qualifying Surviving Spouse",
  };
  return map[status] || status;
}

function formatDeduction(status: string): string {
  const map: Record<string, string> = {
    single: "$14,600",
    "married-joint": "$29,200",
    "married-separate": "$14,600",
    "head-of-household": "$21,900",
    "qualifying-widow": "$29,200",
  };
  return map[status] || "$14,600";
}

function getStandardDeduction(status: string): number {
  const map: Record<string, number> = {
    single: 14600,
    "married-joint": 29200,
    "married-separate": 14600,
    "head-of-household": 21900,
    "qualifying-widow": 29200,
  };
  return map[status] || 14600;
}

function slugFromParams(params: Record<string, any>): string {
  return generateVariantSlug(params as any);
}
