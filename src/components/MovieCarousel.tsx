"use client";

import { useEffect, useMemo, useState } from "react";

import { MovieCard } from "@/components/MovieCard";
import { MOVIE_CARDS_SETTINGS_KEY, normalizeMovieCards } from "@/lib/movie-cards";
import { supabase } from "@/lib/supabase";
import type { Movie } from "@/types/site";

type MovieCarouselProps = {
  initialMovies: Movie[];
};

function getCardsPerPage() {
  if (typeof window === "undefined") {
    return 4;
  }

  if (window.innerWidth >= 1024) {
    return 4;
  }

  if (window.innerWidth >= 768) {
    return 3;
  }

  return 2;
}

export function MovieCarousel({ initialMovies }: MovieCarouselProps) {
  const [items, setItems] = useState(initialMovies);
  const [page, setPage] = useState(0);
  const [cardsPerPage, setCardsPerPage] = useState(4);

  useEffect(() => {
    setCardsPerPage(getCardsPerPage());

    function handleResize() {
      setCardsPerPage(getCardsPerPage());
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadMovieCards() {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", MOVIE_CARDS_SETTINGS_KEY)
        .maybeSingle();

      if (!mounted || error) {
        return;
      }

      setItems(normalizeMovieCards(data?.value));
    }

    void loadMovieCards();

    return () => {
      mounted = false;
    };
  }, []);

  const totalPages = Math.max(1, Math.ceil(items.length / cardsPerPage));
  const visibleItems = useMemo(() => {
    const safePage = Math.min(page, totalPages - 1);
    const start = safePage * cardsPerPage;
    return items.slice(start, start + cardsPerPage);
  }, [cardsPerPage, items, page, totalPages]);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages - 1));
  }, [totalPages]);

  function movePage(direction: -1 | 1) {
    setPage((current) => Math.min(Math.max(current + direction, 0), totalPages - 1));
  }

  return (
    <div className="relative">
      {items.length > cardsPerPage ? (
        <div className="mb-4 flex items-center justify-end gap-2">
          <span className="mr-2 text-xs font-bold text-zinc-500">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page <= 0}
            onClick={() => movePage(-1)}
            aria-label="이전 영화 카드"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-700 bg-black text-xl font-black text-zinc-200 transition hover:border-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ‹
          </button>
          <button
            type="button"
            disabled={page >= totalPages - 1}
            onClick={() => movePage(1)}
            aria-label="다음 영화 카드"
            className="inline-flex size-10 items-center justify-center rounded-full border border-zinc-700 bg-black text-xl font-black text-zinc-200 transition hover:border-red-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {visibleItems.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </div>
  );
}
