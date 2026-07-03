import { siteConfig } from "@/data/site-config";
import { absoluteUrl, escapeXml, siteUrl } from "@/lib/seo";
import { fetchPublishedPostsLite } from "@/lib/supabase-rest-lite";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const posts = await fetchPublishedPostsLite(50);
  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/${post.category_id}/${post.slug}`);
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <description>${escapeXml(post.excerpt ?? "")}</description>
          <pubDate>${pubDate}</pubDate>
          <category>${escapeXml(String(post.category_id))}</category>
          ${post.thumbnail_url ? `<enclosure url="${escapeXml(absoluteUrl(post.thumbnail_url))}" type="image/jpeg" />` : ""}
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${escapeXml(siteConfig.name)}</title>
        <link>${escapeXml(siteUrl)}</link>
        <description>${escapeXml(siteConfig.description)}</description>
        <language>ko-KR</language>
        <atom:link href="${escapeXml(absoluteUrl("/rss.xml"))}" rel="self" type="application/rss+xml" />
        ${items}
      </channel>
    </rss>`;

  return new Response(xml.trim(), {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300",
    },
  });
}
