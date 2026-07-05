import { allCalculators } from "@/lib/calculators";
import { blogPosts } from "@/lib/blog/posts";
import { decisionPages } from "@/lib/decision-pages";
import { getAllComparisons } from "@/lib/programmatic-seo/comparisons";
// Phase 34 Cycle 3: getAllHowToGuides removed — thin programmatic content excluded from sitemap
// Phase 38 FIX (Jul 4): Re-add tool variants — 301 redirects caused 286→207 indexing regression
import { getAllVariantPages } from "@/lib/programmatic-seo/generator";

const BASE_URL = "https://www.qfinhub.com";

type ChangeFrequency =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface SitemapEntry {
  url: string;
  lastModified?: string | Date;
  changeFrequency?: ChangeFrequency;
  priority?: number;
}

export default async function sitemap(): Promise<SitemapEntry[]> {
  const staticPages: SitemapEntry[] = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/calculators`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Phase 38: /ai-specialist removed from sitemap — now noindex (client-side tool)
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/methodology`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/editorial-policy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/widgets/mortgage-affordability-embed`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/widgets/debt-snowball-vs-avalanche-embed`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/loan-payment-table`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/data`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/loan-scenarios/small-emergency-loan-5000-15-percent`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/loan-scenarios/good-credit-loan-20000-8-percent`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/loan-scenarios/debt-consolidation-loan-25000-10-percent`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/loan-scenarios/fair-credit-loan-20000-20-percent`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ];

  const calculatorPages: SitemapEntry[] = allCalculators.map((calc) => ({
    url: `${BASE_URL}/calculators/${calc.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.8,
  }));

  // Blog post pages
  const blogPages: SitemapEntry[] = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.publishedAt,
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.6,
  }));

  // Phase 38 FIX (Jul 4): Re-add tool variant pages to sitemap.
  // Phase 36 removed these + 301 redirected them → Google de-indexed 79 pages (286→207).
  // FIX: Restore all non-formula variants to sitemap. Formula variants stay noindex (via
  // generateMetadata) but are NOT 301 redirected — they serve 200 with noindex+canonical.
  const NOINDEXED_VARIANT_SLUGS = new Set([
    "auto-loan-717d83b1",
    "auto-loan-92918ea9",
    "retirement-planning-eb1dd78b",
    "retirement-1M-30yr",
    "afford-100k-40k-6-5pct",
    "afford-130k-40k-7pct",
  ]);

  function isFormulaVariant(slug: string): boolean {
    const parts = slug.split("-");
    const hasPct = parts.some((p) => p.endsWith("pct"));
    const hasYr = parts.some((p) => p.endsWith("yr"));
    const hasMo = parts.some((p) => p.endsWith("mo"));
    const numCount = parts.filter((p) => /\d|pct|yr|mo/.test(p) && p.length <= 6).length;
    return (hasPct && (hasYr || hasMo)) || (/^[a-z]+-\d/.test(slug) && numCount >= 3);
  }

  let variantPages: SitemapEntry[] = [];
  try {
    const variants = getAllVariantPages();
    variantPages = variants
      .filter((v) => !isFormulaVariant(v.slug))
      .filter((v) => !NOINDEXED_VARIANT_SLUGS.has(v.slug))
      .map((v) => ({
        url: `${BASE_URL}/tools/${v.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.6,
      }));
  } catch (e) {
    console.warn("Failed to generate variant pages for sitemap:", e);
  }

  // Geo pages — only keep the 3 with GSC impressions.
  const GEO_GSC_PATHS = new Set([
    "/calculators/loan/nashville-tn",
    "/calculators/loan/reno-nv",
    "/calculators/tax/philadelphia-pa",
  ]);

  let geotargetedPages: SitemapEntry[] = [];
  try {
    const { US_CITIES, GEOTARGETED_CALCULATORS } = await import("@/lib/programmatic-seo/data/us-cities");
    for (const calc of GEOTARGETED_CALCULATORS) {
      for (const city of US_CITIES) {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
        const geoPath = `/calculators/${calc.slug}/${citySlug}-${city.stateAbbr.toLowerCase()}`;
        if (GEO_GSC_PATHS.has(geoPath)) {
          geotargetedPages.push({
            url: `${BASE_URL}${geoPath}`,
            lastModified: new Date(),
            changeFrequency: "monthly" as ChangeFrequency,
            priority: 0.6,
          });
        }
      }
    }
  } catch (e) {
    console.warn("Failed to generate geotargeted pages:", e);
  }

  // Comparison pages
  const comparisonPages: SitemapEntry[] = getAllComparisons().map((c) => ({
    url: `${BASE_URL}/compare/${c.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.6,
  }));

  // How-to-use guide pages removed — programmatic thin content
  const guidePages: SitemapEntry[] = [];

  // Decision pages (quality-gated financial decision guides)
  const decisionPageEntries: SitemapEntry[] = decisionPages.map((d) => ({
    url: `${BASE_URL}/decision/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.7,
  }));

  return [...staticPages, ...calculatorPages, ...blogPages, ...variantPages, ...geotargetedPages, ...comparisonPages, ...guidePages, ...decisionPageEntries];
}
