import type { Metadata } from "next";

import { AdminNavigationManager } from "@/components/AdminNavigationManager";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "메뉴 관리",
  robots: { index: false, follow: false },
};

export default function AdminNavigationPage() {
  return (
    <AdminShell title="메뉴 관리" description="상단 메뉴의 이름, 링크, 순서, 활성 상태를 관리합니다.">
      <AdminNavigationManager />
    </AdminShell>
  );
}
