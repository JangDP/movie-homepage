import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { AdminSpellCheckRulesManager } from "@/components/AdminSpellCheckRulesManager";

export const metadata: Metadata = {
  title: "맞춤법 사전 관리",
  robots: { index: false, follow: false },
};

export default function AdminSpellCheckRulesPage() {
  return (
    <AdminShell
      title="맞춤법 사전"
      description="글쓰기 맞춤법 검사에 사용할 사이트 전용 표현 사전을 관리합니다."
    >
      <AdminSpellCheckRulesManager />
    </AdminShell>
  );
}
