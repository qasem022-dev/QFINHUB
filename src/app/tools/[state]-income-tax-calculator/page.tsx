import { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorLayout } from "@/components/calculators/calculator-layout";
import { ResultCard } from "@/components/calculators/result-card";
import { CalculatorInput } from "@/components/calculators/calculator-input";
import { formatCurrency } from "@/lib/utils";
import React from "react";

// ─── State Tax Data ─────────────────────────────────────────────────────────

type TaxBracket = { min: number; max: number; rate: number };

type StateData = {
  name: string;
  description: string;
  intro: string;
  brackets: TaxBracket[];
  flatRate?: number;
  faqs: { question: string; answer: string }[];
};

const STATES: Record<string, StateData> = {
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
        question: "Are property taxes in Texas actually high?",
        answer: "Yes, Texas has effective property tax rates that average around 1.7–1.9% of home value, which is higher than most states. However, homestead exemptions (up to $100,000 for school district taxes) can reduce the taxable value of your primary residence. New homeowners may also qualify for tax limitations under Texas law.",
      },
    ],
  },
  florida: {
    name: "Florida",
    description:
      "Florida has no state income tax, making it a popular destination for retirees. The state relies on sales taxes and a communications services tax. Intangible assets like stocks are not taxed.",
    intro: `Florida is another zero-income-tax haven, and the Sunshine State uses that as a major recruiting tool when attracting retirees and businesses from the Northeast and Midwest. If you're earning $150,000 in Florida, your state tax bill is $0 — full stop. Beyond income tax, Florida doesn't tax intangible personal property like stocks, bonds, or mutual funds, which is a meaningful advantage for investment-heavy households. The state's revenue base leans heavily on tourism-driven sales taxes, which means residents with modest spending footprints contribute less proportionally than their tax burdens would suggest in an income-tax state. Florida's homestead exemption can reduce the assessed value of your primary residence by up to $50,000 for school district taxes, and additional exemptions exist for seniors and disabled veterans. The trade-off is that property insurance costs in Florida have skyrocketed in recent years due to hurricane risk, so factor that into your overall cost of living. For most residents, the lack of state income tax translates to thousands of dollars in annual savings that compound nicely in retirement accounts.`,
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    flatRate: 0,
    faqs: [
      {
        question: "Does Florida tax retirement income?",
        answer: "No, Florida has no state income tax at all, so retirement income — including Social Security, pensions, 401(k) withdrawals, and IRA distributions — is completely exempt from Florida state tax. This is a major reason Florida is a top retirement destination.",
      },
      {
        question: "What taxes do Florida residents actually pay?",
        answer: "Florida residents primarily pay federal income taxes, property taxes (with homestead exemptions), and sales taxes on purchases. The state sales tax is 6%, with additional local option taxes that can bring the total to 7–8.5% depending on the county.",
      },
      {
        question: "Does Florida have estate or inheritance tax?",
        answer: "No, Florida does not have an estate tax or inheritance tax. Upon death, your assets can be transferred to heirs without any Florida state tax liability, making it an attractive state for wealth transfer and estate planning.",
      },
    ],
  },
  illinois: {
    name: "Illinois",
    description:
      "Illinois has a flat income tax rate of 4.95% for individuals, one of the lower flat rates in the US. The state taxes Social Security benefits partially and treats retirement income with a deduction for those 65 and older.",
    intro: `Illinois takes a flat-rate approach to income tax, meaning everyone pays the same 4.95% regardless of how much they earn — a refreshing departure from complex progressive systems. If you're pulling in $90,000 in Illinois, your state income tax is a straightforward 4.95%, or about $4,455. No bracket math, no hidden surtaxes (unless you're in Chicago, which adds a 4.5% city income tax on top for residents). For a middle-income earner, Illinois is roughly in the middle of the pack nationally — more expensive than Texas or Florida but less than California or New York. The Land of Lincoln does tax Social Security benefits, but there's a deduction available: if you're 65 or older and your federal adjusted gross income is below $100,000, you can subtract up to $10,000 of retirement income from your Illinois return. Property taxes in Illinois are famously high — among the highest in the nation — which partially offsets the income tax advantage. For Chicagoans, the combined city+state burden of 9.45% gets you into New York territory, so location within the state matters significantly.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.0495 }],
    flatRate: 0.0495,
    faqs: [
      {
        question: "What is Illinois' income tax rate in 2026?",
        answer: "Illinois has a flat income tax rate of 4.95% for individuals, meaning every dollar of taxable income is taxed at the same rate regardless of total income. This is one of the lower flat rates among US states that impose an income tax.",
      },
      {
        question: "Does Illinois tax Social Security benefits?",
        answer: "Yes, Illinois partially taxes Social Security benefits. However, if you are 65 or older and your federal adjusted gross income is below $100,000, you may qualify for a retirement income deduction of up to $10,000 on your Illinois return.",
      },
      {
        question: "How do Chicago income taxes affect Illinois residents?",
        answer: "Chicago residents owe an additional city income tax of 4.5%, bringing the combined Chicago+Illinois state income tax rate to 9.45%. This is among the highest combined city-state income tax burdens in the country. Non-Chicago Illinois residents pay only the 4.95% state rate.",
      },
    ],
  },
  pennsylvania: {
    name: "Pennsylvania",
    description:
      "Pennsylvania has a flat income tax rate of 3.07% for individuals, one of the lowest flat rates in the US. The state does not tax Social Security benefits and offers a generous standard deduction.",
    intro: `Pennsylvania keeps its income tax refreshingly simple: a flat 3.07% on all taxable income, one of the lowest flat rates in the country. On $80,000 of income, you're looking at roughly $2,456 in state income tax — less than a week of gross pay for many workers. The Keystone State is notably generous with Social Security: unlike most states, Pennsylvania does not tax Social Security benefits, which makes it especially friendly to retirees. Property taxes in Pennsylvania are locally assessed and vary dramatically by school district — some areas have very high property taxes to fund local schools, while others are more moderate. Philadelphia residents face an additional 3.89% city wage tax, which is quite steep in combination with the state rate, bringing the total to nearly 7% for city residents. The state offers a standard deduction of $4,500 for single filers and $9,000 for married filing jointly in 2026, which further reduces taxable income for lower earners. For most Pennsylvanians outside Philadelphia, the 3.07% flat rate is a competitive advantage over the graduated systems in neighboring New York and New Jersey.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.0307 }],
    flatRate: 0.0307,
    faqs: [
      {
        question: "What is Pennsylvania's income tax rate in 2026?",
        answer: "Pennsylvania has a flat individual income tax rate of 3.07% on all taxable income, regardless of amount. This is one of the lowest flat income tax rates in the United States.",
      },
      {
        question: "Does Pennsylvania tax Social Security benefits?",
        answer: "No, Pennsylvania does not tax Social Security benefits. This makes Pennsylvania particularly tax-friendly for retirees who rely heavily on Social Security income, as unlike most other states, these benefits are fully exempt from Pennsylvania state income tax.",
      },
      {
        question: "Do Philadelphia residents pay additional city income tax?",
        answer: "Yes, Philadelphia residents pay a city wage tax of 3.89% in addition to the 3.07% Pennsylvania state income tax, bringing the combined rate to 6.96%. This is one of the highest city income tax rates in the nation. Non-Philadelphia Pennsylvania residents pay only the 3.07% state rate.",
      },
    ],
  },
  washington: {
    name: "Washington",
    description:
      "Washington State has no state income tax, making it one of the most tax-friendly states for workers and retirees. The state funds itself through sales taxes and property taxes. There is no estate tax in Washington.",
    intro: `Washington State is a tax-free haven for income, joining Texas and Florida in the zero-income-tax column — but with a distinctly Pacific Northwest character. Every dollar you earn above your federal filing threshold is yours to keep, whether you're a software engineer in Seattle or a small business owner in Spokane. The state generates revenue primarily through sales taxes (which run 6.5% state plus local additions up to another 4%) and property taxes. Washington's property taxes are moderate compared to Texas, though they vary by county and have been rising as the state funds public education under the McCleary decision. One significant advantage Washington holds over Florida and Texas: there's no state estate tax, whereas both Florida and Texas also lack this tax. Washington does have a special B&O tax on business gross receipts rather than a traditional corporate income tax. For high-tech workers in the Seattle area earning $200,000+, the absence of a state income tax can mean $10,000–$15,000+ in annual savings versus California or New York. The trade-off is a relatively high cost of living, particularly in the Seattle metro.`,
    brackets: [{ min: 0, max: Infinity, rate: 0 }],
    flatRate: 0,
    faqs: [
      {
        question: "Does Washington State have an income tax?",
        answer: "No, Washington State has no personal state income tax. This applies to all forms of income including wages, investments, and retirement accounts. Washington is one of nine states with no individual income tax.",
      },
      {
        question: "How does Washington State fund public services without an income tax?",
        answer: "Washington relies on sales taxes (the state rate is 6.5% with local additions that can bring the combined rate to 10–11% in some areas), property taxes, and business taxes including a B&O (Business and Occupation) tax on gross receipts. The sales-tax-heavy system means visitors and tourists also contribute to state revenue.",
      },
      {
        question: "Does Washington have an estate tax?",
        answer: "No, Washington State does not have an estate tax. Combined with the absence of an income tax, this makes Washington particularly favorable for wealth preservation and estate planning, as assets can be transferred to heirs without either tax burden.",
      },
    ],
  },
  massachusetts: {
    name: "Massachusetts",
    description:
      "Massachusetts has a flat 5% income tax rate, one of the lower flat rates in the US. However, investment income above a threshold is subject to an additional 4% surtax, bringing the effective rate on investment income to 9%.",
    intro: `Massachusetts pitches itself as a low-tax state, and the headline 5% flat income tax rate supports that claim — at least at first glance. The nuance is the investment income surcharge: if you have investment income (interest, dividends, capital gains) exceeding $8 for single filers in 2026, every dollar beyond that threshold gets hit with an additional 4% surtax, pushing the total rate on investment income to 9%. For someone with $200,000 in wage income and $50,000 in capital gains, the math gets interesting. The 5% rate applies straightforwardly to wages, but capital gains above the threshold tip into the 9% bracket — effectively making Massachusetts' tax system less flat than advertised for investment-heavy households. The Bay State does not tax Social Security benefits, which is a meaningful exemption for retirees. Property taxes in Massachusetts are moderate by national standards, though Boston-area home prices make the dollar amounts feel steep. One useful credit: the Massachusetts Earned Income Tax Credit (EITC) matches a portion of the federal credit, helping lower-income workers. For most salaried employees earning under $200,000 with modest investment income, the 5% flat rate is accurate and competitive.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.05 }],
    flatRate: 0.05,
    faqs: [
      {
        question: "What is Massachusetts' income tax rate in 2026?",
        answer: "Massachusetts has a flat 5% income tax rate on most types of income, including wages, interest, and dividends. However, investment income above certain thresholds is subject to an additional 4% surtax, making the effective rate 9% on investment income exceeding the threshold.",
      },
      {
        question: "Does Massachusetts tax Social Security benefits?",
        answer: "No, Massachusetts does not tax Social Security benefits. This makes the state relatively favorable for retirees who rely heavily on Social Security income, as these benefits are fully exempt from Massachusetts state income tax.",
      },
      {
        question: "How does the Massachusetts investment income surtax work?",
        answer: "Massachusetts imposes an additional 4% surtax on investment income (interest, dividends, and capital gains) that exceeds a threshold ($8 for single filers in 2026). This means investment income above this small threshold is taxed at a combined 9% rate (5% flat + 4% surtax), making Massachusetts less competitive for high-net-worth individuals with significant investment portfolios.",
      },
    ],
  },
  colorado: {
    name: "Colorado",
    description:
      "Colorado has a flat income tax rate of 4.4%, one of the lowest in the nation. The state has a flat tax structure with no brackets, and it allows a deduction for retirement income for residents 55 and older.",
    intro: `Colorado's income tax is refreshingly straightforward: a flat 4.4% on all taxable income, one of the lowest flat rates in the entire country. On $75,000 of income, you're looking at $3,300 in state tax — competitive with Texas and Florida when you factor in the cost-of-living differences. The Centennial State has been gradually reducing its rate over the years, and 4.4% represents a meaningful advantage over neighboring states like California (up to 13.3%) and New York (up to 10.9%). Colorado allows a deduction for retirement income for residents age 55 and older, which can further reduce tax liability for retirees with pension or 401(k) income. Social Security benefits are partially taxed in Colorado, though the state offers a subtraction for retirement benefits that reduces the effective burden for many retirees. The state funds itself primarily through income taxes (which at 4.4% generates less per capita than many states), sales taxes, and property taxes. Denver's recent investments in public transit and urban development are partially funded through sales tax increases that voters approved. For remote workers earning a high salary while enjoying Colorado's outdoor lifestyle, the flat 4.4% rate is a meaningful financial benefit that stacks up well against the nation's best tax havens.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.044 }],
    flatRate: 0.044,
    faqs: [
      {
        question: "What is Colorado's income tax rate in 2026?",
        answer: "Colorado has a flat individual income tax rate of 4.4% on all taxable income, one of the lowest flat rates in the United States. There are no brackets or progressive tiers — every dollar is taxed at the same 4.4% rate regardless of total income.",
      },
      {
        question: "Does Colorado tax Social Security and retirement income?",
        answer: "Colorado partially taxes Social Security benefits but offers a retirement income deduction for residents age 55 and older, which can reduce or eliminate tax on pension and retirement account withdrawals. The exact treatment depends on your total income and filing status.",
      },
      {
        question: "Are there local city income taxes in Colorado?",
        answer: "Unlike some states (notably Ohio and Pennsylvania), Colorado does not have city or local income taxes. Aurora, the third-largest city, attempted a local income tax in 2021 but it did not pass. You only need to file a state return, not a local one.",
      },
    ],
  },
  arizona: {
    name: "Arizona",
    description:
      "Arizona has a flat income tax rate of 2.5% for individuals, one of the lowest flat rates in the US. The state has been gradually reducing its rate and is moving toward a flatter structure.",
    intro: `Arizona offers one of the most competitive flat income tax rates in the nation at just 2.5%, making it a standout choice for professionals and retirees looking to minimize state tax burdens without relocating to a zero-income-tax state. On $100,000 of income, your Arizona state income tax is a mere $2,500 — roughly equivalent to what a New Yorker pays on their first $50,000 of earnings. The Grand Canyon State has been on a trajectory of rate reduction, having cut its rate from 4.5% in 2021 to the current 2.5%, with ongoing discussions about further reductions. Arizona taxes Social Security benefits partially, though many retirees with moderate income end up owing little or nothing due to a generous subtraction for retirement income available to residents age 65 and older. Property taxes in Arizona are moderate, with the average effective rate around 0.62% of assessed value — lower than the national average. Phoenix and Tucson both have relatively low cost-of-living indices compared to coastal metros, which compounds the tax advantage into real purchasing power. For remote workers, Arizona's combination of low taxes, warm weather, and growing tech-sector job market makes it a frequently overlooked gem.`,
    brackets: [{ min: 0, max: Infinity, rate: 0.025 }],
    flatRate: 0.025,
    faqs: [
      {
        question: "What is Arizona's income tax rate in 2026?",
        answer: "Arizona has a flat individual income tax rate of 2.5% on all taxable income, one of the lowest flat rates in the United States. This rate has been reduced gradually from 4.5% starting in 2022, and the state has signaled interest in further reductions.",
      },
      {
        question: "Does Arizona tax Social Security and retirement income?",
        answer: "Arizona partially taxes Social Security benefits, but residents age 65 and older may qualify for a substantial retirement income subtraction that can reduce or eliminate tax on pensions, 401(k) distributions, and other retirement income. The exact benefit depends on income level and filing status.",
      },
      {
        question: "What is Arizona's cost of living compared to other low-tax states?",
        answer: "Arizona generally offers a lower cost of living than states like California, New York, and Massachusetts, while maintaining a lower income tax rate than all of them. Housing costs in Phoenix and Tucson have risen in recent years but remain significantly below coastal metro areas. Combined with the 2.5% flat income tax rate, Arizona provides strong purchasing power for professionals and retirees.",
      },
    ],
  },
};

