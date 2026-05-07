import "@/styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/use-theme";

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
  ],
  authors: [{ name: "QFINHUB" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "QFINHUB",
    title: "QFINHUB — Financial Tools Platform",
    description:
      "Professional financial calculators, AI-powered analysis, and comprehensive finance tools.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-surface-dark dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
