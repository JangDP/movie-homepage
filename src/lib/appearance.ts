import { siteConfig } from "@/data/site-config";
import type { SiteAppearance } from "@/types/site";

export const APPEARANCE_SETTINGS_KEY = "appearance_settings";

export function mergeAppearanceSettings(value?: Partial<SiteAppearance> | null): SiteAppearance {
  return {
    ...siteConfig.appearance,
    ...(value ?? {}),
    visibleSections: {
      ...siteConfig.appearance.visibleSections,
      ...(value?.visibleSections ?? {}),
    },
  };
}

function supabaseRestBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return url ? `${url}/rest/v1` : null;
}

function supabaseHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    return null;
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export async function fetchAppearanceSettings() {
  const base = supabaseRestBase();
  const headers = supabaseHeaders();

  if (!base || !headers) {
    return siteConfig.appearance;
  }

  const search = new URLSearchParams({
    select: "value",
    key: `eq.${APPEARANCE_SETTINGS_KEY}`,
    limit: "1",
  });

  const response = await fetch(`${base}/site_settings?${search.toString()}`, {
    headers,
    cache: "force-cache",
  });

  if (!response.ok) {
    console.error("[appearance_settings]", await response.text());
    return siteConfig.appearance;
  }

  const rows = (await response.json()) as Array<{ value: Partial<SiteAppearance> | null }>;

  return mergeAppearanceSettings(rows[0]?.value);
}

export function persistAppearanceToBrowser(appearance: SiteAppearance) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("cinescope-appearance-settings", JSON.stringify(appearance));
  }
}

export function readAppearanceFromBrowser() {
  if (typeof window === "undefined") {
    return siteConfig.appearance;
  }

  const value = window.localStorage.getItem("cinescope-appearance-settings");

  if (!value) {
    return siteConfig.appearance;
  }

  try {
    return mergeAppearanceSettings(JSON.parse(value) as Partial<SiteAppearance>);
  } catch {
    return siteConfig.appearance;
  }
}
