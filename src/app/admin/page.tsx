import type { Metadata } from "next";
import Link from "next/link";

import { AdminCard } from "@/components/AdminCard";
import { AdminShell } from "@/components/AdminShell";
import { SupabaseConnectionStatus } from "@/components/SupabaseConnectionStatus";
import { siteConfig } from "@/data/site-config";
import { getPostsFromSupabase } from "@/lib/cms-repository";

export const metadata: Metadata = {
  title: "관리자",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminDashboardPage() {
  const posts = await getPostsFromSupabase();
  const publishedCount = posts.filter((post) => post.status === "published").length;
  const draftCount = posts.filter((post) => post.status === "draft").length;

  return (
    <AdminShell
      title="관리자 대시보드"
      description="Supabase 연결 상태와 콘텐츠 현황을 확인합니다."
    >
      <div className="mb-6">
        <SupabaseConnectionStatus />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <AdminCard>
          <p className="text-sm text-zinc-500">전체 글</p>
          <p className="mt-2 text-3xl font-black text-white">{posts.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Supabase posts</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-zinc-500">공개 글</p>
          <p className="mt-2 text-3xl font-black text-white">{publishedCount}</p>
          <p className="mt-1 text-xs text-zinc-500">status: published</p>
        </AdminCard>
        <AdminCard>
          <p className="text-sm text-zinc-500">임시저장</p>
          <p className="mt-2 text-3xl font-black text-white">{draftCount}</p>
          <p className="mt-1 text-xs text-zinc-500">status: draft</p>
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminCard title="빠른 작업" description="자주 쓰는 CMS 화면으로 이동합니다.">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: "새 글 작성", href: "/admin/posts/new" },
              { label: "글 목록", href: "/admin/posts" },
              { label: "미디어 관리", href: "/admin/media" },
              { label: "카테고리 수정", href: "/admin/categories" },
              { label: "메인 배너 수정", href: "/admin/banners" },
              { label: "사이트 꾸미기", href: "/admin/appearance" },
              { label: "애드센스 설정", href: "/admin/adsense" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm font-bold text-zinc-200 transition hover:border-red-700 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </AdminCard>
        <AdminCard title="현재 사이트 설정" description="site_settings 연결 전까지 기본 설정을 표시합니다.">
          <dl className="grid gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">사이트명</dt>
              <dd className="font-bold text-white">{siteConfig.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">로고</dt>
              <dd className="font-bold text-white">{siteConfig.logoText}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">메뉴 수</dt>
              <dd className="font-bold text-white">{siteConfig.menus.length}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">카테고리 수</dt>
              <dd className="font-bold text-white">{siteConfig.categories.length}</dd>
            </div>
          </dl>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
