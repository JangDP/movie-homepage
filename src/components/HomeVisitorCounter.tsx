"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { getKoreaDateKey } from "@/lib/visitor-stats";

function formatCount(value: number | null) {
  return value === null ? "집계 중" : value.toLocaleString("ko-KR");
}

export function HomeVisitorCounter() {
  const [todayVisitors, setTodayVisitors] = useState<number | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadVisitorCounts() {
      if (!supabase) {
        return;
      }

      const today = getKoreaDateKey();

      const [todayResult, totalResult] = await Promise.all([
        supabase
          .from("visitor_stats")
          .select("unique_visitors")
          .eq("date", today)
          .maybeSingle(),
        supabase
          .from("visitor_stats")
          .select("unique_visitors")
          .order("date", { ascending: true }),
      ]);

      if (todayResult.error) {
        console.error("[Supabase:visitor_stats:today]", todayResult.error.message);
        return;
      }

      if (totalResult.error) {
        console.error("[Supabase:visitor_stats:total]", totalResult.error.message);
        return;
      }

      const total = (totalResult.data ?? []).reduce(
        (sum, row) => sum + Number(row.unique_visitors ?? 0),
        0,
      );

      if (isMounted) {
        setTodayVisitors(Number(todayResult.data?.unique_visitors ?? 0));
        setTotalVisitors(total);
      }
    }

    void loadVisitorCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <div className="rounded border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          오늘의 방문자 수
        </p>
        <p className="mt-1 text-xl font-black text-white">{formatCount(todayVisitors)}</p>
      </div>
      <div className="rounded border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          총 방문자 수
        </p>
        <p className="mt-1 text-xl font-black text-white">{formatCount(totalVisitors)}</p>
      </div>
    </div>
  );
}
