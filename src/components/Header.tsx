"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { siteConfig } from "@/data/site-config";
import { fetchNavigationMenus, normalizeMenus } from "@/lib/navigation";
import type { NavItem } from "@/types/site";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menus, setMenus] = useState<NavItem[]>(() => normalizeMenus(siteConfig.menus));

  useEffect(() => {
    let mounted = true;

    fetchNavigationMenus().then((items) => {
      if (mounted) {
        setMenus(items);
      }
    });

    function handleStorage(event: StorageEvent) {
      if (event.key !== "cinescope-navigation-menus" || !event.newValue) {
        return;
      }

      try {
        setMenus(normalizeMenus(JSON.parse(event.newValue) as NavItem[]));
      } catch {
        setMenus(normalizeMenus(siteConfig.menus));
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      mounted = false;
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded bg-red-700 text-sm font-black text-white">
            C
          </span>
          <span className="text-lg font-black text-white">{siteConfig.appearance.logoText}</span>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="상단 메뉴">
          {menus.map((item) => {
            const active = pathname === item.href;

            return (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={`rounded px-3 py-2 text-sm font-semibold transition ${
                  active ? "bg-red-700 text-white" : "text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            className="hidden rounded border border-zinc-700 px-3 py-2 text-sm font-bold text-zinc-200 transition hover:border-red-700 hover:text-white sm:inline-flex"
          >
            검색
          </Link>
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded border border-zinc-700 text-zinc-200 lg:hidden"
            aria-label="메뉴 열기"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="text-xl leading-none">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </div>
      {open ? (
        <nav className="border-t border-white/10 bg-black px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-2">
            {[...menus, { label: "검색", href: "/search" }].map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className="rounded px-3 py-3 text-sm font-semibold text-zinc-200 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
