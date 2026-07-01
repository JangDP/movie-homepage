"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { MediaPicker } from "@/components/MediaPicker";
import { siteConfig } from "@/data/site-config";
import { APPEARANCE_SETTINGS_KEY, fetchAppearanceSettings, persistAppearanceToBrowser } from "@/lib/appearance";
import { supabase } from "@/lib/supabase";
import { canManageAppearance } from "@/types/admin";
import type { MediaFile } from "@/types/cms";
import type { SiteAppearance } from "@/types/site";

type SaveState = { type: "idle" | "success" | "error"; message: string };
type PickerTarget = "heroImage" | "backgroundImage" | null;

const sections = [
  { key: "featured", label: "편집부 추천" },
  { key: "movies", label: "영화 카드" },
  { key: "latest", label: "최신 글" },
  { key: "categories", label: "카테고리 바로가기" },
] as const;

export function AdminAppearanceManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageAppearance(adminUser.role);
  const [appearance, setAppearance] = useState<SiteAppearance>(siteConfig.appearance);
  const [pending, setPending] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    fetchAppearanceSettings().then(setAppearance);
  }, []);

  function updateAppearance(patch: Partial<SiteAppearance>) {
    setAppearance((current) => ({ ...current, ...patch }));
  }

  function updateSection(key: keyof SiteAppearance["visibleSections"], value: boolean) {
    setAppearance((current) => ({
      ...current,
      visibleSections: { ...current.visibleSections, [key]: value },
    }));
  }

  function selectMedia(asset: MediaFile) {
    if (!pickerTarget) {
      return;
    }

    updateAppearance({ [pickerTarget]: asset.webpUrl } as Partial<SiteAppearance>);
    setPickerTarget(null);
  }

  async function saveAppearance() {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "꾸미기 설정을 저장할 권한이 없습니다." });
      return;
    }

    setPending(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: APPEARANCE_SETTINGS_KEY, value: appearance }, { onConflict: "key" });
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `꾸미기 저장 실패: ${error.message}` });
      return;
    }

    persistAppearanceToBrowser(appearance);
    setSaveState({ type: "success", message: "꾸미기 설정이 저장되었습니다. 새로고침 후에도 유지됩니다." });
  }

  return (
    <div className="grid gap-5">
      {!canEdit ? (
        <p className="rounded border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">editor 권한은 꾸미기 설정을 수정할 수 없습니다.</p>
      ) : null}

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">로고/색상</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-bold text-zinc-300">로고 텍스트<input value={appearance.logoText} onChange={(event) => updateAppearance({ logoText: event.target.value })} disabled={!canEdit} className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50" /></label>
          <label className="text-sm font-bold text-zinc-300">포인트 컬러<input type="color" value={appearance.accentColor} onChange={(event) => updateAppearance({ accentColor: event.target.value })} disabled={!canEdit} className="mt-2 h-10 w-full rounded border border-zinc-800 bg-zinc-950 px-2 disabled:opacity-50" /></label>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">이미지</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm font-bold text-white">대표 배너 이미지</p>
            <img src={appearance.heroImage} alt="대표 배너" className="mt-3 aspect-video w-full rounded object-cover" />
            <button type="button" disabled={!canEdit} onClick={() => setPickerTarget("heroImage")} className="mt-3 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50">미디어에서 선택</button>
          </div>
          <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
            <p className="text-sm font-bold text-white">배경 이미지</p>
            <img src={appearance.backgroundImage} alt="배경" className="mt-3 aspect-video w-full rounded object-cover" />
            <button type="button" disabled={!canEdit} onClick={() => setPickerTarget("backgroundImage")} className="mt-3 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50">미디어에서 선택</button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">화면 구성</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sections.map((section) => (
            <label key={section.key} className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200">
              {section.label}
              <input type="checkbox" checked={appearance.visibleSections[section.key]} onChange={(event) => updateSection(section.key, event.target.checked)} disabled={!canEdit} className="size-4 accent-red-700" />
            </label>
          ))}
        </div>
        <label className="mt-5 block text-sm font-bold text-zinc-300">카드 스타일
          <select value={appearance.cardStyle} onChange={(event) => updateAppearance({ cardStyle: event.target.value as SiteAppearance["cardStyle"] })} disabled={!canEdit} className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50">
            <option value="editorial">매거진형</option>
            <option value="poster">포스터형</option>
            <option value="compact">컴팩트형</option>
          </select>
        </label>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">푸터</h2>
        <textarea value={appearance.footerText} onChange={(event) => updateAppearance({ footerText: event.target.value })} disabled={!canEdit} rows={4} className="mt-4 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50" />
      </section>

      <section className="rounded-lg border border-zinc-800 bg-gradient-to-br from-red-950 via-zinc-950 to-black p-5">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-400">Preview</p>
        <h2 className="mt-3 text-2xl font-black text-white">{appearance.logoText}</h2>
        <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">{appearance.footerText}</p>
      </section>

      <button type="button" onClick={saveAppearance} disabled={!canEdit || pending} className="min-h-11 justify-self-end rounded bg-red-700 px-5 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50">{pending ? "저장 중..." : "꾸미기 저장"}</button>

      {saveState.message ? (
        <p className={`rounded border p-3 text-sm font-bold ${saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"}`}>{saveState.message}</p>
      ) : null}

      <MediaPicker open={pickerTarget !== null} title="이미지 선택" onClose={() => setPickerTarget(null)} onSelect={selectMedia} />
    </div>
  );
}
