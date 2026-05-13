import { allCalculators } from "@/lib/calculators";
import { blogPosts } from "@/lib/blog/posts";
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
    {
      url: `${BASE_URL}/auth/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
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
      url: `${BASE_URL}/cookies`,
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
      url: `${BASE_URL}/dashboard`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/dashboard/plans`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/dashboard/settings`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
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

  // Programmatic SEO variant pages (thousands of targeted pages)
  let variantPages: SitemapEntry[] = [];
  try {
    const variants = getAllVariantPages();
    variantPages = variants.map((v) => ({
      url: `${BASE_URL}/tools/${v.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as ChangeFrequency,
      priority: 0.7,
    }));
  } catch (e) {
    console.warn("Failed to generate variant pages:", e);
  }

  // Geotargeted city pages (mortgage calculator houston, etc.)
  let geotargetedPages: SitemapEntry[] = [];
  try {
    const { US_CITIES, GEOTARGETED_CALCULATORS } = await import("@/lib/programmatic-seo/data/us-cities");
    for (const calc of GEOTARGETED_CALCULATORS) {
      for (const city of US_CITIES) {
        const citySlug = city.name.toLowerCase().replace(/\s+/g, "-").replace(/\./g, "");
        geotargetedPages.push({
          url: `${BASE_URL}/calculators/${calc.slug}/${citySlug}-${city.stateAbbr.toLowerCase()}`,
          lastModified: new Date(),
          changeFrequency: "monthly" as ChangeFrequency,
          priority: 0.6,
        });
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

  return [...staticPages, ...calculatorPages, ...blogPages, ...variantPages, ...geotargetedPages, ...comparisonPages, ...guidePages];
}
