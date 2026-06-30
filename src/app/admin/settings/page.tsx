import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { AdminShell } from "@/components/AdminShell";
import { MockSaveBar } from "@/components/MockSaveBar";
import { siteConfig } from "@/data/site-config";

export const metadata: Metadata = {
  title: "사이트 설정",
  robots: { index: false, follow: false },
};

export default function AdminSettingsPage() {
  return (
    <AdminShell title="사이트 설정" description="사이트 이름, 로고 텍스트, SEO 설명, SNS, 푸터 정보를 수정합니다.">
      <AdminCard title="기본 설정">
        <form className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <AdminField label="사이트 이름" name="name" defaultValue={siteConfig.name} />
            <AdminField label="로고 텍스트" name="logoText" defaultValue={siteConfig.logoText} />
          </div>
          <AdminField label="사이트 URL" name="url" type="url" defaultValue={siteConfig.url} />
          <AdminField label="SEO 설명" name="description" defaultValue={siteConfig.description} multiline rows={3} />
          <AdminField label="푸터 설명" name="footerDescription" defaultValue={siteConfig.footer.description} multiline rows={3} />
          <div className="grid gap-5 md:grid-cols-3">
            {siteConfig.socialLinks.map((link) => (
              <AdminField key={link.label} label={`${link.label} URL`} name={`social-${link.label}`} defaultValue={link.href} />
            ))}
          </div>
          <MockSaveBar label="설정 저장 미리보기" />
        </form>
      </AdminCard>
    </AdminShell>
  );
}
