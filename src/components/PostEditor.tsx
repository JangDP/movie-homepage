"use client";

import { FormEvent, useMemo, useState } from "react";
import { NodeSelection } from "@tiptap/pm/state";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import StarterKit from "@tiptap/starter-kit";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Youtube from "@tiptap/extension-youtube";
import { Table } from "@tiptap/extension-table";

import { AdminSelect } from "@/components/AdminSelect";
import { ArticleBody } from "@/components/ArticleBody";
import { MediaPicker } from "@/components/MediaPicker";
import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import {
  CinescopeImage,
  type CinescopeCaptionSize,
  type CinescopeImageAlign,
  type CinescopeImageAttrs,
  type CinescopeImageSize,
} from "@/lib/tiptap-cinescope-image";
import type { MediaFile } from "@/types/cms";

type SaveMode = "draft" | "published";
type SaveState = { type: "idle" | "success" | "error"; message: string };
type SelectedImage = { pos: number; attrs: CinescopeImageAttrs };

const emptyContent = "<p></p>";

const imageAlignOptions: Array<{ value: CinescopeImageAlign; label: string }> = [
  { value: "left", label: "왼쪽" },
  { value: "center", label: "가운데" },
  { value: "right", label: "오른쪽" },
  { value: "full", label: "전체폭" },
];

const imageSizeOptions: Array<{ value: CinescopeImageSize; label: string }> = [
  { value: "small", label: "작게" },
  { value: "medium", label: "보통" },
  { value: "large", label: "크게" },
  { value: "full", label: "전체폭" },
];

const captionSizeOptions: Array<{ value: CinescopeCaptionSize; label: string }> = [
  { value: "small", label: "작게" },
  { value: "normal", label: "보통" },
  { value: "large", label: "크게" },
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

function getFirstImageFromHtml(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function getSelectedImage(editor: Editor): SelectedImage | null {
  const { selection } = editor.state;

  if (selection instanceof NodeSelection && selection.node.type.name === "cinescopeImage") {
    return {
      pos: selection.from,
      attrs: selection.node.attrs as CinescopeImageAttrs,
    };
  }

  return null;
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

  const currentEditor = editor;

  function setLink() {
    const previousUrl = currentEditor.getAttributes("link").href as string | undefined;
    const url = window.prompt("링크 URL을 입력하세요.", previousUrl ?? "https://");

    if (url === null) {
      return;
    }

    if (!url.trim()) {
      currentEditor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    currentEditor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }

  function insertYoutube() {
    const url = window.prompt("YouTube URL을 입력하세요.");

    if (!url?.trim()) {
      return;
    }

    currentEditor.chain().focus().setYoutubeVideo({ src: url.trim(), width: 960, height: 540 }).run();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ToolbarButton active={currentEditor.isActive("heading", { level: 1 })} onClick={() => currentEditor.chain().focus().toggleHeading({ level: 1 }).run()}>H1</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("heading", { level: 2 })} onClick={() => currentEditor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("heading", { level: 3 })} onClick={() => currentEditor.chain().focus().toggleHeading({ level: 3 }).run()}>H3</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("heading", { level: 4 })} onClick={() => currentEditor.chain().focus().toggleHeading({ level: 4 }).run()}>H4</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("paragraph")} onClick={() => currentEditor.chain().focus().setParagraph().run()}>본문</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("bold")} onClick={() => currentEditor.chain().focus().toggleBold().run()}>B</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("italic")} onClick={() => currentEditor.chain().focus().toggleItalic().run()}>I</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("underline")} onClick={() => currentEditor.chain().focus().toggleUnderline().run()}>U</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("link")} onClick={setLink}>링크</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive({ textAlign: "left" })} onClick={() => currentEditor.chain().focus().setTextAlign("left").run()}>왼쪽</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive({ textAlign: "center" })} onClick={() => currentEditor.chain().focus().setTextAlign("center").run()}>가운데</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive({ textAlign: "right" })} onClick={() => currentEditor.chain().focus().setTextAlign("right").run()}>오른쪽</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("bulletList")} onClick={() => currentEditor.chain().focus().toggleBulletList().run()}>목록</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("orderedList")} onClick={() => currentEditor.chain().focus().toggleOrderedList().run()}>번호</ToolbarButton>
      <ToolbarButton active={currentEditor.isActive("blockquote")} onClick={() => currentEditor.chain().focus().toggleBlockquote().run()}>인용</ToolbarButton>
      <ToolbarButton onClick={() => currentEditor.chain().focus().setHorizontalRule().run()}>구분선</ToolbarButton>
      <ToolbarButton onClick={onOpenMedia}>이미지</ToolbarButton>
      <ToolbarButton onClick={insertYoutube}>유튜브</ToolbarButton>
      <ToolbarButton onClick={() => currentEditor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>표</ToolbarButton>
      <ToolbarButton disabled={!currentEditor.can().addColumnAfter()} onClick={() => currentEditor.chain().focus().addColumnAfter().run()}>열+</ToolbarButton>
      <ToolbarButton disabled={!currentEditor.can().addRowAfter()} onClick={() => currentEditor.chain().focus().addRowAfter().run()}>행+</ToolbarButton>
    </div>
  );
}

