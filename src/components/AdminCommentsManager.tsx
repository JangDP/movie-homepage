"use client";

import { useEffect, useMemo, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import { canDeleteComments } from "@/types/admin";
import type { Database } from "@/types/database";

type CommentRow = Database["public"]["Functions"]["list_admin_comments"]["Returns"][number];
type RpcResult = Array<{ ok: boolean; message: string; deleted_id: string | null }>;

type SaveState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function AdminCommentsManager() {
  const adminUser = useAdminUser();
  const canManageComments = canDeleteComments(adminUser.role);
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [saveState, setSaveState] = useState<SaveState>({ type: "idle", message: "" });

  const rootComments = useMemo(
    () =>
      comments
        .filter((comment) => !comment.parent_id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [comments],
  );

  const repliesByParent = useMemo(
    () =>
      comments.reduce<Record<string, CommentRow[]>>((groups, comment) => {
        if (comment.parent_id) {
          groups[comment.parent_id] = [...(groups[comment.parent_id] ?? []), comment].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );
        }

        return groups;
      }, {}),
    [comments],
  );

  useEffect(() => {
    if (!supabase) {
      setSaveState({
        type: "error",
        message: "Supabase 연결이 없어 댓글을 불러올 수 없습니다.",
      });
      return;
    }

    supabase
      .rpc("list_admin_comments", {})
      .then(({ data, error }) => {
        if (error) {
          setSaveState({ type: "error", message: `댓글 불러오기 실패: ${error.message}` });
          return;
        }

        setComments(data ?? []);
      });
  }, []);

  async function deleteComment(comment: CommentRow) {
    if (!canManageComments) {
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

    const { data, error } = await supabase.rpc("admin_soft_delete_comment", {
      target_comment_id: comment.id,
    });

    setPendingId(null);

    const results = (data as RpcResult | null) ?? [];
    const result = results[0];

    if (error || !result?.ok) {
      setSaveState({ type: "error", message: `댓글 삭제 실패: ${error?.message ?? result?.message ?? "권한을 확인해 주세요."}` });
      return;
    }

    const deletedIds = new Set(results.map((item) => item.deleted_id).filter(Boolean));
    setComments((current) => current.filter((item) => !deletedIds.has(item.id) && !deletedIds.has(item.parent_id)));
    setSaveState({ type: "success", message: "댓글이 삭제 처리되었습니다." });
  }

  async function submitReply(comment: CommentRow) {
    if (!canManageComments) {
      setSaveState({ type: "error", message: "editor 권한은 답글을 작성할 수 없습니다." });
      return;
    }

    if (!supabase) {
      setSaveState({ type: "error", message: "Supabase 연결이 없습니다." });
      return;
    }

    const body = (replyDrafts[comment.id] ?? "").trim();

    if (!body) {
      setSaveState({ type: "error", message: "답글 내용을 입력해 주세요." });
      return;
    }

    setPendingId(comment.id);
    setSaveState({ type: "idle", message: "" });

    const { data, error } = await supabase.rpc("create_admin_comment_reply", {
      target_parent_id: comment.id,
      reply_body: body,
    });

    setPendingId(null);

    const reply = data?.[0];

    if (error || !reply) {
      setSaveState({ type: "error", message: `답글 저장 실패: ${error?.message ?? "권한을 확인해 주세요."}` });
      return;
    }

    setComments((current) => [reply, ...current]);
    setReplyDrafts((current) => ({ ...current, [comment.id]: "" }));
    setSaveState({ type: "success", message: "관리자 답글이 등록되었습니다." });
  }

  return (
    <div className="grid gap-5">
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-white">댓글 목록</h2>
            <p className="mt-1 text-sm text-zinc-500">
              방문자 댓글을 확인하고 관리자 답글을 달 수 있습니다.
            </p>
          </div>
          <span className="rounded bg-zinc-900 px-3 py-1 text-xs font-bold text-zinc-400">
            {rootComments.length}개
          </span>
        </div>

        {!canManageComments ? (
          <p className="mt-4 rounded border border-yellow-900 bg-yellow-950/30 p-3 text-sm text-yellow-200">
            editor 권한은 댓글 보기만 가능하며 답글 작성과 삭제는 할 수 없습니다.
          </p>
        ) : null}

        <div className="mt-5 grid gap-4">
          {rootComments.length === 0 ? (
            <p className="rounded border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-500">
              표시할 댓글이 없습니다.
            </p>
          ) : (
            rootComments.map((comment) => (
              <article
                key={comment.id}
                className="rounded-lg border border-zinc-800 bg-zinc-950 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                      <span className="font-bold text-zinc-200">{comment.author_name}</span>
                      {comment.is_secret ? (
                        <span className="rounded bg-zinc-900 px-2 py-0.5 font-bold text-zinc-200">
                          🔒 비밀글
                        </span>
                      ) : null}
                      <span>{new Date(comment.created_at).toLocaleString("ko-KR")}</span>
                      <span className="rounded bg-zinc-900 px-2 py-0.5 font-bold">
                        {comment.status}
                      </span>
                      <span className="truncate">post_id: {comment.post_id}</span>
                    </div>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                      {comment.body}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteComment(comment)}
                    disabled={!canManageComments || pendingId === comment.id}
                    className="rounded border border-red-900 px-3 py-2 text-sm font-bold text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingId === comment.id ? "처리 중..." : "삭제"}
                  </button>
                </div>

                {(repliesByParent[comment.id] ?? []).length > 0 ? (
                  <div className="mt-4 grid gap-3 border-l border-red-900/70 pl-4">
                    {(repliesByParent[comment.id] ?? []).map((reply) => (
                      <div key={reply.id} className="rounded border border-zinc-800 bg-black p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                              <span className="rounded bg-red-700 px-2 py-0.5 font-bold text-white">
                                관리자 답글
                              </span>
                              {reply.is_secret ? (
                                <span className="rounded bg-zinc-900 px-2 py-0.5 font-bold text-zinc-200">
                                  🔒 비밀글
                                </span>
                              ) : null}
                              <span className="font-bold text-zinc-200">{reply.author_name}</span>
                              <span>{new Date(reply.created_at).toLocaleString("ko-KR")}</span>
                            </div>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                              {reply.body}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => deleteComment(reply)}
                            disabled={!canManageComments || pendingId === reply.id}
                            className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/40 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {pendingId === reply.id ? "처리 중..." : "답글 삭제"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

                <div className="mt-4 rounded border border-zinc-800 bg-black p-3">
                  <label className="text-xs font-bold text-zinc-400" htmlFor={`reply-${comment.id}`}>
                    관리자 답글
                  </label>
                  <textarea
                    id={`reply-${comment.id}`}
                    value={replyDrafts[comment.id] ?? ""}
                    onChange={(event) =>
                      setReplyDrafts((current) => ({
                        ...current,
                        [comment.id]: event.target.value,
                      }))
                    }
                    disabled={!canManageComments}
                    rows={3}
                    placeholder="방문자 댓글에 남길 답글을 입력하세요."
                    className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600 disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => submitReply(comment)}
                    disabled={!canManageComments || pendingId === comment.id}
                    className="mt-3 min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {pendingId === comment.id ? "저장 중..." : "답글 등록"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      </div>

      {saveState.message ? (
        <p
          className={`rounded border p-3 text-sm font-bold ${
            saveState.type === "success"
              ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
              : "border-red-900 bg-red-950/40 text-red-200"
          }`}
        >
          {saveState.message}
        </p>
      ) : null}
    </div>
  );
}