const SUPPORTED_SLUGS = Object.keys(STATES);

export async function generateStaticParams() {
  return SUPPORTED_SLUGS.map((slug) => ({ state: slug }));
}

export const revalidate = 86400;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ state: string }>;
}): Promise<Metadata> {
  const { state } = await params;
  const stateData = STATES[state];
  if (!stateData) return {};

  const title = `${stateData.name} Income Tax Calculator 2026 | QFINHUB`;
  const description = `Calculate your ${stateData.name} state income tax for 2026. ${stateData.description} Use our free ${stateData.name} tax calculator to estimate your tax owed, effective rate, and take-home pay.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.qfinhub.com/tools/${state}-income-tax-calculator`,
    },
    openGraph: {
      title,
      description,
      url: `https://www.qfinhub.com/tools/${state}-income-tax-calculator`,
      siteName: "QFINHUB",
      type: "website",
    },
  };
}

// ─── Tax Calculation ─────────────────────────────────────────────────────────

function calculateStateTax(income: number, state: string): number {
  const data = STATES[state];
  if (!data) return 0;

  if (data.flatRate !== undefined) {
    return income * data.flatRate;
  }

  let tax = 0;
  for (const bracket of data.brackets) {
    if (income <= bracket.min) break;
    const taxableInBracket = Math.min(income, bracket.max) - bracket.min;
    if (taxableInBracket > 0) {
      tax += taxableInBracket * bracket.rate;
    }
  }

  return tax;
}

