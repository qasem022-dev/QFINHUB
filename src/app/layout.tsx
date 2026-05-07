import "@/styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/use-theme";
import { Toaster } from "@/components/ui/toast";
import { LocaleProvider } from "./i18n-provider";
import { defaultLocale, locales } from "@/lib/i18n";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "QFINHUB — Financial Tools Platform",
    template: "%s | QFINHUB",
  },
  description:
    "Professional financial calculators, AI-powered analysis, and comprehensive finance tools for investors and analysts.",
  keywords: [
    "finance",
    "calculators",
    "investment",
    "AI finance",
    "financial analysis",
    "loan calculator",
    "mortgage calculator",
    "retirement planning",
  ],
  authors: [{ name: "QFINHUB" }],
  creator: "QFINHUB",
  publisher: "QFINHUB",
  metadataBase: new URL("https://qfinhub.com"),
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
    title: "QFINHUB — Financial Tools Platform",
    description:
      "Professional financial calculators, AI-powered analysis, and comprehensive finance tools.",
    url: "https://qfinhub.com",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "QFINHUB — Financial Tools Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "QFINHUB — Financial Tools Platform",
    description:
      "Professional financial calculators, AI-powered analysis, and comprehensive finance tools.",
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
  url: "https://qfinhub.com",
  description:
    "Professional financial calculators, AI-powered analysis, and comprehensive finance tools for investors and analysts.",
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
    "60+ Financial Calculators",
    "AI Custom Specialist",
    "Multi-Language Support",
    "Embeddable Widgets",
    "Save & Dashboard",
    "Professional Design",
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
        {/* Hreflang tags for multi-language support */}
        {locales.map((locale) => (
          <link
            key={locale}
            rel="alternate"
            hrefLang={locale}
            href={`https://qfinhub.com/${locale}`}
          />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://qfinhub.com" />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-surface-dark dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider>
            {children}
          </LocaleProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
