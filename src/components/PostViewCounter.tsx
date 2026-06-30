"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/visitor";

const VIEW_DEDUPE_MINUTES = 30;

type PostViewCounterProps = {
  postId: string;
  postSlug: string;
  initialCount?: number;
};

function isWithinDedupeWindow(viewedAt: string) {
  const viewedTime = new Date(viewedAt).getTime();

  if (Number.isNaN(viewedTime)) {
    return false;
  }

  return Date.now() - viewedTime < VIEW_DEDUPE_MINUTES * 60 * 1000;
}

export function PostViewCounter({
  postId,
  postSlug,
  initialCount = 0,
}: PostViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    let mounted = true;

    async function trackView() {
      if (!supabase) {
        return;
      }

      const visitorId = getVisitorId();

      if (!visitorId) {
        return;
      }

      const { data: recentView, error: recentViewError } = await supabase
        .from("page_views")
        .select("viewed_at")
        .eq("post_slug", postSlug)
        .eq("visitor_id", visitorId)
        .order("viewed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (recentViewError) {
        console.error("[Supabase:page_views:select]", recentViewError.message);
        return;
      }

      if (recentView?.viewed_at && isWithinDedupeWindow(recentView.viewed_at)) {
        return;
      }

      const { error: insertError } = await supabase.from("page_views").insert({
        post_id: postId,
        post_slug: postSlug,
        visitor_id: visitorId,
        viewed_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error("[Supabase:page_views:insert]", insertError.message);
        return;
      }

      const { data, error } = await supabase.rpc("increment_post_view", {
        target_post_id: postId,
      });

      if (error) {
        console.error("[Supabase:views:increment]", error.message);
        return;
      }

      if (typeof data === "number" && mounted) {
        setCount(data);
      }
    }

    trackView();

    return () => {
      mounted = false;
    };
  }, [postId, postSlug]);

  return <span>{"\uc870\ud68c\uc218"} {count.toLocaleString()}</span>;
}
