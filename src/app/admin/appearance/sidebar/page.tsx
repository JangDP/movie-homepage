import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { AdminSidebarMusicManager } from "@/components/AdminSidebarMusicManager";

export const metadata: Metadata = {
  title: "사이드바 설정",
  robots: { index: false, follow: false },
};

export default function AdminSidebarAppearancePage() {
  return (
    <AdminShell
      title="사이드바 설정"
      description="방문자가 언제든 재생할 수 있는 고정 음악 플레이어를 설정합니다."
    >
      <AdminSidebarMusicManager />
    </AdminShell>
  );
}
