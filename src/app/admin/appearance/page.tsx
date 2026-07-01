import type { Metadata } from "next";

import { AdminAppearanceManager } from "@/components/AdminAppearanceManager";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "꾸미기",
  robots: { index: false, follow: false },
};

export default function AdminAppearancePage() {
  return (
    <AdminShell title="사이트 꾸미기" description="로고, 색상, 배너, 배경, 메인 섹션과 푸터 문구를 저장합니다.">
      <AdminAppearanceManager />
    </AdminShell>
  );
}
