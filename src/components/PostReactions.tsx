"use client";

import { useEffect, useMemo, useState } from "react";

import type { ReactionCounts } from "@/lib/cms-repository";
import { supabase } from "@/lib/supabase";
import { getVisitorId } from "@/lib/visitor";

type ReactionType = keyof ReactionCounts;

const reactionItems: Array<{
  type: ReactionType;
  label: string;
}> = [
  { type: "like", label: "\u2764\ufe0f \uc88b\uc544\uc694" },
  { type: "watched", label: "\ud83c\udf7f \ubd24\uc5b4\uc694" },
  { type: "excited", label: "\u2b50 \uae30\ub300 \uc911" },
  { type: "dislike", label: "\ud83d\udc4e \ubcc4\ub85c\uc600\uc5b4\uc694" },
];

type PostReactionsProps = {
  postId: string;
  postSlug: string;
  initialCounts: ReactionCounts;
};

const emptyCounts: ReactionCounts = {
  like: 0,
  watched: 0,
  excited: 0,
  dislike: 0,
};

function countReactions(rows: Array<{ reaction_type: ReactionType }>) {
  return rows.reduce<ReactionCounts>(
    (counts, row) => {
      counts[row.reaction_type] += 1;
      return counts;
    },
    { ...emptyCounts },
  );
}

export function PostReactions({
  postId,
  postSlug,
  initialCounts,
}: PostReactionsProps) {
  const [counts, setCounts] = useState(initialCounts);
  const [activeTypes, setActiveTypes] = useState<Set<ReactionType>>(new Set());
  const [message, setMessage] = useState("");
  const disabled = useMemo(() => !supabase, []);

  useEffect(() => {
    let mounted = true;

    async function loadReactions() {
      if (!supabase) {
        return;
      }

      const visitorId = getVisitorId();

      const [{ data: allRows, error: allError }, { data: myRows, error: myError }] =
        await Promise.all([
          supabase
            .from("post_reactions")
            .select("reaction_type")
            .eq("post_slug", postSlug),
          supabase
            .from("post_reactions")
            .select("reaction_type")
            .eq("post_slug", postSlug)
            .eq("visitor_id", visitorId),
        ]);

      if (allError) {
        console.error("[Supabase:reactions:counts]", allError.message);
      }

      if (myError) {
        console.error("[Supabase:reactions:active]", myError.message);
      }

      if (!mounted) {
        return;
      }

      if (allRows) {
        setCounts(countReactions(allRows as Array<{ reaction_type: ReactionType }>));
      }

      if (myRows) {
        setActiveTypes(
          new Set(
            (myRows as Array<{ reaction_type: ReactionType }>).map(
              (row) => row.reaction_type,
            ),
          ),
        );
      }
    }

    loadReactions();

    return () => {
      mounted = false;
    };
  }, [postSlug]);

  async function react(type: ReactionType) {
    if (!supabase) {
      setMessage("\uc218\ud37c\ubca0\uc774\uc2a4 \ud658\uacbd\ubcc0\uc218\uac00 \uc5c6\uc5b4 \ubc18\uc751\uc744 \uc800\uc7a5\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.");
      return;
    }

    if (activeTypes.has(type)) {
      setMessage("\uc774\ubbf8 \ub0a8\uae34 \ubc18\uc751\uc785\ub2c8\ub2e4.");
      return;
    }

    const visitorId = getVisitorId();

    const { error } = await supabase.from("post_reactions").insert({
      post_id: postId,
      post_slug: postSlug,
      visitor_id: visitorId,
      client_id: visitorId,
      reaction_type: type,
    });

    if (error) {
      if (error.code === "23505") {
        setActiveTypes((current) => new Set(current).add(type));
        setMessage("\uc774\ubbf8 \ub0a8\uae34 \ubc18\uc751\uc785\ub2c8\ub2e4.");
        return;
      }

      setMessage(`\uc800\uc7a5 \uc2e4\ud328: ${error.message}`);
      return;
    }

    setCounts((current) => ({
      ...current,
      [type]: current[type] + 1,
    }));
    setActiveTypes((current) => new Set(current).add(type));
    setMessage("\ubc18\uc751\uc774 \uc800\uc7a5\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold text-white">{"\uc601\ud654 \ubc18\uc751"}</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {reactionItems.map((item) => {
          const isActive = activeTypes.has(item.type);

          return (
            <button
              key={item.type}
              type="button"
              disabled={disabled}
              className={`flex min-h-11 items-center justify-between rounded border px-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${
                isActive
                  ? "border-red-700 bg-red-950/50 text-white"
                  : "border-zinc-800 bg-black text-zinc-200 hover:border-red-700"
              }`}
              onClick={() => react(item.type)}
            >
              <span>{item.label}</span>
              <span className={isActive ? "text-red-200" : "text-zinc-500"}>
                {counts[item.type]}
              </span>
            </button>
          );
        })}
      </div>
      {message ? <p className="mt-3 text-xs text-zinc-500">{message}</p> : null}
    </section>
  );
}
