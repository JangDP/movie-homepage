import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { MediaLibraryManager } from "@/components/MediaLibraryManager";

export const metadata: Metadata = {
  title: "미디어 라이브러리",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "edge";

export default function AdminMediaPage() {
  return (
    <AdminShell
      title="미디어 라이브러리"
      description="이미지 업로드, 검색, 정렬, 삭제, 사용 여부 확인을 관리합니다."
    >
      <MediaLibraryManager />
    </AdminShell>
  );
}
