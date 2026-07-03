"use client";

import { FormEvent, type KeyboardEvent, useEffect, useMemo, useState } from "react";
import { Extension } from "@tiptap/core";
import type { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { NodeSelection, Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
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
import { fetchSpellCheckRules } from "@/lib/spell-check-rules";
import { supabase } from "@/lib/supabase";
import { fetchTags, type TagRow } from "@/lib/tags";
import {
  spellCheckService,
  type SpellCheckIssue,
  type SpellCheckResult,
} from "@/lib/spell-check-service";
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
type PostEditorProps = {
  postId?: string;
};
type ExistingPostRow = {
  title: string;
  slug: string;
  category_id: string;
  body: string | null;
  excerpt: string | null;
  author: string | null;
  published_at: string | null;
  read_time: string | null;
  thumbnail_url: string | null;
  image_alt: string | null;
  tags: string[] | null;
  status: SaveMode | "deleted";
  featured: boolean | null;
  seo_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
};

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

  return normalized || `post-${new Date().toISOString().slice(0, 10)}`;
}

async function getUniqueSlug(baseSlug: string) {
  const base = slugify(baseSlug);

  if (!supabase) {
    return base;
  }

  const { data, error } = await supabase
    .from("posts")
    .select("slug")
    .ilike("slug", `${base}%`)
    .neq("status", "deleted");

  if (error || !data?.length) {
    return base;
  }

  const usedSlugs = new Set(data.map((row) => row.slug));

  if (!usedSlugs.has(base)) {
    return base;
  }

  let suffix = 2;
  while (usedSlugs.has(`${base}-${suffix}`)) {
    suffix += 1;
  }

  return `${base}-${suffix}`;
}

function getValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function getFirstImageFromHtml(html: string) {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function getSeoChecks({
  title,
  slug,
  excerpt,
  seoTitle,
  metaDescription,
  bodyText,
  hasImage,
}: {
  title: string;
  slug: string;
  excerpt: string;
  seoTitle: string;
  metaDescription: string;
  bodyText: string;
  hasImage: boolean;
}) {
  const checks = [
    { ok: title.trim().length >= 10, label: "제목을 10자 이상 입력하세요." },
    { ok: Boolean(slug.trim()), label: "검색 친화적인 slug를 입력하세요." },
    { ok: (metaDescription || excerpt).trim().length >= 50, label: "요약 또는 메타 설명을 50자 이상 입력하세요." },
    { ok: bodyText.trim().length >= 300, label: "본문을 300자 이상 작성하세요." },
    { ok: hasImage, label: "대표 이미지 또는 본문 이미지를 추가하세요." },
    { ok: (seoTitle || title).trim().length <= 65, label: "SEO 제목은 65자 이하가 좋습니다." },
  ];
  const score = Math.round((checks.filter((check) => check.ok).length / checks.length) * 100);

  return {
    score,
    missing: checks.filter((check) => !check.ok).map((check) => check.label),
  };
}

function SeoScorePanel({ score, missing }: { score: number; missing: string[] }) {
  const tone =
    score >= 80
      ? "border-emerald-900 bg-emerald-950/30 text-emerald-200"
      : score >= 50
        ? "border-yellow-900 bg-yellow-950/30 text-yellow-200"
        : "border-red-900 bg-red-950/30 text-red-200";

  return (
    <section className={`rounded-lg border p-4 ${tone}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-black">SEO 점수</h2>
        <span className="text-2xl font-black">{score}</span>
      </div>
      {missing.length > 0 ? (
        <ul className="mt-3 grid gap-2 text-xs leading-5">
          {missing.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs font-bold">기본 SEO 항목이 잘 채워졌습니다.</p>
      )}
    </section>
  );
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceFirst(value: string, original: string, suggestion: string) {
  return value.replace(new RegExp(escapeRegExp(original)), suggestion);
}

function normalizeTag(value: string) {
  return value
    .replace(/^#+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueTags(values: string[]) {
  const seen = new Set<string>();
  const tags: string[] = [];

  values.forEach((value) => {
    const tag = normalizeTag(value);
    const key = tag.toLowerCase();

    if (!tag || seen.has(key)) {
      return;
    }

    seen.add(key);
    tags.push(tag);
  });

  return tags;
}

const spellCheckHighlightPluginKey = new PluginKey<DecorationSet>("spellCheckHighlights");

type SpellCheckHighlightStorage = Record<string, { issues?: SpellCheckIssue[] }>;

function getSpellCheckHighlightIssues(editor: Editor) {
  return (editor.storage as unknown as SpellCheckHighlightStorage).spellCheckHighlight?.issues ?? [];
}

function setSpellCheckHighlightIssues(editor: Editor, issues: SpellCheckIssue[]) {
  const storage = editor.storage as unknown as SpellCheckHighlightStorage;
  storage.spellCheckHighlight = {
    ...storage.spellCheckHighlight,
    issues,
  };
}

function createSpellCheckDecorations(doc: ProseMirrorNode, issues: SpellCheckIssue[]) {
  const terms = Array.from(
    new Set(
      issues
        .filter((issue) => issue.field === "body")
        .map((issue) => issue.original.trim())
        .filter(Boolean),
    ),
  );

  if (terms.length === 0) {
    return DecorationSet.empty;
  }

  const decorations: Decoration[] = [];

  doc.descendants((node, position) => {
    if (!node.isText || !node.text) {
      return;
    }

    terms.forEach((term) => {
      let index = node.text?.indexOf(term) ?? -1;

      while (index >= 0) {
        decorations.push(
          Decoration.inline(position + index, position + index + term.length, {
            class: "cinescope-spellcheck-underline",
            "data-spellcheck-error": term,
          }),
        );
        index = node.text?.indexOf(term, index + term.length) ?? -1;
      }
    });
  });

  return DecorationSet.create(doc, decorations);
}

const SpellCheckHighlight = Extension.create({
  name: "spellCheckHighlight",

  addStorage() {
    return {
      issues: [] as SpellCheckIssue[],
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: spellCheckHighlightPluginKey,
        state: {
          init: (_, state) => createSpellCheckDecorations(state.doc, getSpellCheckHighlightIssues(this.editor)),
          apply: (transaction, previousDecorations, _oldState, newState) => {
            const meta = transaction.getMeta(spellCheckHighlightPluginKey);

            if (meta?.refresh || transaction.docChanged) {
              return createSpellCheckDecorations(newState.doc, getSpellCheckHighlightIssues(this.editor));
            }

            return previousDecorations.map(transaction.mapping, transaction.doc);
          },
        },
        props: {
          decorations(state) {
            return spellCheckHighlightPluginKey.getState(state) ?? DecorationSet.empty;
          },
        },
      }),
    ];
  },
});

function HighlightedContext({ issue }: { issue: SpellCheckIssue }) {
  const index = issue.context.indexOf(issue.original);

  if (index < 0) {
    return <span>{issue.context}</span>;
  }

  return (
    <span>
      {issue.context.slice(0, index)}
      <mark className="bg-red-950/60 text-red-200 underline decoration-red-500 decoration-2 underline-offset-4">
        {issue.original}
      </mark>
      {issue.context.slice(index + issue.original.length)}
    </span>
  );
}

function SpellCheckPanel({
  result,
  pending,
  onApply,
  onApplyAll,
}: {
  result: SpellCheckResult | null;
  pending: boolean;
  onApply: (issue: SpellCheckIssue) => void;
  onApplyAll: () => void;
}) {
  if (pending) {
    return (
      <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-300">
        맞춤법 검사 중...
      </section>
    );
  }

  if (!result) {
    return null;
  }

  if (result.totalCount === 0) {
    return (
      <section className="rounded-lg border border-emerald-900 bg-emerald-950/30 p-4 text-sm font-bold text-emerald-200">
        현재 로컬 검사 규칙에서 발견된 맞춤법 오류가 없습니다.
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-red-900/70 bg-red-950/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-black text-white">맞춤법 검사 결과</h2>
          <p className="mt-1 text-xs text-red-200">
            맞춤법 {result.spellingCount}건 / 띄어쓰기 {result.spacingCount}건 / 총{" "}
            {result.totalCount}건 발견
          </p>
        </div>
        <button
          type="button"
          onClick={onApplyAll}
          className="min-h-9 rounded bg-red-700 px-3 text-xs font-bold text-white hover:bg-red-600"
        >
          모두 수정
        </button>
      </div>
      <div className="mt-4 grid gap-3">
        {result.issues.map((issue) => (
          <article key={issue.id} className="rounded border border-zinc-800 bg-black p-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold text-zinc-400">{issue.message}</p>
                <p className="mt-2 text-sm leading-6 text-zinc-200">
                  <HighlightedContext issue={issue} />
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  제안: <span className="font-bold text-emerald-300">{issue.suggestion}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => onApply(issue)}
                className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 hover:text-white"
              >
                수정
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
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

export function PostEditor({ postId }: PostEditorProps = {}) {
  const defaultCategory = siteConfig.categories[0]?.id ?? "news";
  const [title, setTitle] = useState("");
  const [featuredImage, setFeaturedImage] = useState<MediaFile | null>(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<"featured" | "body" | null>(null);
  const [pendingMode, setPendingMode] = useState<SaveMode | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });
  const [previewHtml, setPreviewHtml] = useState(emptyContent);
  const [bodyText, setBodyText] = useState("");
  const [slugValue, setSlugValue] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [slugPending, setSlugPending] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [excerptValue, setExcerptValue] = useState("");
  const [seoTitleValue, setSeoTitleValue] = useState("");
  const [metaDescriptionValue, setMetaDescriptionValue] = useState("");
  const [availableTags, setAvailableTags] = useState<TagRow[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);
  const [existingPost, setExistingPost] = useState<ExistingPostRow | null>(null);
  const [loadingPost, setLoadingPost] = useState(Boolean(postId));
  const [spellCheckPending, setSpellCheckPending] = useState(false);
  const [spellCheckResult, setSpellCheckResult] = useState<SpellCheckResult | null>(null);
  const isSupabaseReady = useMemo(() => Boolean(supabase), []);
  const seoCheck = getSeoChecks({
    title,
    slug: slugValue,
    excerpt: excerptValue,
    seoTitle: seoTitleValue,
    metaDescription: metaDescriptionValue,
    bodyText,
    hasImage: Boolean(featuredImage || getFirstImageFromHtml(previewHtml)),
  });

  useEffect(() => {
    fetchTags().then(setAvailableTags);
  }, []);

  useEffect(() => {
    if (!postId) {
      setLoadingPost(false);
      return;
    }

    if (!supabase) {
      return;
    }

    const client = supabase;
    let cancelled = false;

    async function loadPost() {
      setLoadingPost(true);
      setSaveState({ type: "idle", message: "" });

      const { data, error } = await client
        .from("posts")
        .select("*")
        .eq("id", postId)
        .maybeSingle();

      if (cancelled) {
        return;
      }

      if (error) {
        setSaveState({ type: "error", message: `글 불러오기 실패: ${error.message}` });
        setLoadingPost(false);
        return;
      }

      if (!data) {
        setSaveState({ type: "error", message: "수정할 글을 찾을 수 없습니다." });
        setLoadingPost(false);
        return;
      }

      const post = data as ExistingPostRow;
      const html = post.body || emptyContent;

      setExistingPost(post);
      setTitle(post.title);
      setSlugValue(post.slug);
      setSlugManuallyEdited(true);
      setAdvancedOpen(true);
      setExcerptValue(post.excerpt ?? "");
      setSeoTitleValue(post.seo_title ?? "");
      setMetaDescriptionValue(post.meta_description ?? "");
      setSelectedTags(uniqueTags(post.tags ?? []));
      setExistingThumbnailUrl(post.thumbnail_url ?? post.og_image_url ?? null);
      setPreviewHtml(html);
      setBodyText("");
      setLoadingPost(false);
    }

    void loadPost();

    return () => {
      cancelled = true;
    };
  }, [postId]);

  useEffect(() => {
    if (slugManuallyEdited) {
      return;
    }

    const base = slugify(title);

    if (!title.trim()) {
      setSlugValue("");
      return;
    }

    let cancelled = false;
    setSlugPending(true);

    const timer = window.setTimeout(() => {
      getUniqueSlug(base)
        .then((slug) => {
          if (!cancelled) {
            setSlugValue(slug);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setSlugPending(false);
          }
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [title, slugManuallyEdited]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      SpellCheckHighlight,
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
        spellcheck: "true",
      },
    },
    onUpdate({ editor: currentEditor }) {
      setPreviewHtml(currentEditor.getHTML());
      setBodyText(currentEditor.getText());
      setSelectedImage(getSelectedImage(currentEditor));
    },
    onSelectionUpdate({ editor: currentEditor }) {
      setSelectedImage(getSelectedImage(currentEditor));
    },
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    setSpellCheckHighlightIssues(editor, spellCheckResult?.issues.filter((issue) => issue.field === "body") ?? []);
    editor.view.dispatch(editor.state.tr.setMeta(spellCheckHighlightPluginKey, { refresh: true }));
  }, [editor, spellCheckResult]);

  useEffect(() => {
    if (!editor || !existingPost) {
      return;
    }

    const html = existingPost.body || emptyContent;
    editor.commands.setContent(html);
    setPreviewHtml(html);
    setBodyText(editor.getText());
  }, [editor, existingPost]);

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

  function addTagsFromValue(value: string) {
    const nextTags = value
      .split(",")
      .map((tag) => normalizeTag(tag))
      .filter(Boolean);

    if (nextTags.length === 0) {
      return;
    }

    setSelectedTags((current) => uniqueTags([...current, ...nextTags]));
    setTagInput("");
  }

  function removeTag(tagToRemove: string) {
    setSelectedTags((current) => current.filter((tag) => tag !== tagToRemove));
  }

  function handleTagKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === "," || event.key === "Tab") {
      if (tagInput.trim()) {
        event.preventDefault();
        addTagsFromValue(tagInput);
      }
      return;
    }

    if (event.key === "Backspace" && !tagInput && selectedTags.length > 0) {
      setSelectedTags((current) => current.slice(0, -1));
    }
  }

  async function runSpellCheck() {
    if (!editor) {
      setSaveState({ type: "error", message: "에디터가 아직 준비되지 않았습니다." });
      return;
    }

    setSpellCheckPending(true);
    setSpellCheckResult(null);

    const savedRules = await fetchSpellCheckRules({ activeOnly: true });
    const result = await spellCheckService.check({
      title,
      body: editor.getText(),
      excerpt: excerptValue,
      seoTitle: seoTitleValue,
      metaDescription: metaDescriptionValue,
    }, savedRules.map((rule) => ({
      type: rule.type,
      wrongText: rule.wrong_text,
      suggestion: rule.suggestion,
      message: rule.message,
    })));

    setSpellCheckResult(result);
    setSpellCheckPending(false);
  }

  function applySpellCheckIssue(issue: SpellCheckIssue, clearApplied = true) {
    if (issue.field === "title") {
      setTitle((value) => replaceFirst(value, issue.original, issue.suggestion));
    }

    if (issue.field === "excerpt") {
      setExcerptValue((value) => replaceFirst(value, issue.original, issue.suggestion));
    }

    if (issue.field === "seoTitle") {
      setSeoTitleValue((value) => replaceFirst(value, issue.original, issue.suggestion));
    }

    if (issue.field === "metaDescription") {
      setMetaDescriptionValue((value) => replaceFirst(value, issue.original, issue.suggestion));
    }

    if (issue.field === "body" && editor) {
      const nextHtml = replaceFirst(editor.getHTML(), issue.original, issue.suggestion);
      editor.commands.setContent(nextHtml);
      setPreviewHtml(nextHtml);
      setBodyText(editor.getText());
    }

    if (clearApplied) {
      setSpellCheckResult((current) => {
        if (!current) {
          return current;
        }

        const issues = current.issues.filter((item) => item.id !== issue.id);
        const spellingCount = issues.filter((item) => item.type === "spelling").length;
        const spacingCount = issues.filter((item) => item.type === "spacing").length;

        return {
          issues,
          spellingCount,
          spacingCount,
          totalCount: issues.length,
        };
      });
    }
  }

  function applyAllSpellCheckIssues() {
    if (!spellCheckResult) {
      return;
    }

    spellCheckResult.issues.forEach((issue) => applySpellCheckIssue(issue, false));
    setSpellCheckResult({
      issues: [],
      spellingCount: 0,
      spacingCount: 0,
      totalCount: 0,
    });
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
    const seoTitle = getValue(formData, "seoTitle");
    const metaDescription = getValue(formData, "metaDescription");
    const tags = uniqueTags(selectedTags);
    const publishedAt = getValue(formData, "publishedAt") || new Date().toISOString().slice(0, 10);
    const slug = postId ? slugify(inputSlug || title) : await getUniqueSlug(inputSlug || title);
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

    const imageUrl = featuredImage?.webpUrl ?? existingThumbnailUrl ?? getFirstImageFromHtml(html);
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
      read_time: null,
      thumbnail_url: imageUrl,
      image_alt: featuredImage?.alt ?? title,
      tags,
      status: mode,
      featured: formData.get("featured") === "on",
      seo_title: seoTitle || title,
      meta_description: metaDescription || summary,
      og_image_url: imageUrl,
    };

    let { error } = postId
      ? await supabase.from("posts").update(payload).eq("id", postId)
      : await supabase.from("posts").insert(payload);

    if (error && error.message.toLowerCase().includes("content_blocks")) {
      const { content_blocks: _contentBlocks, ...fallbackPayload } = payload;
      const fallbackResult = postId
        ? await supabase.from("posts").update(fallbackPayload).eq("id", postId)
        : await supabase.from("posts").insert(fallbackPayload);
      error = fallbackResult.error;
    }

    setPendingMode(null);

    if (error) {
      setSaveState({ type: "error", message: `저장 실패: ${error.message}` });
      return;
    }

    setSaveState({
      type: "success",
      message: postId
        ? mode === "published"
          ? "글 수정 및 발행 완료"
          : "글 수정 및 임시 저장 완료"
        : mode === "published"
          ? "발행 완료"
          : "임시 저장 완료",
    });
    setSelectedTags(tags);
    setTagInput("");
    if (postId) {
      setExistingPost({
        ...payload,
        body: html,
        content_blocks: json,
        category_id: category,
        thumbnail_url: imageUrl ?? null,
        image_alt: featuredImage?.alt ?? title,
        created_at: null,
      } as unknown as ExistingPostRow);
      return;
    }
    form.reset();
    setTitle("");
    setSlugValue("");
    setSlugManuallyEdited(false);
    setAdvancedOpen(false);
    setExcerptValue("");
    setSeoTitleValue("");
    setMetaDescriptionValue("");
    setSelectedTags([]);
    setTagInput("");
    setBodyText("");
    setFeaturedImage(null);
    setSelectedImage(null);
    editor.commands.setContent(emptyContent);
    setPreviewHtml(emptyContent);
  }

  if (loadingPost) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-8 text-center text-sm text-zinc-400">
        수정할 글을 불러오는 중입니다.
      </div>
    );
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
            <button
              type="button"
              onClick={() => void runSpellCheck()}
              disabled={spellCheckPending || !editor}
              className="min-h-10 rounded border border-red-900 px-4 text-sm font-bold text-red-200 hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {spellCheckPending ? "맞춤법 검사 중..." : "맞춤법 검사"}
            </button>
            <button type="submit" name="intent" value="draft" disabled={pendingMode !== null || !isSupabaseReady} className="min-h-10 rounded border border-zinc-700 px-4 text-sm font-bold text-zinc-200 hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-50">
              {pendingMode === "draft" ? "저장 중..." : "임시 저장"}
            </button>
            <button type="submit" name="intent" value="published" disabled={pendingMode !== null || !isSupabaseReady} className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50">
              {pendingMode === "published" ? "발행 중..." : "발행하기"}
            </button>
          </div>
        </div>
      </div>

      <SpellCheckPanel
        result={spellCheckResult}
        pending={spellCheckPending}
        onApply={applySpellCheckIssue}
        onApplyAll={applyAllSpellCheckIssues}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <main className="min-w-0">
          <section className="mx-auto max-w-6xl rounded-lg border border-zinc-800 bg-zinc-200 p-3 shadow-2xl shadow-black/40 md:p-6">
            <div className="cinescope-editor-paper min-h-[920px] rounded bg-white px-5 py-8 text-[#111827] shadow-sm md:px-14 md:py-12 xl:px-20">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                name="title"
                spellCheck
                placeholder="제목을 입력하세요"
                className="w-full border-0 border-b border-zinc-200 bg-transparent px-0 pb-5 text-4xl font-black leading-tight text-[#111827] outline-none placeholder:text-[#9ca3af]"
              />
              <div className="cinescope-editor-canvas mt-8">
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

          <SeoScorePanel score={seoCheck.score} missing={seoCheck.missing} />

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-bold text-white">발행 설정</h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded border border-zinc-800 bg-black px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-zinc-500">자동 slug</span>
                  {slugPending ? <span className="text-xs font-bold text-red-400">확인 중...</span> : null}
                </div>
                <p className="mt-1 break-all text-sm font-bold text-zinc-200">
                  {slugValue || "제목을 입력하면 자동 생성됩니다."}
                </p>
              </div>
              <AdminSelect
                label="카테고리"
                name="category"
                defaultValue={existingPost?.category_id ?? defaultCategory}
                options={siteConfig.categories.map((category) => ({ label: category.label, value: category.id }))}
              />
              <div className="block text-sm font-semibold text-zinc-300">
                <label htmlFor="post-tags-input">태그</label>
                <input type="hidden" name="tags" value={selectedTags.join(", ")} />
                <input
                  id="post-tags-input"
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="태그 입력 후 Enter 예: 슈퍼 히어로"
                  className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
                />
                <p className="mt-1 text-xs font-medium text-zinc-500">Enter, 쉼표, Tab으로 태그를 추가합니다.</p>

                {selectedTags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {selectedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="rounded bg-red-950/50 px-2 py-1 text-[11px] font-bold text-red-100 hover:bg-red-900"
                        aria-label={`${tag} 태그 삭제`}
                      >
                        #{tag} <span className="text-red-300">x</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 rounded border border-zinc-900 bg-black/40 px-3 py-2 text-xs font-medium text-zinc-600">
                    아직 추가된 태그가 없습니다.
                  </p>
                )}

                {availableTags.length > 0 ? (
                  <div className="mt-3">
                    <p className="text-xs font-bold text-zinc-500">추천 태그</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {availableTags.slice(0, 10).map((tag) => {
                        const selected = selectedTags.some((selectedTag) => selectedTag.toLowerCase() === tag.name.toLowerCase());

                        return (
                          <button
                            key={tag.id}
                            type="button"
                            disabled={selected}
                            onClick={() => addTagsFromValue(tag.name)}
                            className="rounded bg-zinc-900 px-2 py-1 text-[11px] font-bold text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            #{tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
              <label className="block text-sm font-semibold text-zinc-300">
                요약 설명
                <textarea name="excerpt" value={excerptValue} onChange={(event) => setExcerptValue(event.target.value)} rows={3} spellCheck placeholder="목록과 SEO에 표시될 짧은 설명" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <button
                type="button"
                onClick={() => setAdvancedOpen((value) => !value)}
                className="rounded border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-200 hover:border-red-700"
              >
                {advancedOpen ? "고급 설정 닫기" : "고급 설정"}
              </button>
              {advancedOpen ? (
                <label className="block rounded border border-zinc-800 bg-black/50 p-3 text-sm font-semibold text-zinc-300">
                  Slug 직접 수정
                  <input
                    name="slug"
                    value={slugValue}
                    onChange={(event) => {
                      setSlugManuallyEdited(true);
                      setSlugValue(slugify(event.target.value));
                    }}
                    placeholder="movie-review-slug"
                    className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
                  />
                  <span className="mt-2 block text-xs leading-5 text-zinc-500">
                    보통은 자동 생성값을 사용하세요. 직접 수정하면 제목 변경 시 자동 갱신이 멈춥니다.
                  </span>
                  {slugManuallyEdited ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSlugManuallyEdited(false);
                        setSlugValue(slugify(title));
                      }}
                      className="mt-3 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
                    >
                      제목 기준으로 다시 자동 생성
                    </button>
                  ) : null}
                </label>
              ) : (
                <input type="hidden" name="slug" value={slugValue} />
              )}
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
                <input name="seoTitle" value={seoTitleValue} onChange={(event) => setSeoTitleValue(event.target.value)} spellCheck placeholder="검색 결과 제목" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                메타 설명
                <textarea name="metaDescription" value={metaDescriptionValue} onChange={(event) => setMetaDescriptionValue(event.target.value)} rows={3} spellCheck placeholder="검색 결과 설명" className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <h2 className="text-sm font-bold text-white">기타</h2>
            <div className="mt-4 grid gap-4">
              <label className="block text-sm font-semibold text-zinc-300">
                작성자
                <input name="author" defaultValue={existingPost?.author ?? "편집부"} className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="block text-sm font-semibold text-zinc-300">
                발행일
                <input name="publishedAt" type="date" defaultValue={existingPost?.published_at ?? ""} className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700" />
              </label>
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <input type="checkbox" name="featured" defaultChecked={Boolean(existingPost?.featured)} className="size-4 accent-red-700" />
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
