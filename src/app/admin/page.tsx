import type { Metadata } from "next";

import { AdminDashboardOverview } from "@/components/AdminDashboardOverview";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  title: "관리자",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminDashboardPage() {
  return (
    <AdminShell
      title="관리자 대시보드"
      description="Supabase 연결 상태와 콘텐츠 현황을 확인합니다."
    >
      <AdminDashboardOverview />
    </AdminShell>
  );
}
