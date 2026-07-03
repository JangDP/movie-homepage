import type { Metadata } from "next";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArticleGrid } from "@/components/ArticleGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { siteConfig } from "@/data/site-config";
import { getArticlesByCategory, getCategory } from "@/lib/content";
import { getCategoriesFromSupabase, getNavigationMenusFromSupabase } from "@/lib/cms-repository";
import { absoluteUrl, getSeoKeywords } from "@/lib/seo";
import type { Category, ContentCategory } from "@/types/site";

type CategoryPageProps = {
  categoryId: ContentCategory;
};

export function createCategoryMetadata(categoryId: ContentCategory): Metadata {
  const category = getCategory(categoryId);

  return {
    title: category?.label,
    description: category?.description,
    keywords: getSeoKeywords([category?.label, category?.description, "영화", "CineScope"]),
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

export async function resolveCategoryInfo(categoryId: ContentCategory): Promise<Category | null> {
  const staticCategory = getCategory(categoryId);

  if (staticCategory) {
    return staticCategory;
  }

  const normalizedCategory = normalizeRoute(String(categoryId));
  const categories = await getCategoriesFromSupabase();
  const category = categories.find((item) => {
    return normalizeRoute(String(item.id)) === normalizedCategory || normalizeRoute(item.href) === normalizedCategory;
  });

  if (category) {
    return category;
  }

  const menus = await getNavigationMenusFromSupabase();
  const menu = menus.find((item) => normalizeRoute(item.href) === normalizedCategory);

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

export async function createDynamicCategoryMetadata(categoryId: ContentCategory): Promise<Metadata> {
  const category = await resolveCategoryInfo(categoryId);
  const label = category?.label ?? String(categoryId);
  const href = category?.href ?? `/${categoryId}`;
  const description = category?.description || fallbackDescription(label);

  return {
    title: label,
    description,
    keywords: getSeoKeywords([label, description, "영화", "CineScope"]),
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

export async function CategoryPage({ categoryId }: CategoryPageProps) {
  const category = await resolveCategoryInfo(categoryId);
  const categoryArticles = await getArticlesByCategory(categoryId);
  const label = category?.label ?? String(categoryId);
  const description = category?.description || fallbackDescription(label);

  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={siteConfig.name}
          title={label}
          description={description}
        />
        <AdPlaceholder label={`${label} list AdSense slot`} />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ArticleGrid articles={categoryArticles} />
      </section>
    </main>
  );
}
