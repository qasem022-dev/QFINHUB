import { allCalculators } from "@/lib/calculators";
import { blogPosts } from "@/lib/blog/posts";
import { decisionPages } from "@/lib/decision-pages";
import { getAllComparisons } from "@/lib/programmatic-seo/comparisons";
// Phase 34 Cycle 3: getAllHowToGuides removed — thin programmatic content excluded from sitemap
// Phase 38 FIX (Jul 4): Re-add tool variants — 301 redirects caused 286→207 indexing regression
// Phase 39.4: Selective restore of 4 guides verified-indexed in GSC to preserve indexing
import { getAllVariantPages } from "@/lib/programmatic-seo/generator";
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
  const HUB_SLUGS = new Set([
    "fed-and-your-mortgage", "fomc-rate-decisions-explained", "fed-enforcement-actions",
    "fed-personnel-and-policy", "fed-and-your-savings-investments", "fed-bank-mergers-approvals",
    "fed-stock-market-and-bonds", "global-central-banks",
  ]);
  // Week 1 Indexing Cleanup (Jul 12, 2026): Exclude 49 blog slugs that 301-redirect
  // (per next.config.ts). Sitemap advertising redirected URLs confuses GSC — they
  // show up as "Discovered" but never index because the redirect sends Google elsewhere.
  // Mirrors REDIRECTED_SLUGS in src/app/blog/page.tsx (Phase 39.4).
  const REDIRECTED_BLOG_SLUGS = new Set([
    "fed-holds-rates-steady-what-the-fomc-statement-means-for-your-mortgage-in-2025",
    "kevin-warsh-fed-rate-decision-how-rising-inflation-impacts-your-mortgage-affordabilit",
    "fed-rate-hike-ahead-how-rising-inflation-impacts-your-mortgage-and-savings",
    "fed-rate-hike-in-july-2025-how-bond-vigilantes-could-impact-your-mortgage-and-sa",
    "fed-rate-hike-odds-rising-by-july-2027-how-to-protect-your-mortgage-and-savings-",
    "fed-s-rising-inflation-forecast-how-to-protect-your-mortgage-and-savings",
    "usd-surge-fed-policy-how-to-protect-your-mortgage-affordability-in-2025",
    "kevin-warsh-sworn-in-as-fed-chair-what-it-means-for-your-mortgage-and-personal-f",
    "fed-s-new-payment-account-proposal-what-it-means-for-your-mortgage-and-savings",
    "morgan-stanley-bank-exemption-your-mortgage-what-the-fed-s-23a-ruling-means-for-",
    "stephen-m-calk-2025-trust-fed-approval-what-it-means-for-your-mortgage-and-savin",
    "fed-approves-united-texas-bank-conversion-what-it-means-for-your-mortgage-and-sa",
    "federal-reserve-operations-update-how-waller-s-speech-impacts-your-mortgage-affo",
    "fed-s-jefferson-speech-how-economic-outlook-energy-effects-impact-your-mortgage-",
    "stephen-miran-exits-the-fed-how-his-policies-could-impact-your-mortgage-affordab",
    "fed-minutes-march-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
    "fed-minutes-april-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
    "fed-2025-report-how-household-economic-well-being-impacts-your-mortgage-and-savi",
    "how-the-fed-s-modernization-plans-could-impact-your-mortgage-and-savings-goals",
    "what-the-fed-s-termination-of-enforcement-actions-means-for-your-mortgage-afford",
    "what-the-fed-s-enforcement-action-against-a-former-bank-employee-means-for-your-",
    "what-the-fed-s-enforcement-action-against-community-bankshares-means-for-your-mo",
    "fed-ends-enforcement-actions-against-major-banks-what-it-means-for-your-mortgage",
    "fed-enforcement-action-at-united-bank-what-it-means-for-your-mortgage-and-person",
    "fed-ends-enforcement-on-ubs-credit-suisse-what-it-means-for-your-mortgage-and-sa",
    "federal-reserve-enforcement-action-against-commerce-bank-what-it-means-for-your-",
    "what-the-fed-s-bank-employee-enforcement-actions-mean-for-your-mortgage-and-mone",
    "fed-discount-window-survey-what-it-means-for-your-mortgage-and-savings",
    "fed-approves-burke-herbert-bank-merger-what-it-means-for-your-mortgage-and-savin",
    "what-the-fed-s-approval-of-banco-de-credito-del-peru-means-for-your-mortgage-and",
    "fed-board-resignation-shakes-markets-how-to-protect-your-mortgage-affordability-",
    "fed-chair-change-how-powell-s-pro-tempore-role-and-warsh-s-appointment-could-imp",
    "bowman-s-fed-speech-on-banking-future-what-it-means-for-your-mortgage-and-saving",
    "blackrock-s-saigal-sees-fed-rate-cut-ahead-what-it-means-for-your-mortgage-and-s",
    "stock-market-week-ahead-nvidia-alphabet-earnings-atlanta-fed-how-to-protect-your",
    "rising-bond-yields-and-stock-market-drop-how-fed-hike-anxiety-impacts-your-mortg",
    "ecb-rate-hike-2025-how-a-modest-increase-affects-your-mortgage-and-savings",
    "ecb-rate-hike-impact-on-mortgages-how-to-protect-your-finances",
    "retire-by-40-calculator-how-much-needed",
    "monthly-mortgage-payment-formula-tax-insurance",
    "200k-mortgage-payment-30-years",
    "how-much-mortgage-afford-100k-salary",
    "20000-loan-5-years-8-percent-monthly-payment",
    "investment-calculator-withdrawals",
    "treasury-selloff-hits-mortgages-how-to-protect-your-home-loan-plans",
    "housing-affordability-breakthrough-how-new-policies-could-make-homeownership-acc",
    "stablecoin-regulation-and-your-mortgage-what-the-genius-act-means-for-homebuyers",
    "investing-cybersecurity-stocks-are-surging-one-looks-promising-into-earnings",
    "mortgage-rates-june-2026-current-rates-home-affordability-calculator",
  ]);
  const blogPages: SitemapEntry[] = blogPosts
    .filter((post) => !REDIRECTED_BLOG_SLUGS.has(post.slug))
    .map((post) => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as ChangeFrequency,
      // Phase 39.4: Boost 8 hub posts to high priority — topical authority anchors
      priority: HUB_SLUGS.has(post.slug) ? 0.8 : 0.6,
    }));

  // Phase 38 FIX (Jul 4): Re-add tool variant pages to sitemap.
  // Phase 36 removed these + 301 redirected them → Google de-indexed 79 pages (286→207).
  // FIX: Restore all non-formula variants to sitemap. Formula variants stay noindex (via
  // generateMetadata) but are NOT 301 redirected — they serve 200 with noindex+canonical.
  // Week 1 Indexing Cleanup (Jul 12, 2026): afford-* variants are actually index/follow
  // per live HTML metadata. NOINDEXED_VARIANT_SLUGS is stale — keep set empty until verified.
  const NOINDEXED_VARIANT_SLUGS = new Set<string>([
    // Empty — all current variant pages emit index, follow (verified Jul 12)
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

  // How-to-use guide pages — Phase 39.4 selective restore
  // Only re-add guides that GSC confirms are indexed (preserves their indexing status)
  // Source: .optimizer-data/gsc-pages-submitted-and-indexed-urls.json (93 indexed)
  // Week 1 Indexing Cleanup (Jul 12): Expanded to 12 verified-indexed guides (was 4)
  // 10 new orphans: how-to-use-{basic-calculator, simple-interest, tax-calculator,
  // currency-converter, loan-comparison, debt-avalanche, perpetuity-calculator,
  // npv-calculator, social-security, retirement-income} — all GSC-verified indexed.
  const INDEXED_GUIDE_SLUGS = new Set([
    "how-to-use-1099-calculator",
    "how-to-use-child-care-cost",
    "how-to-use-date-difference",
    "how-to-use-fraction-calculator",
    "how-to-use-basic-calculator",
    "how-to-use-simple-interest",
    "how-to-use-tax-calculator",
    "how-to-use-currency-converter",
    "how-to-use-loan-comparison",
    "how-to-use-debt-avalanche",
    "how-to-use-perpetuity-calculator",
    "how-to-use-npv-calculator",
    "how-to-use-social-security",
    "how-to-use-retirement-income",
  ]);
  const indexedGuides = getAllHowToGuides().filter((g) =>
    INDEXED_GUIDE_SLUGS.has(g.slug)
  );
  const guidePages: SitemapEntry[] = indexedGuides.map((g) => ({
    url: `${BASE_URL}/guides/${g.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.5,
  }));

  // HTML sitemap page — Phase 39.4 restore (verified indexed, was orphaned)
  const allPagesEntry: SitemapEntry = {
    url: `${BASE_URL}/all-pages`,
    lastModified: new Date(),
    changeFrequency: "weekly" as ChangeFrequency,
    priority: 0.4,
  };

  // Decision pages (quality-gated financial decision guides)
  const decisionPageEntries: SitemapEntry[] = decisionPages.map((d) => ({
    url: `${BASE_URL}/decision/${d.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as ChangeFrequency,
    priority: 0.7,
  }));

  return [...staticPages, ...calculatorPages, ...blogPages, ...variantPages, ...geotargetedPages, ...comparisonPages, ...guidePages, allPagesEntry, ...decisionPageEntries];
}
