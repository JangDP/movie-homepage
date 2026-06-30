type AdPlaceholderProps = {
  label?: string;
  className?: string;
};

export function AdPlaceholder({
  label = "Google AdSense placement",
  className = "",
}: AdPlaceholderProps) {
  return (
    <aside
      className={`flex min-h-28 items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/70 p-6 text-center text-sm text-zinc-500 ${className}`}
      aria-label={label}
    >
      {label}
    </aside>
  );
}
