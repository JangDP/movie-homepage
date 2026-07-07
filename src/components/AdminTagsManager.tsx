"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { fetchTags, tagSlug, type TagRow } from "@/lib/tags";
import { supabase } from "@/lib/supabase";
import { canManageTags } from "@/types/admin";

type SaveState = { type: "idle" | "success" | "error"; message: string };

export function AdminTagsManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageTags(adminUser.role);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [name, setName] = useState("");
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    fetchTags().then(setTags);
  }, []);

  async function addTag() {
    const trimmed = name.trim();
    if (!trimmed) {
      setSaveState({ type: "error", message: "태그 이름을 입력하세요." });
      return;
    }
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "태그를 수정할 권한이 없습니다." });
      return;
    }

    const nextOrder = Math.max(0, ...tags.map((tag) => tag.sort_order ?? 0)) + 1;

    setPending(true);
    const { data, error } = await supabase
      .from("tags")
      .insert({ name: trimmed, slug: tagSlug(trimmed), sort_order: nextOrder })
      .select("*")
      .single();
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `태그 추가 실패: ${error.message}` });
      return;
    }

    setTags((current) => [...current, data].sort((a, b) => (a.sort_order ?? 999) - (b.sort_order ?? 999)));
    setName("");
    setSaveState({ type: "success", message: "태그가 저장되었습니다." });
  }

  async function updateTag(tag: TagRow, patch: Partial<TagRow>) {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "editor 권한은 태그를 수정할 수 없습니다." });
      return;
    }

    const next = {
      ...patch,
      slug: patch.name ? tagSlug(patch.name) : (patch.slug ?? tag.slug),
    };

    setTags((current) => current.map((item) => (item.id === tag.id ? { ...item, ...next } : item)));
    const { error } = await supabase.from("tags").update(next).eq("id", tag.id);

    if (error) {
      setSaveState({ type: "error", message: `태그 수정 실패: ${error.message}` });
      setTags(await fetchTags());
      return;
    }

    setSaveState({ type: "success", message: "태그가 수정되었습니다." });
  }

  async function deleteTag(tag: TagRow) {
    if (!canEdit || !supabase) {
      setSaveState({ type: "error", message: "editor 권한은 태그를 삭제할 수 없습니다." });
      return;
    }

    if (!confirm(`"${tag.name}" 태그를 삭제할까요?`)) {
      return;
    }

    const { error } = await supabase.from("tags").delete().eq("id", tag.id);

    if (error) {
      setSaveState({ type: "error", message: `태그 삭제 실패: ${error.message}` });
      return;
    }

    setTags((current) => current.filter((item) => item.id !== tag.id));
    setSaveState({ type: "success", message: "태그가 삭제되었습니다." });
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">태그 추가</h2>
            <p className="mt-1 text-sm text-zinc-500">태그는 글 작성 화면의 태그 입력 추천 목록과 연결됩니다.</p>
          </div>
          {!canEdit ? <span className="rounded bg-yellow-950 px-3 py-1 text-xs font-bold text-yellow-200">읽기 전용</span> : null}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_120px]">
          <input value={name} onChange={(event) => setName(event.target.value)} disabled={!canEdit} placeholder="태그 이름" className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-50" />
          <button type="button" onClick={addTag} disabled={!canEdit || pending} className="rounded bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50">
            {pending ? "저장 중..." : "추가"}
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <h2 className="text-lg font-black text-white">태그 목록</h2>
        <div className="mt-5 grid gap-3">
          {tags.map((tag) => (
            <article key={tag.id} className="grid gap-3 rounded border border-zinc-800 bg-zinc-950 p-4 md:grid-cols-[1fr_1fr_90px]">
              <input value={tag.name} onChange={(event) => updateTag(tag, { name: event.target.value })} disabled={!canEdit} className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60" />
              <p className="self-center break-all text-xs text-zinc-500">/{tag.slug}</p>
              <button type="button" onClick={() => deleteTag(tag)} disabled={!canEdit} className="rounded border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40 disabled:opacity-50">삭제</button>
            </article>
          ))}
          {tags.length === 0 ? <p className="rounded border border-zinc-800 bg-zinc-950 p-5 text-sm text-zinc-500">저장된 태그가 없습니다.</p> : null}
        </div>
      </section>

      {saveState.message ? (
        <p className={`rounded border p-3 text-sm font-bold ${saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"}`}>{saveState.message}</p>
      ) : null}
    </div>
  );
}
