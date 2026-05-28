// V2 Correction Phase 3: Scenario sitemap removed.
// All hash-ID scenarios are noindexed except ~2 strong candidates.
// Return empty sitemap — no scenario pages should be indexed until 
// human-readable decision pages replace them.

export async function GET() {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
