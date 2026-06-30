"use client";

import { FormEvent, useMemo, useState } from "react";

import { AdminSelect } from "@/components/AdminSelect";
import { ArticleBody } from "@/components/ArticleBody";
import { MediaPicker } from "@/components/MediaPicker";
import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import {
  blocksToHtml,
  blocksToPlainText,
  createInitialBlocks,
  createWysiwygBlock,
  getFirstImageUrl,
  type ImageAlign,
  type ImageBlock,
  type ImageSize,
  type TextBlock,
  type TextAlign,
  type WysiwygBlock,
  type WysiwygBlockType,
} from "@/lib/wysiwyg-content";
import type { MediaFile } from "@/types/cms";

type SaveMode = "draft" | "published";
type SaveState = { type: "idle" | "success" | "error"; message: string };

const blockMenu: Array<{ type: WysiwygBlockType; label: string }> = [
  { type: "paragraph", label: "문단" },
  { type: "heading", label: "소제목" },
  { type: "image", label: "이미지" },
  { type: "youtube", label: "유튜브" },
  { type: "quote", label: "인용문" },
  { type: "divider", label: "구분선" },
  { type: "table", label: "표" },
  { type: "button", label: "버튼" },
  { type: "ad", label: "광고" },
  { type: "toc", label: "목차" },
];

const imageAlignOptions: Array<{ value: ImageAlign; label: string }> = [
  { value: "left", label: "왼쪽" },
  { value: "center", label: "가운데" },
  { value: "right", label: "오른쪽" },
  { value: "full", label: "전체폭" },
];

const imageSizeOptions: Array<{ value: ImageSize; label: string }> = [
  { value: "small", label: "작게" },
  { value: "medium", label: "보통" },
  { value: "large", label: "크게" },
  { value: "full", label: "전체" },
];

