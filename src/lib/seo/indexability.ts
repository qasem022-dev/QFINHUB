/**
 * Single source of truth for "should this URL be indexed?".
 *
 * IMPORTANT: sitemap.ts and the page-level generateMetadata() used to each carry
 * their own copy of the formula-variant classifier. They disagreed — the sitemap
 * copy did not recognise the `Nk` + `Nyr` pattern (e.g. `investment-1k-5yr`), so
 * 198 pages that render `noindex` were still submitted in the sitemap. A sitemap
 * full of noindex URLs is a direct sitemap-quality violation and erodes crawl
 * trust for the whole domain.
 *
 * Rule: anything that renders noindex MUST NOT appear in the sitemap. Both sides
 * now call the helpers in this file.
 */

/**
 * A "formula variant" is a programmatic page whose slug encodes calculator
 * parameters (e.g. `loan-20k-5yr-8pct`, `investment-1k-5yr`, `tax-40k-single`).
 * These pages are 97-99% identical to their siblings — only the numbers change —
 * so they are noindexed and canonicalised to their parent calculator.
 */
export function isFormulaVariantSlug(slug: string): boolean {
  const parts = slug.split("-");
  // Any slug carrying a parameter token (5k, 150k, 8pct, 20yr, 500mo, 1M, 3dp,
  // 20s) is a generated variant. Measured on the live site: sibling variants are
  // 97-99.5% textually identical — only the numbers change — so Google treats
  // them as duplicates of one another.
  if (parts.some((p) => /^\d/.test(p))) return true;
  // Catch suffixes attached to words without a leading digit (e.g. "apr-pct").
  return parts.some((p) => /(pct|yr|mo|dp)$/.test(p));
}

/**
 * Variants that are ALREADY indexed by Google, so they stay indexable.
 *
 * Building this list from a live URL Inspection audit (Nov 11, 2026) rather than
 * guesswork avoids deindexing pages that are currently winning — while letting
 * the remaining ~100 near-duplicate variants drop out of the crawl surface.
 */
export const INDEXABLE_VARIANT_OVERRIDES = new Set<string>([
  "/tools/afford-100k-40k-6-5pct",
  "/tools/afford-130k-40k-7pct",
  // Verified indexed in the Nov 11, 2026 audit:
  "/tools/budget-40k-zero-based",
  "/tools/budget-65k-zero-based",
  "/tools/dti-55k-car-buyer",
  "/tools/fi-15k-lean-extreme",
  "/tools/fire-25k-van-life",
  "/tools/fire-35k-geo-arb",
  "/tools/net-worth-1M-milestone",
  "/tools/net-worth-entrepreneur",
  "/tools/net-worth-minimalist",
  "/tools/net-worth-real-estate",
  "/tools/tax-110k-single",
  "/tools/tax-150k-single",
  "/tools/tax-300k-head-of-household",
  "/tools/tax-400k-head-of-household",
  "/tools/tax-40k-single",
  "/tools/tax-5M-married-joint",
  "/tools/tax-750k-single",
  "/tools/tax-80k-married-separate",
]);

/** A /tools/<slug> page is indexable when it is not an unproven formula variant. */
export function isToolVariantIndexable(slug: string): boolean {
  const path = `/tools/${slug}`;
  if (INDEXABLE_VARIANT_OVERRIDES.has(path)) return true;
  return !isFormulaVariantSlug(slug);
}

/**
 * Blog posts that render `noindex` (duplicate titles, news-jacking templates).
 * These are explicitly excluded from the sitemap.
 */
export const NOINDEX_DUPLICATE_BLOG_SLUGS = new Set<string>([
  "20000-loan-5-years-8-percent-monthly-payment",
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
  "What Happened",
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
  "investing-cybersecurity-stocks-are-surging-one-looks-promising-into-earnings",
  "investment-calculator-withdrawals",
  "200k-mortgage-payment-30-years",
  "retire-by-40-calculator-how-much-needed",
  "monthly-mortgage-payment-formula-tax-insurance",
  "how-much-mortgage-afford-100k-salary",
]);

/** Static routes that render `noindex` and therefore must not be in the sitemap. */
export const NOINDEX_STATIC_PATHS = new Set<string>([
  "/all-pages",
]);
