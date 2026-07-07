export const SIDEBAR_MUSIC_SETTINGS_KEY = "sidebar_music_player";

export type SidebarMusicSettings = {
  enabled: boolean;
  title: string;
  artist: string;
  audioUrl: string;
  coverImage: string;
  position: "left" | "right";
  loop: boolean;
  compactOnMobile: boolean;
};

export const defaultSidebarMusicSettings: SidebarMusicSettings = {
  enabled: false,
  title: "시네마틱 유니버스 OST",
  artist: "",
  audioUrl: "",
  coverImage: "",
  position: "right",
  loop: true,
  compactOnMobile: true,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function normalizeSidebarMusicSettings(value: unknown): SidebarMusicSettings {
  if (!isRecord(value)) {
    return defaultSidebarMusicSettings;
  }

  const position = value.position === "left" ? "left" : "right";

  return {
    enabled: Boolean(value.enabled),
    title: String(value.title ?? defaultSidebarMusicSettings.title),
    artist: String(value.artist ?? ""),
    audioUrl: String(value.audioUrl ?? ""),
    coverImage: String(value.coverImage ?? ""),
    position,
    loop: typeof value.loop === "boolean" ? value.loop : defaultSidebarMusicSettings.loop,
    compactOnMobile:
      typeof value.compactOnMobile === "boolean"
        ? value.compactOnMobile
        : defaultSidebarMusicSettings.compactOnMobile,
  };
}
