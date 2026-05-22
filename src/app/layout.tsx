import "@/styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "./i18n-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteFooter } from "@/components/layout/site-footer";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { ConsentBanner } from "@/components/ui/consent-banner";
import { AdsterraBanner } from "@/components/ads/adsterra-banner";
import { defaultLocale, locales } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
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
  authors: [{ name: "Qasem Mohammed", url: "https://qfinhub.com/about" }],
  creator: "Qasem Mohammed",
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
    google: "31q5DZ8DIMa5Mq_3HtJt1VyPSj-KqkkvFEf_zo9aQ-k",
    other: {
      "p:domain_verify": "4756ee5e97724d0b2403293fe43f64c3",
    },
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    languages: Object.fromEntries(
      locales.map((locale) => [locale, `/?lang=${locale}`])
    ),
    canonical: "/",
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

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "QFINHUB",
  url: baseUrl,
  logo: "https://www.qfinhub.com/logo.png",
  sameAs: [
    "https://x.com/qfinhub",
    "https://www.linkedin.com/company/qfinhub",
    "https://github.com/qfinhub",
  ],
  foundingDate: "2024",
  address: {
    "@type": "PostalAddress",
    streetAddress: "548 Market Street, PMB 72296",
    addressLocality: "San Francisco",
    addressRegion: "CA",
    postalCode: "94104-5401",
    addressCountry: "US",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "hello@qfinhub.com",
    availableLanguage: ["English"],
  },
  description:
    "Free online financial calculator platform with 124+ tools for loans, mortgages, investments, retirement, taxes, and personal finance.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning className={inter.variable}>
      <head>
        {/* DNS Preconnect — critical origins only */}
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        {/* Critical inline CSS — minimal, prevents CLS */}
        <style dangerouslySetInnerHTML={{ __html: `
          html{overflow-y:scroll;-webkit-text-size-adjust:100%;scroll-behavior:smooth}
          body{margin:0;-webkit-tap-highlight-color:transparent}
          input,textarea,select{font-size:16px}
          img{max-width:100%;height:auto}
        `}} />
        {/* Google Consent Mode v2 — inline, before gtag */}
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments)}
          gtag('consent','default',{
            'ad_storage':'denied','ad_user_data':'denied','ad_personalization':'denied',
            'analytics_storage':'denied','functionality_storage':'granted',
            'personalization_storage':'denied','security_storage':'granted','wait_for_update':500
          });
        `}} />
        {/* Google Analytics */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-ZL2W7KLRK8" />
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer=window.dataLayer||[];
          function gtag(){dataLayer.push(arguments)}
          gtag('js',new Date());
          gtag('config','G-ZL2W7KLRK8');
        `}} />
        {/* Organization JSON-LD */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        {/* Verification */}
        <meta name="google-adsense-account" content="ca-pub-1102790706635466" />
        <meta name="p:domain_verify" content="4756ee5e97724d0b2403293fe43f64c3" />
        {/* Hreflang — top 8 languages */}
        {["en","es","fr","de","it","pt","hi","zh"].map((locale) => (
          <link key={locale} rel="alternate" hrefLang={locale} href={`${baseUrl}/?lang=${locale}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href={baseUrl} />
        <link rel="manifest" href="/manifest.json" />
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
              <AdsterraBanner />
              <PWAInstallPrompt />
              <ConsentBanner />
            </AuthProvider>
          </LocaleProvider>
          <Toaster />
        </ThemeProvider>
        <script dangerouslySetInnerHTML={{ __html: `
          if("serviceWorker" in navigator){
            window.addEventListener("load",function(){
              navigator.serviceWorker.register("/sw.js").catch(function(){});
            });
          }
        `}} />
      </body>
    </html>
  );
}
