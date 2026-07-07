"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { MediaPicker } from "@/components/MediaPicker";
import { POPUP_AD_SETTINGS_KEY, normalizePopupAdSettings, type PopupAdSettings } from "@/lib/popup-ad";
import { supabase } from "@/lib/supabase";
import { canManageAppearance } from "@/types/admin";
import type { MediaFile } from "@/types/cms";
import type { Json } from "@/types/database";

type SaveState = { type: "idle" | "success" | "error"; message: string };

export function AdminPopupAdManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageAppearance(adminUser.role);
  const [settings, setSettings] = useState<PopupAdSettings>(() => normalizePopupAdSettings());
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    async function loadSettings() {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", POPUP_AD_SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        setSaveState({ type: "error", message: `팝업 설정 불러오기 실패: ${error.message}` });
        return;
      }

      setSettings(normalizePopupAdSettings(data?.value as Partial<PopupAdSettings> | null));
    }

    loadSettings();
  }, []);

  function updateSettings(patch: Partial<PopupAdSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function selectMedia(file: MediaFile) {
    updateSettings({
      imageUrl: file.webpUrl || file.originalUrl,
      imageAlt: file.alt || file.title,
    });
    setPickerOpen(false);
  }

  async function saveSettings() {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "팝업 광고를 수정할 권한이 없습니다." });
      return;
    }

    const nextSettings = {
      ...settings,
      updatedAt: new Date().toISOString(),
    };

    setPending(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: POPUP_AD_SETTINGS_KEY, value: nextSettings as unknown as Json }, { onConflict: "key" });
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `팝업 광고 저장 실패: ${error.message}` });
      return;
    }

    setSettings(nextSettings);
    setSaveState({ type: "success", message: "팝업 광고 설정이 저장되었습니다." });
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-white">팝업 광고</h2>
          <p className="mt-1 text-sm text-zinc-500">이벤트, 시사회, 공지 이미지를 방문자에게 팝업으로 보여줍니다.</p>
        </div>
        {!canEdit ? <span className="rounded bg-yellow-950 px-3 py-1 text-xs font-bold text-yellow-200">읽기 전용</span> : null}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-4">
          <label className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => updateSettings({ enabled: event.target.checked })}
              disabled={!canEdit}
              className="size-4 accent-red-700"
            />
            팝업 광고 사용
          </label>

          <label className="text-sm font-bold text-zinc-300">
            제목
            <input
              value={settings.title}
              onChange={(event) => updateSettings({ title: event.target.value })}
              disabled={!canEdit}
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
            />
          </label>

          <label className="text-sm font-bold text-zinc-300">
            설명
            <textarea
              value={settings.description}
              onChange={(event) => updateSettings({ description: event.target.value })}
              disabled={!canEdit}
              rows={3}
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-zinc-300">
              버튼/이미지 클릭 링크
              <input
                value={settings.linkUrl}
                onChange={(event) => updateSettings({ linkUrl: event.target.value })}
                disabled={!canEdit}
                placeholder="/event 또는 https://..."
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>
            <label className="text-sm font-bold text-zinc-300">
              버튼 텍스트
              <input
                value={settings.buttonText}
                onChange={(event) => updateSettings({ buttonText: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>
          </div>

          <label className="text-sm font-bold text-zinc-300">
            이미지 alt 텍스트
            <input
              value={settings.imageAlt}
              onChange={(event) => updateSettings({ imageAlt: event.target.value })}
              disabled={!canEdit}
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
            />
          </label>

          <label className="flex items-center gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200">
            <input
              type="checkbox"
              checked={settings.showOncePerDay}
              onChange={(event) => updateSettings({ showOncePerDay: event.target.checked })}
              disabled={!canEdit}
              className="size-4 accent-red-700"
            />
            오늘 하루 보지 않기 사용
          </label>
        </div>

        <aside className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-black text-white">팝업 이미지</p>
          <div className="mt-3 overflow-hidden rounded border border-zinc-800 bg-black">
            {settings.imageUrl ? (
              <img src={settings.imageUrl} alt={settings.imageAlt || settings.title} className="aspect-[16/10] w-full object-cover" />
            ) : (
              <div className="flex aspect-[16/10] items-center justify-center text-xs text-zinc-600">선택된 이미지가 없습니다.</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            disabled={!canEdit}
            className="mt-3 w-full rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50"
          >
            미디어에서 선택
          </button>
          {settings.imageUrl ? <p className="mt-3 break-all text-xs leading-5 text-zinc-600">{settings.imageUrl}</p> : null}
        </aside>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-zinc-500">저장 후 일반 방문자 페이지에서 팝업이 표시됩니다. 관리자 페이지에서는 표시하지 않습니다.</p>
        <button
          type="button"
          onClick={saveSettings}
          disabled={!canEdit || pending}
          className="min-h-10 rounded bg-red-700 px-5 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50"
        >
          {pending ? "저장 중..." : "팝업 광고 저장"}
        </button>
      </div>

      {saveState.message ? (
        <p
          className={`mt-4 rounded border p-3 text-sm font-bold ${
            saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"
          }`}
        >
          {saveState.message}
        </p>
      ) : null}

      <MediaPicker open={pickerOpen} title="팝업 이미지 선택" onClose={() => setPickerOpen(false)} onSelect={selectMedia} />
    </section>
  );
}
