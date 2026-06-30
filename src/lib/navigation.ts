import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import type { NavItem } from "@/types/site";

export const NAVIGATION_SETTINGS_KEY = "navigation_menus";

export function normalizeMenus(menus: NavItem[]) {
  return [...menus]
    .filter((item) => item.active !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export function createDefaultMenu(): NavItem {
  return {
    id: `nav-${Date.now()}`,
    label: "새 메뉴",
    href: "/",
    order: 1,
    active: true,
  };
}

export async function fetchNavigationMenus() {
  if (!supabase) {
    return normalizeMenus(siteConfig.menus);
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", NAVIGATION_SETTINGS_KEY)
    .maybeSingle();

  if (error) {
    console.error("[navigation_menus]", error.message);
    return normalizeMenus(siteConfig.menus);
  }

  const menus = Array.isArray(data?.value) ? (data.value as NavItem[]) : siteConfig.menus;
  return normalizeMenus(menus);
}
