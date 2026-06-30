import { ArticleCard } from "@/components/ArticleCard";
import type { Article } from "@/types/site";

type ArticleGridProps = {
  articles: Article[];
};

export function ArticleGrid({ articles }: ArticleGridProps) {
  if (articles.length === 0) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-zinc-400">
        표시할 글이 없습니다.
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <ArticleCard key={article.id} article={article} priority={index < 2} />
      ))}
    </div>
  );
}
