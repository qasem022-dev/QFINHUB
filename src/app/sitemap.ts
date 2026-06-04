import { allCalculators } from "@/lib/calculators";
import { blogPosts } from "@/lib/blog/posts";
import { decisionPages } from "@/lib/decision-pages";
import { getAllVariantPages } from "@/lib/programmatic-seo/generator";
import { getAllComparisons } from "@/lib/programmatic-seo/comparisons";
import { getAllHowToGuides } from "@/lib/programmatic-seo/guides";

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
    {
      url: `${BASE_URL}/ai-specialist`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    // Auth & Cookie pages REMOVED from sitemap (PHASE 13C.9, Jun 4)
    // /auth/login, /auth/signup — authentication pages, not public content
    // /cookies — noindex page, should not be in sitemap
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
    // Dashboard URLs REMOVED from sitemap (PHASE 13C.7, Jun 4)
    // Reason: Auth-gated pages return 307 redirect, not public content
    // /dashboard, /dashboard/plans, /dashboard/settings → redirect to /auth/login
    // Dashboard functionality is completely unaffected
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
      url: `${BASE_URL}/all-pages`,
      lastModified: new Date(),
      changeFrequency: "weekly",
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

  // V2 Correction Phase 3: Sitemap cleanup — exclude noindexed pages.
  // Formula variants (loan-20k-5yr-8pct patterns) are noindexed + canonicalized → excluded.
  const TOOL_GSC_SLUGS = new Set([
    "afford-100k-40k-6-5pct",
    "afford-130k-40k-7pct",
  ]);

  function isFormulaVariant(slug: string): boolean {
    const parts = slug.split("-");
    const hasPct = parts.some((p) => p.endsWith("pct"));
    const hasYr = parts.some((p) => p.endsWith("yr"));
    const hasMo = parts.some((p) => p.endsWith("mo"));
    const numCount = parts.filter((p) => /\d|pct|yr|mo/.test(p) && p.length <= 6).length;
    // Formula = percentage-based slug with year/month terms, or multi-parameter numeric slug
    return (hasPct && (hasYr || hasMo)) || (/^[a-z]+-\d/.test(slug) && numCount >= 3);
  }

  let variantPages: SitemapEntry[] = [];
  try {
    const variants = getAllVariantPages();
    variantPages = variants
      .filter((v) => !isFormulaVariant(v.slug) || TOOL_GSC_SLUGS.has(v.slug))
      .map((v) => ({
        url: `${BASE_URL}/tools/${v.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as ChangeFrequency,
        priority: 0.7,
      }));
  } catch (e) {
    console.warn("Failed to generate variant pages:", e);
  }

  // V2 Correction Phase 3: Geo pages — only keep the 3 with GSC impressions.
  // All other geo pages are noindexed (doorway risk) → excluded from sitemap.
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

  // How-to-use guide pages
  const guidePages: SitemapEntry[] = getAllHowToGuides().map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.6,
  }));

  // V2: Decision pages (quality-gated financial decision guides)
  const decisionPageEntries: SitemapEntry[] = decisionPages.map((d) => ({
    url: `${BASE_URL}/decision/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.7,
  }));

  return [...staticPages, ...calculatorPages, ...blogPages, ...variantPages, ...geotargetedPages, ...comparisonPages, ...guidePages, ...decisionPageEntries];
}
