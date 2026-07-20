import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CalculatorLayout } from "@/components/calculators";
import { YMYLDisclaimer } from "@/components/layout/ymyl-disclaimer";
import { LastReviewedBy } from "@/components/layout/last-reviewed";
import { getCalculatorBySlug } from "@/lib/calculators";
import { getCalculatorComponent } from "@/components/calculators/registry";
import { US_CITIES, GEOTARGETED_CALCULATORS } from "@/lib/programmatic-seo/data/us-cities";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/calculator";
import type { CategoryType } from "@/types/calculator";

interface GeoPageProps {
  params: Promise<{ slug: string; geo: string }>;
}

// Generate all geotargeted city pages
export function generateStaticParams() {
  const params: { slug: string; geo: string }[] = [];
  
  for (const calc of GEOTARGETED_CALCULATORS) {
    for (const city of US_CITIES) {
      const citySlug = city.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
      const stateSlug = city.stateAbbr.toLowerCase();
      params.push({
        slug: calc.slug,
        geo: `${citySlug}-${stateSlug}`,
      });
    }
  }
  
  return params;
}

function parseGeoParam(geo: string): { citySlug: string; stateAbbr: string } | null {
  // geo format: "houston-tx" or "new-york-ny"
  // The state abbreviation is always the last 2 chars
  const parts = geo.split("-");
  if (parts.length < 2) return null;
  const stateAbbr = parts[parts.length - 1]?.toUpperCase() ?? "";
  const citySlug = parts.slice(0, -1).join("-");
  return { citySlug, stateAbbr };
}

function findCity(citySlug: string, stateAbbr: string) {
  return US_CITIES.find(
    (c) =>
      c.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "") === citySlug &&
      c.stateAbbr.toUpperCase() === stateAbbr
  );
}

export async function generateMetadata({ params }: GeoPageProps) {
  const { slug, geo } = await params;
  const parsed = parseGeoParam(geo);
  if (!parsed) return { title: "Not Found" };
  
  const city = findCity(parsed.citySlug, parsed.stateAbbr);
  const calcConfig = GEOTARGETED_CALCULATORS.find((c) => c.slug === slug);

  if (!city || !calcConfig) return { title: "Not Found" };

  // Build geo-specific title with city name near the front for SERP relevance
  const geoTitle = `${city.name}, ${city.stateAbbr} ${calcConfig.label} (2026) — Free & Instant`;
  const title = geoTitle;
  const description = `${calcConfig.label} for ${city.name}, ${city.stateAbbr} — get a personalized estimate in 30 seconds. Free tool tailored for ${city.name} residents. No signup, no email required, 100% free.`;

  // V2 Correction Phase 2: Geo pages are noindexed by default (doorway risk without real local data).
  // Only keep indexable if this exact geo page has GSC impressions.
  const geoPath = `/calculators/${slug}/${geo}`;
  const GEO_GSC_PAGES = new Set([
    "/calculators/loan/nashville-tn",
    "/calculators/loan/reno-nv",
    "/calculators/tax/philadelphia-pa",
  ]);
  const hasGscImpressions = GEO_GSC_PAGES.has(geoPath);

  return {
    title,
    description,
    robots: hasGscImpressions
      ? { index: true, follow: true }
      : { index: false, follow: true },
    alternates: {
      canonical: `https://www.qfinhub.com/calculators/${slug}/${geo}`,
    },
  };
}

