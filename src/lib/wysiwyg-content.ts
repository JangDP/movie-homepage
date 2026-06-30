export type WysiwygBlockType =
  | "paragraph"
  | "heading"
  | "image"
  | "youtube"
  | "quote"
  | "divider"
  | "table"
  | "button"
  | "ad"
  | "toc";

export type TextAlign = "left" | "center" | "right";
export type ImageAlign = "left" | "center" | "right" | "full";
export type ImageSize = "small" | "medium" | "large" | "full";

type BaseBlock = {
  id: string;
  type: WysiwygBlockType;
};

export type TextBlock = BaseBlock & {
  type: "paragraph" | "heading" | "quote";
  content: string;
  align: TextAlign;
  level?: 2 | 3;
};

export type ImageBlock = BaseBlock & {
  type: "image";
  src: string;
  alt: string;
  caption: string;
  align: ImageAlign;
  size: ImageSize;
};

export type YoutubeBlock = BaseBlock & {
  type: "youtube";
  url: string;
  caption: string;
};

export type DividerBlock = BaseBlock & {
  type: "divider";
};

export type TableBlock = BaseBlock & {
  type: "table";
  rows: string[][];
};

export type ButtonBlock = BaseBlock & {
  type: "button";
  label: string;
  url: string;
  align: TextAlign;
};

export type AdBlock = BaseBlock & {
  type: "ad";
  label: string;
};

export type TocBlock = BaseBlock & {
  type: "toc";
};

export type WysiwygBlock =
  | TextBlock
  | ImageBlock
  | YoutubeBlock
  | DividerBlock
  | TableBlock
  | ButtonBlock
  | AdBlock
  | TocBlock;

