"use client";

import { useState } from "react";

import type { Comment } from "@/lib/cms-repository";
import { supabase } from "@/lib/supabase";

type CommentsSectionProps = {
  postId: string;
  initialComments: Comment[];
};

export function CommentsSection({ postId, initialComments }: CommentsSectionProps) {
  const [comments, setComments] = useState(initialComments);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const rootComments = comments.filter((comment) => !comment.parentId);
  const repliesByParent = comments.reduce<Record<string, Comment[]>>((groups, comment) => {
    if (comment.parentId) {
      groups[comment.parentId] = [...(groups[comment.parentId] ?? []), comment];
    }

    return groups;
  }, {});

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("\uc218\ud37c\ubca0\uc774\uc2a4 \uc5f0\uacb0\uc774 \uc5c6\uc5b4 \ub313\uae00\uc744 \uc800\uc7a5\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.");
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const authorName = String(formData.get("authorName") ?? "").trim();
    const body = String(formData.get("body") ?? "").trim();

    if (!authorName || !body) {
      setMessage("\uc774\ub984\uacfc \ub313\uae00 \ub0b4\uc6a9\uc744 \uc785\ub825\ud574 \uc8fc\uc138\uc694.");
      return;
    }

    setPending(true);
    setMessage("");

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        author_name: authorName,
        body,
        status: "approved",
      })
      .select("*")
      .single();

    setPending(false);

    if (error) {
      setMessage(`\ub313\uae00 \uc800\uc7a5 \uc2e4\ud328: ${error.message}`);
      return;
    }

    setComments((current) => [
      {
        id: data.id,
        postId: data.post_id,
        parentId: data.parent_id ?? null,
        authorName: data.author_name,
        body: data.body,
        isAdminReply: Boolean(data.is_admin_reply),
        createdAt: data.created_at,
      },
      ...current,
    ]);
    form.reset();
    setMessage("\ub313\uae00\uc774 \ub4f1\ub85d\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
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
                <span>{new Date(comment.createdAt).toLocaleString("ko-KR")}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{comment.body}</p>

              {(repliesByParent[comment.id] ?? []).length > 0 ? (
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
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                        {reply.body}
                      </p>
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
          placeholder={"\ub313\uae00\uc744 \uc785\ub825\ud574 \uc8fc\uc138\uc694"}
          className="rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
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
