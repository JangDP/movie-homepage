import type { Metadata } from "next";

import { PostDetailClient } from "@/components/PostDetailClient";
import type { ContentCategory } from "@/types/site";

export const runtime = "edge";

export const metadata: Metadata = {
  title: "시네마틱 유니버스 글 보기",
  description: "시네마틱 유니버스 영화 매거진 글 상세 페이지입니다.",
  robots: {
    index: true,
    follow: true,
  },
};

type PostDetailPageProps = {
  params: Promise<{
    category: ContentCategory;
    slug: string;
  }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { category, slug } = await params;

  return <PostDetailClient category={category} slug={slug} />;
}
