"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { MediaPicker } from "@/components/MediaPicker";
import {
  defaultSidebarMusicSettings,
  normalizeSidebarMusicSettings,
  SIDEBAR_MUSIC_SETTINGS_KEY,
  type SidebarMusicSettings,
} from "@/lib/sidebar-music";
import { supabase } from "@/lib/supabase";
import { canManageAppearance } from "@/types/admin";
import type { MediaFile } from "@/types/cms";
import type { Json } from "@/types/database";

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function AdminSidebarMusicManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageAppearance(adminUser.role);
  const [settings, setSettings] = useState<SidebarMusicSettings>(defaultSidebarMusicSettings);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SIDEBAR_MUSIC_SETTINGS_KEY)
        .maybeSingle();

      if (!mounted || error) {
        return;
      }

      setSettings(normalizeSidebarMusicSettings(data?.value));
    }

    void loadSettings();

    return () => {
      mounted = false;
    };
  }, []);

  function updateSettings(patch: Partial<SidebarMusicSettings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function selectCoverImage(asset: MediaFile) {
    updateSettings({ coverImage: asset.webpUrl || asset.originalUrl });
    setPickerOpen(false);
  }

  async function saveSettings() {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "사이드바 음악 설정을 저장할 권한이 없습니다." });
      return;
    }

    setPending(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert(
        { key: SIDEBAR_MUSIC_SETTINGS_KEY, value: settings as unknown as Json },
        { onConflict: "key" },
      );
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `저장 실패: ${error.message}` });
      return;
    }

    setSaveState({ type: "success", message: "사이드바 음악 플레이어 설정이 저장되었습니다." });
  }

  return (
    <div className="grid gap-5">
      {!canEdit ? (
        <p className="rounded border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
          editor 권한은 사이드바 음악 플레이어를 수정할 수 없습니다.
        </p>
      ) : null}

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">사이드 음악 플레이어</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-500">
          방문자가 스크롤을 내려도 따라다니는 작은 음악 플레이어입니다. 사용자가 재생 버튼을 누르면 음악이 재생됩니다.
        </p>

        <div className="mt-5 grid gap-4">
          <label className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200">
            음악 플레이어 표시
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(event) => updateSettings({ enabled: event.target.checked })}
              disabled={!canEdit}
              className="size-4 accent-red-700"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-bold text-zinc-300">
              곡 제목
              <input
                value={settings.title}
                onChange={(event) => updateSettings({ title: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>
            <label className="text-sm font-bold text-zinc-300">
              아티스트
              <input
                value={settings.artist}
                onChange={(event) => updateSettings({ artist: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>
          </div>

          <label className="text-sm font-bold text-zinc-300">
            음악 파일 URL
            <input
              value={settings.audioUrl}
              onChange={(event) => updateSettings({ audioUrl: event.target.value })}
              disabled={!canEdit}
              placeholder="https://.../music.mp3"
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
            />
            <span className="mt-2 block text-xs leading-5 text-zinc-500">
              mp3, wav, ogg처럼 브라우저가 재생할 수 있는 직접 파일 URL을 넣어주세요.
            </span>
          </label>

          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
            <label className="text-sm font-bold text-zinc-300">
              커버 이미지 URL
              <input
                value={settings.coverImage}
                onChange={(event) => updateSettings({ coverImage: event.target.value })}
                disabled={!canEdit}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              />
            </label>
            <button
              type="button"
              disabled={!canEdit}
              onClick={() => setPickerOpen(true)}
              className="self-end rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50"
            >
              미디어에서 선택
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-sm font-bold text-zinc-300">
              위치
              <select
                value={settings.position}
                onChange={(event) =>
                  updateSettings({ position: event.target.value === "left" ? "left" : "right" })
                }
                disabled={!canEdit}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50"
              >
                <option value="right">오른쪽</option>
                <option value="left">왼쪽</option>
              </select>
            </label>
            <label className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200">
              반복 재생
              <input
                type="checkbox"
                checked={settings.loop}
                onChange={(event) => updateSettings({ loop: event.target.checked })}
                disabled={!canEdit}
                className="size-4 accent-red-700"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 text-sm font-bold text-zinc-200">
              모바일 압축 표시
              <input
                type="checkbox"
                checked={settings.compactOnMobile}
                onChange={(event) => updateSettings({ compactOnMobile: event.target.checked })}
                disabled={!canEdit}
                className="size-4 accent-red-700"
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">미리보기</h2>
        <div className="mt-4 max-w-sm rounded-lg border border-zinc-800 bg-black p-3">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center overflow-hidden rounded bg-red-700 text-sm font-black text-white">
              {settings.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={settings.coverImage} alt="" className="size-full object-cover" />
              ) : (
                "♪"
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-white">{settings.title}</p>
              {settings.artist ? <p className="truncate text-xs text-zinc-500">{settings.artist}</p> : null}
            </div>
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-red-700 text-sm font-black text-white">
              ▶
            </span>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={saveSettings}
        disabled={!canEdit || pending}
        className="min-h-11 justify-self-end rounded bg-red-700 px-5 text-sm font-black text-white hover:bg-red-600 disabled:opacity-50"
      >
        {pending ? "저장 중..." : "사이드바 음악 저장"}
      </button>

      {saveState.message ? (
        <p
          className={`rounded border p-3 text-sm font-bold ${
            saveState.type === "success"
              ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
              : "border-red-900 bg-red-950/40 text-red-200"
          }`}
        >
          {saveState.message}
        </p>
      ) : null}

      <MediaPicker
        open={pickerOpen}
        title="음악 플레이어 커버 이미지 선택"
        onClose={() => setPickerOpen(false)}
        onSelect={selectCoverImage}
      />
    </div>
  );
}