// ─── Client Component ───────────────────────────────────────────────────────

function StateTaxCalculator({
  state,
  stateData,
}: {
  state: string;
  stateData: StateData;
}) {
  "use client";

  const [income, setIncome] = React.useState(75000);
  // Filing status: 0 = Single, 1 = Married
  const [filingStatus, setFilingStatus] = React.useState(0);

  const taxOwed = calculateStateTax(income, state);
  const effectiveRateCalc = income > 0 ? (taxOwed / income) * 100 : 0;
  const takeHome = income - taxOwed;
  return (
    <>
      {/* Input: Annual Income */}
      <CalculatorInput
        input={{
          id: "income",
          label: "Annual Income",
          type: "number",
          defaultValue: 75000,
          min: 0,
          max: 10000000,
          step: 1000,
          suffix: "USD",
          placeholder: "75000",
          tooltip: "Your total annual taxable income before deductions.",
        }}
        value={income}
        onChange={setIncome}
      />

      {/* Input: Filing Status */}
      <CalculatorInput
        input={{
          id: "filingStatus",
          label: "Filing Status",
          type: "select",
          defaultValue: 0,
          options: [
            { value: 0, label: "Single" },
            { value: 1, label: "Married Filing Jointly" },
          ],
          tooltip: "Your federal filing status affects some state tax calculations.",
        }}
        value={filingStatus}
        onChange={setFilingStatus}
      />

      {/* Result: Tax Owed */}
      <ResultCard
        label={`Estimated ${stateData.name} State Tax`}
        value={formatCurrency(taxOwed)}
        subtext={`${effectiveRateCalc.toFixed(2)}% effective rate`}
        prefix={<span>💰</span>}
      />

      {/* Result: Take-Home */}
      <ResultCard
        label="Take-Home After State Tax"
        value={formatCurrency(takeHome)}
        subtext={`${(100 - effectiveRateCalc).toFixed(2)}% of income`}
        prefix={<span>🏠</span>}
      />

      {/* Result: Rate Summary */}
      <ResultCard
        label="State Tax Rate"
        value={
          stateData.flatRate !== undefined
            ? `${(stateData.flatRate * 100).toFixed(2)}%`
            : "Progressive"
        }
        subtext={
          stateData.flatRate !== undefined
            ? "Flat rate — same on every dollar"
            : "Multiple brackets — higher income taxed more"
        }
        prefix={<span>📊</span>}
      />
    </>
  );
}

// ─── Page Component ──────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ state: string }>;
}

export default async function StateIncomeTaxCalculatorPage({ params }: PageProps) {
  const { state } = await params;

  if (!SUPPORTED_SLUGS.includes(state)) {
    notFound();
  }

  const stateData = STATES[state]!;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: stateData.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <CalculatorLayout
          title={`${stateData.name} Income Tax Calculator 2026`}
          description={stateData.description}
        >
          {/* Intro Section */}
          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <p className="text-sm leading-relaxed text-slate-300">{stateData.intro}</p>
          </div>

          {/* Inputs */}
          <div className="space-y-6">
            <StateTaxCalculator state={state} stateData={stateData} />
          </div>
        </CalculatorLayout>
      </div>
    </>
  );
}
