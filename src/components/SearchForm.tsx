import { ArticleGrid } from "@/components/ArticleGrid";
import { searchPosts } from "@/lib/content";

type SearchFormProps = {
  query?: string;
};

export async function SearchForm({ query = "" }: SearchFormProps) {
  const results = await searchPosts(query);

  return (
    <div className="space-y-8">
      <form action="/search" className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="영화 제목, 장르, 키워드, 작성자를 검색하세요"
          className="min-h-12 flex-1 rounded border border-zinc-800 bg-zinc-950 px-4 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700"
        />
        <button
          type="submit"
          className="min-h-12 rounded bg-red-700 px-6 text-sm font-bold text-white transition hover:bg-red-600"
        >
          검색
        </button>
      </form>
      <div className="flex items-center justify-between gap-3 border-b border-zinc-900 pb-4">
        <p className="text-sm text-zinc-400">
          {query ? `"${query}" 검색 결과` : "전체 글"} {results.length}개
        </p>
      </div>
      <ArticleGrid articles={results} />
    </div>
  );
}
