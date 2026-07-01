import type { MetadataRoute } from "next";

import { siteConfig } from "@/data/site-config";
import { getPostsFromSupabase } from "@/lib/cms-repository";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/search",
    "/about",
    "/contact",
    "/privacy",
    ...siteConfig.categories.map((category) => category.href),
  ];

  const posts = await getPostsFromSupabase({ status: "published" });
  const postRoutes = posts.map((post) => `/${post.category}/${post.slug}`);

  return [...staticRoutes, ...postRoutes].map((route) => ({
    url: absoluteUrl(route || "/"),
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : route.includes("-") ? 0.6 : 0.7,
  }));
}
