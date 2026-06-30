import Link from "next/link";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleGrid } from "@/components/ArticleGrid";
import { HeroBanner } from "@/components/HeroBanner";
import { MovieCard } from "@/components/MovieCard";
import { SectionHeader } from "@/components/SectionHeader";
import { movies } from "@/data/movies";
import { siteConfig } from "@/data/site-config";
import { getPostsFromSupabase } from "@/lib/cms-repository";
import { getFeaturedArticles } from "@/lib/content";

export default async function HomePage() {
  const [featured, latest] = await Promise.all([
    getFeaturedArticles(),
    getPostsFromSupabase({ status: "published", limit: 6 }),
  ]);
  const hero = {
    ...siteConfig.hero,
    image: siteConfig.appearance.heroImage,
  };
  const { visibleSections } = siteConfig.appearance;

  return (
    <main>
      <HeroBanner hero={hero} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <AdPlaceholder label="Home top responsive AdSense slot" />
      </section>

      {visibleSections.featured ? (
        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Featured"
            title="편집부 추천"
            description="이번 주 가장 먼저 읽어볼 만한 영화 이야기입니다."
          />
          <div className="grid gap-5 lg:grid-cols-2">
            {featured.map((article, index) => (
              <ArticleCard key={article.id} article={article} priority={index === 0} />
            ))}
          </div>
        </section>
      ) : null}

      {visibleSections.movies ? (
        <section className="border-y border-zinc-900 bg-black/35">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <SectionHeader
              eyebrow="Now Playing"
              title="영화 카드"
              description="극장, OTT, 영화제에서 눈여겨볼 작품을 카드 형태로 정리했습니다."
              href="/recommendations"
            />
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {visibleSections.latest ? (
        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <SectionHeader
            eyebrow="Latest"
            title="최신 글"
            description="뉴스, 리뷰, 가이드, 추천 글을 최신순으로 모았습니다."
            href="/search"
            linkLabel="글 검색"
          />
          <ArticleGrid articles={latest} />
        </section>
      ) : null}

      {visibleSections.categories ? (
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {siteConfig.categories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-5 transition hover:border-red-700 hover:bg-zinc-900"
              >
                <h2 className="text-lg font-black text-white">{category.label}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{category.description}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
