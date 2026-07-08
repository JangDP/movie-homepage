"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ArticleCard } from "@/components/ArticleCard";
import { siteConfig } from "@/data/site-config";
import { getCategory } from "@/lib/content";
import { formatPostDate, formatRelativeTime } from "@/lib/date-format";
import type { Article } from "@/types/site";

type ArticleViewMode = "card" | "list" | "compact" | "image";

type ArticleViewSwitcherProps = {
  articles: Article[];
};

const storageKey = "cinescope-article-view-mode";

const viewOptions: Array<{
  value: ArticleViewMode;
  label: string;
  icon: "grid" | "list" | "compact" | "image";
}> = [
  { value: "card", label: "카드형", icon: "grid" },
  { value: "list", label: "목록형", icon: "list" },
  { value: "compact", label: "썸네일형", icon: "compact" },
  { value: "image", label: "이미지형", icon: "image" },
];

function ViewIcon({ icon }: { icon: (typeof viewOptions)[number]["icon"] }) {
  if (icon === "grid") {
    return (
      <span className="grid size-5 grid-cols-2 gap-1" aria-hidden="true">
        <span className="rounded-sm bg-current" />
        <span className="rounded-sm bg-current" />
        <span className="rounded-sm bg-current" />
        <span className="rounded-sm bg-current" />
      </span>
    );
  }

  if (icon === "list") {
    return (
      <span className="grid size-5 gap-1" aria-hidden="true">
        <span className="h-1 rounded bg-current" />
        <span className="h-1 rounded bg-current" />
        <span className="h-1 rounded bg-current" />
      </span>
    );
  }

  if (icon === "compact") {
    return (
      <span className="grid size-5 gap-1" aria-hidden="true">
        <span className="h-2 rounded bg-current" />
        <span className="h-2 rounded bg-current opacity-60" />
      </span>
    );
  }

  return (
    <span className="relative flex size-5 items-center justify-center rounded bg-current" aria-hidden="true">
      <span className="ml-0.5 h-0 w-0 border-y-[5px] border-l-[7px] border-y-transparent border-l-black" />
    </span>
  );
}

function ArticleMeta({ article }: { article: Article }) {
  const relativeTime = formatRelativeTime(article.publishedAt);

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
      <span>{formatPostDate(article.publishedAt)}</span>
      {relativeTime ? (
        <>
          <span aria-hidden="true">/</span>
          <span>{relativeTime}</span>
        </>
      ) : null}
      <span aria-hidden="true">/</span>
      <span>조회수 {article.viewCount ?? 0}</span>
    </div>
  );
}

function ArticleThumb({ article, sizes }: { article: Article; sizes: string }) {
  const imageSrc = article.image || siteConfig.appearance.heroImage;

  return (
    <Image
      src={imageSrc}
      alt={article.imageAlt || article.title}
      fill
      sizes={sizes}
      className="object-cover transition duration-500 group-hover:scale-105"
    />
  );
}

function ListArticle({ article }: { article: Article }) {
  const category = getCategory(article.category);

  return (
    <article className="group border-b border-zinc-900 py-5 last:border-b-0">
      <Link href={`/${article.category}/${article.slug}`} className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
        <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-zinc-900">
          <ArticleThumb article={article} sizes="(max-width: 640px) 100vw, 180px" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-bold text-red-400">{category?.label ?? article.category}</p>
          <h3 className="mt-2 line-clamp-2 text-lg font-black leading-snug text-white group-hover:text-red-200">
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{article.excerpt}</p>
          <div className="mt-3">
            <ArticleMeta article={article} />
          </div>
        </div>
      </Link>
    </article>
  );
}

function CompactArticle({ article }: { article: Article }) {
  return (
    <article className="group border-b border-zinc-900 py-5 last:border-b-0">
      <Link href={`/${article.category}/${article.slug}`} className="grid grid-cols-[minmax(0,1fr)_120px] gap-4 sm:grid-cols-[minmax(0,1fr)_170px]">
        <div className="min-w-0">
          <h3 className="line-clamp-2 text-lg font-black leading-snug text-white group-hover:text-red-200">
            {article.title}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{article.excerpt}</p>
          <div className="mt-3">
            <ArticleMeta article={article} />
          </div>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-zinc-900 sm:aspect-[4/3]">
          <ArticleThumb article={article} sizes="170px" />
        </div>
      </Link>
    </article>
  );
}

function ImageArticle({ article }: { article: Article }) {
  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-900 bg-zinc-950">
      <Link href={`/${article.category}/${article.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-zinc-900 sm:aspect-[4/3]">
          <ArticleThumb article={article} sizes="(max-width: 640px) 50vw, 25vw" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3">
            <h3 className="line-clamp-2 text-sm font-black leading-snug text-white">{article.title}</h3>
          </div>
        </div>
      </Link>
    </article>
  );
}

export function ArticleViewSwitcher({ articles }: ArticleViewSwitcherProps) {
  const [viewMode, setViewMode] = useState<ArticleViewMode>("card");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey) as ArticleViewMode | null;

    if (saved === "card" || saved === "list" || saved === "compact" || saved === "image") {
      setViewMode(saved);
    }
  }, []);

  function changeViewMode(mode: ArticleViewMode) {
    setViewMode(mode);
    window.localStorage.setItem(storageKey, mode);
  }

  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
        표시할 글이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-800 bg-black/45 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-black text-white">전체글</h3>
          <p className="mt-1 text-xs text-zinc-500">원하는 보기 방식으로 글 목록을 확인하세요.</p>
        </div>
        <div className="flex items-center gap-2" aria-label="글 목록 보기 방식">
          {viewOptions.map((option) => {
            const active = viewMode === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => changeViewMode(option.value)}
                aria-pressed={active}
                title={option.label}
                className={`inline-flex size-10 items-center justify-center rounded border transition ${
                  active
                    ? "border-red-700 bg-red-700 text-white"
                    : "border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-600 hover:text-white"
                }`}
              >
                <ViewIcon icon={option.icon} />
                <span className="sr-only">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {viewMode === "card" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article, index) => (
            <ArticleCard key={article.id} article={article} priority={index < 2} />
          ))}
        </div>
      ) : null}

      {viewMode === "list" ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 sm:px-5">
          {articles.map((article) => (
            <ListArticle key={article.id} article={article} />
          ))}
        </div>
      ) : null}

      {viewMode === "compact" ? (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-4 sm:px-5">
          {articles.map((article) => (
            <CompactArticle key={article.id} article={article} />
          ))}
        </div>
      ) : null}

      {viewMode === "image" ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {articles.map((article) => (
            <ImageArticle key={article.id} article={article} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
