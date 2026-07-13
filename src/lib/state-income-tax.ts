// State income tax calculator data + utilities.
//
// This lives outside of any route folder so it can be reused by the
// `/tools/[slug]` dynamic route handler. The original folder
// `/tools/[state]-income-tax-calculator/` was removed because Next.js App
// Router does NOT honor literal text after a dynamic segment in the same
// folder name — it registered the route as a literal, unreachable path.
// State tax URLs are now handled inside `/tools/[slug]` by checking for
// the `-income-tax-calculator` suffix.

export type TaxBracket = { min: number; max: number; rate: number };

export type StateTaxData = {
  name: string;
  description: string;
  intro: string;
  brackets: TaxBracket[];
  flatRate?: number;
  faqs: { question: string; answer: string }[];
};

export const STATE_INCOME_TAX_DATA: Record<string, StateTaxData> = {
  california: {
    name: "California",
    description:
      "California has one of the most progressive income tax systems in the US, with top marginal rates reaching 13.3% on earnings over $1 million. The state offers limited deductions and the highest top rate in the nation.",
    intro: `California's income tax system is among the most progressive in the nation, with 2026 marginal rates ranging from 1% at the bottom to 13.3% at the very top. If you're earning $70,000 a year as a single filer, you're sitting in the 9.3% bracket — not the 13.3% top rate you may have heard about. The Golden State taxes retirement income from Social Security partially, while pensions receive mixed treatment depending on your plan type. One thing worth knowing: California doesn't conform to all federal deductions, so your itemized deductions may be worth less here than in other states. Franchise Tax Board estimates indicate roughly 40% of filers owe zero state income tax due to the generous standard deduction. For high earners, the Mental Health Services Tax adds an additional 1% surtax on income above $1 million.`,
    brackets: [
      { min: 0, max: 10412, rate: 0.01 },
      { min: 10412, max: 24684, rate: 0.02 },
      { min: 24684, max: 38959, rate: 0.04 },
      { min: 38959, max: 54081, rate: 0.06 },
      { min: 54081, max: 68350, rate: 0.08 },
      { min: 68350, max: 349137, rate: 0.093 },
      { min: 349137, max: 418961, rate: 0.103 },
      { min: 418961, max: 698271, rate: 0.113 },
      { min: 698271, max: 1000000, rate: 0.123 },
      { min: 1000000, max: Infinity, rate: 0.133 },
    ],
    faqs: [
      {
        question: "What is California's top income tax rate in 2026?",
        answer: "California's top marginal income tax rate is 13.3%, which applies to taxable income exceeding $1 million for single filers. This is the highest top marginal rate of any state in the US.",
      },
      {
        question: "Does California tax Social Security benefits?",
        answer: "California partially taxes Social Security benefits. Depending on your total income, a portion of your Social Security may be included in your California taxable income, though many retirees end up with little or no additional tax liability from the state.",
      },
      {
        question: "Are California state income taxes deductible on my federal return?",
        answer: "Yes, state and local income taxes (including California) are deductible on your federal return as an itemized deduction, subject to the $10,000 SALT cap. However, California doesn't conform to all federal deductions, so consult a tax professional for your specific situation.",
      },
    ],
  },
  "new-york": {
    name: "New York",
    description:
      "New York has a progressive income tax with rates up to 6.85% for most filers, and an additional MCTD surcharge for NYC metro residents. The state offers generous deductions and a relatively high standard deduction.",
    intro: `New York's income tax runs on a progressive bracket system, with 2026 rates climbing from 4% at the lowest end to a top rate of 6.85% for income above $1.5 million for single filers. Here's something many people miss: if you live in New York City or the MTA commuting zone, you're also subject to the MCTD (Metropolitan Commuter Transportation Mobility Tax) surcharge, which adds up to 1.5% on top of your state rate. For a single filer earning $85,000, you're likely in the 5.85% bracket — not the headline 6.85%. New York allows a rich set of deductions, including the subtraction of contributions to NY-specific retirement accounts. The state's standard deduction for 2026 is $10,300 for single filers, which means many lower-to-middle earners pay little to no state income tax. One quirk: New York taxes virtual currency as property, so if you've been trading crypto, expect those gains to show up on your state return.`,
    brackets: [
      { min: 0, max: 8500, rate: 0.04 },
      { min: 8500, max: 11700, rate: 0.045 },
      { min: 11700, max: 13900, rate: 0.0525 },
      { min: 13900, max: 80650, rate: 0.055 },
      { min: 80650, max: 215400, rate: 0.06 },
      { min: 215400, max: 1077550, rate: 0.0685 },
      { min: 1077550, max: 5000000, rate: 0.0965 },
      { min: 5000000, max: 25000000, rate: 0.103 },
      { min: 25000000, max: Infinity, rate: 0.109 },
    ],
    faqs: [
      {
        question: "What is New York's top income tax rate in 2026?",
        answer: "New York's top marginal income tax rate is 10.9%, which applies to taxable income above $25 million for single filers. Most high earners sit in the 6.85% bracket, which applies to income between $1,077,550 and $5 million.",
      },
      {
        question: "Do I need to pay the MCTD tax if I live outside NYC?",
        answer: "The MCTD (Metropolitan Commuter Transportation Mobility Tax) applies only to residents of New York City and the surrounding MTA service region (parts of Long Island, Westchester, and the Hudson Valley). If you live outside this zone, you generally don't owe the MCTD surcharge.",
      },
      {
        question: "Can I deduct New York state income taxes from my federal return?",
        answer: "Yes, New York state income taxes are deductible as a state and local tax (SALT) deduction on your federal return, subject to the $10,000 annual cap. This includes both state and local income taxes combined.",
      },
    ],
  },
  texas: {
    name: "Texas",
    description:
      "Texas has no state income tax, making it one of the most tax-friendly states for high earners. The state relies on property taxes and sales taxes for revenue. There is no estate tax or inheritance tax in Texas.",
    intro: `Texas takes a refreshingly simple approach to income tax: there isn't one. The Lone Star State has zero state income tax, which means every dollar you earn above the federal level stays in your pocket — no brackets, no forms beyond your federal filing, and no guessing about where you fall. This is one of the primary reasons Texas consistently ranks as a top destination for professionals and businesses relocating from high-tax states. The trade-off is that Texas funds its government through other means: property taxes are among the nation's highest, and sales taxes add up on every purchase. For a Texan earning $120,000, the absence of a state income tax means roughly $6,000–$7,200 in annual savings compared to a Californian or New Yorker in the same bracket. Texas also has no estate tax or inheritance tax, making it particularly attractive for wealth preservation. If you're moving from a high-tax state, you won't miss the income tax filings, but do budget carefully for property taxes if you plan to own real estate.`,
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    flatRate: 0,
    faqs: [
      {
        question: "Does Texas have a state income tax?",
        answer: "No, Texas has no state income tax. There is no personal income tax, no corporate income tax at the state level, and no estate or inheritance tax. You only need to file a federal tax return.",
      },
      {
        question: "How does Texas fund its government without income tax?",
        answer: "Texas relies primarily on property taxes, sales taxes, and fees to fund state and local government services. Property taxes in Texas are among the highest in the nation, which is the trade-off for having no income tax.",
      },
      {
        question: "Are Texas property taxes deductible on my federal return?",
        answer: "Yes, Texas property taxes are deductible on your federal return as an itemized deduction, subject to the $10,000 SALT cap (which combines state and local income, sales, and property taxes).",
      },
    ],
  },
  florida: {
    name: "Florida",
    description:
      "Florida has no state income tax, making it attractive for retirees, investors, and remote workers. The state funds services through sales tax and tourism-related fees.",
    intro: `Florida is one of nine states with no state income tax, which makes it especially popular among retirees, remote workers, and high earners looking to keep more of what they make. There are no brackets to climb, no state-level capital gains tax, and no state-level estate tax. The trade-off is the same as Texas: Florida relies on a 6% statewide sales tax (plus local add-ons that can push the combined rate to 7.5%–8.5%) and property taxes that, while not the highest in the US, are still substantial in desirable counties like Miami-Dade and Collier. For someone earning $150,000 a year, the lack of state income tax means keeping roughly $9,000 per year more than they would in California. Florida also has a homestead exemption that can shave up to $50,000 off your primary residence's assessed value for property tax purposes. One quirk worth knowing: if you earn income from a business physically located in another state, you may still owe that state's income tax on that portion — Florida's "no income tax" promise only applies to income sourced here.`,
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    flatRate: 0,
    faqs: [
      {
        question: "Does Florida have a state income tax?",
        answer: "No, Florida has no state personal income tax. There is no tax on wages, salaries, or investment income at the state level. You only need to file a federal tax return.",
      },
      {
        question: "Do retirees pay Florida state income tax on retirement income?",
        answer: "Florida does not tax retirement income at the state level — Social Security benefits, pensions, IRA withdrawals, and 401(k) distributions are all state-tax-free. This is one of the main reasons Florida is a top retirement destination.",
      },
      {
        question: "How does Florida make up for not having an income tax?",
        answer: "Florida relies on a 6% statewide sales tax (with local surcharges that can push the combined rate up to 8.5% in some counties), property taxes, and tourism-related revenue. There is no state-level property tax, but counties and municipalities levy their own.",
      },
    ],
  },
  illinois: {
    name: "Illinois",
    description:
      "Illinois has a flat 4.95% state income tax rate for individuals. The state is one of a handful that uses a flat-rate structure rather than a progressive bracket system.",
    intro: `Illinois stands out for using a flat-rate income tax rather than the progressive brackets most states use. As of 2026, the Illinois individual income tax rate is a flat 4.95% applied to all taxable income, regardless of how much you earn. For a single filer making $80,000, that works out to roughly $3,960 in state tax — significantly less than California or New York would charge at the same income level. Illinois exempts retirement income (Social Security, pensions, and IRA/401(k) withdrawals) from state income tax, which is a major win for retirees. The state also has a property tax credit that can offset some of Illinois's notoriously high property taxes. One thing to watch: Cook County (which includes Chicago) adds a small surtax on certain transactions, and some municipalities levy their own local income taxes on top of the state rate. If you're self-employed or run a pass-through business, Illinois's pass-through entity tax election can let you bypass the federal SALT cap by paying state tax at the entity level instead.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.0495 }],
    flatRate: 0.0495,
    faqs: [
      {
        question: "What is Illinois's income tax rate in 2026?",
        answer: "Illinois uses a flat income tax rate of 4.95% for individuals. This applies to all taxable income regardless of filing status or income level — there are no progressive brackets.",
      },
      {
        question: "Does Illinois tax retirement income?",
        answer: "No, Illinois does not tax most retirement income. Social Security benefits, pension income, and qualified retirement account withdrawals (IRAs, 401(k)s) are all exempt from Illinois state income tax.",
      },
      {
        question: "Do Illinois residents pay local income taxes?",
        answer: "Yes, many Illinois municipalities levy their own local income tax on top of the state rate. For example, Chicago residents pay an additional 1.25% to the city, and Cook County residents pay an additional 1.75% combined.",
      },
    ],
  },
  pennsylvania: {
    name: "Pennsylvania",
    description:
      "Pennsylvania has a flat 3.07% state income tax, one of the lowest flat rates in the nation. Most retirement income is exempt, and there are no local income taxes.",
    intro: `Pennsylvania's 3.07% flat income tax is among the lowest in the country, and the simplicity is a major draw. There are no progressive brackets to navigate — every taxable dollar is taxed at the same rate, regardless of whether you earn $30,000 or $3 million. For a single filer making $75,000, that's about $2,302 in state tax, which is dramatically less than what you'd pay in California or New York at the same income. Pennsylvania does not tax most retirement income, including Social Security benefits, retirement account withdrawals, and pension income for those 59½ or older. One of the biggest perks: Pennsylvania has no local income taxes, so the rate you see is the rate you pay, no matter where in the state you live. The Keystone State does, however, have some of the highest property taxes in the country, particularly in the Philadelphia suburbs, and a 6% statewide sales tax (with a 2% local add-on in Philadelphia, pushing it to 8%).`,
    brackets: [{ min: 0, max: Infinity, rate: 0.0307 }],
    flatRate: 0.0307,
    faqs: [
      {
        question: "What is Pennsylvania's income tax rate in 2026?",
        answer: "Pennsylvania uses a flat 3.07% income tax rate for individuals. This is one of the lowest flat rates in the nation, and it applies to all taxable income regardless of bracket.",
      },
      {
        question: "Does Pennsylvania tax Social Security benefits?",
        answer: "No, Pennsylvania does not tax Social Security benefits, retirement account withdrawals, or pension income for residents 59½ or older. This makes Pennsylvania one of the most tax-friendly states for retirees.",
      },
      {
        question: "Are there local income taxes in Pennsylvania?",
        answer: "No, Pennsylvania does not authorize local income taxes for municipalities. The 3.07% state rate is the only income tax you pay, regardless of where in the state you live.",
      },
    ],
  },
  washington: {
    name: "Washington",
    description:
      "Washington has no state income tax, but imposes a 7% capital gains tax on high-value investment sales above $262,000. The state funds services through sales and property taxes.",
    intro: `Washington is one of nine states with no state income tax, which makes it a popular destination for high earners and tech workers relocating from California. Wages, salaries, and most investment income are state-tax-free. But there's a catch that has gotten more attention in recent years: Washington imposes a 7% capital gains tax on the sale of long-term assets (stocks, bonds, businesses) above $262,000 per year, with standard deductions and exemptions. For most workers and retirees, this doesn't change anything — you'll pay zero Washington state income tax. But for someone selling a business or liquidating a large stock position, the capital gains tax can add up. Washington also has one of the highest statewide sales taxes in the nation at 6.5%, with local rates pushing combined totals above 10% in some areas. Property taxes vary dramatically by county, with King County (Seattle) and parts of the Eastside among the higher-tax regions in the state.`,
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    flatRate: 0,
    faqs: [
      {
        question: "Does Washington have a state income tax?",
        answer: "No, Washington has no state income tax on wages, salaries, or most investment income. You only need to file a federal tax return for ordinary income.",
      },
      {
        question: "What is Washington's capital gains tax?",
        answer: "Washington imposes a 7% capital gains tax on long-term capital assets (stocks, bonds, business interests) sold for more than $262,000 per year. The tax applies to gains above the threshold, with standard deductions and exemptions for certain sales.",
      },
      {
        question: "Does Washington tax retirement income?",
        answer: "No, Washington does not tax Social Security benefits, pension income, retirement account withdrawals, or any other form of retirement income at the state level.",
      },
    ],
  },
  massachusetts: {
    name: "Massachusetts",
    description:
      "Massachusetts has a flat 5% state income tax rate, with an additional 4% surtax on income above $1,083,150. The state has no Social Security tax and offers generous deductions.",
    intro: `Massachusetts uses a flat 5% income tax rate, which is middle-of-the-road compared to other states — lower than California's top marginal rate but higher than Pennsylvania's 3.07%. However, Massachusetts adds a 4% surtax (the "millionaires' tax") on taxable income above $1,083,150, so the effective top rate for high earners is 9%. For a single filer making $90,000, the tax bill comes out to about $4,500 after deductions, with no Social Security taxation. Massachusetts has one of the highest per-capita incomes in the US, and Bay Staters enjoy generous state-level deductions, including a commuter deduction, a rent deduction, and a generous dependent care credit. The state also has a relatively high sales tax (6.25%) and some of the highest property taxes in the country, particularly on the South Shore and in Greater Boston. For retirees, the absence of Social Security taxation is a major plus, and there's no estate or inheritance tax for estates under $2 million.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.05 }],
    flatRate: 0.05,
    faqs: [
      {
        question: "What is Massachusetts's income tax rate in 2026?",
        answer: "Massachusetts uses a flat 5% income tax rate for individuals, with an additional 4% surtax on taxable income above $1,083,150. This brings the effective top marginal rate to 9% for high earners.",
      },
      {
        question: "Does Massachusetts tax Social Security?",
        answer: "No, Massachusetts does not tax Social Security benefits at the state level. This is one of the major draws for retirees considering a move to the Bay State.",
      },
      {
        question: "Are Massachusetts state income taxes deductible federally?",
        answer: "Yes, Massachusetts state income taxes are deductible on your federal return as part of the SALT (state and local tax) deduction, subject to the $10,000 annual cap.",
      },
    ],
  },
  colorado: {
    name: "Colorado",
    description:
      "Colorado has a flat 4.4% state income tax, down from 4.55% in 2025. The state taxes retirement income partially and has a relatively low property tax assessment rate.",
    intro: `Colorado's 4.4% flat income tax (reduced from 4.55% in 2025) places it in the middle of the pack for state income taxes. The Centennial State uses a simple flat-rate structure — every taxable dollar is taxed at the same rate, with no progressive brackets. For a single filer earning $85,000, that's about $3,740 in state tax, after the state's generous standard deduction. Colorado partially taxes retirement income: Social Security benefits are exempt for residents 65 and older (and partially exempt for those 55–64), but pension income and retirement account withdrawals are fully taxable. The state's residential property tax assessment rate is set at 7.15% (down from earlier rates), which can result in meaningfully lower property tax bills than in some neighboring states. Colorado also allows a generous Earned Income Tax Credit (EITC) that matches 25% of the federal credit. For remote workers and tech professionals relocating from California or New York, Colorado's tax structure — combined with no state estate tax — is a major draw.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.044 }],
    flatRate: 0.044,
    faqs: [
      {
        question: "What is Colorado's income tax rate in 2026?",
        answer: "Colorado uses a flat 4.4% income tax rate for individuals as of 2026, down from 4.55% in 2025. The flat rate applies to all taxable income, with no progressive brackets.",
      },
      {
        question: "Does Colorado tax Social Security benefits?",
        answer: "Colorado exempts Social Security benefits for residents 65 and older. For residents aged 55–64, a portion of Social Security income may be taxable, with full exemption kicking in at age 65.",
      },
      {
        question: "Are Colorado property taxes high?",
        answer: "Colorado's residential property tax assessment rate is 7.15%, and actual property tax rates vary by county and school district. The state's Gallagher Amendment adjustment keeps residential property taxes generally lower than in some neighboring states.",
      },
    ],
  },
  arizona: {
    name: "Arizona",
    description:
      "Arizona has a flat 2.5% state income tax, one of the lowest flat rates in the nation. The state taxes most retirement income and has moderate property taxes.",
    intro: `Arizona's 2.5% flat income tax is among the lowest in the nation, which is one of the reasons the Grand Canyon State has become a popular retirement and remote-work destination. For a single filer making $80,000, that's $2,000 in state tax — significantly less than California, New York, or even Colorado. The flat rate applies to all taxable income with no progressive brackets. However, Arizona does tax most retirement income — Social Security benefits, pension income, and retirement account withdrawals are all included in taxable income at the state level, though the state's low rate softens the impact. Arizona's property taxes are moderate compared to national averages, with the state's average effective property tax rate around 0.63% of home value. The state has a 5.6% transaction privilege tax (state-level sales tax) that applies to most purchases, with combined state-and-local rates typically running 7%–8.5%. For retirees on a fixed income, the 2.5% flat rate combined with Arizona's warm climate and active 55+ communities keeps the state consistently popular for relocations from higher-tax states.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.025 }],
    flatRate: 0.025,
    faqs: [
      {
        question: "What is Arizona's income tax rate in 2026?",
        answer: "Arizona uses a flat 2.5% income tax rate for individuals — one of the lowest flat rates in the nation. The rate applies to all taxable income regardless of bracket.",
      },
      {
        question: "Does Arizona tax Social Security benefits?",
        answer: "Yes, Arizona does tax Social Security benefits at the state level, unlike many retirement-friendly states. However, the low 2.5% flat rate keeps the impact relatively modest compared to higher-tax states.",
      },
      {
        question: "Are Arizona property taxes high?",
        answer: "Arizona's property taxes are moderate, with an average effective rate around 0.63% of home value. This is lower than many neighboring states and significantly lower than high-tax states like New Jersey or Illinois.",
      },
    ],
  },
};

export const STATE_INCOME_TAX_SLUGS: readonly string[] = Object.freeze(
  Object.keys(STATE_INCOME_TAX_DATA).map(
    (state) => `${state}-income-tax-calculator`,
  ),
);

export function isStateIncomeTaxSlug(slug: string): boolean {
  return STATE_INCOME_TAX_SLUGS.includes(slug);
}

export function getStateKeyFromTaxSlug(slug: string): string | null {
  if (!slug.endsWith("-income-tax-calculator")) return null;
  const key = slug.slice(0, "-income-tax-calculator".length * -1);
  return key in STATE_INCOME_TAX_DATA ? key : null;
}

export function calculateStateTax(income: number, state: string): number {
  const data = STATE_INCOME_TAX_DATA[state];
  if (!data) return 0;
  if (data.flatRate !== undefined) return income * data.flatRate;
  let tax = 0;
  for (const bracket of data.brackets) {
    if (income <= bracket.min) break;
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    if (taxableInBracket > 0) tax += taxableInBracket * bracket.rate;
  }
  return tax;
}