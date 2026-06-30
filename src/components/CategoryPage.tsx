import type { Metadata } from "next";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArticleGrid } from "@/components/ArticleGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { siteConfig } from "@/data/site-config";
import { getArticlesByCategory, getCategory } from "@/lib/content";
import type { ContentCategory } from "@/types/site";

type CategoryPageProps = {
  categoryId: ContentCategory;
};

export function createCategoryMetadata(categoryId: ContentCategory): Metadata {
  const category = getCategory(categoryId);

  return {
    title: category?.label,
    description: category?.description,
  };
}

export async function CategoryPage({ categoryId }: CategoryPageProps) {
  const category = getCategory(categoryId);
  const categoryArticles = await getArticlesByCategory(categoryId);

  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow={siteConfig.name}
          title={category?.label ?? categoryId}
          description={category?.description}
        />
        <AdPlaceholder label={`${category?.label ?? categoryId} list AdSense slot`} />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <ArticleGrid articles={categoryArticles} />
      </section>
    </main>
  );
}
