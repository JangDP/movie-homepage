import type { Metadata } from "next";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { AdminShell } from "@/components/AdminShell";
import { MockSaveBar } from "@/components/MockSaveBar";

export const metadata: Metadata = {
  title: "애드센스",
  robots: { index: false, follow: false },
};

const adOptions = [
  { name: "autoAds", label: "자동 광고" },
  { name: "articleTop", label: "본문 상단 광고" },
  { name: "articleMiddle", label: "본문 중간 광고" },
  { name: "articleBottom", label: "본문 하단 광고" },
  { name: "sidebar", label: "사이드바 광고" },
];

export default function AdminAdsensePage() {
  return (
    <AdminShell title="애드센스 관리" description="광고 위치와 Publisher ID를 관리하는 mock 설정 화면입니다.">
      <form className="grid gap-5">
        <AdminCard title="광고 계정">
          <AdminField label="AdSense Publisher ID" name="publisherId" placeholder="ca-pub-0000000000000000" />
        </AdminCard>

        <AdminCard title="광고 노출 위치">
          <div className="grid gap-3 sm:grid-cols-2">
            {adOptions.map((option) => (
              <label
                key={option.name}
                className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-semibold text-zinc-200"
              >
                {option.label}
                <input type="checkbox" name={option.name} defaultChecked className="size-4 accent-red-700" />
              </label>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="광고 미리보기">
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              <AdPlaceholder label="본문 상단 광고" />
              <AdPlaceholder label="본문 중간 광고" />
              <AdPlaceholder label="본문 하단 광고" />
            </div>
            <AdPlaceholder label="사이드바 광고" />
          </div>
        </AdminCard>

        <MockSaveBar label="애드센스 설정 저장" />
      </form>
    </AdminShell>
  );
}
