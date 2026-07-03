import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminDraftPostsList } from "@/components/AdminDraftPostsList";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "임시 저장 글",
  robots: { index: false, follow: false },
};

export default function AdminDraftPostsPage() {
  return (
    <AdminShell title="임시 저장" description="Supabase posts 테이블의 draft 상태 글을 확인합니다.">
      <AdminCard title="임시 저장 글">
        <AdminDraftPostsList />
      </AdminCard>
    </AdminShell>
  );
}
