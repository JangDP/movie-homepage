"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArticleBody } from "@/components/ArticleBody";
import { ArticleGrid } from "@/components/ArticleGrid";
import { CommentsSection } from "@/components/CommentsSection";
import { PostReactions } from "@/components/PostReactions";
import { PostViewCounter } from "@/components/PostViewCounter";
import { siteConfig } from "@/data/site-config";
import { getCategory } from "@/lib/content";
import { supabase } from "@/lib/supabase";
import type { Comment, ReactionCounts } from "@/lib/cms-repository";
import type { Database } from "@/types/database";
import type { Article, ContentCategory } from "@/types/site";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type ReactionType = keyof ReactionCounts;

type PostDetailClientProps = {
  category: ContentCategory;
  slug: string;
};

const emptyReactionCounts: ReactionCounts = {
  like: 0,
  watched: 0,
  excited: 0,
  dislike: 0,
};

function normalizeCategory(value: string) {
  return value.replace(/^\//, "").toLowerCase();
}

function mapPost(row: PostRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category_id,
    author: row.author ?? "편집부",
    publishedAt: row.published_at ?? row.created_at ?? "",
    readTime: row.read_time ?? "3분",
    image: row.thumbnail_url ?? "",
    imageAlt: row.image_alt ?? row.title,
    tags: row.tags ?? [],
    status: row.status,
    featured: row.featured ?? false,
    viewCount: row.view_count ?? 0,
  };
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function countReactions(rows: Array<{ reaction_type: ReactionType }>) {
  return rows.reduce<ReactionCounts>(
    (counts, row) => {
      counts[row.reaction_type] += 1;
      return counts;
    },
    { ...emptyReactionCounts },
  );
}

export function PostDetailClient({ category, slug }: PostDetailClientProps) {
  const [post, setPost] = useState<Article | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<Article[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [reactionCounts, setReactionCounts] = useState<ReactionCounts>(emptyReactionCounts);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadPost() {
      if (!supabase) {
        setErrorMessage("Supabase 환경변수가 설정되지 않았습니다.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage("");

      const { data: postRows, error: postError } = await supabase
        .from("posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published");

      if (!isMounted) {
        return;
      }

      if (postError) {
        setErrorMessage(postError.message);
        setIsLoading(false);
        return;
      }

      const requestedCategory = normalizeCategory(String(category));
      const matchedRow = (postRows ?? []).find((row) => {
        const rowCategory = normalizeCategory(row.category_id);
        return rowCategory === requestedCategory || rowCategory === `${requestedCategory}s`;
      });

      if (!matchedRow) {
        setPost(null);
        setIsLoading(false);
        return;
      }

      const nextPost = mapPost(matchedRow);
      setPost(nextPost);

      const [
        { data: relatedRows },
        { data: commentRows },
        { data: reactionRows },
      ] = await Promise.all([
        supabase
          .from("posts")
          .select("*")
          .eq("category_id", nextPost.category)
          .eq("status", "published")
          .neq("id", nextPost.id)
          .order("published_at", { ascending: false, nullsFirst: false })
          .limit(3),
        supabase
          .from("comments")
          .select("*")
          .eq("post_id", nextPost.id)
          .eq("status", "approved")
          .eq("is_deleted", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("post_reactions")
          .select("reaction_type")
          .eq("post_slug", nextPost.slug),
      ]);

      if (!isMounted) {
        return;
      }

      setRelatedPosts((relatedRows ?? []).map(mapPost));
      setComments((commentRows ?? []).map(mapComment));
      setReactionCounts(
        countReactions((reactionRows ?? []) as Array<{ reaction_type: ReactionType }>),
      );
      setIsLoading(false);
    }

    void loadPost();

    return () => {
      isMounted = false;
    };
  }, [category, slug]);

  if (isLoading) {
    return (
      <main className="min-h-screen pt-24">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-sm font-bold text-zinc-400">글을 불러오는 중입니다.</p>
        </section>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="min-h-screen pt-24">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-900 bg-red-950/30 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-400">
              Supabase Error
            </p>
            <h1 className="mt-3 text-2xl font-black text-white">
              글을 불러오지 못했습니다.
            </h1>
            <p className="mt-3 text-sm leading-6 text-red-100">{errorMessage}</p>
          </div>
        </section>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen pt-24">
        <section className="mx-auto max-w-3xl px-4 py-20 text-center">
          <p className="text-sm font-bold text-red-500">404</p>
          <h1 className="mt-3 text-3xl font-black text-white">글을 찾을 수 없습니다.</h1>
          <Link
            href="/"
            className="mt-6 inline-flex min-h-10 items-center rounded bg-red-700 px-4 text-sm font-bold text-white"
          >
            홈으로 이동
          </Link>
        </section>
      </main>
    );
  }

  const categoryInfo = getCategory(post.category);

  return (
    <main className="min-h-screen pt-16">
      <article>
        <header className="relative isolate min-h-[520px] overflow-hidden border-b border-zinc-900">
          {post.image ? (
            <Image
              src={post.image}
              alt={post.imageAlt}
              fill
              priority
              sizes="100vw"
              className="object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-black/70 to-black/30" />
          <div className="relative mx-auto flex min-h-[520px] max-w-4xl flex-col justify-end px-4 pb-12 pt-28 sm:px-6 lg:px-8">
            <p className="text-sm font-bold text-red-500">
              {categoryInfo?.label ?? post.category}
            </p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
              {post.title}
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-zinc-300">
              {post.excerpt}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-zinc-400">
              <span>{post.author}</span>
              <span>/</span>
              <span>{post.publishedAt}</span>
              <span>/</span>
              <span>{post.readTime}</span>
              <span>/</span>
              <PostViewCounter
                postId={post.id}
                postSlug={post.slug}
                initialCount={post.viewCount}
              />
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,760px)_320px] lg:px-8">
          <div className="min-w-0 space-y-8">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded border border-zinc-800 bg-zinc-950 px-3 py-1 text-xs text-zinc-400"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <div className="rounded-lg border border-zinc-800 bg-black/50 p-5 sm:p-8">
              <ArticleBody content={post.body} />
              <AdPlaceholder label="Article middle AdSense slot" className="my-8" />
            </div>

            <PostReactions
              postId={post.id}
              postSlug={post.slug}
              initialCounts={reactionCounts}
            />
            <CommentsSection postId={post.id} initialComments={comments} />
          </div>

          <aside className="space-y-5">
            <AdPlaceholder label="Sidebar AdSense slot" />
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-5">
              <h2 className="text-lg font-bold text-white">{siteConfig.logoText}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                {siteConfig.description}
              </p>
            </div>
          </aside>
        </div>
      </article>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-5">
          <h2 className="text-2xl font-black text-white">관련 글</h2>
          <p className="mt-2 text-sm text-zinc-500">
            같은 카테고리의 다른 글입니다.
          </p>
        </div>
        <ArticleGrid articles={relatedPosts} />
      </section>
    </main>
  );
}
