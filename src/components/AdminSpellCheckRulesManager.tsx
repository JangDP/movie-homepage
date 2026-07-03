"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { fetchSpellCheckRules, type SpellCheckRuleRow, type SpellCheckRuleType } from "@/lib/spell-check-rules";
import { supabase } from "@/lib/supabase";
import { canManageSpellCheckRules } from "@/types/admin";

type SaveState = { type: "idle" | "success" | "error"; message: string };

export function AdminSpellCheckRulesManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageSpellCheckRules(adminUser.role);
  const [rules, setRules] = useState<SpellCheckRuleRow[]>([]);
  const [wrongText, setWrongText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [type, setType] = useState<SpellCheckRuleType>("spelling");
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    fetchSpellCheckRules().then(setRules);
  }, []);

  async function addRule() {
    const trimmedWrongText = wrongText.trim();
    const trimmedSuggestion = suggestion.trim();

    if (!trimmedWrongText || !trimmedSuggestion) {
      setSaveState({ type: "error", message: "틀린 표현과 수정 제안을 모두 입력하세요." });
      return;
    }
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "맞춤법 사전을 수정할 권한이 없습니다." });
      return;
    }

    setPending(true);
    const { data, error } = await supabase
      .from("spell_check_rules")
      .insert({
        wrong_text: trimmedWrongText,
        suggestion: trimmedSuggestion,
        message: null,
        type,
        sort_order: getNextSortOrder(rules),
        is_active: true,
      })
      .select("*")
      .single();
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `규칙 추가 실패: ${error.message}` });
      return;
    }

    setRules((current) => [...current, data].sort(sortRules));
    setWrongText("");
    setSuggestion("");
    setSaveState({ type: "success", message: "맞춤법 사전 규칙이 저장되었습니다." });
  }

  async function updateRule(rule: SpellCheckRuleRow, patch: Partial<SpellCheckRuleRow>) {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "editor 권한은 맞춤법 사전을 수정할 수 없습니다." });
      return;
    }

    const next = { ...patch, updated_at: new Date().toISOString() };
    setRules((current) => current.map((item) => (item.id === rule.id ? { ...item, ...next } : item)));

    const { error } = await supabase.from("spell_check_rules").update(next).eq("id", rule.id);

    if (error) {
      setSaveState({ type: "error", message: `규칙 수정 실패: ${error.message}` });
      setRules(await fetchSpellCheckRules());
      return;
    }

    setSaveState({ type: "success", message: "맞춤법 사전 규칙이 수정되었습니다." });
  }

  async function deleteRule(rule: SpellCheckRuleRow) {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "editor 권한은 맞춤법 사전을 삭제할 수 없습니다." });
      return;
    }

    if (!confirm(`"${rule.wrong_text}" 규칙을 삭제할까요?`)) {
      return;
    }

    const { error } = await supabase.from("spell_check_rules").delete().eq("id", rule.id);

    if (error) {
      setSaveState({ type: "error", message: `규칙 삭제 실패: ${error.message}` });
      return;
    }

    setRules((current) => current.filter((item) => item.id !== rule.id));
    setSaveState({ type: "success", message: "맞춤법 사전 규칙이 삭제되었습니다." });
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">규칙 추가</h2>
            <p className="mt-1 text-sm text-zinc-500">
              자주 틀리는 표현을 사전처럼 저장하면 글쓰기 맞춤법 검사에 바로 사용됩니다.
            </p>
          </div>
          {!canEdit ? <span className="rounded bg-yellow-950 px-3 py-1 text-xs font-bold text-yellow-200">읽기 전용</span> : null}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_160px_140px]">
          <input value={wrongText} onChange={(event) => setWrongText(event.target.value)} disabled={!canEdit} placeholder="틀린 표현 예: 어딧" className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50" />
          <input value={suggestion} onChange={(event) => setSuggestion(event.target.value)} disabled={!canEdit} placeholder="수정 제안 예: 어디 있" className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50" />
          <select value={type} onChange={(event) => setType(event.target.value as SpellCheckRuleType)} disabled={!canEdit} className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50">
            <option value="spelling">맞춤법</option>
            <option value="spacing">띄어쓰기</option>
          </select>
          <button type="button" onClick={addRule} disabled={!canEdit || pending} className="rounded bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
            {pending ? "저장 중..." : "추가"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">맞춤법 사전 목록</h2>
        <div className="mt-5 grid gap-3">
          {rules.map((rule) => (
            <article key={rule.id} className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 xl:grid-cols-[1fr_1fr_150px_110px_90px]">
              <input value={rule.wrong_text} onChange={(event) => updateRule(rule, { wrong_text: event.target.value })} disabled={!canEdit} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60" />
              <input value={rule.suggestion} onChange={(event) => updateRule(rule, { suggestion: event.target.value })} disabled={!canEdit} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60" />
              <select value={rule.type} onChange={(event) => updateRule(rule, { type: event.target.value as SpellCheckRuleType })} disabled={!canEdit} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60">
                <option value="spelling">맞춤법</option>
                <option value="spacing">띄어쓰기</option>
              </select>
              <button type="button" onClick={() => updateRule(rule, { is_active: !rule.is_active })} disabled={!canEdit} className={`rounded border px-3 py-2 text-sm font-bold disabled:opacity-50 ${rule.is_active ? "border-emerald-900 text-emerald-300" : "border-zinc-700 text-zinc-500"}`}>
                {rule.is_active ? "활성" : "비활성"}
              </button>
              <button type="button" onClick={() => deleteRule(rule)} disabled={!canEdit} className="rounded border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40 disabled:opacity-50">삭제</button>
            </article>
          ))}
          {rules.length === 0 ? <p className="rounded border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">저장된 맞춤법 사전 규칙이 없습니다.</p> : null}
        </div>
      </section>

      {saveState.message ? (
        <p className={`rounded border p-3 text-sm font-bold ${saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"}`}>{saveState.message}</p>
      ) : null}
    </div>
  );
}

function sortRules(a: SpellCheckRuleRow, b: SpellCheckRuleRow) {
  return (a.sort_order ?? 999) - (b.sort_order ?? 999) || a.wrong_text.localeCompare(b.wrong_text);
}

function getNextSortOrder(rules: SpellCheckRuleRow[]) {
  const maxOrder = rules.reduce((max, rule) => Math.max(max, rule.sort_order ?? 0), 0);
  return maxOrder + 10;
}