export default async function GeotargetedPage({ params }: GeoPageProps) {
  const { slug, geo } = await params;
  const parsed = parseGeoParam(geo);
  if (!parsed) notFound();
  
  const city = findCity(parsed.citySlug, parsed.stateAbbr);
  const calcConfig = GEOTARGETED_CALCULATORS.find((c) => c.slug === slug);
  const calculator = getCalculatorBySlug(calcConfig?.id ?? "");

  if (!city || !calcConfig || !calculator) notFound();

  const CalculatorComponent = getCalculatorComponent(calcConfig.id);
  const cityDisplay = `${city.name}, ${city.stateAbbr}`;
  const medianFormatted = `$${(city.medianHomePrice / 1000).toFixed(0)}K`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: `${calcConfig.label} for ${cityDisplay}`,
            description: `Free ${calcConfig.label.toLowerCase()} for ${city.name}, ${city.stateAbbr}`,
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            url: `https://qfinhub.com/calculators/${slug}/${geo}`,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            areaServed: { "@type": "City", name: city.name },
            author: { "@type": "Person", name: "Qasem Mohammed", url: "https://www.qfinhub.com/about", sameAs: ["https://www.linkedin.com/in/qasem-mohammed"], jobTitle: "AI & Software Engineer, Founder & Lead Developer" },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://www.qfinhub.com/" },
              { "@type": "ListItem", position: 2, name: "Calculators", item: "https://www.qfinhub.com/calculators" },
              { "@type": "ListItem", position: 3, name: `${calcConfig.label} for ${cityDisplay}`, item: `https://qfinhub.com/calculators/${slug}/${geo}` },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "HowTo",
            name: `How to Calculate ${calcConfig.label} for ${city.name}`,
            description: `Step-by-step guide to using our free ${calcConfig.label.toLowerCase()} tailored for ${city.name}, ${city.stateAbbr}.`,
            step: [
              { "@type": "HowToStep", position: 1, name: `Enter your loan amount`, text: `Input your expected home price or loan amount based on ${city.name}'s median home value of ${medianFormatted}.` },
              { "@type": "HowToStep", position: 2, name: "Adjust interest rate and term", text: "Set the current mortgage interest rate and choose between a 15-year or 30-year loan term." },
              { "@type": "HowToStep", position: 3, name: "Review your results", text: `See your estimated monthly payment, total interest, and amortization schedule specific to ${city.name}.` },
            ],
          }),
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/calculators" className="hover:text-gray-900 dark:hover:text-white">Calculators</Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{cityDisplay}</span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary-500" />
            <Badge variant="secondary" className="text-sm">
              {cityDisplay} — Median Home: {medianFormatted}
            </Badge>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            {calcConfig.label} for {city.name}, {city.stateAbbr}
          </h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-3xl">
            Use our free {calcConfig.label.toLowerCase()} tailored for {city.name}. 
            The median home value is approximately {medianFormatted}. Adjust the values to match
            your specific property for an accurate estimate.
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark-elevated">
          {CalculatorComponent ? (
            <div className="p-4">
              <CalculatorComponent />
            </div>
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-400">Calculator coming soon.</p>
            </div>
          )}
        </div>

        <div className="mt-8 prose prose-gray max-w-3xl dark:prose-invert mx-auto">
          <h2>Why Use a {city.name}-Specific {calcConfig.label}?</h2>
          <p>
            Property taxes, insurance, and home prices vary significantly by location. Our calculator
            uses {city.name}'s median home price of {medianFormatted} as a starting point. With a
            population of {(city.population / 1000).toFixed(0)}K in the {city.region} region,
            {city.name} has its own unique real estate market conditions.
          </p>

          <h2>Key Factors for {city.name} Homebuyers</h2>
          <ul>
            <li><strong>Median Home Price:</strong> At {medianFormatted}, {city.name}'s market is {city.medianHomePrice > 400000 ? 'above' : 'near or below'} the national median, affecting affordability calculations.</li>
            <li><strong>Local Property Taxes:</strong> {city.stateAbbr} property tax rates impact your total monthly payment. Our calculator accounts for estimated taxes based on your location.</li>
            <li><strong>Insurance Costs:</strong> Homeowners insurance varies by region — {city.region} properties may have different risk profiles that affect premiums.</li>
            <li><strong>Market Conditions:</strong> With {(city.population / 1000).toFixed(0)}K residents, {city.name}'s housing supply and demand dynamics influence both prices and negotiation leverage.</li>
            <li><strong>Down Payment Strategy:</strong> First-time buyers in {city.name} may qualify for local and state assistance programs. Our calculator lets you test different down payment scenarios.</li>
          </ul>

          <h2>How to Get the Most Accurate Results</h2>
          <p>
            For the most accurate estimate, replace the default values with your actual numbers. 
            Enter your specific home price or loan amount, current interest rate from your lender, 
            and your planned down payment percentage. The calculator will instantly update with 
            your personalized monthly payment breakdown including principal, interest, taxes, and insurance.
            All calculations run directly in your browser — your financial data never leaves your device.
          </p>

          <h2>{city.name} Real Estate Market Snapshot</h2>
          <p>
            {city.name} sits in the {city.region} region with a population of approximately {(city.population / 1000).toFixed(0)}K residents.
            The local housing market reflects broader {city.stateAbbr} trends — including state-level property tax rates, regional
            construction costs, and demand from major employers. With a median home price of {medianFormatted},
            {city.name} buyers should plan for closing costs of 2-5% of the purchase price (roughly
            ${Math.round(city.medianHomePrice * 0.03 / 1000)}K-${Math.round(city.medianHomePrice * 0.05 / 1000)}K on a median-priced home),
            separate from the down payment. Local first-time homebuyer programs, USDA rural development loans (where applicable),
            and VA loans (for eligible veterans) can dramatically reduce upfront costs. We recommend getting
            pre-approved with 2-3 {city.stateAbbr} lenders before house hunting — rates can vary by 0.25-0.5%
            between lenders, which translates to tens of thousands of dollars over a 30-year mortgage.
          </p>

          <h2>Frequently Asked Questions About {city.name} Mortgages</h2>
          <h3>What credit score do I need to buy in {city.name}?</h3>
          <p>
            Most {city.name} lenders require a minimum FICO score of 620 for conventional loans,
            though FHA loans accept scores as low as 580 with a 3.5% down payment. VA loans
            (for eligible military members) and USDA loans (in eligible rural areas near {city.name})
            often have more flexible credit requirements. Higher scores unlock better rates: a
            740+ score typically gets the most competitive offers, while sub-700 scores pay a meaningful premium.
          </p>
          <h3>How much house can I afford in {city.name}?</h3>
          <p>
            Use the 28/36 rule: monthly housing costs should stay under 28% of gross income (front-end ratio),
            and total debt payments under 36% (back-end ratio). On a $75,000 salary, that's roughly $1,750/month
            for housing. With {city.name}'s median home value of {medianFormatted}, you'd typically need
            a household income of at least ${Math.round(city.medianHomePrice * 0.28 * 12 / 0.28 / 1000)}K for
            a median-priced home at current rates. Our affordability calculator can refine this estimate
            with your specific debt obligations.
          </p>
          <h3>Are property taxes high in {city.name}?</h3>
          <p>
            Property taxes in {city.name} reflect {city.stateAbbr} state rates plus local county and
            municipal levies. {city.stateAbbr}-wide effective property tax rates typically range from 0.5% to 2.5%
            of assessed value annually. On a {medianFormatted} home in {city.name}, that's roughly
            ${Math.round(city.medianHomePrice * 0.015 / 1000)}K/year in property taxes — fold this into your
            total monthly payment, not just the principal and interest. Our calculator factors in estimated
            taxes based on {city.stateAbbr} statewide averages.
          </p>

          <h2>Nearby Cities</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 not-prose">
            {US_CITIES.filter(
              (c) => c.stateAbbr === city.stateAbbr && c.name !== city.name
            )
              .slice(0, 8)
              .map((nearby) => {
                const nearbySlug = nearby.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
                return (
                  <Link
                    key={nearby.name}
                    href={`/calculators/${slug}/${nearbySlug}-${nearby.stateAbbr.toLowerCase()}`}
                    className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 dark:border-gray-700 dark:bg-surface-dark-elevated dark:text-primary-400"
                  >
                    {nearby.name}
                  </Link>
                );
              })}
          </div>
        </div>
      </div>
      <YMYLDisclaimer />
      <LastReviewedBy />
    </div>
  );
}
