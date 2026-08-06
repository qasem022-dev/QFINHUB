import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { blogPosts, type BlogPost } from "@/lib/blog/posts";
import { cn } from "@/lib/utils";
import { ArrowLeft, ArrowRight, Calendar, Clock, Tag, ExternalLink } from "lucide-react";
import { allCalculators } from "@/lib/calculators";

const baseUrl = "https://www.qfinhub.com";

// Phase 36: Duplicate/near-duplicate blog posts that compete with the primary version.
// The primary version is the longer, ranking one (10 min read at another slug).
//
// Phase 40 (2026-07-28): AdSense rejection for "low value content". Google sees 22
// "Fed X / Bank Y approval: What It Means for Your Mortgage and Savings" posts
// as scaled content abuse — same template, different fact slot. All follow:
//   - TL;DR section
//   - "What Happened" section with [date placeholder]
//   - "Why It Matters" section
//   - Mortgage advice + calculator CTAs
// Different fact + same skeleton = exactly the pattern Google has rejected since
// the March 2024 Helpful Content Update. Noindex these to remove them from search
// and AdSense review. Original editorial posts (3 explainers, decision guides,
// genuine methodology content) stay indexed.
const NOINDEX_DUPLICATE_SLUGS = new Set([
  "20000-loan-5-years-8-percent-monthly-payment",  // Duplicate of 20000-loan-at-8-percent-for-5-years-monthly-payment

  // ── Fed-event-mortgage template posts (Phase 40 AdSense rejection cleanup) ──
  "columbia-bank-mhc-acquisition-approved-what-it-means-for-your-mortgage-and-savin",
  "oceanfirst-financial-corp-approval-what-it-means-for-your-mortgage-and-savings-i",
  "fed-approves-burke-herbert-bank-merger-what-it-means-for-your-mortgage-and-savin",
  "fed-ends-enforcement-actions-against-major-banks-what-it-means-for-your-mortgage",
  "fednow-intermediary-proposal-what-it-means-for-your-mortgage-and-savings-goals",
  "fed-discount-window-survey-what-it-means-for-your-mortgage-and-savings",
  "fed-enforcement-action-at-united-bank-what-it-means-for-your-mortgage-and-person",
  "fed-ends-enforcement-on-ubs-credit-suisse-what-it-means-for-your-mortgage-and-sa",
  "bowman-s-fed-speech-on-banking-future-what-it-means-for-your-mortgage-and-saving",
  "stephen-m-calk-2025-trust-fed-approval-what-it-means-for-your-mortgage-and-savin",
  "fed-approves-united-texas-bank-conversion-what-it-means-for-your-mortgage-and-sa",
  "kevin-warsh-sworn-in-as-fed-chair-what-it-means-for-your-mortgage-and-personal-f",
  "foreign-holdings-of-us-treasuries-drop-what-it-means-for-your-mortgage-and-savin",
  "allianzgi-warns-of-overpriced-inflation-what-it-means-for-your-mortgage-and-bond",
  "fed-s-new-payment-account-proposal-what-it-means-for-your-mortgage-and-savings",
  "federal-reserve-enforcement-action-against-commerce-bank-what-it-means-for-your-",
  "prediction-markets-vs-regulators-what-it-means-for-your-mortgage-and-savings-goa",
  "mexico-inflation-slows-in-may-what-it-means-for-your-mortgage-and-finances",
  "new-federal-housing-funding-what-it-means-for-your-mortgage-and-rental-budget",
  "uk-gilt-yields-retreat-from-multi-decade-highs-what-it-means-for-your-mortgage-a",
  "ecb-rate-hike-impact-on-mortgages-how-to-protect-your-finances",
  "core-inflation-holds-steady-at-3-3-what-it-means-for-your-mortgage-and-savings",

  // ── Phase 40.1 (Jul 28): News-jacking posts with "What Happened" template ──
  "fed-2025-report-how-household-economic-well-being-impacts-your-mortgage-and-savi",
  "what-the-fed-s-termination-of-enforcement-actions-means-for-your-mortgage-afford",
  "fed-holds-rates-steady-what-the-fomc-statement-means-for-your-mortgage-in-2025",
  "what-the-fed-s-enforcement-action-against-a-former-bank-employee-means-for-your-",
  "what-the-fed-s-approval-of-banco-de-credito-del-peru-means-for-your-mortgage-and",
  "what-the-fed-s-enforcement-action-against-community-bankshares-means-for-your-mo",
  "fed-minutes-march-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
  "fed-board-resignation-shakes-markets-how-to-protect-your-mortgage-affordability-",
  "morgan-stanley-bank-exemption-your-mortgage-what-the-fed-s-23a-ruling-means-for-",
  "fed-chair-change-how-powell-s-pro-tempore-role-and-warsh-s-appointment-could-imp",
  "federal-reserve-operations-update-how-waller-s-speech-impacts-your-mortgage-affo",
  "how-the-fed-s-modernization-plans-could-impact-your-mortgage-and-savings-goals",
  "stablecoin-regulation-and-your-mortgage-what-the-genius-act-means-for-homebuyers",
  "fed-s-jefferson-speech-how-economic-outlook-energy-effects-impact-your-mortgage-",
  "kevin-warsh-fed-rate-decision-how-rising-rates-impact-your-mortgage-affordabilit",
  "trump-administration-s-proposed-scsep-cuts-what-it-means-for-older-workers-and-y",
  "fed-rate-hike-ahead-how-rising-inflation-impacts-your-mortgage-and-savings",
  "stephen-miran-exits-the-fed-how-his-policies-could-impact-your-mortgage-affordab",
  "ecb-rate-hike-2025-how-a-modest-increase-affects-your-mortgage-and-savings",
  "fed-rate-hike-in-july-2025-how-bond-vigilantes-could-impact-your-mortgage-and-sa",
  "gold-inches-up-amid-iran-deal-uncertainty-and-inflation-fears-how-to-protect-you",
  "stock-market-week-ahead-nvidia-alphabet-earnings-atlanta-fed-how-to-protect-your",
  "mortgage-rates-today-may-18-2026-will-they-rise-or-fall-this-week-how-to-prepare",
  "2027-social-security-cola-forecast-jumps-to-3-9-what-retirees-need-to-know-now",
  "housing-affordability-breakthrough-how-new-policies-could-make-homeownership-acc",
  "30-year-treasury-yield-hits-1999-levels-how-to-protect-your-savings-and-retireme",
  "30-year-yields-near-2007-highs-how-to-protect-your-mortgage-and-savings-now",
  "europe-s-bond-rush-what-record-borrowing-means-for-your-mortgage-and-savings",
  "rate-cuts-are-off-the-table-2-stocks-under-30-for-this-market-how-to-protect-you",
  "fed-s-rising-inflation-forecast-how-to-protect-your-mortgage-and-savings",
  "rising-bond-yields-and-stock-market-drop-how-fed-hike-anxiety-impacts-your-mortg",
  "trump-gas-tax-holiday-how-lower-fuel-costs-could-impact-your-mortgage-and-budget",
  "fed-rate-hike-odds-rising-by-july-2027-how-to-protect-your-mortgage-and-savings-",
  "treasury-selloff-hits-mortgages-how-to-protect-your-home-loan-plans",
  "jeff-bezos-proposes-zero-income-tax-for-bottom-half-of-earners-what-it-means-for",
  "usd-surge-fed-policy-how-to-protect-your-mortgage-affordability-in-2025",
  "fed-minutes-april-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
  "florida-insurance-crisis-why-homeowners-need-r-pace-and-smart-financial-tools-to",
  "blackrock-s-saigal-sees-fed-rate-cut-ahead-what-it-means-for-your-mortgage-and-s",
  "mortgage-rates-hit-9-month-high-how-to-protect-your-home-buying-power",
  "90-day-fiance-star-s-kentucky-home-a-lesson-in-mortgage-affordability-and-dead-a",
  "hungary-holds-key-interest-rate-steady-how-june-cut-could-impact-your-mortgage-a",
  "energy-inflation-persists-how-higher-oil-prices-impact-your-mortgage-and-savings",
  "what-the-fed-s-bank-employee-enforcement-actions-mean-for-your-mortgage-and-mone",
  "student-loan-repayment-options-2025-how-to-choose-the-best-plan-for-your-budget",

  // ── Phase 40.2 (Jul 28): Thin programmatic + YMYL-flagged posts ──
  // Under 500 words + YMYL concern (specific stock recommendation)
  "investing-cybersecurity-stocks-are-surging-one-looks-promising-into-earnings",
  // Thin programmatic variants (180-250w, single-number content)
  "investment-calculator-withdrawals",
  "200k-mortgage-payment-30-years",
  "retire-by-40-calculator-how-much-needed",
  "monthly-mortgage-payment-formula-tax-insurance",
  "how-much-mortgage-afford-100k-salary",
]);

