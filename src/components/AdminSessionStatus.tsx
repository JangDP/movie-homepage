"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export function AdminSessionStatus() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? "");
    });
  }, []);

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
      <p className="text-xs text-zinc-500">{email || "로그인됨"}</p>
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
