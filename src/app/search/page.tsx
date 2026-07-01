"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { SearchForm } from "@/components/SearchForm";

function SearchPageContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? undefined;

  return (
    <main className="min-h-screen pt-24">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">
            Search
          </p>
          <h1 className="text-3xl font-black text-white sm:text-4xl">영화 콘텐츠 검색</h1>
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">
            뉴스, 리뷰, 가이드, 추천 글을 키워드로 찾아보세요.
          </p>
        </div>
        <SearchForm query={query} />
      </section>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<main className="min-h-screen pt-24" />}>
      <SearchPageContent />
    </Suspense>
  );
}
