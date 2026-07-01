import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type TagRow = Database["public"]["Tables"]["tags"]["Row"];

export function tagSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function fetchTags() {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("tags")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("[tags]", error.message);
    return [];
  }

  return data ?? [];
}
