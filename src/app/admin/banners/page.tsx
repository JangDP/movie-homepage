import type { Metadata } from "next";

import { AdminBannerEditor } from "@/components/AdminBannerEditor";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "배너 관리",
  robots: { index: false, follow: false },
};

export default function AdminBannersPage() {
  return (
    <AdminShell
      title="배너 관리"
      description="메인 배너를 관리하고 Supabase 미디어 라이브러리에서 이미지를 선택합니다."
    >
      <AdminBannerEditor />
    </AdminShell>
  );
}
