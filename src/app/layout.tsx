import "@/styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "./i18n-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { ConsentBanner } from "@/components/ui/consent-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { defaultLocale, locales, getLanguageCount } from "@/lib/i18n";
import { ALL_LANGUAGES, getNativeName } from "@/lib/i18n/languages";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const baseUrl = "https://www.qfinhub.com";

export const metadata: Metadata = {
  title: {
    default: "QFINHUB — Free Financial Calculators Online",
    template: "%s | QFINHUB",
  },
  description:
    "124 free financial calculators for loans, mortgages, investments, retirement, taxes, and personal finance. Fast, accurate, and 100% free — no sign-up required.",
  keywords: [
    "financial calculator",
    "loan calculator",
    "mortgage calculator",
    "investment calculator",
    "retirement calculator",
    "tax calculator",
    "compound interest calculator",
    "free finance tools",
  ],
  authors: [{ name: "QFINHUB" }],
  creator: "QFINHUB",
  publisher: "QFINHUB",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  verification: {
    google: "ca-pub-1102790706635466",
    other: {
      "p:domain_verify": "4756ee5e97724d0b2403293fe43f64c3",
    },
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `/${locale}`])
    ),
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "QFINHUB",
    title: "QFINHUB — Free Financial Calculators Online",
    description:
      "124 free financial calculators for loans, mortgages, investments, retirement, taxes, and personal finance.",
    url: baseUrl,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QFINHUB — Free Financial Calculators Online",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QFINHUB — Free Financial Calculators Online",
    description:
      "124 free financial calculators for loans, mortgages, investments, retirement, taxes, and personal finance.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "QFINHUB",
  url: baseUrl,
  description:
    "124 free financial calculators for loans, mortgages, investments, retirement, taxes, and personal finance.",
  applicationCategory: "FinanceApplication",
  operatingSystem: "All",
  browserRequirements: "Requires JavaScript",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Organization",
    name: "QFINHUB",
  },
  availableLanguage: ALL_LANGUAGES.map((l) => l.name),
  featureList: [
    "124 Financial Calculators",
    "AI Custom Calculator",
    "Multi-Language Support",
    "Export to PDF & Image",
    "Save & Dashboard",
    "Embeddable Widgets",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning className={inter.variable}>
      <head>
        {/* ════════════════════════════════════════════════
             Google Consent Mode v2 — MUST execute BEFORE
             gtag.js loads so that default consent signals
             are in place when the tag library initializes.
             ════════════════════════════════════════════════ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}

              // Consent defaults — denied for ads/analytics by default
              gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'functionality_storage': 'granted',
                'personalization_storage': 'denied',
                'security_storage': 'granted',
                'wait_for_update': 500,
              });
            `,
          }}
        />
        {/* Google tag (gtag.js) — Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZL2W7KLRK8" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ZL2W7KLRK8');
            `,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense site verification */}
        <meta name="google-adsense-account" content="ca-pub-1102790706635466" />
        {/* Google Search Console site verification */}
        <meta name="google-site-verification" content="31q5DZ8DIMa5Mq_3HtJt1VyPSj-KqkkvFEf_zo9aQ-k" />
        {/* Pinterest site verification — also set in metadata.other for SSR reliability */}
        <meta name="p:domain_verify" content="4756ee5e97724d0b2403293fe43f64c3" />
        {/* Hreflang tags for multi-language support */}
        {locales.map((locale) => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={`${baseUrl}/${locale}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />
        {/* Dual manifest references for browser compatibility */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="manifest" href="/site.webmanifest" />
        {/* iOS PWA / Add to Home Screen support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QFINHUB" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-startup-image" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-surface-dark dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider>
            <AuthProvider>
              {children}
              <SiteFooter />
              {/* Adsterra Native Banner */}
              <div className="w-full max-w-3xl mx-auto px-4 py-6 mt-8">
                <div id="container-93e6358fa4836a576dd463e0a148a834" />
              </div>
              <script
                async
                src="https://pl29448163.profitablecpmratenetwork.com/93e6358fa4836a576dd463e0a148a834/invoke.js"
              />
              <PWAInstallPrompt />
              <ConsentBanner />
            </AuthProvider>
          </LocaleProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        {/* Service Worker registration for PWA */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function() {
                  navigator.serviceWorker.register("/sw.js").then(function(reg) {
                    console.log("SW registered:", reg.scope);
                  }).catch(function(err) {
                    console.log("SW registration failed:", err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
