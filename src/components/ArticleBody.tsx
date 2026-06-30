import Image from "next/image";

import { tokenizeArticleContent, type ArticleImageBlock } from "@/lib/article-content";

type ArticleBodyProps = {
  content: string;
};

const alignClassName: Record<ArticleImageBlock["align"], string> = {
  left: "mr-auto max-w-[70%]",
  center: "mx-auto max-w-full",
  right: "ml-auto max-w-[70%]",
  full: "w-full",
};

function renderText(value: string, keyPrefix: string) {
  return value
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph, index) => (
      <p key={`${keyPrefix}-${index}`} className="whitespace-pre-wrap">
        {paragraph}
      </p>
    ));
}

function ArticleImage({ block }: { block: ArticleImageBlock }) {
  return (
    <figure className={`my-8 ${alignClassName[block.align]}`}>
      <div className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
        <Image
          src={block.src}
          alt={block.alt}
          width={1200}
          height={675}
          sizes="(max-width: 768px) 100vw, 760px"
          className="h-auto w-full object-contain"
        />
      </div>
      {block.caption ? (
        <figcaption className="mt-2 text-center text-xs leading-5 text-zinc-500">
          {block.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

export function ArticleBody({ content }: ArticleBodyProps) {
  const tokens = tokenizeArticleContent(content);

  return (
    <div className="space-y-5 text-base leading-8 text-zinc-300">
      {tokens.map((token, index) => {
        if (token.type === "image") {
          return <ArticleImage key={`image-${index}`} block={token.block} />;
        }

        return renderText(token.value, `text-${index}`);
      })}
    </div>
  );
}
