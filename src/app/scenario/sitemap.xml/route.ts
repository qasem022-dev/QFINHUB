import { readFileSync, existsSync } from "fs";
import { join } from "path";

const BASE_URL = "https://www.qfinhub.com";

interface ScenarioIndexEntry {
  batch: string;
  title: string;
  calculatorSlug: string;
  category: string;
}

export async function GET() {
  const indexPath = join(process.cwd(), "public", "data", "scenarios", "index.json");
  
  if (!existsSync(indexPath)) {
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>`,
      { headers: { "Content-Type": "application/xml" } }
    );
  }

  const index: Record<string, ScenarioIndexEntry> = JSON.parse(readFileSync(indexPath, "utf-8"));
  const slugs = Object.keys(index);
  
  // Generate sitemap XML
  const entries = slugs.map((slug) => {
    const entry = index[slug];
    return `  <url>
    <loc>${BASE_URL}/scenario/${slug}</loc>
    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
