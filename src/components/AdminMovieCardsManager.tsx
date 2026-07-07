"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { MediaPicker } from "@/components/MediaPicker";
import { MovieCard } from "@/components/MovieCard";
import { movies as fallbackMovies } from "@/data/movies";
import {
  createEmptyMovieCard,
  MOVIE_CARDS_SETTINGS_KEY,
  normalizeMovieCards,
} from "@/lib/movie-cards";
import { supabase } from "@/lib/supabase";
import { canManageAppearance } from "@/types/admin";
import type { MediaFile } from "@/types/cms";
import type { Movie } from "@/types/site";

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

const sourceOptions: Array<{ value: Movie["source"]; label: string }> = [
  { value: "theater", label: "극장" },
  { value: "ott", label: "OTT" },
  { value: "festival", label: "영화제" },
];

function genreToInput(movie: Movie) {
  return movie.genre.join(", ");
}

function inputToGenre(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function AdminMovieCardsManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageAppearance(adminUser.role);
  const [cards, setCards] = useState<Movie[]>(fallbackMovies);
  const [selectedId, setSelectedId] = useState<string | null>(fallbackMovies[0]?.id ?? null);
  const [pickerTargetId, setPickerTargetId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    let mounted = true;

    async function loadCards() {
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

      const nextCards = normalizeMovieCards(data?.value);
      setCards(nextCards);
      setSelectedId(nextCards[0]?.id ?? null);
    }

    void loadCards();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedCard = cards.find((card) => card.id === selectedId) ?? cards[0] ?? null;

  function updateCard(id: string, patch: Partial<Movie>) {
    setCards((current) => current.map((card) => (card.id === id ? { ...card, ...patch } : card)));
  }

  function addCard() {
    const nextCard = createEmptyMovieCard();
    setCards((current) => [...current, nextCard]);
    setSelectedId(nextCard.id);
  }

  function removeCard(id: string) {
    setCards((current) => {
      const nextCards = current.filter((card) => card.id !== id);
      setSelectedId(nextCards[0]?.id ?? null);
      return nextCards;
    });
  }

  function moveCard(id: string, direction: -1 | 1) {
    setCards((current) => {
      const index = current.findIndex((card) => card.id === id);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }

      const nextCards = [...current];
      const [item] = nextCards.splice(index, 1);
      nextCards.splice(target, 0, item);
      return nextCards;
    });
  }

  function selectMedia(asset: MediaFile) {
    if (!pickerTargetId) {
      return;
    }

    updateCard(pickerTargetId, {
      poster: asset.webpUrl || asset.originalUrl,
      posterAlt: asset.alt || asset.title,
    });
    setPickerTargetId(null);
  }

  async function saveCards() {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "영화 카드를 저장할 권한이 없습니다." });
      return;
    }

    const normalizedCards = normalizeMovieCards(cards);

    setPending(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: MOVIE_CARDS_SETTINGS_KEY, value: normalizedCards }, { onConflict: "key" });
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `영화 카드 저장 실패: ${error.message}` });
      return;
    }

    setCards(normalizedCards);
    setSaveState({ type: "success", message: "영화 카드가 저장되었습니다. 홈페이지 새로고침 후 반영됩니다." });
  }

  return (
    <div className="grid gap-5">
      {!canEdit ? (
        <p className="rounded border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
          editor 권한은 영화 카드를 수정할 수 없습니다.
        </p>
      ) : null}

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">영화 카드 목록</h2>
            <p className="mt-1 text-sm text-zinc-500">홈페이지 영화 카드 섹션에 노출될 카드를 관리합니다.</p>
          </div>
          <button
            type="button"
            disabled={!canEdit}
            onClick={addCard}
            className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            카드 추가
          </button>
        </div>

        <div className="mt-5 grid gap-2">
          {cards.map((card, index) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedId(card.id)}
              className={`flex items-center justify-between gap-3 rounded border px-4 py-3 text-left text-sm transition ${
                selectedCard?.id === card.id
                  ? "border-red-700 bg-red-950/30 text-white"
                  : "border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-red-800"
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate font-bold">
                  {index + 1}. {card.title || "제목 없음"}
                </span>
                <span className="mt-1 block truncate text-xs text-zinc-500">
                  {card.releaseLabel} / {card.genre.join(", ")}
                </span>
              </span>
              <span className="text-xs font-bold text-red-300">★ {card.rating.toFixed(1)}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedCard ? (
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-lg border border-zinc-800 bg-black/50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-black text-white">카드 내용 수정</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => moveCard(selectedCard.id, -1)}
                  className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50"
                >
                  위로
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => moveCard(selectedCard.id, 1)}
                  className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50"
                >
                  아래로
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => removeCard(selectedCard.id)}
                  className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/40 disabled:opacity-50"
                >
                  삭제
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-bold text-zinc-300">
                영화 제목
                <input
                  value={selectedCard.title}
                  onChange={(event) => updateCard(selectedCard.id, { title: event.target.value })}
                  disabled={!canEdit}
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                />
              </label>
              <label className="text-sm font-bold text-zinc-300">
                원제
                <input
                  value={selectedCard.originalTitle}
                  onChange={(event) => updateCard(selectedCard.id, { originalTitle: event.target.value })}
                  disabled={!canEdit}
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                />
              </label>
              <label className="text-sm font-bold text-zinc-300">
                상태 라벨
                <input
                  value={selectedCard.releaseLabel}
                  onChange={(event) => updateCard(selectedCard.id, { releaseLabel: event.target.value })}
                  disabled={!canEdit}
                  placeholder="극장 상영중, 7월 개봉, OTT 공개"
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                />
              </label>
              <label className="text-sm font-bold text-zinc-300">
                평점
                <input
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  value={selectedCard.rating}
                  onChange={(event) => updateCard(selectedCard.id, { rating: Number(event.target.value) })}
                  disabled={!canEdit}
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                />
              </label>
              <label className="text-sm font-bold text-zinc-300">
                장르
                <input
                  value={genreToInput(selectedCard)}
                  onChange={(event) => updateCard(selectedCard.id, { genre: inputToGenre(event.target.value) })}
                  disabled={!canEdit}
                  placeholder="액션, 드라마, SF"
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                />
              </label>
              <label className="text-sm font-bold text-zinc-300">
                출처 구분
                <select
                  value={selectedCard.source}
                  onChange={(event) => updateCard(selectedCard.id, { source: event.target.value as Movie["source"] })}
                  disabled={!canEdit}
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                >
                  {sourceOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-4 block text-sm font-bold text-zinc-300">
              소개 문구
              <textarea
                value={selectedCard.summary}
                onChange={(event) => updateCard(selectedCard.id, { summary: event.target.value })}
                disabled={!canEdit}
                rows={4}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
              <label className="text-sm font-bold text-zinc-300">
                포스터 이미지 URL
                <input
                  value={selectedCard.poster}
                  onChange={(event) => updateCard(selectedCard.id, { poster: event.target.value })}
                  disabled={!canEdit}
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
                />
              </label>
              <button
                type="button"
                disabled={!canEdit}
                onClick={() => setPickerTargetId(selectedCard.id)}
                className="self-end rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50"
              >
                미디어에서 선택
              </button>
            </div>

            <label className="mt-4 block text-sm font-bold text-zinc-300">
              이미지 alt 텍스트
              <input
                value={selectedCard.posterAlt}
                onChange={(event) => updateCard(selectedCard.id, { posterAlt: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>
          </div>

          <aside className="rounded-lg border border-zinc-800 bg-black/50 p-5">
            <h2 className="mb-4 text-lg font-black text-white">미리보기</h2>
            <MovieCard movie={selectedCard} />
          </aside>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={saveCards}
          disabled={!canEdit || pending}
          className="min-h-11 rounded bg-red-700 px-5 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "영화 카드 저장"}
        </button>
      </div>

      {saveState.message ? (
        <p
          className={`rounded border p-3 text-sm font-bold ${
            saveState.type === "success"
              ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
              : "border-red-900 bg-red-950/40 text-red-200"
          }`}
        >
          {saveState.message}
        </p>
      ) : null}

      <MediaPicker
        open={pickerTargetId !== null}
        title="영화 카드 포스터 선택"
        onClose={() => setPickerTargetId(null)}
        onSelect={selectMedia}
      />
    </div>
  );
}
