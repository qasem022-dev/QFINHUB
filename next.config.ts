import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return [
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
      {
        source: "/blog/fed-holds-rates-steady-what-the-fomc-statement-means-for-your-mortgage-in-2025",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/kevin-warsh-fed-rate-decision-how-rising-rates-impact-your-mortgage-affordabilit",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-rate-hike-ahead-how-rising-inflation-impacts-your-mortgage-and-savings",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-rate-hike-in-july-2025-how-bond-vigilantes-could-impact-your-mortgage-and-sa",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-rate-hike-odds-rising-by-july-2027-how-to-protect-your-mortgage-and-savings-",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-s-rising-inflation-forecast-how-to-protect-your-mortgage-and-savings",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/usd-surge-fed-policy-how-to-protect-your-mortgage-affordability-in-2025",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/kevin-warsh-sworn-in-as-fed-chair-what-it-means-for-your-mortgage-and-personal-f",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-s-new-payment-account-proposal-what-it-means-for-your-mortgage-and-savings",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/morgan-stanley-bank-exemption-your-mortgage-what-the-fed-s-23a-ruling-means-for-",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/stephen-m-calk-2025-trust-fed-approval-what-it-means-for-your-mortgage-and-savin",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-approves-united-texas-bank-conversion-what-it-means-for-your-mortgage-and-sa",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/federal-reserve-operations-update-how-waller-s-speech-impacts-your-mortgage-affo",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-s-jefferson-speech-how-economic-outlook-energy-effects-impact-your-mortgage-",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/stephen-miran-exits-the-fed-how-his-policies-could-impact-your-mortgage-affordab",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/fed-minutes-march-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
        destination: "/blog/fomc-rate-decisions-explained",
        permanent: true,
      },
      {
        source: "/blog/fed-minutes-april-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
        destination: "/blog/fomc-rate-decisions-explained",
        permanent: true,
      },
      {
        source: "/blog/fed-2025-report-how-household-economic-well-being-impacts-your-mortgage-and-savi",
        destination: "/blog/fed-and-your-savings-investments",
        permanent: true,
      },
      {
        source: "/blog/how-the-fed-s-modernization-plans-could-impact-your-mortgage-and-savings-goals",
        destination: "/blog/fed-and-your-savings-investments",
        permanent: true,
      },
      {
        source: "/blog/what-the-fed-s-termination-of-enforcement-actions-means-for-your-mortgage-afford",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/what-the-fed-s-enforcement-action-against-a-former-bank-employee-means-for-your-",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/what-the-fed-s-enforcement-action-against-community-bankshares-means-for-your-mo",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/fed-ends-enforcement-actions-against-major-banks-what-it-means-for-your-mortgage",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/fed-enforcement-action-at-united-bank-what-it-means-for-your-mortgage-and-person",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/fed-ends-enforcement-on-ubs-credit-suisse-what-it-means-for-your-mortgage-and-sa",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/federal-reserve-enforcement-action-against-commerce-bank-what-it-means-for-your-",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/what-the-fed-s-bank-employee-enforcement-actions-mean-for-your-mortgage-and-mone",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/fed-discount-window-survey-what-it-means-for-your-mortgage-and-savings",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/fed-approves-burke-herbert-bank-merger-what-it-means-for-your-mortgage-and-savin",
        destination: "/blog/fed-bank-mergers-approvals",
        permanent: true,
      },
      {
        source: "/blog/what-the-fed-s-approval-of-banco-de-credito-del-peru-means-for-your-mortgage-and",
        destination: "/blog/fed-bank-mergers-approvals",
        permanent: true,
      },
      {
        source: "/blog/fed-board-resignation-shakes-markets-how-to-protect-your-mortgage-affordability-",
        destination: "/blog/fed-personnel-and-policy",
        permanent: true,
      },
      {
        source: "/blog/fed-chair-change-how-powell-s-pro-tempore-role-and-warsh-s-appointment-could-imp",
        destination: "/blog/fed-personnel-and-policy",
        permanent: true,
      },
      {
        source: "/blog/bowman-s-fed-speech-on-banking-future-what-it-means-for-your-mortgage-and-saving",
        destination: "/blog/fed-personnel-and-policy",
        permanent: true,
      },
      {
        source: "/blog/blackrock-s-saigal-sees-fed-rate-cut-ahead-what-it-means-for-your-mortgage-and-s",
        destination: "/blog/fed-personnel-and-policy",
        permanent: true,
      },
      {
        source: "/blog/stock-market-week-ahead-nvidia-alphabet-earnings-atlanta-fed-how-to-protect-your",
        destination: "/blog/fed-stock-market-and-bonds",
        permanent: true,
      },
      {
        source: "/blog/rising-bond-yields-and-stock-market-drop-how-fed-hike-anxiety-impacts-your-mortg",
        destination: "/blog/fed-stock-market-and-bonds",
        permanent: true,
      },
      {
        source: "/blog/ecb-rate-hike-2025-how-a-modest-increase-affects-your-mortgage-and-savings",
        destination: "/blog/global-central-banks",
        permanent: true,
      },
      {
        source: "/blog/ecb-rate-hike-impact-on-mortgages-how-to-protect-your-finances",
        destination: "/blog/global-central-banks",
        permanent: true,
      },
      // Phase 39.4: Thin evergreen posts (<500w) → hubs/calcs
      {
        source: "/blog/retire-by-40-calculator-how-much-needed",
        destination: "/blog/fed-and-your-savings-investments",
        permanent: true,
      },
      {
        source: "/blog/monthly-mortgage-payment-formula-tax-insurance",
        destination: "/calculators/mortgage-calculator",
        permanent: true,
      },
      {
        source: "/blog/200k-mortgage-payment-30-years",
        destination: "/calculators/mortgage-calculator",
        permanent: true,
      },
      {
        source: "/blog/how-much-mortgage-afford-100k-salary",
        destination: "/calculators/mortgage-affordability",
        permanent: true,
      },
      {
        source: "/blog/20000-loan-5-years-8-percent-monthly-payment",
        destination: "/calculators/loan-calculator",
        permanent: true,
      },
      {
        source: "/blog/investment-calculator-withdrawals",
        destination: "/calculators/investment-return",
        permanent: true,
      },
      {
        source: "/blog/treasury-selloff-hits-mortgages-how-to-protect-your-home-loan",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/housing-affordability-breakthrough-how-new-policies-could-impact-your-mortgage-a",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
      {
        source: "/blog/stablecoin-regulation-and-your-mortgage-what-the-genius-act-means-for-homeowner",
        destination: "/blog/fed-enforcement-actions",
        permanent: true,
      },
      {
        source: "/blog/investing-cybersecurity-stocks-are-surging-one-looks-promising",
        destination: "/blog/fed-and-your-savings-investments",
        permanent: true,
      },
      // Phase 39.4: Remaining NJ posts (month-year slugs)
      {
        source: "/blog/fed-minutes-march-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
        destination: "/blog/fomc-rate-decisions-explained",
        permanent: true,
      },
      {
        source: "/blog/fed-minutes-april-2026-what-the-fomc-decision-means-for-your-mortgage-and-saving",
        destination: "/blog/fomc-rate-decisions-explained",
        permanent: true,
      },
      {
        source: "/blog/mortgage-rates-june-2026-current-rates-home-affordability-calculator",
        destination: "/blog/fed-and-your-mortgage",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