function ImageEditPanel({
  editor,
  selectedImage,
  onChange,
  onOpenMedia,
}: {
  editor: Editor | null;
  selectedImage: SelectedImage | null;
  onChange: (selectedImage: SelectedImage | null) => void;
  onOpenMedia: () => void;
}) {
  if (!editor || !selectedImage) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
        <h2 className="text-sm font-bold text-white">이미지 편집</h2>
        <p className="mt-2 text-xs leading-5 text-zinc-500">본문 이미지를 클릭하면 alt, 캡션, 정렬, 크기를 수정할 수 있습니다.</p>
      </section>
    );
  }

  const currentEditor = editor;
  const currentImage = selectedImage;

  function updateImage(patch: Partial<CinescopeImageAttrs>) {
    currentEditor.commands.updateAttributes("cinescopeImage", patch);
    const next = getSelectedImage(currentEditor);
    onChange(next);
  }

  function deleteImage() {
    currentEditor.chain().focus().deleteSelection().run();
    onChange(null);
  }

  function moveImage(direction: -1 | 1) {
    const { state, view } = currentEditor;
    const node = state.doc.nodeAt(currentImage.pos);

    if (!node) {
      return;
    }

    const items: Array<{ pos: number; size: number }> = [];
    state.doc.forEach((child: { nodeSize: number }, offset: number) => {
      items.push({ pos: offset, size: child.nodeSize });
    });

    const index = items.findIndex((item) => item.pos === currentImage.pos || item.pos + 1 === currentImage.pos);
    const target = index + direction;

    if (index < 0 || target < 0 || target >= items.length) {
      return;
    }

    const current = items[index];
    const targetItem = items[target];
    let insertPos = direction < 0 ? targetItem.pos : targetItem.pos + targetItem.size;
    let tr = state.tr.delete(current.pos, current.pos + node.nodeSize);

    if (insertPos > current.pos) {
      insertPos -= node.nodeSize;
    }

    tr = tr.insert(insertPos, node).setSelection(NodeSelection.create(tr.doc, insertPos));
    view.dispatch(tr);
    onChange(getSelectedImage(currentEditor));
  }

  const attrs = currentImage.attrs;

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
      <h2 className="text-sm font-bold text-white">이미지 편집</h2>
      <div className="mt-4 grid gap-4">
        <label className="block text-xs font-bold text-zinc-400">
          alt 텍스트
          <input value={attrs.alt ?? ""} onChange={(event) => updateImage({ alt: event.target.value })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
        </label>
        <label className="block text-xs font-bold text-zinc-400">
          캡션
          <input value={attrs.caption ?? ""} onChange={(event) => updateImage({ caption: event.target.value })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block text-xs font-bold text-zinc-400">
            정렬
            <select value={attrs.align ?? "center"} onChange={(event) => updateImage({ align: event.target.value as CinescopeImageAlign })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700">
              {imageAlignOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-zinc-400">
            크기
            <select value={attrs.size ?? "large"} onChange={(event) => updateImage({ size: event.target.value as CinescopeImageSize })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700">
              {imageSizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block text-xs font-bold text-zinc-400">
            캡션 색상
            <input type="color" value={attrs.captionColor ?? "#6b7280"} onChange={(event) => updateImage({ captionColor: event.target.value })} className="mt-1 h-10 w-full rounded border border-zinc-800 bg-black px-2" />
          </label>
          <label className="block text-xs font-bold text-zinc-400">
            캡션 크기
            <select value={attrs.captionSize ?? "normal"} onChange={(event) => updateImage({ captionSize: event.target.value as CinescopeCaptionSize })} className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700">
              {captionSizeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => updateImage({ captionBold: !attrs.captionBold })} className={`rounded border px-3 py-2 text-xs font-bold ${attrs.captionBold ? "border-red-700 bg-red-700 text-white" : "border-zinc-700 text-zinc-200"}`}>캡션 굵게</button>
          <button type="button" onClick={() => updateImage({ captionItalic: !attrs.captionItalic })} className={`rounded border px-3 py-2 text-xs font-bold italic ${attrs.captionItalic ? "border-red-700 bg-red-700 text-white" : "border-zinc-700 text-zinc-200"}`}>캡션 기울임</button>
        </div>
        <div className="grid gap-2">
          <button type="button" onClick={onOpenMedia} className="rounded border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-200 hover:border-red-700">다른 이미지 선택</button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => moveImage(-1)} className="rounded border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-200 hover:border-red-700">위로 이동</button>
            <button type="button" onClick={() => moveImage(1)} className="rounded border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-200 hover:border-red-700">아래로 이동</button>
          </div>
          <button type="button" onClick={deleteImage} className="rounded border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/50">이미지 삭제</button>
        </div>
      </div>
    </section>
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
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
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
      CinescopeImage,
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
        class: "cinescope-rich-content min-h-[760px] w-full max-w-none focus:outline-none",
      },
    },
    onUpdate({ editor: currentEditor }) {
      setPreviewHtml(currentEditor.getHTML());
      setSelectedImage(getSelectedImage(currentEditor));
    },
    onSelectionUpdate({ editor: currentEditor }) {
      setSelectedImage(getSelectedImage(currentEditor));
    },
  });

  function selectMedia(asset: MediaFile) {
    if (pickerTarget === "featured") {
      setFeaturedImage(asset);
      setPickerTarget(null);
      return;
    }

    if (editor && selectedImage) {
      editor.commands.updateAttributes("cinescopeImage", {
        src: asset.webpUrl,
        alt: asset.alt || asset.title,
        caption: selectedImage.attrs.caption || asset.title,
      });
      setSelectedImage(getSelectedImage(editor));
    } else {
      editor
        ?.chain()
        .focus()
        .insertContent({
          type: "cinescopeImage",
          attrs: {
            src: asset.webpUrl,
            alt: asset.alt || asset.title,
            caption: asset.title,
            align: "center",
            size: "large",
            captionColor: "#6b7280",
            captionSize: "normal",
            captionBold: false,
            captionItalic: false,
          },
        })
        .run();
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
    setSelectedImage(null);
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
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
          <ImageEditPanel
            editor={editor}
            selectedImage={selectedImage}
            onChange={setSelectedImage}
            onOpenMedia={() => setPickerTarget("body")}
          />

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
