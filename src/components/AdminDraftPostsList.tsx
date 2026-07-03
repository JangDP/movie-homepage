"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];

export function AdminDraftPostsList() {
  const [drafts, setDrafts] = useState<PostRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDrafts() {
      if (!supabase) {
        setErrorMessage("Supabase 환경변수가 설정되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .eq("status", "draft")
        .order("created_at", { ascending: false });

      if (!mounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      setDrafts(data ?? []);
      setIsLoading(false);
    }

    void loadDrafts();

    return () => {
      mounted = false;
    };
  }, []);

  if (isLoading) {
    return <p className="text-sm text-zinc-500">임시 저장 글을 불러오는 중입니다.</p>;
  }

  if (errorMessage) {
    return <p className="text-sm text-red-300">임시 저장 글 조회 실패: {errorMessage}</p>;
  }

  return (
    <div className="grid gap-3">
      {drafts.map((post) => (
        <div key={post.id} className="rounded border border-zinc-800 bg-zinc-950 p-4">
          <p className="text-sm font-bold text-white">{post.title}</p>
          <p className="mt-2 text-xs text-zinc-500">{post.excerpt}</p>
        </div>
      ))}
      {drafts.length === 0 ? <p className="text-sm text-zinc-500">임시 저장 글이 없습니다.</p> : null}
    </div>
  );
}
