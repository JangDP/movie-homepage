import Link from "next/link";

import { AdminAuthGate } from "@/components/AdminAuthGate";
import { AdminSessionStatus } from "@/components/AdminSessionStatus";
import { siteConfig } from "@/data/site-config";

type AdminNavItem = {
  label: string;
  href: string;
  children?: Array<{
    label: string;
    href: string;
  }>;
};

const adminNav: AdminNavItem[] = [
  { label: "대시보드", href: "/admin" },
  {
    label: "글",
    href: "/admin/posts",
    children: [
      { label: "모든 글", href: "/admin/posts" },
      { label: "새 글 작성", href: "/admin/posts/new" },
      { label: "임시 저장", href: "/admin/posts/drafts" },
    ],
  },
  { label: "카테고리", href: "/admin/categories" },
  { label: "댓글", href: "/admin/comments" },
  { label: "태그", href: "/admin/tags" },
  { label: "맞춤법 사전", href: "/admin/spell-check-rules" },
  { label: "미디어", href: "/admin/media" },
  {
    label: "꾸미기",
    href: "/admin/appearance",
    children: [
      { label: "테마", href: "/admin/appearance#theme" },
      { label: "로고/헤더", href: "/admin/appearance#brand" },
      { label: "메인 배너", href: "/admin/banners" },
      { label: "사이드바", href: "/admin/appearance#sidebar" },
      { label: "푸터", href: "/admin/appearance#footer" },
    ],
  },
  { label: "메뉴", href: "/admin/navigation" },
  { label: "애드센스", href: "/admin/adsense" },
  { label: "관리자 관리", href: "/admin/users" },
  { label: "설정", href: "/admin/settings" },
];

type AdminShellProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AdminShell({ title, description, children }: AdminShellProps) {
  return (
    <AdminAuthGate>
      <main className="min-h-screen bg-zinc-950 pt-16 text-zinc-100">
        <div className="border-b border-zinc-800 bg-black/70">
          <div className="mx-auto flex max-w-[1560px] flex-col gap-5 px-4 py-6 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div>
              <Link href="/" className="text-sm font-bold text-red-500">
                {siteConfig.appearance.logoText}
              </Link>
              <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">{description}</p>
            </div>
            <AdminSessionStatus />
          </div>
        </div>
        <div className="mx-auto grid max-w-[1560px] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-8">
          <aside className="h-fit rounded-lg border border-zinc-800 bg-black/50 p-3">
            <nav className="grid gap-2" aria-label="관리자 메뉴">
              {adminNav.map((item) => (
                <div key={item.href}>
                  <Link
                    href={item.href}
                    className="block rounded px-3 py-2 text-sm font-bold text-zinc-200 transition hover:bg-red-700 hover:text-white"
                  >
                    {item.label}
                  </Link>
                  {item.children ? (
                    <div className="mt-1 grid gap-1 border-l border-zinc-800 pl-3">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className="rounded px-3 py-1.5 text-xs font-semibold text-zinc-500 transition hover:text-white"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </nav>
          </aside>
          <section className="min-w-0">{children}</section>
        </div>
      </main>
    </AdminAuthGate>
  );
}
