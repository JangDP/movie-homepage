"use client";

import { useEffect, useState } from "react";

import { ArticleViewSwitcher } from "@/components/ArticleViewSwitcher";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { Article } from "@/types/site";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

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

export function LatestArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadLatestArticles() {
      if (!supabase) {
        setErrorMessage("Supabase 환경변수가 설정되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .limit(12);

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

    void loadLatestArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-400">
        최신 글을 불러오는 중입니다.
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-lg border border-red-900/70 bg-red-950/30 p-8 text-center text-sm text-red-200">
        최신 글을 불러오지 못했습니다: {errorMessage}
      </div>
    );
  }

  return <ArticleViewSwitcher articles={articles} />;
}
