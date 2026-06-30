import Link from "next/link";

type SectionHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
};

export function SectionHeader({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "전체 보기",
}: SectionHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-red-500">
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-2xl font-black text-white sm:text-3xl">{title}</h2>
        {description ? (
          <p className="max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="inline-flex min-h-10 items-center justify-center rounded border border-zinc-700 px-4 text-sm font-bold text-zinc-200 transition hover:border-red-700 hover:text-white"
        >
          {linkLabel}
        </Link>
      ) : null}
    </div>
  );
}
