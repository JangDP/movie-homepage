import { movies as fallbackMovies } from "@/data/movies";
import type { Movie } from "@/types/site";

export const MOVIE_CARDS_SETTINGS_KEY = "movie_cards";

const movieSources = new Set<Movie["source"]>(["theater", "ott", "festival"]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function normalizeGenre(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function normalizeMovieCards(value: unknown): Movie[] {
  if (!Array.isArray(value)) {
    return fallbackMovies;
  }

  const cards = value
    .filter(isRecord)
    .map((item, index) => {
      const source = String(item.source ?? "theater") as Movie["source"];

      return {
        id: String(item.id ?? `movie-${index + 1}`),
        title: String(item.title ?? ""),
        originalTitle: String(item.originalTitle ?? ""),
        genre: normalizeGenre(item.genre),
        rating: Number.isFinite(Number(item.rating)) ? Number(item.rating) : 0,
        releaseLabel: String(item.releaseLabel ?? ""),
        poster: String(item.poster ?? ""),
        posterAlt: String(item.posterAlt ?? item.title ?? ""),
        summary: String(item.summary ?? ""),
        source: movieSources.has(source) ? source : "theater",
      };
    })
    .filter((item) => item.title.trim() || item.poster.trim());

  return cards.length > 0 ? cards : fallbackMovies;
}

export function createEmptyMovieCard(): Movie {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `movie-${Date.now()}`;

  return {
    id,
    title: "새 영화",
    originalTitle: "",
    genre: ["장르"],
    rating: 0,
    releaseLabel: "개봉 예정",
    poster: "",
    posterAlt: "영화 포스터",
    summary: "영화 소개를 입력하세요.",
    source: "theater",
  };
}
