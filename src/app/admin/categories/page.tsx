import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { AdminShell } from "@/components/AdminShell";
import { MockSaveBar } from "@/components/MockSaveBar";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "카테고리 관리",
  robots: { index: false, follow: false },
};

export default function AdminCategoriesPage() {
  return (
    <AdminShell title="카테고리 관리" description="목록 페이지와 글 분류에 사용되는 카테고리를 수정합니다.">
      <div className="grid gap-5">
        <AdminCard title="카테고리 추가" description="새 카테고리 UI입니다. 저장 연결은 다음 단계에서 붙입니다.">
          <form className="grid gap-5 md:grid-cols-[1fr_1fr_120px]">
            <AdminField label="이름" name="label" placeholder="예: 인터뷰" />
            <AdminField label="경로" name="href" placeholder="/interviews" />
            <AdminField label="순서" name="order" type="number" defaultValue={7} />
          </form>
        </AdminCard>
        <AdminCard title="카테고리 수정">
          <form className="grid gap-5">
            {siteConfig.categories.map((category) => (
              <div key={category.id} className="grid gap-4 rounded border border-zinc-900 bg-zinc-950 p-4 md:grid-cols-[1fr_1fr_100px]">
                <AdminField label="이름" name={`${category.id}-label`} defaultValue={category.label} />
                <AdminField label="경로" name={`${category.id}-href`} defaultValue={category.href} />
                <AdminField label="순서" name={`${category.id}-order`} type="number" defaultValue={category.order ?? 0} />
                <div className="md:col-span-3">
                  <AdminField
                    label="설명"
                    name={`${category.id}-description`}
                    defaultValue={category.description}
                    multiline
                    rows={2}
                  />
                </div>
              </div>
            ))}
            <MockSaveBar label="카테고리 저장 미리보기" />
          </form>
        </AdminCard>
      </div>
    </AdminShell>
  );
}
