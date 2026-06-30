import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { AdminUsersManager } from "@/components/AdminUsersManager";

export const metadata: Metadata = {
  title: "관리자 관리",
  robots: { index: false, follow: false },
};

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="관리자 관리"
      description="관리자 계정과 권한을 관리합니다. 최고 관리자만 접근할 수 있습니다."
    >
      <AdminUsersManager />
    </AdminShell>
  );
}
