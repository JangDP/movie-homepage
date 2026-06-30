type AdminCardProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminCard({ title, description, children, className = "" }: AdminCardProps) {
  return (
    <div className={`rounded-lg border border-zinc-800 bg-black/45 p-5 ${className}`}>
      {title ? <h2 className="text-lg font-bold text-white">{title}</h2> : null}
      {description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p> : null}
      <div className={title || description ? "mt-5" : ""}>{children}</div>
    </div>
  );
}
