/**
 * White-label embed: licensing and per-client configuration.
 *
 * Server-only. License keys must never reach the browser bundle — the whole
 * commercial model is "free shows our badge, paid removes it", so validation
 * has to happen on the server or anyone can delete `?key=` and strip the badge.
 *
 * Clients are configured through the EMBED_CLIENTS env var (JSON array) so a new
 * customer is a config change rather than a deploy. When the list grows past a
 * handful, move this to a table.
 */

export type EmbedPlan = "free" | "demo" | "starter" | "institution";

export type EmbedClient = {
  /** License key handed to the customer. */
  key: string;
  /** Customer name, for our own logs. */
  name: string;
  plan: EmbedPlan;
  /**
   * Where captured leads are POSTed. Any URL that accepts JSON works —
   * Zapier, HubSpot, GoHighLevel, Slack, or the customer's own endpoint.
   */
  webhook?: string;
  /** Max calculators this licence may embed. */
  calculators?: number;
};

const PLAN_LIMITS: Record<EmbedPlan, number> = {
  free: 1,
  demo: 15,
  starter: 15,
  institution: Number.POSITIVE_INFINITY,
};

function parseClients(): EmbedClient[] {
  const raw = process.env.EMBED_CLIENTS;
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (c): c is EmbedClient =>
          !!c && typeof c.key === "string" && typeof c.name === "string",
      )
      .map((c) => ({
        ...c,
        plan: (c.plan ?? "free") as EmbedPlan,
        calculators: c.calculators ?? PLAN_LIMITS[(c.plan ?? "free") as EmbedPlan],
      }));
  } catch {
    // A malformed env var must not break the whole embed route.
    return [];
  }
}

export function getClients(): EmbedClient[] {
  return parseClients();
}

/** Returns the client for a key, or null. Constant-time-ish string compare. */
export function findClient(key: string | undefined | null): EmbedClient | null {
  if (!key || typeof key !== "string") return null;
  const trimmed = key.trim();
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(trimmed)) return null;

  const match = getClients().find((c) => c.key === trimmed) ?? null;
  return match;
}

/** A licence only counts as paid (badge-free) for the paid tiers. */
export function isPaidLicence(client: EmbedClient | null): boolean {
  return !!client && (client.plan === "starter" || client.plan === "institution");
}

/**
 * The badge comes off only for paying customers.
 *
 * `demo` is the shared preview licence used in sales emails: it may show the
 * full experience, including lead capture, but it keeps our badge so a preview
 * can never be mistaken for a licensed install.
 */
export function badgeAllowed(client: EmbedClient | null): boolean {
  return !isPaidLicence(client);
}

/** Lead capture is the paid feature — but demo licences may preview it. */
export function leadCaptureAllowed(client: EmbedClient | null): boolean {
  return !!client && client.plan !== "free";
}

/**
 * Sanitise the brand string. It is rendered into the customer's own page and
 * into our iframe, so anything that could break out of an attribute is dropped.
 */
export function cleanBrand(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .replace(/[<>"'`\\]/g, "")
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** Accept `0b5ea8`, `#0b5ea8`, `#0B5EA8`. Anything else falls back. */
export function cleanColor(input: unknown, fallback = "#2563eb"): string {
  if (typeof input !== "string") return fallback;
  const v = input.trim().replace(/^#/, "");
  return /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : fallback;
}
