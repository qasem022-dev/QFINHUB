/**
 * Layout for the white-label embed.
 *
 * This route used to re-render <html> and <body> and re-mount the providers,
 * which nested a second document inside the root layout's document — invalid
 * markup — while still inheriting every piece of site chrome from the root.
 *
 * The root layout now supplies the document, providers and fonts, and
 * <SiteChrome> hides the footer, ads, analytics, PWA prompt and consent banner
 * on /embed. This layout only needs to force noindex.
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="w-full bg-white dark:bg-surface-dark">{children}</div>;
}
