export type ImageAlign = "left" | "center" | "right" | "full";

export type ArticleImageBlock = {
  index: number;
  raw: string;
  src: string;
  alt: string;
  caption: string;
  align: ImageAlign;
};

const figurePattern =
  /<figure data-media-image data-align="(left|center|right|full)">\s*<img src="([^"]*)" alt="([^"]*)" \/>\s*(?:<figcaption>([\s\S]*?)<\/figcaption>)?\s*<\/figure>/g;

function escapeAttribute(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeText(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function decodeValue(value: string) {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

export function createImageFigure({
  src,
  alt,
  caption = "",
  align = "center",
}: {
  src: string;
  alt: string;
  caption?: string;
  align?: ImageAlign;
}) {
  const captionMarkup = caption.trim()
    ? `\n  <figcaption>${escapeText(caption.trim())}</figcaption>`
    : "";

  return `<figure data-media-image data-align="${align}">
  <img src="${escapeAttribute(src)}" alt="${escapeAttribute(alt)}" />${captionMarkup}
</figure>`;
}

export function parseImageBlocks(content: string): ArticleImageBlock[] {
  const blocks: ArticleImageBlock[] = [];
  let match: RegExpExecArray | null;
  let index = 0;

  figurePattern.lastIndex = 0;

  while ((match = figurePattern.exec(content)) !== null) {
    blocks.push({
      index,
      raw: match[0],
      align: match[1] as ImageAlign,
      src: decodeValue(match[2]),
      alt: decodeValue(match[3]),
      caption: decodeValue(match[4] ?? ""),
    });
    index += 1;
  }

  return blocks;
}

export function replaceImageBlock(
  content: string,
  targetIndex: number,
  nextBlock: Omit<ArticleImageBlock, "index" | "raw">,
) {
  let currentIndex = 0;

  figurePattern.lastIndex = 0;

  return content.replace(figurePattern, (raw) => {
    if (currentIndex !== targetIndex) {
      currentIndex += 1;
      return raw;
    }

    currentIndex += 1;
    return createImageFigure(nextBlock);
  });
}

export function deleteImageBlock(content: string, targetIndex: number) {
  let currentIndex = 0;

  figurePattern.lastIndex = 0;

  return content.replace(figurePattern, (raw) => {
    if (currentIndex !== targetIndex) {
      currentIndex += 1;
      return raw;
    }

    currentIndex += 1;
    return "";
  });
}

export type ArticleToken =
  | { type: "text"; value: string }
  | { type: "image"; block: ArticleImageBlock };

export function tokenizeArticleContent(content: string): ArticleToken[] {
  const tokens: ArticleToken[] = [];
  let lastIndex = 0;
  let imageIndex = 0;
  let match: RegExpExecArray | null;

  figurePattern.lastIndex = 0;

  while ((match = figurePattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    tokens.push({
      type: "image",
      block: {
        index: imageIndex,
        raw: match[0],
        align: match[1] as ImageAlign,
        src: decodeValue(match[2]),
        alt: decodeValue(match[3]),
        caption: decodeValue(match[4] ?? ""),
      },
    });

    imageIndex += 1;
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) });
  }

  return tokens;
}
