import { siteConfig } from "@/data/site-config";
import { getPostsFromSupabase } from "@/lib/cms-repository";
import { absoluteUrl, escapeXml, postUrl, siteUrl } from "@/lib/seo";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const posts = await getPostsFromSupabase({ status: "published", limit: 50 });
  const items = posts
    .map((post) => {
      const url = postUrl(post);
      const pubDate = post.publishedAt ? new Date(post.publishedAt).toUTCString() : new Date().toUTCString();

      return `
        <item>
          <title>${escapeXml(post.title)}</title>
          <link>${escapeXml(url)}</link>
          <guid isPermaLink="true">${escapeXml(url)}</guid>
          <description>${escapeXml(post.excerpt)}</description>
          <pubDate>${pubDate}</pubDate>
          <category>${escapeXml(String(post.category))}</category>
          ${post.image ? `<enclosure url="${escapeXml(absoluteUrl(post.image))}" type="image/jpeg" />` : ""}
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
