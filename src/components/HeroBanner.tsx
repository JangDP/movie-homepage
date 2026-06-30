import Image from "next/image";
import Link from "next/link";

import type { HeroBanner as HeroBannerType } from "@/types/site";

type HeroBannerProps = {
  hero: HeroBannerType;
};

export function HeroBanner({ hero }: HeroBannerProps) {
  return (
    <section className="relative isolate min-h-[560px] overflow-hidden border-b border-zinc-900">
      <Image
        src={hero.image}
        alt={hero.imageAlt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/40" />
      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end px-4 pb-12 pt-28 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm font-bold uppercase tracking-[0.28em] text-red-500">
            {hero.eyebrow}
          </p>
          <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
            {hero.title}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
            {hero.description}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={hero.primaryCta.href}
              className="inline-flex min-h-12 items-center justify-center rounded bg-red-700 px-5 text-sm font-bold text-white transition hover:bg-red-600"
            >
              {hero.primaryCta.label}
            </Link>
            <Link
              href={hero.secondaryCta.href}
              className="inline-flex min-h-12 items-center justify-center rounded border border-zinc-600 px-5 text-sm font-bold text-zinc-100 transition hover:border-zinc-300 hover:bg-white/10"
            >
              {hero.secondaryCta.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
