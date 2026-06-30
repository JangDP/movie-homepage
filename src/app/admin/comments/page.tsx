import type { Metadata } from "next";

import { AdminCommentsManager } from "@/components/AdminCommentsManager";
import { AdminShell } from "@/components/AdminShell";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "댓글 관리",
  robots: { index: false, follow: false },
};

export default function AdminCommentsPage() {
  return (
    <AdminShell title="댓글 관리" description="방문자 댓글을 확인하고 관리자 권한으로 삭제 처리합니다.">
      <AdminCommentsManager />
    </AdminShell>
  );
}
