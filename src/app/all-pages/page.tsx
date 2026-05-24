import { allCalculators } from "@/lib/calculators";
import { blogPosts } from "@/lib/blog/posts";
import { getAllScenarioLinks } from "@/lib/scenarios";
import { getAllVariantPages } from "@/lib/programmatic-seo/generator";
import { getAllComparisons } from "@/lib/programmatic-seo/comparisons";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap — All QFINHUB Pages",
  description: "Complete list of all calculators, scenarios, tools, blog posts, and pages on QFINHUB.",
  alternates: { canonical: "https://www.qfinhub.com/all-pages" },
};

export default function SitemapPage() {
  const calculators = allCalculators;
  const scenarios = getAllScenarioLinks();
  const blog = blogPosts || [];
  
  let variantPages: Array<{ slug: string; title: string }> = [];
  try {
    variantPages = getAllVariantPages().map((v: { slug: string; title?: string }) => ({
      slug: v.slug,
      title: v.title || v.slug.replace(/-/g, " "),
    }));
  } catch {}

  let comparisons: Array<{ slug: string; title: string }> = [];
  try {
    comparisons = getAllComparisons().map((c: { slug: string; title?: string }) => ({
      slug: c.slug,
      title: c.title || c.slug.replace(/-/g, " "),
    }));
  } catch {}

  const categories = [...new Set(calculators.map((c) => c.category))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-surface-dark">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Sitemap</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          Complete index of all {calculators.length + scenarios.length + variantPages.length + comparisons.length + blog.length}+ pages on QFINHUB.
        </p>

        {/* Calculators by Category */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Calculators ({calculators.length})
          </h2>
          {categories.map((cat) => {
            const catCalcs = calculators.filter((c) => c.category === cat);
            return (
              <div key={cat} className="mb-6">
                <h3 className="text-lg font-semibold text-primary-600 dark:text-primary-400 mb-2 capitalize">
                  {cat}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {catCalcs.map((calc) => (
                    <Link
                      key={calc.slug}
                      href={`/calculators/${calc.slug}`}
                      className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <span className="mr-1.5">{calc.icon}</span>
                      {calc.title}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </section>

        {/* Scenarios */}
        {scenarios.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Pre-Calculated Scenarios ({scenarios.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {scenarios.slice(0, 200).map((s) => (
                <Link
                  key={s.slug}
                  href={`/scenario/${s.slug}`}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors truncate"
                  title={s.title}
                >
                  {s.title}
                </Link>
              ))}
            </div>
            {scenarios.length > 200 && (
              <p className="text-sm text-gray-400 mt-3">
                + {scenarios.length - 200} more scenarios —{" "}
                <Link href="/scenario/all-pages.xml" className="text-primary-600 hover:underline">
                  view full XML sitemap
                </Link>
              </p>
            )}
          </section>
        )}

        {/* Variant/Tools Pages */}
        {variantPages.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Tools & Variants ({variantPages.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {variantPages.slice(0, 200).map((v) => (
                <Link
                  key={v.slug}
                  href={`/tools/${v.slug}`}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors truncate capitalize"
                >
                  {v.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Comparison Pages */}
        {comparisons.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Comparisons ({comparisons.length})
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {comparisons.map((c) => (
                <Link
                  key={c.slug}
                  href={`/compare/${c.slug}`}
                  className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors truncate capitalize"
                >
                  {c.title}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Blog */}
        {blog.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Blog Posts ({blog.length})
            </h2>
            <div className="space-y-2">
              {blog.map((post: { slug: string; title?: string }) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {post.title || post.slug}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Static Pages */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Pages</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {[
              { href: "/about", label: "About" },
              { href: "/contact", label: "Contact" },
              { href: "/blog", label: "Blog" },
              { href: "/calculators", label: "All Calculators" },
              { href: "/methodology", label: "Methodology" },
              { href: "/editorial-policy", label: "Editorial Policy" },
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Service" },
            ].map((page) => (
              <Link
                key={page.href}
                href={page.href}
                className="text-sm text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 py-2 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              >
                {page.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
