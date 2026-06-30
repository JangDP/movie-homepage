"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import { adminRoleLabels } from "@/types/admin";

export function AdminSessionStatus() {
  const router = useRouter();
  const adminUser = useAdminUser();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (!supabase) {
      return;
    }

    setPending(true);
    await supabase.auth.signOut();
    setPending(false);
    router.replace("/admin/login");
  }

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm">
      <p className="font-bold text-white">관리자</p>
      <p className="text-xs text-zinc-500">{adminUser.email}</p>
      <p className="mt-1 text-xs font-bold text-red-300">{adminRoleLabels[adminUser.role]}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => void signOut()}
        className="mt-3 rounded border border-zinc-700 px-3 py-1.5 text-xs font-bold text-zinc-200 hover:border-red-700 disabled:opacity-50"
      >
        {pending ? "로그아웃 중..." : "로그아웃"}
      </button>
    </div>
  );
}
