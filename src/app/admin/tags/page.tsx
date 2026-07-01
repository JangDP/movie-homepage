import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { AdminTagsManager } from "@/components/AdminTagsManager";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "태그 관리",
  robots: { index: false, follow: false },
};

export default function AdminTagsPage() {
  return (
    <AdminShell title="태그 관리" description="글에 사용할 태그를 Supabase에 저장하고 관리합니다.">
      <AdminTagsManager />
    </AdminShell>
  );
}
