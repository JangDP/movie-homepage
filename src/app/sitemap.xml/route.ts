import { siteConfig } from "@/data/site-config";
import { getPostsFromSupabase } from "@/lib/cms-repository";
import { absoluteUrl, escapeXml } from "@/lib/seo";

export const runtime = "edge";
export const dynamic = "force-dynamic";
export const revalidate = 0;

type SitemapEntry = {
  url: string;
  lastModified: string;
  changeFrequency: "daily" | "weekly";
  priority: number;
};

function staticEntries(): SitemapEntry[] {
  const routes = [
    "",
    "/search",
    "/about",
    "/contact",
    "/privacy",
    ...siteConfig.categories.map((category) => category.href),
  ];

  return routes.map((route) => ({
    url: absoluteUrl(route || "/"),
    lastModified: new Date().toISOString(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}

function renderSitemap(entries: SitemapEntry[]) {
  const urls = entries
    .map(
      (entry) => `<url>
  <loc>${escapeXml(entry.url)}</loc>
  <lastmod>${escapeXml(entry.lastModified)}</lastmod>
  <changefreq>${entry.changeFrequency}</changefreq>
  <priority>${entry.priority.toFixed(1)}</priority>
</url>`,
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export async function GET() {
  let entries = staticEntries();

  try {
    const posts = await getPostsFromSupabase({ status: "published" });
    const postEntries = posts.map<SitemapEntry>((post) => ({
      url: absoluteUrl(`/${post.category}/${post.slug}`),
      lastModified: post.publishedAt
        ? new Date(post.publishedAt).toISOString()
        : new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    entries = [...entries, ...postEntries];
  } catch (error) {
    console.error("[sitemap.xml]", error);
  }

  return new Response(renderSitemap(entries), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=300",
    },
  });
}
