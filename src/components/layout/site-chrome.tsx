'use client';

/**
 * Site chrome that must never appear inside an embedded widget.
 *
 * The root layout wraps every route, including /embed/[slug]. Without this gate,
 * a white-label calculator rendered in a customer's page also carried our
 * footer, our Adsterra banner, our PWA install prompt, our cookie-consent modal
 * and our analytics — on their domain, under their brand. That is unacceptable
 * for a product we charge $149 a month for: they paid to remove us, not to
 * inherit our advertising.
 *
 * /demo is included for the same reason: it is a sales preview opened by a
 * stranger from an email, and site chrome makes it look broken.
 */

import { usePathname } from 'next/navigation';
import { Analytics } from '@vercel/analytics/next';
import { SiteFooter } from '@/components/layout/site-footer';
import { AdsterraBanner } from '@/components/ads/adsterra-banner';
import { PWAInstallPrompt } from '@/components/ui/pwa-install-prompt';
import { ConsentBanner } from '@/components/ui/consent-banner';

const CHROMELESS_PREFIXES = ['/embed', '/demo'];

export function SiteChrome() {
  const pathname = usePathname();

  if (pathname && CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  return (
    <>
      <Analytics />
      <SiteFooter />
      <AdsterraBanner />
      <PWAInstallPrompt />
      <ConsentBanner />
    </>
  );
}
