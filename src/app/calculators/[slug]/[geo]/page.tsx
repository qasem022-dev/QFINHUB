import { notFound } from "next/navigation";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CalculatorLayout } from "@/components/calculators";
import { YMYLDisclaimer } from "@/components/layout/ymyl-disclaimer";
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

  const title = `${calcConfig.label} for ${city.name}, ${city.stateAbbr} (2026)`;
  const description = `Free ${calcConfig.label.toLowerCase()} for ${city.name}, ${city.stateAbbr}. Calculate payments based on ${city.name}'s median home price of $${(city.medianHomePrice / 1000).toFixed(0)}K. No sign-up required.`;

  return { title, description };
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
            "@type": "WebApplication",
            name: `${calcConfig.label} for ${cityDisplay}`,
            description: `Free ${calcConfig.label.toLowerCase()} for ${city.name}, ${city.stateAbbr}`,
            applicationCategory: "FinanceApplication",
            operatingSystem: "All",
            url: `https://qfinhub.com/calculators/${slug}/${geo}`,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            areaServed: { "@type": "City", name: city.name },
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
    </div>
  );
}