// ISR: revalidate blog pages every 5 minutes for Phase 36 noindex propagation
export const revalidate = 300;

const categoryLabels: Record<BlogPost["category"], string> = {
  mortgage: "Mortgage",
  loan: "Loans",
  investment: "Investing",
  retirement: "Retirement",
  tax: "Tax",
  personal: "Personal Finance",
};

const categoryColors: Record<BlogPost["category"], string> = {
  mortgage: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  loan: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  investment: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  retirement: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  tax: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  personal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function markdownToHtml(markdown: string): string {
  // Simple markdown rendering for headings, links, bold, italic, lists, code, blockquotes, tables
  let html = markdown;

  // Headers: ## h2, ### h3, etc. (h1 is handled separately)
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-bold text-gray-900 dark:text-white mt-10 mb-4">$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-3">$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-lg font-semibold text-gray-900 dark:text-white mt-6 mb-2">$1</h4>');

  // Tables
  // Convert markdown tables to div-based layout for Telegram compatibility
  html = html.replace(/\|(.+)\|/g, (match) => {
    if (match.includes("---")) return "";
    const cells = match.split("|").filter((c) => c.trim());
    return `• ${cells.join(" — ")}`;
  });

  // Bold and italic
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Inline code
  html = html.replace(/`(.+?)`/g, '<code class="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-red-600 dark:bg-gray-800 dark:text-red-400">$1</code>');

  // Links: [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-primary-600 underline underline-offset-2 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">$1</a>'
  );

  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li class="ml-6 list-disc text-gray-600 dark:text-gray-300 leading-relaxed">$1</li>');
  html = html.replace(/^\d\. (.+)$/gm, '<li class="ml-6 list-decimal text-gray-600 dark:text-gray-300 leading-relaxed">$1</li>');

  // Blockquotes
  html = html.replace(
    /^> (.+)$/gm,
    '<blockquote class="border-l-4 border-accent-500 bg-accent-50 dark:bg-accent-900/20 pl-4 py-2 my-4 text-gray-700 dark:text-gray-300 italic">$1</blockquote>'
  );

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="my-8 border-gray-200 dark:border-gray-700" />');

  // Paragraphs: wrap non-tag lines in <p>
  const lines = html.split("\n");
  const result: string[] = [];
  let inList = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("<h") || trimmed.startsWith("<hr") || trimmed.startsWith("<blockquote")) {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      result.push(trimmed);
    } else if (trimmed.startsWith("<li")) {
      if (!inList) {
        result.push('<ul class="space-y-1 my-4">');
        inList = true;
      }
      result.push(trimmed);
    } else if (trimmed.startsWith("•")) {
      if (!inList) {
        result.push('<ul class="space-y-1 my-4">');
        inList = true;
      }
      result.push(`<li class="ml-6 list-disc text-gray-600 dark:text-gray-300 leading-relaxed">${trimmed.slice(2)}</li>`);
    } else {
      if (inList) {
        result.push("</ul>");
        inList = false;
      }
      // Skip known table markers
      if (trimmed.includes("|")) continue;
      result.push(`<p class="mb-4 leading-relaxed text-gray-600 dark:text-gray-300">${trimmed}</p>`);
    }
  }
  if (inList) result.push("</ul>");

  return result.join("\n");
}

