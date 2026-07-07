"use client";

import { useEffect, useMemo, useState } from "react";

import { POPUP_AD_SETTINGS_KEY, normalizePopupAdSettings, type PopupAdSettings } from "@/lib/popup-ad";
import { supabase } from "@/lib/supabase";

function todayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function PopupAd() {
  const [settings, setSettings] = useState<PopupAdSettings | null>(null);
  const [closed, setClosed] = useState(true);
  const storageKey = useMemo(() => {
    if (!settings) {
      return "";
    }

    return `cinescope-popup-ad-hidden:${settings.id}:${settings.updatedAt || "default"}`;
  }, [settings]);

  useEffect(() => {
    if (typeof window === "undefined" || window.location.pathname.startsWith("/admin")) {
      return;
    }

    async function loadPopupSettings() {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", POPUP_AD_SETTINGS_KEY)
        .maybeSingle();

      if (error) {
        console.error("[popup_ad_settings]", error.message);
        return;
      }

      const nextSettings = normalizePopupAdSettings(data?.value as Partial<PopupAdSettings> | null);

      if (!nextSettings.enabled || !nextSettings.imageUrl) {
        return;
      }

      const nextStorageKey = `cinescope-popup-ad-hidden:${nextSettings.id}:${nextSettings.updatedAt || "default"}`;
      const hiddenDate = window.localStorage.getItem(nextStorageKey);

      setSettings(nextSettings);
      setClosed(nextSettings.showOncePerDay && hiddenDate === todayKey());
    }

    loadPopupSettings();
  }, []);

  function closePopup(hideToday: boolean) {
    if (hideToday && storageKey) {
      window.localStorage.setItem(storageKey, todayKey());
    }

    setClosed(true);
  }

  if (!settings || closed) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-label={settings.title}
        className="relative w-full max-w-[520px] overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 shadow-2xl shadow-black/70"
      >
        <button
          type="button"
          onClick={() => closePopup(false)}
          aria-label="팝업 닫기"
          className="absolute right-3 top-3 z-10 inline-flex size-9 items-center justify-center rounded-full bg-black/70 text-xl font-black text-white transition hover:bg-red-700"
        >
          ×
        </button>

        <a href={settings.linkUrl || "#"} className="block" aria-label={settings.title}>
          <img src={settings.imageUrl} alt={settings.imageAlt || settings.title} className="aspect-[16/10] w-full bg-zinc-900 object-cover" />
        </a>

        <div className="grid gap-4 p-5">
          <div>
            <h2 className="text-xl font-black text-white">{settings.title}</h2>
            {settings.description ? <p className="mt-2 text-sm leading-6 text-zinc-400">{settings.description}</p> : null}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => closePopup(true)}
              className="min-h-10 rounded border border-zinc-700 px-4 text-sm font-bold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
            >
              오늘 하루 보지 않기
            </button>
            <a
              href={settings.linkUrl || "#"}
              className="inline-flex min-h-10 items-center justify-center rounded bg-red-700 px-4 text-sm font-black text-white transition hover:bg-red-600"
            >
              {settings.buttonText || "자세히 보기"}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
