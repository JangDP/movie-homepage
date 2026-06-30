"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

import { AdminSelect } from "@/components/AdminSelect";
import { ArticleBody } from "@/components/ArticleBody";
import { MediaPicker } from "@/components/MediaPicker";
import { editorBlocks } from "@/data/editor-blocks";
import {
  createImageFigure,
  deleteImageBlock,
  parseImageBlocks,
  replaceImageBlock,
  type ImageAlign,
} from "@/lib/article-content";
import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import type { MediaFile } from "@/types/cms";

type SaveMode = "draft" | "published";

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

const alignOptions: Array<{ label: string; value: ImageAlign }> = [
  { label: "왼쪽", value: "left" },
  { label: "가운데", value: "center" },
  { label: "오른쪽", value: "right" },
  { label: "전체폭", value: "full" },
];

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
  const [body, setBody] = useState("");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"featured" | "body" | null>(null);
  const [pendingMode, setPendingMode] = useState<SaveMode | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });
  const isSupabaseReady = useMemo(() => Boolean(supabase), []);
  const imageBlocks = useMemo(() => parseImageBlocks(body), [body]);

  function insertAtCursor(value: string) {
    const textarea = bodyRef.current;

    if (!textarea) {
      setBody((current) => `${current}\n\n${value}\n\n`);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextBody = body.slice(0, start) + value + body.slice(end);

    setBody(nextBody);

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = start + value.length;
      textarea.selectionEnd = start + value.length;
    });
  }

  function selectMedia(asset: MediaFile) {
    if (pickerTarget === "body") {
      insertAtCursor(
        `\n\n${createImageFigure({
          src: asset.webpUrl,
          alt: asset.alt,
          align: "center",
        })}\n\n`,
      );
      return;
    }

    setFeaturedImage(asset);
  }

  function updateImageBlock(
    index: number,
    patch: Partial<{
      alt: string;
      caption: string;
      align: ImageAlign;
    }>,
  ) {
    const block = imageBlocks[index];

    if (!block) {
      return;
    }

    setBody((current) =>
      replaceImageBlock(current, index, {
        src: block.src,
        alt: patch.alt ?? block.alt,
        caption: patch.caption ?? block.caption,
        align: patch.align ?? block.align,
      }),
    );
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

    if (mode === "published" && (!slug || !category || !body.trim())) {
      setSaveState({
        type: "error",
        message: "발행하려면 제목, slug, 카테고리, 본문을 모두 입력해야 합니다.",
      });
      return;
    }

    setPendingMode(mode);

    const imageUrl = featuredImage?.webpUrl ?? null;
    const summary = excerpt || body.replace(/<figure[\s\S]*?<\/figure>/g, "").slice(0, 140);

    const { error } = await supabase.from("posts").insert({
      title,
      slug,
      category_id: category,
      body,
      excerpt: summary,
      author,
      published_at: publishedAt,
      read_time: readTime,
      thumbnail_url: imageUrl,
      image_alt: featuredImage?.alt ?? title,
      tags,
      status: mode,
      featured: formData.get("featured") === "on",
      seo_title: seoTitle || title,
      meta_description: metaDescription || summary,
      og_image_url: imageUrl,
    });

    setPendingMode(null);

    if (error) {
      setSaveState({ type: "error", message: `저장 실패: ${error.message}` });
      return;
    }

    setSaveState({ type: "success", message: mode === "published" ? "발행 완료" : "임시 저장 완료" });
    form.reset();
    setBody("");
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
                <p className="mt-1 text-sm text-zinc-500">이미지를 삽입하면 아래 미리보기와 이미지 블록 설정에 바로 표시됩니다.</p>
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
              <span className="text-xs font-bold text-red-500">본문 원본</span>
              <textarea
                ref={bodyRef}
                name="body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={10}
                placeholder="본문을 입력하세요. 이미지 삽입 버튼으로 원하는 위치에 이미지를 넣을 수 있습니다."
                className="mt-3 w-full rounded border border-zinc-800 bg-black px-4 py-3 text-sm leading-7 text-zinc-100 outline-none placeholder:text-zinc-600 focus:border-red-700"
              />
            </div>

            {imageBlocks.length > 0 ? (
              <div className="mt-5 grid gap-4">
                <h3 className="text-sm font-bold text-white">이미지 블록</h3>
                {imageBlocks.map((block) => (
                  <article key={`${block.src}-${block.index}`} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
                      <img src={block.src} alt={block.alt} className="aspect-video w-full rounded object-contain bg-black" />
                      <div className="grid gap-3">
                        <label className="block text-xs font-bold text-zinc-400">
                          alt 텍스트
                          <input
                            value={block.alt}
                            onChange={(event) => updateImageBlock(block.index, { alt: event.target.value })}
                            className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
                          />
                        </label>
                        <label className="block text-xs font-bold text-zinc-400">
                          캡션
                          <input
                            value={block.caption}
                            onChange={(event) => updateImageBlock(block.index, { caption: event.target.value })}
                            placeholder="이미지 아래에 표시할 설명"
                            className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
                          />
                        </label>
                        <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
                          <label className="block text-xs font-bold text-zinc-400">
                            정렬
                            <select
                              value={block.align}
                              onChange={(event) => updateImageBlock(block.index, { align: event.target.value as ImageAlign })}
                              className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
                            >
                              {alignOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </label>
                          <button
                            type="button"
                            onClick={() => setBody((current) => deleteImageBlock(current, block.index))}
                            className="self-end rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/50"
                          >
                            이미지 삭제
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : null}

            <div className="mt-5 rounded-lg border border-zinc-800 bg-black/60 p-5">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">본문 미리보기</h3>
                <span className="text-xs text-zinc-500">상세 페이지와 같은 렌더러 사용</span>
              </div>
              {body.trim() ? (
                <ArticleBody content={body} />
              ) : (
                <p className="text-sm text-zinc-500">본문을 입력하거나 이미지를 삽입하면 미리보기가 표시됩니다.</p>
              )}
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
