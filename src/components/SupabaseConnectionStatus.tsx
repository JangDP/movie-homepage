"use client";

import { useEffect, useState } from "react";

import { testSupabaseConnection } from "@/lib/supabase";

type Status = {
  ok: boolean;
  message: string;
};

export function SupabaseConnectionStatus() {
  const [status, setStatus] = useState<Status>({ ok: false, message: "Supabase 연결을 확인하는 중..." });

  useEffect(() => {
    let mounted = true;

    testSupabaseConnection().then((nextStatus) => {
      if (mounted) {
        setStatus(nextStatus);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div
      className={`rounded-lg border p-4 ${
        status.ok
          ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
          : "border-red-950 bg-red-950/30 text-red-200"
      }`}
    >
      <p className="text-sm font-bold">{status.ok ? "Supabase 연결됨" : "Supabase 연결 확인 필요"}</p>
      <p className="mt-1 text-xs opacity-80">{status.message}</p>
    </div>
  );
}
