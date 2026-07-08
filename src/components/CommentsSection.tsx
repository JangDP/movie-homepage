"use client";

import { useState } from "react";

import type { Comment } from "@/lib/cms-repository";

type CommentsSectionProps = {
  postId: string;
  initialComments: Comment[];
};

export function CommentsSection({ postId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [isSecret, setIsSecret] = useState(false);
  const [secretModeById, setSecretModeById] = useState<Record<string, "reveal" | "delete" | null>>({});
  const [secretPasswords, setSecretPasswords] = useState<Record<string, string>>({});
  const [pendingSecretId, setPendingSecretId] = useState<string | null>(null);
  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((groups, comment) => {
    if (comment.parentId) {
      groups[comment.parentId] = [...(groups[comment.parentId] ?? []), comment];
    }

    return groups;
  }, {});

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const authorName = String(formData.get("authorName") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();
    const secretPassword = String(formData.get("secretPassword") ?? "").trim();

    if (!authorName || !body) {
      setMessage("\uc774\ub984\uacfc \ub313\uae00 \ub0b4\uc6a9\uc744 \uc785\ub825\ud574 \uc8fc\uc138\uc694.");
      return;
    }

    if (isSecret && secretPassword.length < 4) {
      setMessage("비밀글 비밀번호는 4자 이상 입력해 주세요.");
      return;
    }

    setPending(true);
    setMessage("");

    const response = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        postId,
        authorName,
        body,
        isSecret,
        password: isSecret ? secretPassword : "",
      }),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
      comment?: {
        id: string;
        post_id: string;
        parent_id: string | null;
        author_name: string;
        body: string | null;
        is_admin_reply: boolean;
        is_secret: boolean;
        created_at: string;
      } | null;
    } | null;

    setPending(false);

    if (!response.ok || !result?.ok || !result.comment) {
      setMessage(result?.message ?? "댓글 저장에 실패했습니다.");
      return;
    }

    const data = result.comment;
    setComments((current) => [
      {
        id: data.id,
        postId: data.post_id,
        parentId: data.parent_id ?? null,
        authorName: data.author_name,
        body: data.body ?? "",
        isAdminReply: Boolean(data.is_admin_reply),
        isSecret: Boolean(data.is_secret),
        createdAt: data.created_at,
      },
      ...current,
    ]);
    form.reset();
    setIsSecret(false);
    setMessage("\ub313\uae00\uc774 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
  }

  async function revealSecretComment(commentId: string) {
    const password = (secretPasswords[commentId] ?? "").trim();

    if (!password) {
      setMessage("비밀번호를 입력해 주세요.");
      return;
    }

    setPendingSecretId(commentId);
    setMessage("");

    const response = await fetch("/api/comments/reveal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, password }),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
      comments?: Array<{ id: string; body: string }>;
    } | null;

    setPendingSecretId(null);

    if (!response.ok || !result?.ok) {
      setMessage(result?.message ?? "비밀번호가 올바르지 않습니다.");
      return;
    }

    const bodyById = new Map((result.comments ?? []).map((comment) => [comment.id, comment.body]));
    setComments((current) =>
      current.map((comment) =>
        bodyById.has(comment.id) ? { ...comment, body: bodyById.get(comment.id) ?? "" } : comment,
      ),
    );
    setSecretModeById((current) => ({ ...current, [commentId]: null }));
    setSecretPasswords((current) => ({ ...current, [commentId]: "" }));
    setMessage("비밀글을 확인했습니다.");
  }

  async function deleteSecretComment(commentId: string) {
    const password = (secretPasswords[commentId] ?? "").trim();

    if (!password) {
      setMessage("비밀번호를 입력해 주세요.");
      return;
    }

    if (!confirm("비밀글을 삭제 처리할까요?")) {
      return;
    }

    setPendingSecretId(commentId);
    setMessage("");

    const response = await fetch("/api/comments/delete-secret", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, password }),
    });
    const result = (await response.json().catch(() => null)) as {
      ok?: boolean;
      message?: string;
      deletedIds?: string[];
    } | null;

    setPendingSecretId(null);

    if (!response.ok || !result?.ok) {
      setMessage(result?.message ?? "비밀번호가 올바르지 않습니다.");
      return;
    }

    const deletedIds = new Set(result.deletedIds ?? [commentId]);
    setComments((current) => current.filter((comment) => !deletedIds.has(comment.id)));
    setSecretModeById((current) => ({ ...current, [commentId]: null }));
    setSecretPasswords((current) => ({ ...current, [commentId]: "" }));
    setMessage("비밀글이 삭제 처리되었습니다.");
  }

  function renderSecretControls(comment: Comment) {
    const mode = secretModeById[comment.id];

    return (
      <div className="mt-3 grid gap-3">
        <p className="rounded border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm font-bold text-zinc-300">
          🔒 비밀글입니다.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSecretModeById((current) => ({ ...current, [comment.id]: "reveal" }))}
            className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
          >
            비밀번호 입력해서 보기
          </button>
          <button
            type="button"
            onClick={() => setSecretModeById((current) => ({ ...current, [comment.id]: "delete" }))}
            className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/40"
          >
            삭제
          </button>
        </div>
        {mode ? (
          <div className="grid gap-2 rounded border border-zinc-800 bg-black p-3 sm:grid-cols-[minmax(0,1fr)_100px]">
            <input
              type="password"
              value={secretPasswords[comment.id] ?? ""}
              onChange={(event) =>
                setSecretPasswords((current) => ({ ...current, [comment.id]: event.target.value }))
              }
              placeholder="비밀글 비밀번호"
              className="rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
            />
            <button
              type="button"
              onClick={() => (mode === "reveal" ? revealSecretComment(comment.id) : deleteSecretComment(comment.id))}
              disabled={pendingSecretId === comment.id}
              className="rounded bg-red-700 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              {pendingSecretId === comment.id ? "확인 중..." : "확인"}
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <section className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
      <h2 className="text-lg font-bold text-white">{"\ub313\uae00"}</h2>
      <div className="mt-5 grid gap-4">
        {rootComments.length === 0 ? (
          <p className="text-sm text-zinc-500">
            {"\uc544\uc9c1 \ub313\uae00\uc774 \uc5c6\uc2b5\ub2c8\ub2e4."}
          </p>
        ) : (
          rootComments.map((comment) => (
            <article key={comment.id} className="rounded border border-zinc-800 bg-black p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="font-bold text-zinc-300">{comment.authorName}</span>
                {comment.isSecret ? (
                  <span className="rounded bg-zinc-900 px-2 py-0.5 font-bold text-zinc-300">
                    🔒 비밀글
                  </span>
                ) : null}
                <span>{new Date(comment.createdAt).toLocaleString("ko-KR")}</span>
              </div>
              {comment.isSecret && !comment.body ? (
                renderSecretControls(comment)
              ) : (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{comment.body}</p>
              )}

              {!(comment.isSecret && !comment.body) && (repliesByParent[comment.id] ?? []).length > 0 ? (
                <div className="mt-4 grid gap-3 border-l border-red-900/70 pl-4">
                  {(repliesByParent[comment.id] ?? []).map((reply) => (
                    <div
                      key={reply.id}
                      className="rounded border border-zinc-800 bg-zinc-950 p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span className="rounded bg-red-700 px-2 py-0.5 font-bold text-white">
                          관리자 답글
                        </span>
                        <span className="font-bold text-zinc-300">{reply.authorName}</span>
                        <span>{new Date(reply.createdAt).toLocaleString("ko-KR")}</span>
                      </div>
                      {reply.isSecret && !reply.body ? (
                        <p className="mt-2 rounded border border-zinc-800 bg-black px-3 py-2 text-sm font-bold text-zinc-400">
                          🔒 비밀 답글입니다.
                        </p>
                      ) : (
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                          {reply.body}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
      <form onSubmit={submitComment} className="mt-5 grid gap-3">
        <input
          type="text"
          name="authorName"
          placeholder={"\uc774\ub984"}
          className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <textarea
          name="body"
          rows={4}
          placeholder="댓글을 입력해 주세요. (비밀글 등록 시 관리자와 비밀번호를 아는 작성자만 확인할 수 있습니다.)"
          className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
        <label className="flex items-center gap-2 text-sm font-bold text-zinc-300">
          <input
            type="checkbox"
            checked={isSecret}
            onChange={(event) => setIsSecret(event.target.checked)}
            className="size-4 accent-red-700"
          />
          비밀글 등록
        </label>
        {isSecret ? (
          <input
            type="password"
            name="secretPassword"
            placeholder="비밀글 비밀번호 입력"
            className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
          />
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="min-h-10 justify-self-start rounded bg-red-700 px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending ? "\uc800\uc7a5 \uc911..." : "\ub313\uae00 \ub4f1\ub85d"}
        </button>
      </form>
      {message ? <p className="mt-3 text-xs text-zinc-500">{message}</p> : null}
    </section>
  );
}