const textAlignOptions: Array<{ value: TextAlign; label: string }> = [
  { value: "left", label: "왼쪽" },
  { value: "center", label: "가운데" },
  { value: "right", label: "오른쪽" },
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

function isTextBlock(block: WysiwygBlock): block is TextBlock {
  return block.type === "paragraph" || block.type === "heading" || block.type === "quote";
}

const editorTextAlignClass: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const editorToolbarButtonClass =
  "min-h-9 rounded border border-zinc-700 px-3 text-xs font-bold text-zinc-200 transition hover:border-red-700 hover:bg-zinc-900";

const editorToolbarRedButtonClass =
  "min-h-9 rounded bg-red-700 px-3 text-xs font-bold text-white transition hover:bg-red-600";

function imageClass(block: ImageBlock) {
  const size = {
    small: "max-w-sm",
    medium: "max-w-2xl",
    large: "max-w-4xl",
    full: "w-full max-w-none",
  }[block.size];

  const align = {
    left: "mr-auto",
    center: "mx-auto",
    right: "ml-auto",
    full: "mx-auto w-full max-w-none",
  }[block.align];

  return `${size} ${align}`;
}

export function PostEditor() {
  const defaultCategory = siteConfig.categories[0]?.id ?? "news";
  const [title, setTitle] = useState("");
  const [blocks, setBlocks] = useState<WysiwygBlock[]>(createInitialBlocks);
  const [activeBlockId, setActiveBlockId] = useState(blocks[0]?.id ?? "");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"featured" | "block" | null>(null);
  const [pendingMode, setPendingMode] = useState<SaveMode | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });
  const isSupabaseReady = useMemo(() => Boolean(supabase), []);
  const articleHtml = useMemo(() => blocksToHtml(blocks), [blocks]);
  const activeBlock = blocks.find((block) => block.id === activeBlockId);

  function updateBlock(id: string, patch: Partial<WysiwygBlock>) {
    setBlocks((current) =>
      current.map((block) => (block.id === id ? ({ ...block, ...patch } as WysiwygBlock) : block)),
    );
  }

  function addBlock(type: WysiwygBlockType, afterId = activeBlockId) {
    const nextBlock = createWysiwygBlock(type);

    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === afterId);

      if (index < 0) {
        return [...current, nextBlock];
      }

      return [...current.slice(0, index + 1), nextBlock, ...current.slice(index + 1)];
    });
    setActiveBlockId(nextBlock.id);

    if (type === "image") {
      setPickerTarget("block");
    }
  }

  function moveBlock(id: string, direction: -1 | 1) {
    setBlocks((current) => {
      const index = current.findIndex((block) => block.id === id);
      const target = index + direction;

      if (index < 0 || target < 0 || target >= current.length) {
        return current;
      }

      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function deleteBlock(id: string) {
    setBlocks((current) => {
      const next = current.filter((block) => block.id !== id);
      const fallback = next[0] ?? createWysiwygBlock("paragraph");
      setActiveBlockId(fallback.id);
      return next.length > 0 ? next : [fallback];
    });
  }

  function applyInline(tag: "strong" | "em" | "u" | "a") {
    if (!activeBlock || !isTextBlock(activeBlock)) {
      return;
    }

    const label = tag === "strong" ? "굵은 텍스트" : tag === "em" ? "기울임 텍스트" : tag === "u" ? "밑줄 텍스트" : "링크 텍스트";
    const value =
      tag === "a"
        ? `<a href="https://" class="text-red-500 underline">${label}</a>`
        : `<${tag}>${label}</${tag}>`;

    updateBlock(activeBlock.id, { content: `${activeBlock.content}${activeBlock.content ? " " : ""}${value}` });
  }

  function selectMedia(asset: MediaFile) {
    if (pickerTarget === "featured") {
      setFeaturedImage(asset);
      setPickerTarget(null);
      return;
    }

    const currentImage = blocks.find((block): block is ImageBlock => block.id === activeBlockId && block.type === "image");
    const targetId = currentImage?.id ?? createWysiwygBlock("image").id;

    if (currentImage) {
      updateBlock(currentImage.id, {
        src: asset.webpUrl,
        alt: asset.alt || asset.title,
        caption: asset.title,
      } as Partial<WysiwygBlock>);
    } else {
      const imageBlock: ImageBlock = {
        id: targetId,
        type: "image",
        src: asset.webpUrl,
        alt: asset.alt || asset.title,
        caption: asset.title,
        align: "center",
        size: "large",
      };

      setBlocks((current) => {
        const index = current.findIndex((block) => block.id === activeBlockId);
        return index < 0 ? [...current, imageBlock] : [...current.slice(0, index + 1), imageBlock, ...current.slice(index + 1)];
      });
      setActiveBlockId(imageBlock.id);
    }

    setPickerTarget(null);
  }

  async function savePost(event: FormEvent<HTMLFormElement>, mode: SaveMode) {
    event.preventDefault();
    setSaveState({ type: "idle", message: "" });

    if (!supabase) {
      setSaveState({ type: "error", message: "Supabase 환경변수가 없어 저장할 수 없습니다." });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
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
    const body = blocksToHtml(blocks);
    const plainText = blocksToPlainText(blocks);

    if (!title.trim()) {
      setSaveState({ type: "error", message: "제목은 필수입니다. 제목만 입력해도 임시 저장할 수 있습니다." });
      return;
    }

    if (mode === "published" && (!slug || !category || !plainText)) {
      setSaveState({ type: "error", message: "발행하려면 제목, slug, 카테고리, 본문을 모두 입력해야 합니다." });
      return;
    }

    setPendingMode(mode);

    const firstImage = getFirstImageUrl(blocks);
    const imageUrl = featuredImage?.webpUrl ?? firstImage;
    const summary = excerpt || plainText.slice(0, 140);
    const payload = {
      title: title.trim(),
      slug,
      category_id: category,
      body,
      content_blocks: blocks,
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
    };

    let { error } = await supabase.from("posts").insert(payload);

    if (error && error.message.toLowerCase().includes("content_blocks")) {
      const { content_blocks: _contentBlocks, ...fallbackPayload } = payload;
      const fallbackResult = await supabase.from("posts").insert(fallbackPayload);
      error = fallbackResult.error;
    }

    setPendingMode(null);

    if (error) {
      setSaveState({ type: "error", message: `저장 실패: ${error.message}` });
      return;
    }

    setSaveState({ type: "success", message: mode === "published" ? "발행 완료" : "임시 저장 완료" });
    form.reset();
    setTitle("");
    setBlocks(createInitialBlocks());
    setFeaturedImage(null);
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
        void savePost(event, submitter?.value === "published" ? "published" : "draft");
      }}
    >
      <div className="sticky top-0 z-30 -mx-4 border-b border-zinc-800 bg-black/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => addBlock("heading")} className={editorToolbarButtonClass}>제목</button>
            <button type="button" onClick={() => addBlock("paragraph")} className={editorToolbarButtonClass}>본문</button>
            <button type="button" onClick={() => applyInline("strong")} className={editorToolbarButtonClass}>B</button>
            <button type="button" onClick={() => applyInline("em")} className={`${editorToolbarButtonClass} italic`}>I</button>
            <button type="button" onClick={() => applyInline("u")} className={`${editorToolbarButtonClass} underline`}>U</button>
            <button type="button" onClick={() => applyInline("a")} className={editorToolbarButtonClass}>링크</button>
            {textAlignOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (activeBlock && isTextBlock(activeBlock)) {
                    updateBlock(activeBlock.id, { align: option.value } as Partial<WysiwygBlock>);
                  }
                }}
                className={editorToolbarButtonClass}
              >
                {option.label}
              </button>
            ))}
            <button type="button" onClick={() => setPickerTarget("block")} className={editorToolbarRedButtonClass}>이미지</button>
            <button type="button" onClick={() => addBlock("youtube")} className={editorToolbarButtonClass}>유튜브</button>
            <button type="button" onClick={() => addBlock("quote")} className={editorToolbarButtonClass}>인용</button>
            <button type="button" onClick={() => addBlock("divider")} className={editorToolbarButtonClass}>구분선</button>
            <button type="button" onClick={() => addBlock("table")} className={editorToolbarButtonClass}>표</button>
            <button type="button" onClick={() => addBlock("button")} className={editorToolbarButtonClass}>버튼</button>
            <button type="button" onClick={() => addBlock("ad")} className={editorToolbarButtonClass}>광고</button>
            <button type="button" onClick={() => addBlock("toc")} className={editorToolbarButtonClass}>목차</button>
          </div>
          <div className="flex gap-2">
            <button type="submit" name="intent" value="draft" disabled={pendingMode !== null || !isSupabaseReady} className="min-h-10 rounded border border-zinc-700 px-4 text-sm font-bold text-zinc-200 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50">
              {pendingMode === "draft" ? "저장 중..." : "임시 저장"}
            </button>
            <button type="submit" name="intent" value="published" disabled={pendingMode !== null || !isSupabaseReady} className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
              {pendingMode === "published" ? "발행 중..." : "발행하기"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <main className="min-w-0">
          <section className="mx-auto max-w-4xl rounded-lg border border-zinc-800 bg-zinc-200 p-3 shadow-2xl shadow-black/40 md:p-6">
            <div className="min-h-[760px] rounded bg-white px-5 py-8 text-zinc-950 shadow-sm md:px-12 md:py-10">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                name="title"
                placeholder="제목을 입력하세요"
                className="w-full border-0 border-b border-zinc-200 bg-transparent px-0 pb-5 text-4xl font-black leading-tight text-zinc-950 outline-none placeholder:text-zinc-300"
              />

              <div className="mt-8 grid gap-4">
                {blocks.map((block, index) => (
                  <article
                    key={block.id}
                    onClick={() => setActiveBlockId(block.id)}
                    className={`group relative rounded-lg border p-3 transition ${
                      activeBlockId === block.id ? "border-red-300 bg-red-50/50" : "border-transparent hover:border-zinc-200"
                    }`}
                  >
                    <div className="absolute -left-11 top-3 hidden flex-col gap-1 md:flex">
                      <button type="button" onClick={() => addBlock("paragraph", block.id)} className="size-8 rounded-full border border-zinc-300 bg-white text-lg font-black text-zinc-700 shadow-sm hover:border-red-500 hover:text-red-600">+</button>
                    </div>
                    <div className="absolute right-2 top-2 hidden gap-1 group-hover:flex">
                      <button type="button" onClick={() => moveBlock(block.id, -1)} disabled={index === 0} className="block-control">↑</button>
                      <button type="button" onClick={() => moveBlock(block.id, 1)} disabled={index === blocks.length - 1} className="block-control">↓</button>
                      <button type="button" onClick={() => deleteBlock(block.id)} className="block-control text-red-600">삭제</button>
                    </div>
                    <EditableBlock block={block} updateBlock={updateBlock} openMedia={() => setPickerTarget("block")} />
                  </article>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-2 border-t border-dashed border-zinc-200 pt-5">
                {blockMenu.map((item) => (
                  <button key={item.type} type="button" onClick={() => addBlock(item.type)} className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-bold text-zinc-700 hover:border-red-500 hover:text-red-600">
                    + {item.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-zinc-800 bg-black/45 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">실제 글 미리보기</h2>
              <span className="text-xs text-zinc-500">상세 페이지와 같은 렌더러 사용</span>
            </div>
            <ArticleBody content={articleHtml} />
          </section>
        </main>

        <aside className="grid h-fit gap-4">
          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-bold text-white">발행 설정</h2>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-semibold text-zinc-300">
                Slug
                <input name="slug" placeholder="movie-review-slug" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <AdminSelect
                label="카테고리"
                name="category"
                defaultValue={defaultCategory}
                options={siteConfig.categories.map((category) => ({ label: category.label, value: category.id }))}
              />
              <label className="block text-sm font-semibold text-zinc-300">
                태그
                <input name="tags" placeholder="리뷰, OTT, 액션" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                요약 설명
                <textarea name="excerpt" rows={3} placeholder="목록과 SEO에 표시될 짧은 설명" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-bold text-white">대표 이미지</h2>
            <p className="mt-1 text-xs text-zinc-500">{featuredImage?.title ?? "선택한 이미지가 없습니다. 본문 첫 이미지가 자동 사용됩니다."}</p>
            {featuredImage ? <img src={featuredImage.thumbnailUrl} alt={featuredImage.alt} className="mt-3 aspect-video w-full rounded object-cover" /> : null}
            <button type="button" onClick={() => setPickerTarget("featured")} className="mt-3 w-full rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700">
              미디어에서 선택
            </button>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-bold text-white">SEO</h2>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-semibold text-zinc-300">
                SEO 제목
                <input name="seoTitle" placeholder="검색 결과 제목" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                메타 설명
                <textarea name="metaDescription" rows={3} placeholder="검색 결과 설명" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-bold text-white">기타</h2>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-semibold text-zinc-300">
                작성자
                <input name="author" defaultValue="편집부" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                발행일
                <input name="publishedAt" type="date" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                읽는 시간
                <input name="readTime" placeholder="5분" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <input type="checkbox" name="featured" className="size-4 accent-red-700" />
                추천 글로 표시
              </label>
            </div>
          </section>

          {!isSupabaseReady ? (
            <p className="rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-200">Supabase가 설정되지 않아 저장 버튼이 비활성화되었습니다.</p>
          ) : null}
          {saveState.message ? (
            <div className={`rounded-lg border p-4 text-sm font-bold ${saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"}`}>
              {saveState.message}
            </div>
          ) : null}
        </aside>
      </div>

      <MediaPicker
        open={pickerTarget !== null}
        title={pickerTarget === "featured" ? "대표 이미지 선택" : "본문 이미지 선택"}
        onClose={() => setPickerTarget(null)}
        onSelect={selectMedia}
      />
    </form>
  );
}

function EditableBlock({
  block,
  updateBlock,
  openMedia,
}: {
  block: WysiwygBlock;
  updateBlock: (id: string, patch: Partial<WysiwygBlock>) => void;
  openMedia: () => void;
}) {
  if (block.type === "paragraph") {
    return (
      <textarea
        value={block.content}
        onChange={(event) => updateBlock(block.id, { content: event.target.value } as Partial<WysiwygBlock>)}
        placeholder="본문을 입력하세요"
        rows={3}
      className={`w-full resize-none border-0 bg-transparent text-base leading-8 text-zinc-900 outline-none placeholder:text-zinc-300 ${editorTextAlignClass[block.align]}`}
      />
    );
  }

  if (block.type === "heading") {
    return (
      <div className="grid gap-2">
        <select
          value={block.level ?? 2}
          onChange={(event) => updateBlock(block.id, { level: Number(event.target.value) as 2 | 3 } as Partial<WysiwygBlock>)}
          className="w-fit rounded border border-zinc-300 bg-white px-2 py-1 text-xs font-bold text-zinc-700"
        >
          <option value={2}>큰 소제목</option>
          <option value={3}>작은 소제목</option>
        </select>
        <input
          value={block.content}
          onChange={(event) => updateBlock(block.id, { content: event.target.value } as Partial<WysiwygBlock>)}
          className={`w-full border-0 bg-transparent text-3xl font-black text-zinc-950 outline-none placeholder:text-zinc-300 ${editorTextAlignClass[block.align]}`}
        />
      </div>
    );
  }

  if (block.type === "quote") {
    return (
      <textarea
        value={block.content}
        onChange={(event) => updateBlock(block.id, { content: event.target.value } as Partial<WysiwygBlock>)}
        rows={3}
        className={`w-full resize-none border-l-4 border-red-600 bg-zinc-50 px-4 py-3 text-lg font-semibold leading-8 text-zinc-800 outline-none ${editorTextAlignClass[block.align]}`}
      />
    );
  }

  if (block.type === "image") {
    return (
      <div className="grid gap-4">
        {block.src ? (
          <figure className={imageClass(block)}>
            <img src={block.src} alt={block.alt} className="h-auto w-full rounded-lg border border-zinc-200 bg-zinc-100 object-contain" />
            {block.caption ? <figcaption className="mt-2 text-center text-sm text-zinc-500">{block.caption}</figcaption> : null}
          </figure>
        ) : (
          <button type="button" onClick={openMedia} className="min-h-[180px] rounded-lg border border-dashed border-zinc-300 bg-zinc-50 text-sm font-bold text-zinc-500 hover:border-red-500 hover:text-red-600">
            미디어 라이브러리에서 이미지 선택
          </button>
        )}
        <div className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-2">
          <label className="text-xs font-bold text-zinc-600">
            alt 텍스트
            <input value={block.alt} onChange={(event) => updateBlock(block.id, { alt: event.target.value } as Partial<WysiwygBlock>)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold text-zinc-600">
            캡션
            <input value={block.caption} onChange={(event) => updateBlock(block.id, { caption: event.target.value } as Partial<WysiwygBlock>)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold text-zinc-600">
            정렬
            <select value={block.align} onChange={(event) => updateBlock(block.id, { align: event.target.value as ImageAlign } as Partial<WysiwygBlock>)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm">
              {imageAlignOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold text-zinc-600">
            크기
            <select value={block.size} onChange={(event) => updateBlock(block.id, { size: event.target.value as ImageSize } as Partial<WysiwygBlock>)} className="mt-1 w-full rounded border border-zinc-300 px-3 py-2 text-sm">
              {imageSizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={openMedia} className="rounded bg-zinc-900 px-3 py-2 text-sm font-bold text-white md:col-span-2">다른 이미지 선택</button>
        </div>
      </div>
    );
  }

  if (block.type === "youtube") {
    const id = block.url.match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([^?&]+)/)?.[1];

    return (
      <div className="grid gap-3">
        <input value={block.url} onChange={(event) => updateBlock(block.id, { url: event.target.value } as Partial<WysiwygBlock>)} placeholder="YouTube URL" className="rounded border border-zinc-300 px-3 py-2 text-sm" />
        {id ? <iframe src={`https://www.youtube.com/embed/${id}`} title="YouTube preview" className="aspect-video w-full rounded-lg border border-zinc-200" /> : <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm font-bold text-zinc-500">유튜브 주소를 입력하면 미리보기가 표시됩니다.</div>}
        <input value={block.caption} onChange={(event) => updateBlock(block.id, { caption: event.target.value } as Partial<WysiwygBlock>)} placeholder="영상 캡션" className="rounded border border-zinc-300 px-3 py-2 text-sm" />
      </div>
    );
  }

  if (block.type === "divider") {
    return <hr className="my-6 border-zinc-300" />;
  }

  if (block.type === "table") {
    return (
      <textarea
        value={block.rows.map((row) => row.join(" | ")).join("\n")}
        onChange={(event) => updateBlock(block.id, { rows: event.target.value.split("\n").map((row) => row.split("|").map((cell) => cell.trim())) } as Partial<WysiwygBlock>)}
        rows={4}
        className="w-full rounded border border-zinc-300 bg-white px-3 py-2 font-mono text-sm"
      />
    );
  }

  if (block.type === "button") {
    return (
      <div className={`grid gap-3 ${editorTextAlignClass[block.align]}`}>
        <a href={block.url} className="inline-flex min-h-11 w-fit items-center justify-center rounded bg-red-700 px-5 text-sm font-black text-white">{block.label}</a>
        <div className="grid gap-2 md:grid-cols-3">
          <input value={block.label} onChange={(event) => updateBlock(block.id, { label: event.target.value } as Partial<WysiwygBlock>)} className="rounded border border-zinc-300 px-3 py-2 text-sm" />
          <input value={block.url} onChange={(event) => updateBlock(block.id, { url: event.target.value } as Partial<WysiwygBlock>)} className="rounded border border-zinc-300 px-3 py-2 text-sm md:col-span-2" />
        </div>
      </div>
    );
  }

  if (block.type === "ad") {
    return <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm font-bold text-zinc-500">AdSense Placeholder · {block.label}</div>;
  }

  return <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-5 text-sm font-bold text-zinc-600">목차 블록은 저장 시 소제목을 기준으로 자동 생성됩니다.</div>;
}