export function createBlockId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `block-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createWysiwygBlock(type: WysiwygBlockType): WysiwygBlock {
  const id = createBlockId();

  switch (type) {
    case "heading":
      return { id, type, content: "소제목을 입력하세요", align: "left", level: 2 };
    case "image":
      return { id, type, src: "", alt: "", caption: "", align: "center", size: "large" };
    case "youtube":
      return { id, type, url: "", caption: "" };
    case "quote":
      return { id, type, content: "인용문을 입력하세요", align: "left" };
    case "divider":
      return { id, type };
    case "table":
      return {
        id,
        type,
        rows: [
          ["항목", "내용"],
          ["", ""],
        ],
      };
    case "button":
      return { id, type, label: "버튼 텍스트", url: "https://", align: "center" };
    case "ad":
      return { id, type, label: "본문 광고" };
    case "toc":
      return { id, type };
    case "paragraph":
    default:
      return { id, type: "paragraph", content: "", align: "left" };
  }
}

export function createInitialBlocks(): WysiwygBlock[] {
  return [createWysiwygBlock("paragraph")];
}

function sanitizeInlineHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+=(?:"[^"]*"|'[^']*')/gi, "");
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function youtubeIdFromUrl(url: string) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtube\.com\/embed\/([^?&]+)/,
    /youtu\.be\/([^?&]+)/,
    /youtube\.com\/shorts\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

const textAlignClass: Record<TextAlign, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

const imageClass: Record<ImageSize, string> = {
  small: "max-w-sm",
  medium: "max-w-2xl",
  large: "max-w-4xl",
  full: "w-full max-w-none",
};

const imageAlignClass: Record<ImageAlign, string> = {
  left: "mr-auto",
  center: "mx-auto",
  right: "ml-auto",
  full: "mx-auto w-full max-w-none",
};

export function blocksToPlainText(blocks: WysiwygBlock[]) {
  return blocks
    .map((block) => {
      if (block.type === "paragraph" || block.type === "heading" || block.type === "quote") {
        return block.content.replace(/<[^>]+>/g, "");
      }

      if (block.type === "image") {
        return block.caption || block.alt;
      }

      if (block.type === "button") {
        return block.label;
      }

      return "";
    })
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getFirstImageUrl(blocks: WysiwygBlock[]) {
  return blocks.find((block): block is ImageBlock => block.type === "image" && Boolean(block.src))?.src ?? null;
}

export function blocksToHtml(blocks: WysiwygBlock[]) {
  const headings = blocks.filter((block): block is TextBlock => block.type === "heading" && Boolean(block.content.trim()));

  const html = blocks
    .map((block) => {
      switch (block.type) {
        case "paragraph":
          return `<p class="mb-5 text-base leading-8 text-zinc-300 ${textAlignClass[block.align]}">${sanitizeInlineHtml(block.content) || "<br />"}</p>`;
        case "heading": {
          const tag = block.level === 3 ? "h3" : "h2";
          const size = block.level === 3 ? "text-2xl" : "text-3xl";

          return `<${tag} class="mb-4 mt-10 ${size} font-black leading-tight text-white ${textAlignClass[block.align]}">${sanitizeInlineHtml(block.content)}</${tag}>`;
        }
        case "quote":
          return `<blockquote class="my-8 border-l-4 border-red-700 bg-zinc-950/80 px-5 py-4 text-lg font-semibold leading-8 text-zinc-100 ${textAlignClass[block.align]}">${sanitizeInlineHtml(block.content)}</blockquote>`;
        case "image":
          if (!block.src) {
            return "";
          }

          return `<figure class="my-8 ${imageClass[block.size]} ${imageAlignClass[block.align]}"><img src="${escapeAttribute(block.src)}" alt="${escapeAttribute(block.alt)}" class="h-auto w-full rounded-lg border border-zinc-800 bg-zinc-950 object-contain" />${block.caption ? `<figcaption class="mt-2 text-center text-sm leading-6 text-zinc-500">${sanitizeInlineHtml(block.caption)}</figcaption>` : ""}</figure>`;
        case "youtube": {
          const id = youtubeIdFromUrl(block.url);

          if (!id) {
            return "";
          }

          return `<figure class="my-8"><div class="aspect-video overflow-hidden rounded-lg border border-zinc-800 bg-black"><iframe src="https://www.youtube.com/embed/${escapeAttribute(id)}" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen class="h-full w-full"></iframe></div>${block.caption ? `<figcaption class="mt-2 text-center text-sm text-zinc-500">${sanitizeInlineHtml(block.caption)}</figcaption>` : ""}</figure>`;
        }
        case "divider":
          return `<hr class="my-10 border-zinc-800" />`;
        case "table":
          return `<div class="my-8 overflow-x-auto"><table class="w-full min-w-[520px] border-collapse text-sm text-zinc-200">${block.rows
            .map(
              (row, rowIndex) =>
                `<tr>${row
                  .map((cell) => {
                    const tag = rowIndex === 0 ? "th" : "td";
                    const tone = rowIndex === 0 ? "bg-zinc-900 font-bold text-white" : "bg-black/40";

                    return `<${tag} class="border border-zinc-800 px-4 py-3 text-left ${tone}">${sanitizeInlineHtml(cell)}</${tag}>`;
                  })
                  .join("")}</tr>`,
            )
            .join("")}</table></div>`;
        case "button":
          return `<p class="my-8 ${textAlignClass[block.align]}"><a href="${escapeAttribute(block.url)}" class="inline-flex min-h-11 items-center justify-center rounded bg-red-700 px-5 text-sm font-black text-white transition hover:bg-red-600">${sanitizeInlineHtml(block.label)}</a></p>`;
        case "ad":
          return `<aside class="my-8 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/70 px-5 py-8 text-center text-sm font-bold text-zinc-500">AdSense Placeholder · ${sanitizeInlineHtml(block.label)}</aside>`;
        case "toc":
          return `<nav class="my-8 rounded-lg border border-zinc-800 bg-zinc-950/80 p-5"><p class="mb-3 text-sm font-black text-white">목차</p><ol class="space-y-2 text-sm text-zinc-400">${headings
            .map((heading) => `<li>${sanitizeInlineHtml(heading.content)}</li>`)
            .join("")}</ol></nav>`;
        default:
          return "";
      }
    })
    .join("");

  return `<section data-cinescope-content="true" class="cinescope-content">${html}</section>`;
}
