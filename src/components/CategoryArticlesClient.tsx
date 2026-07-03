"use client";

import { useEffect, useState } from "react";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArticleGrid } from "@/components/ArticleGrid";
import { SectionHeader } from "@/components/SectionHeader";
import { siteConfig } from "@/data/site-config";
import { fetchNavigationMenus } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { Article, Category, ContentCategory } from "@/types/site";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

type CategoryArticlesClientProps = {
  categoryId: ContentCategory;
  initialCategory: Category | null;
};

function normalizeRoute(value: string) {
  return value.replace(/^\/+|\/+$/g, "").toLowerCase();
}

function fallbackDescription(label: string) {
  return `${label} 관련 영화 이야기를 모아봅니다.`;
}

function mapPost(row: PostRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category_id,
    author: row.author ?? "편집부",
    publishedAt: row.published_at ?? row.created_at ?? "",
    readTime: row.read_time ?? "3분",
    image: row.thumbnail_url ?? "",
    imageAlt: row.image_alt ?? row.title,
    tags: row.tags ?? [],
    status: row.status,
    featured: row.featured ?? false,
    viewCount: row.view_count ?? 0,
  };
}

export function CategoryArticlesClient({ categoryId, initialCategory }: CategoryArticlesClientProps) {
  const [category, setCategory] = useState<Category | null>(initialCategory);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;
    const normalizedCategory = normalizeRoute(String(categoryId));

    async function loadCategoryInfo() {
      if (initialCategory) {
        return;
      }

      const menus = await fetchNavigationMenus();
      const menu = menus.find((item) => normalizeRoute(item.href) === normalizedCategory);

      if (isMounted && menu) {
        setCategory({
          id: categoryId,
          label: menu.label,
          href: menu.href,
          description: fallbackDescription(menu.label),
          order: menu.order,
          visible: menu.active !== false,
        });
      }
    }

    async function loadArticles() {
      if (!supabase) {
        setErrorMessage("Supabase 환경변수가 설정되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .eq("category_id", normalizedCategory)
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setArticles((data ?? []).map(mapPost));
      setIsLoading(false);
    }

    void loadCategoryInfo();
    void loadArticles();

    return () => {
      isMounted = false;
    };
  }, [categoryId, initialCategory]);

  const label = category?.label ?? String(categoryId);
  const description = category?.description || fallbackDescription(label);

  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <SectionHeader eyebrow={siteConfig.name} title={label} description={description} />
        <AdPlaceholder label={`${label} list AdSense slot`} />
      </section>
      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
            글을 불러오는 중입니다.
          </div>
        ) : errorMessage ? (
          <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-8 text-center text-sm text-red-200">
            글을 불러오지 못했습니다: {errorMessage}
          </div>
        ) : (
          <ArticleGrid articles={articles} />
        )}
      </section>
    </main>
  );
}
