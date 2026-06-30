"use client";

import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import { canDeleteComments } from "@/types/admin";
import type { Database } from "@/types/database";

type CommentRow = Database["public"]["Tables"]["comments"]["Row"];

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function AdminCommentsManager() {
  const adminUser = useAdminUser();
  const canDelete = canDeleteComments(adminUser.role);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  useEffect(() => {
    if (!supabase) {
      setSaveState({ type: "error", message: "Supabase 연결이 없어 댓글을 불러올 수 없습니다." });
      return;
    }

    supabase
      .from("comments")
      .select("*")
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setSaveState({ type: "error", message: `댓글 불러오기 실패: ${error.message}` });
          return;
        }

        setComments(data ?? []);
      });
  }, []);

  async function deleteComment(comment: CommentRow) {
    if (!canDelete) {
      setSaveState({ type: "error", message: "editor 권한은 댓글을 삭제할 수 없습니다." });
      return;
    }

    if (!supabase) {
      setSaveState({ type: "error", message: "Supabase 연결이 없습니다." });
      return;
    }

    if (!confirm("이 댓글을 삭제 처리할까요? 실제 데이터는 보관되고 화면에서 숨겨집니다.")) {
      return;
    }

    setPendingId(comment.id);
    setSaveState({ type: "idle", message: "" });

    const { error } = await supabase.from("comments").update({ is_deleted: true }).eq("id", comment.id);

    setPendingId(null);

    if (error) {
      setSaveState({ type: "error", message: `댓글 삭제 실패: ${error.message}` });
      return;
    }

    setComments((current) => current.filter((item) => item.id !== comment.id));
    setSaveState({ type: "success", message: "댓글이 삭제 처리되었습니다." });
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">댓글 목록</h2>
            <p className="mt-1 text-sm text-zinc-500">방문자 댓글을 확인하고 soft delete 방식으로 삭제 처리합니다.</p>
          </div>
          <span className="rounded bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400">{comments.length}개</span>
        </div>

        {!canDelete ? (
          <p className="mt-4 rounded border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
            editor 권한은 댓글을 볼 수만 있고 삭제할 수 없습니다.
          </p>
        ) : null}

        <div className="mt-5 grid gap-3">
          {comments.length === 0 ? (
            <p className="rounded border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-500">
              표시할 댓글이 없습니다.
            </p>
          ) : (
            comments.map((comment) => (
              <article key={comment.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="font-bold text-zinc-200">{comment.author_name}</span>
                      <span>{new Date(comment.created_at).toLocaleString("ko-KR")}</span>
                      <span className="rounded bg-zinc-900 px-2 py-0.5 font-bold">{comment.status}</span>
                      <span className="truncate">post_id: {comment.post_id}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{comment.body}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteComment(comment)}
                    disabled={!canDelete || pendingId === comment.id}
                    className="rounded border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingId === comment.id ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              </article>
            ))
          )}
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
