"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import { getCategory } from "@/lib/content";
import { canDeletePosts } from "@/types/admin";
import type { Post } from "@/types/site";

type AdminPostsTableProps = {
  posts?: Post[];
};

type PostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string | null;
  category_id: string;
  author: string | null;
  published_at: string | null;
  read_time: string | null;
  thumbnail_url: string | null;
  image_alt: string | null;
  tags: string[] | null;
  status: "draft" | "published" | "deleted";
  featured: boolean | null;
  view_count: number | null;
};

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category_id,
    author: row.author ?? "편집부",
    publishedAt: row.published_at ?? "",
    readTime: row.read_time ?? "3분",
    image: row.thumbnail_url ?? "",
    imageAlt: row.image_alt ?? row.title,
    tags: row.tags ?? [],
    status: row.status,
    featured: row.featured ?? false,
    viewCount: row.view_count ?? 0,
  };
}

export function AdminPostsTable({ posts = [] }: AdminPostsTableProps) {
  const adminUser = useAdminUser();
  const allowDelete = canDeletePosts(adminUser.role);
  const [items, setItems] = useState(posts);
  const [message, setMessage] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setMessage("Supabase 연결이 없어 글 목록을 불러올 수 없습니다.");
      return;
    }

    supabase
      .from("posts")
      .select("*")
      .neq("status", "deleted")
      .order("published_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setMessage(`글 목록 불러오기 실패: ${error.message}`);
          return;
        }

        setItems(((data ?? []) as PostRow[]).map(mapPost));
      });
  }, []);

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
              <th className="py-3 pr-4">추천</th>
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
                <td className="py-4 pr-4">
                  {post.featured ? (
                    <span
                      title="추천 글"
                      aria-label="추천 글"
                      className="inline-flex size-8 items-center justify-center rounded bg-red-700/15 text-lg text-red-300"
                    >
                      👍
                    </span>
                  ) : (
                    <span className="text-zinc-700">-</span>
                  )}
                </td>
                <td className="py-4 pr-4">{post.publishedAt}</td>
                <td className="py-4 pr-4 text-zinc-500">{post.slug}</td>
                <td className="py-4">
                  <div className="flex gap-2">
                  <Link
                    href={`/admin/posts/${post.id}/edit`}
                    className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 transition hover:border-red-700 hover:text-white"
                  >
                    수정
                  </Link>
                  <button
                    type="button"
                    disabled={deletingId === post.id || !allowDelete}
                    onClick={() => deletePost(post)}
                    className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {deletingId === post.id ? "\ucc98\ub9ac \uc911" : "\uc0ad\uc81c"}
                  </button>
                  </div>
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
