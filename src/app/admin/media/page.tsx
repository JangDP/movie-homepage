import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { MediaLibraryManager } from "@/components/MediaLibraryManager";

export const metadata: Metadata = {
  title: "미디어 라이브러리",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminMediaPage() {
  return (
    <AdminShell
      title="Media Library"
      description="Supabase Storage에 이미지를 업로드하고 글 썸네일, 본문 이미지, 배너 이미지로 재사용합니다."
    >
      <MediaLibraryManager />
    </AdminShell>
  );
}
