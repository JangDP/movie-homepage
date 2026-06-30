import type { Metadata } from "next";

import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { AdminSelect } from "@/components/AdminSelect";
import { AdminShell } from "@/components/AdminShell";
import { MockSaveBar } from "@/components/MockSaveBar";
import { mediaAssets } from "@/data/media";
import { siteConfig } from "@/data/site-config";
import { themes } from "@/data/themes";

export const metadata: Metadata = {
  title: "꾸미기",
  robots: { index: false, follow: false },
};

const sections = [
  { key: "featured", label: "편집부 추천" },
  { key: "movies", label: "영화 카드" },
  { key: "latest", label: "최신 글" },
  { key: "categories", label: "카테고리 바로가기" },
] as const;

export default function AdminAppearancePage() {
  const { appearance } = siteConfig;
  const background = mediaAssets.find((asset) => asset.usage.includes("background")) ?? mediaAssets[0];
  const logo = mediaAssets.find((asset) => asset.usage.includes("logo")) ?? mediaAssets[0];

  return (
    <AdminShell
      title="사이트 꾸미기"
      description="테마, 색상, 로고, 배경, 카드 스타일을 선택하는 mock 디자인 관리 화면입니다."
    >
      <form className="grid gap-5">
        <AdminCard title="테마 선택" description="운영자가 클릭해서 전체 분위기를 바꾸는 카드형 테마 선택 UI입니다.">
          <div id="theme" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {themes.map((theme) => (
              <label key={theme.id} className="cursor-pointer overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 transition hover:border-red-700">
                <div className={`h-24 bg-gradient-to-br ${theme.previewClassName}`} />
                <div className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-white">{theme.name}</span>
                    <input type="radio" name="themeId" value={theme.id} defaultChecked={theme.id === "cinema"} className="accent-red-700" />
                  </div>
                  <p className="text-xs leading-5 text-zinc-500">{theme.description}</p>
                </div>
              </label>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="로고/헤더" description="URL 직접 입력보다 미디어 라이브러리 선택을 우선하는 구조입니다.">
          <div id="brand" className="grid gap-5">
            <div className="grid gap-5 md:grid-cols-2">
              <AdminField label="로고 텍스트" name="appearance.logoText" defaultValue={appearance.logoText} />
              <AdminSelect
                label="폰트"
                name="appearance.font"
                defaultValue="system"
                options={[
                  { label: "시스템 기본", value: "system" },
                  { label: "굵은 매거진", value: "magazine" },
                  { label: "깔끔한 고딕", value: "gothic" },
                  { label: "영문 영화 포스터", value: "poster" },
                ]}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm font-bold text-white">사이트 로고 이미지</p>
                <p className="mt-1 text-xs text-zinc-500">{logo.title}</p>
                <input type="hidden" name="appearance.logoMediaId" defaultValue={logo.id} />
                <button type="button" className="mt-4 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700">
                  미디어에서 선택
                </button>
              </div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm font-bold text-white">배경 이미지</p>
                <p className="mt-1 text-xs text-zinc-500">{background.title}</p>
                <input type="hidden" name="appearance.backgroundMediaId" defaultValue={background.id} />
                <button type="button" className="mt-4 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700">
                  미디어에서 선택
                </button>
              </div>
            </div>
          </div>
        </AdminCard>

        <AdminCard title="색상과 카드">
          <div className="grid gap-5 md:grid-cols-3">
            <AdminField label="포인트 컬러" name="appearance.accentColor" defaultValue={appearance.accentColor} />
            <AdminSelect
              label="카드 스타일"
              name="appearance.cardStyle"
              defaultValue={appearance.cardStyle}
              options={[
                { label: "매거진형", value: "editorial" },
                { label: "포스터형", value: "poster" },
                { label: "컴팩트형", value: "compact" },
              ]}
            />
            <AdminSelect
              label="본문 폭"
              name="appearance.contentWidth"
              defaultValue="comfortable"
              options={[
                { label: "편안하게", value: "comfortable" },
                { label: "넓게", value: "wide" },
                { label: "좁게", value: "narrow" },
              ]}
            />
          </div>
        </AdminCard>

        <AdminCard title="메인 화면 섹션">
          <div className="grid gap-3 sm:grid-cols-2">
            {sections.map((section) => (
              <label key={section.key} className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-semibold text-zinc-200">
                {section.label}
                <input
                  type="checkbox"
                  name={`appearance.visibleSections.${section.key}`}
                  defaultChecked={appearance.visibleSections[section.key]}
                  className="size-4 accent-red-700"
                />
              </label>
            ))}
          </div>
        </AdminCard>

        <AdminCard title="실시간 미리보기">
          <div className="rounded-lg border border-zinc-800 bg-gradient-to-br from-red-950 via-zinc-950 to-black p-5">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Preview</p>
            <h2 className="mt-3 text-2xl font-black text-white">{appearance.logoText}</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
              선택한 테마, 포인트 컬러, 카드 스타일이 실제 사이트에 반영되는 모습을 보여주는 mock 미리보기 영역입니다.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {["뉴스", "리뷰", "추천"].map((label) => (
                <div key={label} className="rounded border border-zinc-800 bg-black/50 p-4">
                  <p className="text-sm font-bold text-white">{label}</p>
                  <p className="mt-2 text-xs text-zinc-500">카드 스타일 미리보기</p>
                </div>
              ))}
            </div>
          </div>
        </AdminCard>

        <AdminCard title="푸터" description="하단 문구와 사이드바 소개 문구로 함께 사용할 수 있습니다.">
          <div id="footer">
            <AdminField label="푸터 문구" name="appearance.footerText" defaultValue={appearance.footerText} multiline rows={3} />
          </div>
        </AdminCard>

        <MockSaveBar label="꾸미기 저장" />
      </form>
    </AdminShell>
  );
}
