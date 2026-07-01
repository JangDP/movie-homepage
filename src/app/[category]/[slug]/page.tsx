import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { AdPlaceholder } from "@/components/AdPlaceholder";
import { ArticleGrid } from "@/components/ArticleGrid";
import { ArticleBody } from "@/components/ArticleBody";
import { CommentsSection } from "@/components/CommentsSection";
import { PostReactions } from "@/components/PostReactions";
import { PostViewCounter } from "@/components/PostViewCounter";
import { siteConfig } from "@/data/site-config";
import {
  getComments,
  getPostDetailFromSupabase,
  getReactionCounts,
} from "@/lib/cms-repository";
import { getCategory, getRelatedPosts } from "@/lib/content";
import {
  absoluteUrl,
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  getPostDescription,
  getPostKeywords,
  postUrl,
} from "@/lib/seo";
import type { ContentCategory } from "@/types/site";

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const revalidate = 0;

type PostDetailPageProps = {
  params: Promise<{
    category: ContentCategory;
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const { post } = await getPostDetailFromSupabase(category, slug);
  const categoryInfo = post ? getCategory(post.category) : null;
  const description = post ? getPostDescription(post) : "";
  const canonical = post ? postUrl(post) : absoluteUrl(`/${category}/${slug}`);
  const image = post?.image ? absoluteUrl(post.image) : absoluteUrl(siteConfig.appearance.heroImage);

  if (!post) {
    return {
      title: "글을 찾을 수 없습니다",
    };
  }

  return {
    title: post.title,
    description,
    keywords: getPostKeywords(post, categoryInfo?.label),
    alternates: {
      canonical,
    },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ],
      type: "article",
      publishedTime: post.publishedAt || undefined,
      authors: [post.author],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
      images: [image],
    },
  };
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { category, slug } = await params;
  const { post, error } = await getPostDetailFromSupabase(category, slug);

  if (error) {
    return (
      <main className="min-h-screen pt-24">
        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-red-900 bg-red-950/30 p-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-red-400">
              Supabase Error
            </p>
            <h1 className="mt-3 text-2xl font-black text-white">
              글을 불러오지 못했습니다
            </h1>
            <p className="mt-3 text-sm leading-6 text-red-100">{error}</p>
            <p className="mt-4 text-sm leading-6 text-zinc-400">
              이 경우는 글이 없는 404가 아니라 Supabase 권한, RLS 정책, 테이블
              상태 문제입니다. `supabase-schema.sql`의 posts select/insert 정책과
              grant를 다시 실행해 주세요.
            </p>
          </div>
        </section>
      </main>
    );
  }

  if (!post) {
    notFound();
  }

  const [relatedPosts, comments, reactionCounts] = await Promise.all([
    getRelatedPosts(post.category, post.id),
    getComments(post.id),
    getReactionCounts(post.slug),
  ]);
  const categoryInfo = getCategory(post.category);
  const canonical = postUrl(post);
  const jsonLd = [
    createArticleJsonLd(post, categoryInfo),
    createBreadcrumbJsonLd([
      { name: siteConfig.name, url: absoluteUrl("/") },
      {
        name: categoryInfo?.label ?? String(post.category),
        url: absoluteUrl(categoryInfo?.href ?? `/${post.category}`),
      },
      { name: post.title, url: canonical },
    ]),
  ];

  return (
    <main className="min-h-screen pt-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
