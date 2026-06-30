import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { AdminShell } from "@/components/AdminShell";
import { MockSaveBar } from "@/components/MockSaveBar";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "메뉴 관리",
  robots: { index: false, follow: false },
};

export default function AdminNavigationPage() {
  return (
    <AdminShell title="메뉴 관리" description="상단 네비게이션의 이름, 경로, 노출 순서를 수정합니다.">
      <AdminCard title="상단 메뉴">
        <form className="grid gap-4">
          {siteConfig.menus.map((item, index) => (
            <div key={item.href} className="grid gap-4 rounded border border-zinc-900 bg-zinc-950 p-4 md:grid-cols-[1fr_1fr_100px]">
              <AdminField label="메뉴 이름" name={`menu-${index}-label`} defaultValue={item.label} />
              <AdminField label="링크" name={`menu-${index}-href`} defaultValue={item.href} />
              <AdminField label="순서" name={`menu-${index}-order`} type="number" defaultValue={item.order ?? index + 1} />
            </div>
          ))}
          <MockSaveBar label="메뉴 저장 미리보기" />
        </form>
      </AdminCard>
    </AdminShell>
  );
}
