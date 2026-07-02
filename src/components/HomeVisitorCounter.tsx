"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/visitor";

export function HomeVisitorCounter() {
  const [visitorCount, setVisitorCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function trackVisit() {
      if (!supabase) {
        return;
      }

      const visitorId = getVisitorId();

      if (!visitorId) {
        return;
      }

      const { error: upsertError } = await supabase.from("site_visits").upsert(
        {
          visitor_id: visitorId,
          page_path: "/",
        },
        {
          onConflict: "visitor_id,page_path",
          ignoreDuplicates: true,
        },
      );

      if (upsertError) {
        console.error("[Supabase:site_visits:upsert]", upsertError.message);
        return;
      }

      const { count, error: countError } = await supabase
        .from("site_visits")
        .select("id", { count: "exact", head: true })
        .eq("page_path", "/");

      if (countError) {
        console.error("[Supabase:site_visits:count]", countError.message);
        return;
      }

      if (isMounted) {
        setVisitorCount(count ?? 0);
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
          Total Visitors
        </p>
        <p className="mt-1 text-xl font-black text-white">
          {visitorCount === null ? "집계 중" : visitorCount.toLocaleString("ko-KR")}
        </p>
      </div>
    </div>
  );
}
