import { siteConfig } from "@/data/site-config";
import type { Category, Post } from "@/types/site";

export const siteUrl = siteConfig.url.replace(/\/$/, "");

export function absoluteUrl(path = "/") {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function postUrl(post: Pick<Post, "category" | "slug">) {
  return absoluteUrl(`/${post.category}/${post.slug}`);
}

export function getSeoKeywords(values: Array<string | string[] | undefined | null>) {
  return values
    .flatMap((value) => (Array.isArray(value) ? value : value ? [value] : []))
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 12);
}

export function getPostDescription(post: Post) {
  return post.excerpt || `${post.title} - ${post.category} 영화 매거진 글`;
}

export function getPostKeywords(post: Post, categoryLabel?: string) {
  return getSeoKeywords([post.title, categoryLabel, post.category, post.tags, "영화", "리뷰", "CineScope"]);
}

export function createWebsiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteUrl,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function createOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteUrl,
    logo: absoluteUrl("/icon.png"),
    sameAs: siteConfig.socialLinks.map((link) => link.href),
  };
}

export function createBreadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function createArticleJsonLd(post: Post, category?: Category | null) {
  const url = postUrl(post);
  const image = post.image ? absoluteUrl(post.image) : absoluteUrl(siteConfig.appearance.heroImage);

  return {
    "@context": "https://schema.org",
    "@type": post.category === "reviews" ? "ReviewNewsArticle" : "Article",
    headline: post.title,
    description: getPostDescription(post),
    image,
    url,
    mainEntityOfPage: url,
    datePublished: post.publishedAt || undefined,
    dateModified: post.publishedAt || undefined,
    articleSection: category?.label ?? post.category,
    keywords: getPostKeywords(post, category?.label).join(", "),
    author: {
      "@type": "Person",
      name: post.author || siteConfig.name,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/icon.png"),
      },
    },
  };
}

export function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
