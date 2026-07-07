import type { Metadata } from "next";

import { CategoryArticlesClient } from "@/components/CategoryArticlesClient";
import { siteConfig } from "@/data/site-config";
import { absoluteUrl, getSeoKeywords } from "@/lib/seo";
import type { Category, ContentCategory } from "@/types/site";

type CategoryPageProps = {
  categoryId: ContentCategory;
};

export function createCategoryMetadata(categoryId: ContentCategory): Metadata {
  const category = resolveStaticCategoryInfo(categoryId);

  return {
    title: category?.label,
    description: category?.description,
    keywords: getSeoKeywords([category?.label, category?.description, "영화", "시네마틱 유니버스"]),
    alternates: {
      canonical: category?.href ?? `/${categoryId}`,
    },
    openGraph: {
      title: `${category?.label ?? categoryId} | ${siteConfig.name}`,
      description: category?.description,
      url: absoluteUrl(category?.href ?? `/${categoryId}`),
      type: "website",
      images: [siteConfig.appearance.heroImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${category?.label ?? categoryId} | ${siteConfig.name}`,
      description: category?.description,
      images: [siteConfig.appearance.heroImage],
    },
  };
}

function normalizeRoute(value: string) {
  return value.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function fallbackDescription(label: string) {
  return `${label} 관련 영화 이야기를 모아봅니다.`;
}

export function resolveStaticCategoryInfo(categoryId: ContentCategory): Category | null {
  const staticCategory = siteConfig.categories.find((category) => category.id === categoryId);

  if (staticCategory) {
    return staticCategory;
  }

  const normalizedCategory = normalizeRoute(String(categoryId));
  const menu = siteConfig.menus.find((item) => normalizeRoute(item.href) === normalizedCategory);

  if (!menu) {
    return null;
  }

  return {
    id: categoryId,
    label: menu.label,
    href: menu.href,
    description: fallbackDescription(menu.label),
    order: menu.order,
    visible: menu.active !== false,
  };
}

export function createDynamicCategoryMetadata(categoryId: ContentCategory): Metadata {
  const category = resolveStaticCategoryInfo(categoryId);
  const label = category?.label ?? String(categoryId);
  const href = category?.href ?? `/${categoryId}`;
  const description = category?.description || fallbackDescription(label);

  return {
    title: label,
    description,
    keywords: getSeoKeywords([label, description, "영화", "시네마틱 유니버스"]),
    alternates: {
      canonical: href,
    },
    openGraph: {
      title: `${label} | ${siteConfig.name}`,
      description,
      url: absoluteUrl(href),
      type: "website",
      images: [siteConfig.appearance.heroImage],
    },
    twitter: {
      card: "summary_large_image",
      title: `${label} | ${siteConfig.name}`,
      description,
      images: [siteConfig.appearance.heroImage],
    },
  };
}

export function CategoryPage({ categoryId }: CategoryPageProps) {
  return <CategoryArticlesClient categoryId={categoryId} initialCategory={resolveStaticCategoryInfo(categoryId)} />;
}
