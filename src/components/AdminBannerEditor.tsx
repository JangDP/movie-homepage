"use client";

import Image from "next/image";
import { useState } from "react";

import { AdminCard } from "@/components/AdminCard";
import { AdminField } from "@/components/AdminField";
import { MediaPicker } from "@/components/MediaPicker";
import { siteConfig } from "@/data/site-config";
import type { MediaFile } from "@/types/cms";

const bannerSlides = [
  { id: "slide-1", title: "이번 주 추천 영화", active: true, order: 1 },
  { id: "slide-2", title: "OTT 신작 모음", active: true, order: 2 },
  { id: "slide-3", title: "개봉 예정작", active: false, order: 3 },
];

export function AdminBannerEditor() {
  const { hero } = siteConfig;
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [message, setMessage] = useState("");

  return (
    <div className="grid gap-5">
      <AdminCard title="메인 배너 편집">
        <form
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setMessage("배너 저장 미리보기가 완료되었습니다. 실제 저장은 다음 단계에서 연결합니다.");
          }}
        >
          <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
            <div className="grid gap-4 md:grid-cols-[220px_1fr]">
              <div className="relative aspect-[16/10] overflow-hidden rounded bg-zinc-900">
                {selectedMedia ? (
                  <Image
                    src={selectedMedia.thumbnailUrl || selectedMedia.webpUrl}
                    alt={selectedMedia.alt}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src={hero.image}
                    alt={hero.imageAlt}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-white">배너 이미지</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {selectedMedia?.title ?? "현재 사이트 설정 이미지"}
                </p>
                <input
                  type="hidden"
                  name="bannerImageUrl"
                  value={selectedMedia?.webpUrl ?? hero.image}
                  readOnly
                />
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="mt-4 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
                >
                  미디어에서 선택
                </button>
              </div>
            </div>
          </div>
          <AdminField label="배너 제목" name="title" defaultValue={hero.title} />
          <AdminField
            label="부제목"
            name="description"
            defaultValue={hero.description}
            multiline
            rows={3}
          />
          <div className="grid gap-5 md:grid-cols-2">
            <AdminField
              label="버튼 텍스트"
              name="primaryLabel"
              defaultValue={hero.primaryCta.label}
            />
            <AdminField
              label="버튼 링크"
              name="primaryHref"
              defaultValue={hero.primaryCta.href}
            />
          </div>
          <button
            type="submit"
            className="justify-self-start rounded bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
          >
            배너 저장
          </button>
          {message ? <p className="text-sm font-bold text-emerald-300">{message}</p> : null}
        </form>
      </AdminCard>

      <AdminCard
        title="슬라이드 배너 목록"
        description="활성화와 순서 변경 UI입니다. 실제 저장은 다음 단계에서 DB에 연결합니다."
      >
        <div className="grid gap-3">
          {bannerSlides.map((slide) => (
            <div
              key={slide.id}
              className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[80px_1fr_120px_120px] md:items-center"
            >
              <AdminField label="순서" name={`${slide.id}-order`} type="number" defaultValue={slide.order} />
              <AdminField label="제목" name={`${slide.id}-title`} defaultValue={slide.title} />
              <label className="flex items-center gap-2 text-sm font-semibold text-zinc-300">
                <input type="checkbox" defaultChecked={slide.active} className="size-4 accent-red-700" />
                활성
              </label>
              <div className="flex gap-2">
                <button type="button" className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200">
                  위로
                </button>
                <button type="button" className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200">
                  아래로
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      <MediaPicker
        open={pickerOpen}
        title="배너 이미지 선택"
        onClose={() => setPickerOpen(false)}
        onSelect={setSelectedMedia}
      />
    </div>
  );
}
