import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { AdminVisitorsDashboard } from "@/components/AdminVisitorsDashboard";

export const metadata: Metadata = {
  title: "방문자 관리",
  robots: { index: false, follow: false },
};

export default function AdminVisitorsPage() {
  return (
    <AdminShell
      title="방문자 관리"
      description="오늘 방문자, 누적 방문자, 기간별 변화 추이를 확인합니다."
    >
      <AdminVisitorsDashboard />
    </AdminShell>
  );
}
