import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
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

export async function fetchAppearanceSettings() {
  if (!supabase) {
    return siteConfig.appearance;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", APPEARANCE_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    console.error("[appearance_settings]", error.message);
    return siteConfig.appearance;
  }

  return mergeAppearanceSettings(data?.value as Partial<SiteAppearance> | null);
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
