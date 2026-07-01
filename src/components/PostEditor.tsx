"use client";

import { FormEvent, useMemo, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";

import { AdminSelect } from "@/components/AdminSelect";
import { ArticleBody } from "@/components/ArticleBody";
import { MediaPicker } from "@/components/MediaPicker";
import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import type { MediaFile } from "@/types/cms";

type SaveMode = "draft" | "published";
type SaveState = { type: "idle" | "success" | "error"; message: string };

const emptyContent = "<p></p>";

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

function getFirstImageFromHtml(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function ToolbarButton({
  active,
  disabled,
  children,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`min-h-9 rounded border px-3 text-xs font-black transition disabled:cursor-not-allowed disabled:opacity-40 ${
        active
          ? "border-red-700 bg-red-700 text-white"
          : "border-zinc-700 bg-black text-zinc-200 hover:border-red-700 hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({
  editor,
  onOpenMedia,
}: {
  editor: Editor | null;
  onOpenMedia: () => void;
}) {
  if (!editor) {
    return null;
  }

  function setLink() {
    const previousUrl = editor?.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요.", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      editor?.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor?.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function insertYoutube() {
    const url = window.prompt("YouTube URL을 입력하세요.");

    if (!url?.trim()) {
      return;
    }

    editor?.chain().focus().setYoutubeVideo({ src: url.trim(), width: 960, height: 540 }).run();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}>
        H1
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        H2
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
        H3
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("heading", { level: 4 })} onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}>
        H4
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("paragraph")} onClick={() => editor.chain().focus().setParagraph().run()}>
        본문
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        B
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        I
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}>
        U
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("link")} onClick={setLink}>
        링크
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}>
        왼쪽
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}>
        가운데
      </ToolbarButton>
      <ToolbarButton active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}>
        오른쪽
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        목록
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        번호
      </ToolbarButton>
      <ToolbarButton active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        인용
      </ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()}>
        구분선
      </ToolbarButton>
      <ToolbarButton onClick={onOpenMedia}>이미지</ToolbarButton>
      <ToolbarButton onClick={insertYoutube}>유튜브</ToolbarButton>
      <ToolbarButton onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>
        표
      </ToolbarButton>
      <ToolbarButton disabled={!editor.can().addColumnAfter()} onClick={() => editor.chain().focus().addColumnAfter().run()}>
        열+
      </ToolbarButton>
      <ToolbarButton disabled={!editor.can().addRowAfter()} onClick={() => editor.chain().focus().addRowAfter().run()}>
        행+
      </ToolbarButton>
    </div>
  );
}

export function PostEditor() {
  const defaultCategory = siteConfig.categories[0]?.id ?? "news";
  const [title, setTitle] = useState("");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"featured" | "body" | null>(null);
  const [pendingMode, setPendingMode] = useState<SaveMode | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });
  const [previewHtml, setPreviewHtml] = useState(emptyContent);
  const isSupabaseReady = useMemo(() => Boolean(supabase), []);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
        HTMLAttributes: {
          class: "text-red-500 underline decoration-red-500/60 underline-offset-4",
        },
      }),
      Image.configure({
        allowBase64: false,
        HTMLAttributes: {
          class: "mx-auto my-8 h-auto max-w-full rounded-lg border border-zinc-800 bg-zinc-950 object-contain",
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: "aspect-video w-full rounded-lg border border-zinc-800 bg-black",
        },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: "my-8 w-full border-collapse text-sm",
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: "border border-zinc-800 bg-zinc-900 px-4 py-3 text-left font-bold text-white",
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: "border border-zinc-800 bg-black/30 px-4 py-3 text-zinc-200",
        },
      }),
    ],
    content: emptyContent,
    editorProps: {
      attributes: {
        class:
          "cinescope-rich-content min-h-[760px] w-full max-w-none focus:outline-none",
      },
    },
    onUpdate({ editor: currentEditor }) {
      setPreviewHtml(currentEditor.getHTML());
    },
  });

  function selectMedia(asset: MediaFile) {
    if (pickerTarget === "featured") {
      setFeaturedImage(asset);
      setPickerTarget(null);
      return;
    }

    editor
      ?.chain()
      .focus()
      .setImage({ src: asset.webpUrl, alt: asset.alt || asset.title, title: asset.title })
      .run();
    setPickerTarget(null);
  }

  async function savePost(event: FormEvent<HTMLFormElement>, mode: SaveMode) {
    event.preventDefault();
    setSaveState({ type: "idle", message: "" });

    if (!supabase) {
      setSaveState({ type: "error", message: "Supabase 환경변수가 없어 저장할 수 없습니다." });
      return;
    }

    if (!editor) {
      setSaveState({ type: "error", message: "에디터가 아직 준비되지 않았습니다." });
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
    const html = editor.getHTML();
    const json = editor.getJSON();
    const text = editor.getText().trim();

    if (!title.trim()) {
      setSaveState({ type: "error", message: "제목은 필수입니다. 제목만 입력해도 임시 저장할 수 있습니다." });
      return;
    }

    if (mode === "published" && (!slug || !category || !text)) {
      setSaveState({ type: "error", message: "발행하려면 제목, slug, 카테고리, 본문을 모두 입력해야 합니다." });
      return;
    }

    setPendingMode(mode);

    const imageUrl = featuredImage?.webpUrl ?? getFirstImageFromHtml(html);
    const summary = excerpt || text.slice(0, 140);
    const payload = {
      title: title.trim(),
      slug,
      category_id: category,
      body: html,
      content_blocks: json,
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
    setFeaturedImage(null);
    editor.commands.setContent(emptyContent);
    setPreviewHtml(emptyContent);
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
        <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
          <EditorToolbar editor={editor} onOpenMedia={() => setPickerTarget("body")} />
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="min-w-0">
          <section className="mx-auto max-w-6xl rounded-lg border border-zinc-800 bg-zinc-200 p-3 shadow-2xl shadow-black/40 md:p-6">
            <div className="min-h-[920px] rounded bg-white px-5 py-8 text-zinc-950 shadow-sm md:px-14 md:py-12 xl:px-20">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                name="title"
                placeholder="제목을 입력하세요"
                className="w-full border-0 border-b border-zinc-200 bg-transparent px-0 pb-5 text-4xl font-black leading-tight text-zinc-950 outline-none placeholder:text-zinc-300"
              />
              <div className="mt-8">
                <EditorContent editor={editor} />
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-zinc-800 bg-black/45 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">실제 글 미리보기</h2>
              <span className="text-xs text-zinc-500">상세 페이지와 같은 스타일</span>
            </div>
            <ArticleBody content={previewHtml} />
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
