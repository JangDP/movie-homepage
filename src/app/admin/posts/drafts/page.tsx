import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminShell } from "@/components/AdminShell";
import { getPostsFromSupabase } from "@/lib/cms-repository";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "임시 저장 글",
  robots: { index: false, follow: false },
};

export default async function AdminDraftPostsPage() {
  const drafts = await getPostsFromSupabase({ status: "draft" });

  return (
    <AdminShell title="임시 저장" description="Supabase posts 테이블의 draft 상태 글을 확인합니다.">
      <AdminCard title="임시 저장 글">
        <div className="grid gap-3">
          {drafts.map((post) => (
            <div key={post.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
              <p className="text-sm font-bold text-white">{post.title}</p>
              <p className="mt-2 text-xs text-zinc-500">{post.excerpt}</p>
            </div>
          ))}
          {drafts.length === 0 ? <p className="text-sm text-zinc-500">임시 저장 글이 없습니다.</p> : null}
        </div>
      </AdminCard>
    </AdminShell>
  );
}
