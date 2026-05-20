import { blogPosts } from "@/lib/blog/posts";

const BASE_URL = "https://www.qfinhub.com";

export async function GET() {
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

  // Only articles from last 2 days (Google News requirement)
  const recentPosts = blogPosts.filter(
    (post) => new Date(post.publishedAt) >= twoDaysAgo
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${recentPosts
  .map(
    (post) => `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <news:news>
      <news:publication>
        <news:name>QFINHUB</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${
        new Date(post.publishedAt).toISOString().split("T")[0]
      }</news:publication_date>
      <news:title>${escapeXml(post.title)}</news:title>
    </news:news>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
