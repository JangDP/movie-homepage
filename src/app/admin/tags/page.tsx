import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { AdminShell } from "@/components/AdminShell";
import { MockSaveBar } from "@/components/MockSaveBar";
import { getPostsFromSupabase } from "@/lib/cms-repository";

export const metadata: Metadata = {
  title: "태그",
  robots: { index: false, follow: false },
};

export default async function AdminTagsPage() {
  const posts = await getPostsFromSupabase();
  const tags = Array.from(new Set(posts.flatMap((post) => post.tags)));

  return (
    <AdminShell title="태그 관리" description="Supabase posts.tags 배열에서 태그를 모아 보여줍니다.">
      <div className="grid gap-5">
        <AdminCard title="태그 추가">
          <div className="grid gap-4 md:grid-cols-[1fr_160px]">
            <AdminField label="태그 이름" name="tagName" placeholder="예: 스릴러" />
            <AdminField label="표시 순서" name="tagOrder" type="number" defaultValue={1} />
          </div>
          <MockSaveBar label="태그 저장" />
        </AdminCard>
        <AdminCard title="현재 태그">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span key={tag} className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-300">
                #{tag}
              </span>
            ))}
            {tags.length === 0 ? <p className="text-sm text-zinc-500">조회된 태그가 없습니다.</p> : null}
          </div>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
