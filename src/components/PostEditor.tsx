"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

import { AdminSelect } from "@/components/AdminSelect";
import { MediaPicker } from "@/components/MediaPicker";
import { editorBlocks } from "@/data/editor-blocks";
import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import type { MediaFile } from "@/types/cms";

type SaveMode = "draft" | "published";

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

function slugify(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `draft-${Date.now()}`;
}

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export function PostEditor() {
  const defaultCategory = siteConfig.categories[0]?.id ?? "news";
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"featured" | "body" | null>(null);
  const [pendingMode, setPendingMode] = useState<SaveMode | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });
  const isSupabaseReady = useMemo(() => Boolean(supabase), []);

  function insertAtCursor(value: string) {
    const textarea = bodyRef.current;

    if (!textarea) {
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.value = textarea.value.slice(0, start) + value + textarea.value.slice(end);
    textarea.focus();
    textarea.selectionStart = start + value.length;
    textarea.selectionEnd = start + value.length;
  }

  function selectMedia(asset: MediaFile) {
    if (pickerTarget === "body") {
      insertAtCursor(`\n\n![${asset.alt}](${asset.webpUrl})\n\n`);
      return;
    }

    setFeaturedImage(asset);
  }

  async function savePost(event: FormEvent<HTMLFormElement>, mode: SaveMode) {
    event.preventDefault();
    setSaveState({ type: "idle", message: "" });

    if (!supabase) {
      setSaveState({
        type: "error",
        message: "Supabase 환경변수가 없어 저장할 수 없습니다.",
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = getValue(formData, "title");
    const inputSlug = getValue(formData, "slug");
    const category = getValue(formData, "category") || defaultCategory;
    const body = getValue(formData, "body");
    const excerpt = getValue(formData, "excerpt");
    const author = getValue(formData, "author") || "편집부";
    const readTime = getValue(formData, "readTime") || "3분";
    const seoTitle = getValue(formData, "seoTitle");
    const metaDescription = getValue(formData, "metaDescription");
    const tags = getValue(formData, "tags")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const publishedAt = getValue(formData, "publishedAt") || new Date().toISOString().slice(0, 10);
    const slug = mode === "draft" ? inputSlug || slugify(title) : inputSlug;

    if (!title) {
      setSaveState({
        type: "error",
        message: "제목은 필수입니다. 제목만 입력해도 임시 저장할 수 있습니다.",
      });
      return;
    }

    if (mode === "published" && (!slug || !category || !body)) {
      setSaveState({
        type: "error",
        message: "발행하려면 제목, slug, 카테고리, 본문을 모두 입력해야 합니다.",
      });
      return;
    }

    setPendingMode(mode);

    const imageUrl = featuredImage?.webpUrl ?? null;

    const { error } = await supabase.from("posts").insert({
      title,
      slug,
      category_id: category,
      body,
      excerpt: excerpt || body.slice(0, 140),
      author,
      published_at: publishedAt,
      read_time: readTime,
      thumbnail_url: imageUrl,
      image_alt: featuredImage?.alt ?? title,
      tags,
      status: mode,
      featured: formData.get("featured") === "on",
      seo_title: seoTitle || title,
      meta_description: metaDescription || excerpt || body.slice(0, 140),
      og_image_url: imageUrl,
    });

    setPendingMode(null);

    if (error) {
      setSaveState({ type: "error", message: `저장 실패: ${error.message}` });
      return;
    }

    setSaveState({ type: "success", message: mode === "published" ? "발행 완료" : "임시 저장 완료" });
    form.reset();
    setFeaturedImage(null);
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        void savePost(event, submitter?.value === "published" ? "published" : "draft");
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="grid gap-5">
          <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
            <div className="grid gap-5">
              <label className="block text-sm font-semibold text-zinc-300">
                제목
                <input name="title" placeholder="글 제목을 입력하세요" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
              </label>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="block text-sm font-semibold text-zinc-300">
                  Slug
                  <input name="slug" placeholder="movie-review-slug" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
                </label>
                <AdminSelect
                  label="카테고리"
                  name="category"
                  defaultValue={defaultCategory}
                  options={siteConfig.categories.map((category) => ({ label: category.label, value: category.id }))}
                />
              </div>
              <label className="block text-sm font-semibold text-zinc-300">
                태그
                <input name="tags" placeholder="리뷰, 누아르, OTT" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                요약 설명
                <textarea name="excerpt" rows={3} placeholder="목록과 SEO에 표시할 짧은 설명" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">본문 편집기</h2>
                <p className="mt-1 text-sm text-zinc-500">이미지 삽입 버튼으로 원하는 위치에 이미지를 넣을 수 있습니다.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPickerTarget("body")}
                  className="min-h-9 rounded bg-red-700 px-3 text-xs font-bold text-white transition hover:bg-red-600"
                >
                  이미지 삽입
                </button>
                {editorBlocks
                  .filter((block) => block.type !== "image")
                  .map((block) => (
                    <button key={block.id} type="button" title={block.description} className="min-h-9 rounded border border-zinc-700 px-3 text-xs font-bold text-zinc-200 transition hover:border-red-700 hover:bg-red-700 hover:text-white">
                      + {block.label}
                    </button>
                  ))}
              </div>
            </div>
            <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950 p-4">
              <span className="text-xs font-bold text-red-500">본문</span>
              <textarea ref={bodyRef} name="body" rows={12} placeholder="본문을 입력하세요. 발행하려면 본문이 필요합니다." className="mt-3 w-full rounded border border-zinc-800 bg-black px-4 py-3 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-700" />
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
            <h2 className="text-lg font-bold text-white">SEO</h2>
            <div className="mt-5 grid gap-5">
              <label className="block text-sm font-semibold text-zinc-300">
                SEO 제목
                <input name="seoTitle" placeholder="검색 결과에 표시할 제목" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                메타 설명
                <textarea name="metaDescription" rows={3} placeholder="검색 결과에 표시할 설명" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
              </label>
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <h2 className="text-sm font-bold text-white">발행 설정</h2>
          <div className="mt-4 grid gap-4">
            <div className="rounded border border-zinc-800 bg-black p-3">
              <p className="text-sm font-bold text-white">대표 이미지</p>
              <p className="mt-1 text-xs text-zinc-500">
                {featuredImage?.title ?? "선택된 이미지 없음"}
              </p>
              {featuredImage ? (
                <img src={featuredImage.thumbnailUrl} alt={featuredImage.alt} className="mt-3 aspect-video w-full rounded object-cover" />
              ) : null}
              <button
                type="button"
                onClick={() => setPickerTarget("featured")}
                className="mt-3 w-full rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
              >
                대표 이미지 선택
              </button>
            </div>
            <label className="block text-sm font-semibold text-zinc-300">
              작성자
              <input name="author" defaultValue="편집부" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
            </label>
            <label className="block text-sm font-semibold text-zinc-300">
              발행일
              <input name="publishedAt" type="date" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
            </label>
            <label className="block text-sm font-semibold text-zinc-300">
              읽는 시간
              <input name="readTime" placeholder="5분" className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-red-700" />
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
              <input type="checkbox" name="featured" className="size-4 accent-red-700" />
              추천 글로 표시
            </label>
          </div>
          <div className="mt-5 flex flex-col gap-2">
            <button type="submit" name="intent" value="draft" disabled={pendingMode !== null || !isSupabaseReady} className="min-h-10 rounded border border-zinc-700 px-4 text-sm font-bold text-zinc-200 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50">
              {pendingMode === "draft" ? "저장 중..." : "임시 저장"}
            </button>
            <button type="submit" name="intent" value="published" disabled={pendingMode !== null || !isSupabaseReady} className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
              {pendingMode === "published" ? "발행 중..." : "발행하기"}
            </button>
          </div>
          {!isSupabaseReady ? <p className="mt-3 rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-200">Supabase가 설정되지 않아 버튼이 비활성화되었습니다.</p> : null}
        </aside>
      </div>

      {saveState.message ? (
        <div className={`rounded-lg border p-4 text-sm font-bold ${saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"}`}>
          {saveState.message}
        </div>
      ) : null}
      <MediaPicker
        open={pickerTarget !== null}
        title={pickerTarget === "body" ? "본문 이미지 선택" : "대표 이미지 선택"}
        onClose={() => setPickerTarget(null)}
        onSelect={selectMedia}
      />
    </form>
  );
}
