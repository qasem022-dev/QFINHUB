import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCalculatorBySlug } from "@/lib/calculators";
import { EmbedShell } from "./embed-shell";
import {
  badgeAllowed,
  cleanBrand,
  cleanColor,
  findClient,
  isPaidLicence,
  leadCaptureAllowed,
} from "@/lib/embed/clients";

/**
 * White-label embed target.
 *
 *   /embed/mortgage-calculator?brand=Acme%20CU&color=0b5ea8&key=LICENCE&leads=1
 *
 * Licence-gated parameters are resolved HERE, on the server. `?key=` decides
 * whether the QFINHUB badge is rendered and whether lead capture is available;
 * doing that in the client component would let anyone strip the badge by reading
 * the bundle.
 */

// Branding and licence state vary per request, so this cannot be statically cached.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function EmbedPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const calculator = getCalculatorBySlug(slug);
  if (!calculator) notFound();

  const client = findClient(first(sp.key));
  const paid = isPaidLicence(client);

  // A paid licence may default its branding to the customer's own name.
  const requestedBrand = cleanBrand(first(sp.brand));
  const brand = requestedBrand || (paid && client ? cleanBrand(client.name) : "");
  const color = cleanColor(first(sp.color));

  // Only paid licences may hide the badge or capture leads, whatever the URL says.
  const showBadge = badgeAllowed(client);
  const leadCapture = leadCaptureAllowed(client) && first(sp.leads) === "1";

  return (
    <EmbedShell
      slug={slug}
      title={calculator.title}
      brand={brand}
      color={color}
      showBadge={showBadge}
      leadCapture={leadCapture}
      // Only pass the key through when it is genuinely paid, so a bogus key is
      // never echoed into the page or attached to a lead.
      licenceKey={paid && client ? client.key : ""}
    />
  );
}
