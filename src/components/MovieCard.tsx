import Image from "next/image";

import { siteConfig } from "@/data/site-config";
import type { Movie } from "@/types/site";

type MovieCardProps = {
  movie: Movie;
};

export function MovieCard({ movie }: MovieCardProps) {
  const posterSrc = movie.poster || siteConfig.appearance.heroImage;

  return (
    <article className="group overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950">
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-900">
        <Image
          src={posterSrc}
          alt={movie.posterAlt || movie.title}
          fill
          sizes="(max-width: 768px) 45vw, 20vw"
          className="object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/60 to-transparent p-4">
          <span className="rounded bg-red-700 px-2 py-1 text-xs font-bold text-white">
            {movie.releaseLabel}
          </span>
        </div>
      </div>
      <div className="space-y-3 p-4">
        <div>
          <h3 className="text-base font-bold text-zinc-50">{movie.title}</h3>
          <p className="text-xs text-zinc-500">{movie.originalTitle}</p>
        </div>
        <p className="line-clamp-2 text-sm leading-6 text-zinc-400">
          {movie.summary}
        </p>
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="font-bold text-red-500">★ {movie.rating.toFixed(1)}</span>
          <span className="truncate text-zinc-500">{movie.genre.join(" / ")}</span>
        </div>
      </div>
    </article>
  );
}
