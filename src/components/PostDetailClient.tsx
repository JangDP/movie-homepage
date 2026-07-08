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
import { formatPostDate, formatRelativeTime } from "@/lib/date-format";
import { supabase } from "@/lib/supabase";
import type { Comment, ReactionCounts } from "@/lib/cms-repository";
import type { Database } from "@/types/database";
import type { Article, ContentCategory } from "@/types/site";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CommentRow = Database["public"]["Functions"]["list_public_comments"]["Returns"][number];
type ReactionType = keyof ReactionCounts;

type PostDetailClientProps = {
  category: ContentCategory;
  slug: string;
};

const postListPageSizeOptions = [5, 10, 20];

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
    parentId: row.parent_id ?? null,
    authorName: row.author_name,
    body: row.body ?? "",
    isAdminReply: Boolean(row.is_admin_reply),
    isSecret: Boolean(row.is_secret),
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

function PostListOverview({
  currentPostId,
  posts,
  total,
  page,
  pageSize,
  open,
  loading,
  onToggle,
  onPageChange,
  onPageSizeChange,
}: {
  currentPostId: string;
  posts: Article[];
  total: number;
  page: number;
  pageSize: number;
  open: boolean;
  loading: boolean;
  onToggle: () => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pages = Array.from({ length: Math.min(totalPages, 10) }, (_, index) => index + 1);

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-zinc-800 bg-black/50 p-4 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-3 border-b border-zinc-800 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-400">
            <span className="font-black text-white">전체보기</span>{" "}
            <span className="text-zinc-500">{total.toLocaleString("ko-KR")}개의 글</span>
          </div>
          <button
            type="button"
            onClick={onToggle}
            className="self-start text-xs font-bold text-zinc-500 transition hover:text-red-400 sm:self-auto"
          >
            {open ? "목록닫기" : "목록열기"}
          </button>
        </div>

        {open ? (
          <>
            <div className="hidden grid-cols-[minmax(0,1fr)_100px_120px] border-b border-zinc-800 py-2 text-xs font-bold text-zinc-500 md:grid">
              <span>글 제목</span>
              <span className="text-right">조회수</span>
              <span className="text-right">작성일</span>
            </div>

            <div className="divide-y divide-zinc-900">
              {loading ? (
                <p className="py-6 text-center text-sm text-zinc-500">글 목록을 불러오는 중입니다.</p>
              ) : posts.length > 0 ? (
                posts.map((item) => {
                  const active = item.id === currentPostId;

                  return (
                    <Link
                      key={item.id}
                      href={`/${item.category}/${item.slug}`}
                      className={`grid gap-2 py-3 text-sm transition md:grid-cols-[minmax(0,1fr)_100px_120px] md:items-center ${
                        active ? "text-red-200" : "text-zinc-300 hover:text-white"
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="line-clamp-1 font-medium">{item.title}</span>
                        {active ? (
                          <span className="mt-1 inline-flex rounded bg-red-700 px-2 py-0.5 text-[10px] font-black text-white">
                            현재 글
                          </span>
                        ) : null}
                      </span>
                      <span className="text-xs text-zinc-500 md:text-right">
                        <span className="md:hidden">조회수 </span>
                        {(item.viewCount ?? 0).toLocaleString("ko-KR")}
                      </span>
                      <span className="text-xs text-zinc-500 md:text-right">
                        <span className="md:hidden">작성일 </span>
                        <span className="block text-zinc-400">{formatRelativeTime(item.publishedAt)}</span>
                        <span className="block text-[11px] text-zinc-600">{formatPostDate(item.publishedAt)}</span>
                      </span>
                    </Link>
                  );
                })
              ) : (
                <p className="py-6 text-center text-sm text-zinc-500">표시할 글이 없습니다.</p>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <select
                value={pageSize}
                onChange={(event) => onPageSizeChange(Number(event.target.value))}
                className="h-9 rounded border border-zinc-800 bg-black px-3 text-xs font-bold text-zinc-300 outline-none focus:border-red-700"
              >
                {postListPageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}줄 보기
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center justify-center gap-1 text-xs">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => onPageChange(page - 1)}
                  className="min-h-8 rounded border border-zinc-800 px-3 font-bold text-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 hover:border-red-700 hover:text-white"
                >
                  이전
                </button>
                {pages.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => onPageChange(item)}
                    className={`size-8 rounded border font-bold ${
                      item === page
                        ? "border-red-700 bg-red-700 text-white"
                        : "border-zinc-800 text-zinc-400 hover:border-red-700 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => onPageChange(page + 1)}
                  className="min-h-8 rounded border border-zinc-800 px-3 font-bold text-zinc-400 disabled:cursor-not-allowed disabled:opacity-40 hover:border-red-700 hover:text-white"
                >
                  다음
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}

export function PostDetailClient({ category, slug }: PostDetailClientProps) {
  const [post, setPost] = useState<Article | null>(null);
  const [postList, setPostList] = useState<Article[]>([]);
  const [postListTotal, setPostListTotal] = useState(0);
  const [postListPage, setPostListPage] = useState(1);
  const [postListPageSize, setPostListPageSize] = useState(5);
  const [postListOpen, setPostListOpen] = useState(true);
  const [postListLoading, setPostListLoading] = useState(false);
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
        supabase.rpc("list_public_comments", {
          target_post_id: nextPost.id,
        }),
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

  useEffect(() => {
    let isMounted = true;

    async function loadPostList() {
      if (!supabase) {
        return;
      }

      setPostListLoading(true);

      const from = (postListPage - 1) * postListPageSize;
      const to = from + postListPageSize - 1;
      const { data, error, count } = await supabase
        .from("posts")
        .select("*", { count: "exact" })
        .eq("status", "published")
        .order("published_at", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("[post list overview]", error.message);
        setPostList([]);
        setPostListTotal(0);
        setPostListLoading(false);
        return;
      }

      setPostList((data ?? []).map(mapPost));
      setPostListTotal(count ?? 0);
      setPostListLoading(false);
    }

    void loadPostList();

    return () => {
      isMounted = false;
    };
  }, [postListPage, postListPageSize]);

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
      <PostListOverview
        currentPostId={post.id}
        posts={postList}
        total={postListTotal}
        page={postListPage}
        pageSize={postListPageSize}
        open={postListOpen}
        loading={postListLoading}
        onToggle={() => setPostListOpen((value) => !value)}
        onPageChange={setPostListPage}
        onPageSizeChange={(nextPageSize) => {
          setPostListPageSize(nextPageSize);
          setPostListPage(1);
        }}
      />
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
              <span>{formatPostDate(post.publishedAt)}</span>
              {formatRelativeTime(post.publishedAt) ? (
                <>
                  <span>/</span>
                  <span>{formatRelativeTime(post.publishedAt)}</span>
                </>
              ) : null}
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