function RelatedCalculators({ slugs }: { slugs: string[] }) {
  const calcs = slugs
    .map((slug) => allCalculators.find((c) => c.slug === slug))
    .filter(Boolean);

  if (calcs.length === 0) return null;

  return (
    <div className="mt-12 rounded-xl border border-accent-200 bg-accent-50 p-6 dark:border-accent-800 dark:bg-accent-900/20">
      <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
        Related Calculators
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        {calcs.map((calc) => (
          <Link
            key={calc!.slug}
            href={`/calculators/${calc!.slug}`}
            className="flex items-center gap-3 rounded-lg border border-accent-200 bg-white p-3 text-sm transition-colors hover:border-accent-300 hover:bg-accent-100/50 dark:border-accent-800 dark:bg-white/5 dark:hover:bg-accent-900/30"
          >
            <span className="text-lg">{calc!.icon}</span>
            <div className="flex-1 min-w-0">
              <span className="block font-medium text-gray-900 dark:text-white truncate">
                {calc!.title}
              </span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                {calc!.description}
              </span>
            </div>
            <ExternalLink className="h-4 w-4 shrink-0 text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function RelatedPosts({ currentSlug }: { currentSlug: string }) {
  const current = blogPosts.find((p) => p.slug === currentSlug);
  if (!current) return null;

  // Show posts in the same category first, then random others
  const related = blogPosts
    .filter((p) => p.slug !== currentSlug)
    .sort((a, b) => {
      const aSameCat = a.category === current.category ? 0 : 1;
      const bSameCat = b.category === current.category ? 0 : 1;
      return aSameCat - bSameCat;
    })
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <div className="mt-16 border-t border-gray-200 pt-10 dark:border-gray-700">
      <h3 className="mb-6 text-xl font-bold text-gray-900 dark:text-white">
        Continue Reading
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-md dark:border-gray-700 dark:bg-surface-dark-elevated"
          >
            <span
              className={cn(
                "mb-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
                categoryColors[post.category]
              )}
            >
              {categoryLabels[post.category]}
            </span>
            <h4 className="mb-1 text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400 line-clamp-2">
              {post.title}
            </h4>
            <span className="text-xs text-gray-400">
              {formatDate(post.publishedAt)} · {post.readingTime} min read
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export async function generateStaticParams() {
  return blogPosts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    robots: NOINDEX_DUPLICATE_SLUGS.has(slug)
      ? { index: false, follow: true }
      : undefined,
    openGraph: {
      title: `${post.title} | QFINHUB Blog`,
      description: post.description,
      type: "article",
      publishedTime: post.publishedAt.toISOString(),
      authors: ["QFINHUB"],
      images: ["/og-image.png"],
      url: `${baseUrl}/blog/${post.slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} | QFINHUB`,
      description: post.description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: `${baseUrl}/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Extract the H1 title from content (first # heading)
  const contentWithoutH1 = post.content.replace(/^# (.+)$/m, "").trim();
  const _h1Title = post.title;

  // Extract FAQ questions from content for JSON-LD schema
  const faqItems: { question: string; answer: string }[] = [];
  const faqMatch = post.content.match(/<h2>FAQ<\/h2>([\s\S]*?)(?:<h2>|$)/i);
  const faqBlock = faqMatch?.[1];
  if (faqBlock) {
    // Pattern 1: <h3>Question?</h3><p>Answer</p>
    const qaRegex1 = /<h3>([^<]+)<\/h3>\s*<p>([^<]+(?:<(?!\/p>)[^<]*)*)<\/p>/gi;
    let match1: RegExpExecArray | null;
    while ((match1 = qaRegex1.exec(faqBlock)) !== null) {
      const question = match1[1]?.replace(/<[^>]+>/g, '').trim() ?? '';
      const answer = match1[2]?.replace(/<[^>]+>/g, '').trim().substring(0, 300) ?? '';
      if (question && answer && question.endsWith('?')) {
        faqItems.push({ question, answer });
      }
    }
    // Pattern 2: <p><strong>Q: Question?</strong><br/>A: Answer</p>
    if (faqItems.length === 0) {
      const qaRegex2 = /<strong>Q:\s*([^<]+)<\/strong>\s*<br\s*\/?>\s*A:\s*([\s\S]*?)(?=<p>|$)/gi;
      let match2: RegExpExecArray | null;
      while ((match2 = qaRegex2.exec(faqBlock)) !== null) {
        const question = match2[1]?.trim() ?? '';
        const answer = match2[2]?.replace(/<[^>]+>/g, '').trim().substring(0, 300) ?? '';
        if (question && answer) faqItems.push({ question, answer });
      }
    }
  }
  // Fallback: extract questions from any heading ending with ?
  if (faqItems.length === 0) {
    const allHeadings = post.content.match(/<h[23]>([^<]+\?)<\/h[23]>\s*<p>([^<]+(?:<(?!\/p>)[^<]*)*)<\/p>/gi);
    if (allHeadings) {
      for (const h of allHeadings.slice(0, 4)) {
        const qMatch = h.match(/<h[23]>([^<]+)<\/h[23]>/);
        const aMatch = h.match(/<p>([\s\S]+?)<\/p>/);
        if (qMatch?.[1] && aMatch?.[1]) {
          faqItems.push({ question: qMatch[1].trim(), answer: aMatch[1].replace(/<[^>]+>/g, '').trim().substring(0, 300) });
        }
      }
    }
  }

  const faqSchema = faqItems.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  } : null;

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-surface-dark">
      {/* FAQPage JSON-LD Schema */}
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/95 backdrop-blur-md dark:border-gray-700 dark:bg-surface-dark/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/qfinhub-logo.svg"
              alt="QFINHUB"
              className="h-8 w-auto"
              width={144}
              height={32}
            />
          </Link>
          <nav className="flex items-center gap-1">
            <Link
              href="/calculators"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-block"
            >
              Calculators
            </Link>
            <Link
              href="/blog"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white sm:inline-block"
            >
              Blog
            </Link>
            <Link
              href="/"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Article ── */}
      <article className="flex-1 px-4 py-12">
        <div className="mx-auto max-w-3xl">
          {/* ── Breadcrumbs ── */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Link
              href="/"
              className="hover:text-gray-700 dark:hover:text-gray-200"
            >
              Home
            </Link>
            <span>/</span>
            <Link
              href="/blog"
              className="hover:text-gray-700 dark:hover:text-gray-200"
            >
              Blog
            </Link>
            <span>/</span>
            <span className="truncate text-gray-900 dark:text-white max-w-[200px] sm:max-w-[400px]">
              {post.title}
            </span>
          </nav>

          {/* ── Header Meta ── */}
          <div className="mb-8">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
                  categoryColors[post.category]
                )}
              >
                <Tag className="h-3 w-3" />
                {categoryLabels[post.category]}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(post.publishedAt)}
              </span>
              <span className="flex items-center gap-1 text-sm text-gray-400">
                <Clock className="h-3.5 w-3.5" />
                {post.readingTime} min read
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
              {post.title}
            </h1>
          </div>

          {/* ── Content ── */}
          <div
            className="prose prose-gray max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: markdownToHtml(contentWithoutH1) }}
          />

          {/* ── Related Calculators ── */}
          <RelatedCalculators slugs={post.relatedCalculators} />

          {/* ── Back to Blog ── */}
          <div className="mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 transition-colors hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to all articles
            </Link>
          </div>

          {/* ── Related Posts ── */}
          <RelatedPosts currentSlug={post.slug} />
        </div>
      </article>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-200 bg-white dark:border-gray-700 dark:bg-surface-dark">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/qfinhub-logo.svg"
                alt="QFINHUB"
                className="h-7 w-auto"
                width={126}
                height={28}
              />
            </Link>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
              <Link
                href="/calculators"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Calculators
              </Link>
              <Link
                href="/about"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                About Us
              </Link>
              <Link
                href="/contact"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Contact
              </Link>
              <Link
                href="/privacy"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Terms of Service
              </Link>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-200 pt-6 text-center text-xs text-gray-400 dark:border-gray-700 dark:text-gray-500">
            &copy; {new Date().getFullYear()} QFINHUB. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
