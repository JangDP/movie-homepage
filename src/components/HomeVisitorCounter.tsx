"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/visitor";

function getTodayKey() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function formatCount(value: number | null) {
  return value === null ? "집계 중" : value.toLocaleString("ko-KR");
}

export function HomeVisitorCounter() {
  const [todayVisitors, setTodayVisitors] = useState<number | null>(null);
  const [totalVisitors, setTotalVisitors] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function trackVisit() {
      if (!supabase) {
        return;
      }

      const visitorId = getVisitorId();
      const today = getTodayKey();

      if (!visitorId) {
        return;
      }

      const { error: upsertError } = await supabase.from("site_visits").upsert(
        {
          visitor_id: visitorId,
          page_path: "/",
          visit_date: today,
        },
        {
          onConflict: "visitor_id,page_path,visit_date",
          ignoreDuplicates: true,
        },
      );

      if (upsertError) {
        console.error("[Supabase:site_visits:upsert]", upsertError.message);
        return;
      }

      const [todayResult, totalResult] = await Promise.all([
        supabase
          .from("site_visits")
          .select("id", { count: "exact", head: true })
          .eq("page_path", "/")
          .eq("visit_date", today),
        supabase
          .from("site_visits")
          .select("visitor_id", { count: "exact", head: true })
          .eq("page_path", "/"),
      ]);

      if (todayResult.error) {
        console.error("[Supabase:site_visits:today]", todayResult.error.message);
        return;
      }

      if (totalResult.error) {
        console.error("[Supabase:site_visits:total]", totalResult.error.message);
        return;
      }

      if (isMounted) {
        setTodayVisitors(todayResult.count ?? 0);
        setTotalVisitors(totalResult.count ?? 0);
      }
    }

    void trackVisit();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      <div className="rounded border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          Today
        </p>
        <p className="mt-1 text-xl font-black text-white">{formatCount(todayVisitors)}</p>
      </div>
      <div className="rounded border border-white/10 bg-black/45 px-4 py-3 backdrop-blur">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
          Total
        </p>
        <p className="mt-1 text-xl font-black text-white">{formatCount(totalVisitors)}</p>
      </div>
    </div>
  );
}
