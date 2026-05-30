/**
 * /news-sitemap.xml — Recent blog posts sitemap
 *
 * V2 Correction (May 30): Was a Google News sitemap (xmlns:news) that was
 * empty because no blog posts were published in the last 2 days (Blog Agent
 * paused). GSC reported "Missing XML tag" for the empty news namespace.
 *
 * NOW: Normal XML sitemap of blog posts from the last 30 days.
 * QFINHUB is not approved for Google News — no news namespace.
 */
import { blogPosts } from "@/lib/blog/posts";

const BASE_URL = "https://www.qfinhub.com";

export async function GET() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPosts = blogPosts.filter(
    (post) => new Date(post.publishedAt) >= thirtyDaysAgo
  );

  // If no recent posts, include the 6 most recent posts as fallback
  // so the sitemap is never completely empty
  const posts =
    recentPosts.length > 0
      ? recentPosts
      : blogPosts.slice(0, 6);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${posts
  .map(
    (post) => `  <url>
    <loc>${BASE_URL}/blog/${post.slug}</loc>
    <lastmod>${
      new Date(post.publishedAt).toISOString().split("T")[0]
    }</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
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
