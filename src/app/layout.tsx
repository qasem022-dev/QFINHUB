import "@/styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import { PlausibleAnalytics } from "@/components/plausible-analytics";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "./i18n-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { defaultLocale, locales } from "@/lib/i18n";

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
    other: [
      {
        rel: "manifest",
        url: "/site.webmanifest",
      },
    ],
  },
  metadataBase: new URL(baseUrl),
  alternates: {
    canonical: "/",
    languages: {
      "en": "/en",
      "es": "/es",
      "hi": "/hi",
    },
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
  availableLanguage: ["English", "Spanish", "Hindi"],
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google AdSense — production only */}
        {process.env.NODE_ENV === "production" && (
          <Script
            src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1102790706635466"
            strategy="afterInteractive"
            crossOrigin="anonymous"
          />
        )}
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
        {/* iOS PWA / Add to Home Screen support */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="QFINHUB" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-surface-dark dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider>
            <AuthProvider>
              {children}
              <PWAInstallPrompt />
            </AuthProvider>
          </LocaleProvider>
          <Toaster />
        </ThemeProvider>
        <Analytics />
        {/* Plausible Analytics — production only */}
        {process.env.NODE_ENV === "production" && <PlausibleAnalytics />}
      </body>
    </html>
  );
}
