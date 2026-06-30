"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { siteConfig } from "@/data/site-config";
import { createDefaultMenu, NAVIGATION_SETTINGS_KEY, normalizeMenus } from "@/lib/navigation";
import { supabase } from "@/lib/supabase";
import { canManageNavigation } from "@/types/admin";
import type { NavItem } from "@/types/site";

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function AdminNavigationManager() {
  const adminUser = useAdminUser();
  const canEdit = canManageNavigation(adminUser.role);
  const [menus, setMenus] = useState<NavItem[]>(() =>
    siteConfig.menus.map((item, index) => ({
      ...item,
      order: item.order ?? index + 1,
      active: item.active !== false,
    })),
  );
  const [pending, setPending] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase
      .from("site_settings")
      .select("value")
      .eq("key", NAVIGATION_SETTINGS_KEY)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          setSaveState({ type: "error", message: `메뉴 불러오기 실패: ${error.message}` });
          return;
        }

        if (Array.isArray(data?.value)) {
          setMenus(data.value as NavItem[]);
        }
      });
  }, []);

  function updateMenu(index: number, patch: Partial<NavItem>) {
    setMenus((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function addMenu() {
    setMenus((current) => [
      ...current,
      {
        ...createDefaultMenu(),
        order: current.length + 1,
      },
    ]);
  }

  function removeMenu(index: number) {
    setMenus((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  async function saveMenus() {
    setSaveState({ type: "idle", message: "" });

    if (!canEdit) {
      setSaveState({ type: "error", message: "editor 권한은 메뉴를 수정할 수 없습니다." });
      return;
    }

    if (!supabase) {
      setSaveState({ type: "error", message: "Supabase 연결이 없어 저장할 수 없습니다." });
      return;
    }

    const normalized = menus
      .map((item, index) => ({
        ...item,
        id: item.id || `nav-${index + 1}`,
        label: item.label.trim(),
        href: item.href.trim() || "/",
        order: Number(item.order ?? index + 1),
        active: item.active !== false,
      }))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

    setPending(true);
    const { error } = await supabase
      .from("site_settings")
      .upsert({ key: NAVIGATION_SETTINGS_KEY, value: normalized }, { onConflict: "key" });
    setPending(false);

    if (error) {
      setSaveState({ type: "error", message: `저장 실패: ${error.message}` });
      return;
    }

    localStorage.setItem("cinescope-navigation-menus", JSON.stringify(normalized));
    setMenus(normalized);
    setSaveState({ type: "success", message: "메뉴가 저장되었습니다. 공개 사이트 상단 메뉴에 반영됩니다." });
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">상단 메뉴</h2>
            <p className="mt-1 text-sm text-zinc-500">메뉴 이름, 링크 URL, 표시 순서, 활성 상태를 관리합니다.</p>
          </div>
          <button
            type="button"
            onClick={addMenu}
            disabled={!canEdit}
            className="min-h-10 rounded border border-zinc-700 px-4 text-sm font-bold text-zinc-100 hover:border-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            메뉴 추가
          </button>
        </div>

        {!canEdit ? (
          <p className="mt-4 rounded border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
            editor 권한은 메뉴를 볼 수만 있고 수정할 수 없습니다.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3">
          {menus.map((item, index) => (
            <article key={`${item.id ?? item.href}-${index}`} className="grid gap-3 rounded-lg border border-zinc-800 bg-zinc-950 p-4 lg:grid-cols-[1.1fr_1.4fr_110px_110px_90px]">
              <label className="text-xs font-bold text-zinc-400">
                메뉴 이름
                <input
                  value={item.label}
                  onChange={(event) => updateMenu(index, { label: event.target.value })}
                  disabled={!canEdit}
                  className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60"
                />
              </label>
              <label className="text-xs font-bold text-zinc-400">
                링크 URL
                <input
                  value={item.href}
                  onChange={(event) => updateMenu(index, { href: event.target.value })}
                  disabled={!canEdit}
                  className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60"
                />
              </label>
              <label className="text-xs font-bold text-zinc-400">
                표시 순서
                <input
                  type="number"
                  value={item.order ?? index + 1}
                  onChange={(event) => updateMenu(index, { order: Number(event.target.value) })}
                  disabled={!canEdit}
                  className="mt-1 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700 disabled:opacity-60"
                />
              </label>
              <label className="flex items-center gap-2 self-end rounded border border-zinc-800 bg-black px-3 py-2 text-sm font-bold text-zinc-200">
                <input
                  type="checkbox"
                  checked={item.active !== false}
                  onChange={(event) => updateMenu(index, { active: event.target.checked })}
                  disabled={!canEdit}
                  className="size-4 accent-red-700"
                />
                활성
              </label>
              <button
                type="button"
                onClick={() => removeMenu(index)}
                disabled={!canEdit}
                className="self-end rounded border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                삭제
              </button>
            </article>
          ))}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">공개 메뉴 미리보기</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {normalizeMenus(menus).map((item) => (
                <span key={`${item.href}-${item.label}`} className="rounded bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-300">
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={saveMenus}
            disabled={!canEdit || pending}
            className="min-h-11 rounded bg-red-700 px-5 text-sm font-black text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "저장 중..." : "메뉴 저장"}
          </button>
        </div>
      </div>

      {saveState.message ? (
        <p className={`rounded border p-3 text-sm font-bold ${saveState.type === "success" ? "border-emerald-900 bg-emerald-950/40 text-emerald-200" : "border-red-900 bg-red-950/40 text-red-200"}`}>
          {saveState.message}
        </p>
      ) : null}
    </div>
  );
}
