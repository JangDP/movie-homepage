"use client";

import { useEffect, useRef, useState } from "react";

import {
  defaultSidebarMusicSettings,
  normalizeSidebarMusicSettings,
  SIDEBAR_MUSIC_SETTINGS_KEY,
  type SidebarMusicSettings,
} from "@/lib/sidebar-music";
import { supabase } from "@/lib/supabase";

export function SidebarMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [settings, setSettings] = useState<SidebarMusicSettings>(defaultSidebarMusicSettings);
  const [isPlaying, setIsPlaying] = useState(false);
  const [message, setMessage] = useState("");

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

  if (!settings.enabled || !settings.audioUrl.trim()) {
    return null;
  }

  const sideClass = settings.position === "left" ? "left-4" : "right-4";

  async function togglePlayback() {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    setMessage("");

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      setMessage("브라우저가 재생을 막았습니다. 다시 눌러 주세요.");
    }
  }

  return (
    <aside
      className={`fixed ${sideClass} bottom-5 z-40 w-[min(280px,calc(100vw-2rem))] rounded-lg border border-zinc-800 bg-black/90 p-3 text-zinc-100 shadow-2xl shadow-black/50 backdrop-blur lg:bottom-auto lg:top-1/2 lg:-translate-y-1/2`}
      aria-label="사이드 음악 플레이어"
    >
      <audio
        ref={audioRef}
        src={settings.audioUrl}
        loop={settings.loop}
        preload="metadata"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      />

      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded bg-red-700 text-sm font-black text-white">
          {settings.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={settings.coverImage} alt="" className="size-full object-cover" />
          ) : (
            "♪"
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="line-clamp-1 text-sm font-black text-white">{settings.title}</p>
          {settings.artist ? (
            <p className="line-clamp-1 text-xs text-zinc-500">{settings.artist}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={togglePlayback}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-red-700 text-sm font-black text-white transition hover:bg-red-600"
          aria-label={isPlaying ? "음악 일시정지" : "음악 재생"}
        >
          {isPlaying ? "Ⅱ" : "▶"}
        </button>
      </div>

      {message ? <p className="mt-2 text-xs font-bold text-red-300">{message}</p> : null}
    </aside>
  );
}
