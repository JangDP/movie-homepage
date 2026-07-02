import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

export type SpellCheckRuleRow = Database["public"]["Tables"]["spell_check_rules"]["Row"];
export type SpellCheckRuleType = SpellCheckRuleRow["type"];

export async function fetchSpellCheckRules(options?: { activeOnly?: boolean }) {
  if (!supabase) {
    return [];
  }

  let query = supabase
    .from("spell_check_rules")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("wrong_text", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[spell-check-rules]", error.message);
    return [];
  }

  return data ?? [];
}
