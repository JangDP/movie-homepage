"use client";

import { useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import { getCategory } from "@/lib/content";
import { canDeletePosts } from "@/types/admin";
import type { Post } from "@/types/site";

type AdminPostsTableProps = {
  posts: Post[];
};

export function AdminPostsTable({ posts }: AdminPostsTableProps) {
  const adminUser = useAdminUser();
  const allowDelete = canDeletePosts(adminUser.role);
  const [items, setItems] = useState(posts);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function deletePost(post: Post) {
    if (!allowDelete) {
      setMessage("에디터 권한은 글을 삭제할 수 없습니다.");
      return;
    }

    if (!supabase) {
      setMessage("\uc218\ud37c\ubca0\uc774\uc2a4 \uc5f0\uacb0\uc774 \uc5c6\uc5b4 \uc0ad\uc81c\ud560 \uc218 \uc5c6\uc2b5\ub2c8\ub2e4.");
      return;
    }

    const confirmed = window.confirm(
      `"${post.title}"\uc744(\ub97c) \uc0ad\uc81c \ucc98\ub9ac\ud560\uae4c\uc694?`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(post.id);
    setMessage("");

    const { error } = await supabase
      .from("posts")
      .update({ status: "deleted" })
      .eq("id", post.id);

    setDeletingId(null);

    if (error) {
      setMessage(`\uc0ad\uc81c \uc2e4\ud328: ${error.message}`);
      return;
    }

    setItems((current) => current.filter((item) => item.id !== post.id));
    setMessage("\uc0ad\uc81c \ucc98\ub9ac\ub418\uc5c8\uc2b5\ub2c8\ub2e4.");
  }

  return (
    <div>
      {message ? (
        <div className="mb-4 rounded border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-zinc-300">
          {message}
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="border-b border-zinc-800 text-xs uppercase text-zinc-500">
            <tr>
              <th className="py-3 pr-4">{"\uc81c\ubaa9"}</th>
              <th className="py-3 pr-4">{"\uce74\ud14c\uace0\ub9ac"}</th>
              <th className="py-3 pr-4">{"\uc0c1\ud0dc"}</th>
              <th className="py-3 pr-4">{"\uc791\uc131\uc790"}</th>
              <th className="py-3 pr-4">{"\ubc1c\ud589\uc77c"}</th>
              <th className="py-3 pr-4">slug</th>
              <th className="py-3">{"\uad00\ub9ac"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {items.map((post) => (
              <tr key={post.id} className="text-zinc-300">
                <td className="py-4 pr-4 font-bold text-white">{post.title}</td>
                <td className="py-4 pr-4">
                  {getCategory(post.category)?.label ?? post.category}
                </td>
                <td className="py-4 pr-4">
                  <span className="rounded bg-zinc-900 px-2 py-1 text-xs font-bold text-zinc-300">
                    {post.status}
                  </span>
                </td>
                <td className="py-4 pr-4">{post.author}</td>
                <td className="py-4 pr-4">{post.publishedAt}</td>
                <td className="py-4 pr-4 text-zinc-500">{post.slug}</td>
                <td className="py-4">
                  <button
                    type="button"
                    disabled={deletingId === post.id || !allowDelete}
                    onClick={() => deletePost(post)}
                    className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === post.id ? "\ucc98\ub9ac \uc911" : "\uc0ad\uc81c"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {items.length === 0 ? (
          <p className="py-8 text-center text-sm text-zinc-500">
            {"\ud45c\uc2dc\ud560 \uae00\uc774 \uc5c6\uc2b5\ub2c8\ub2e4."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
