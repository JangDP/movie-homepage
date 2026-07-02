import Image from "next/image";
import Link from "next/link";

import { siteConfig } from "@/data/site-config";
import { getCategory } from "@/lib/content";
import type { Article } from "@/types/site";

type ArticleCardProps = {
  article: Article;
  priority?: boolean;
};

export function ArticleCard({ article, priority = false }: ArticleCardProps) {
  const category = getCategory(article.category);
  const imageSrc = article.image || siteConfig.appearance.heroImage;

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-red-700/70">
      <Link href={`/${article.category}/${article.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-900">
          <Image
            src={imageSrc}
            alt={article.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
            priority={priority}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <span className="absolute left-4 top-4 rounded bg-red-700 px-2.5 py-1 text-xs font-bold text-white">
            {category?.label ?? article.category}
          </span>
        </div>
        <div className="space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <span>{article.publishedAt}</span>
            <span aria-hidden="true">/</span>
            <span>{article.author}</span>
          </div>
          <h3 className="line-clamp-2 text-lg font-bold leading-snug text-zinc-50">
            {article.title}
          </h3>
          <p className="line-clamp-3 text-sm leading-6 text-zinc-400">
            {article.excerpt}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded border border-zinc-800 px-2 py-1 text-xs text-zinc-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </Link>
    </article>
  );
}
