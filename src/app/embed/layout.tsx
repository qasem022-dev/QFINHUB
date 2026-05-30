/**
 * Minimal layout for embed routes.
 * Strips out site navigation, footer, ads, consent banners.
 * Keeps ThemeProvider + LocaleProvider so calculator components work.
 */
import type { Metadata } from "next";
import { ThemeProvider } from "@/hooks/use-theme";
import { LocaleProvider } from "@/app/i18n-provider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  robots: "noindex, follow",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex, follow" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className="min-h-screen bg-white font-sans text-gray-900 antialiased dark:bg-surface-dark dark:text-gray-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
