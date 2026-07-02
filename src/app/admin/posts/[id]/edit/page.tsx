import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { PostEditor } from "@/components/PostEditor";

export const metadata: Metadata = {
  title: "글 수정",
  robots: { index: false, follow: false },
};

export const runtime = "edge";

type AdminEditPostPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AdminEditPostPage({ params }: AdminEditPostPageProps) {
  const { id } = await params;

  return (
    <AdminShell
      title="글 수정"
      description="발행된 글이나 임시 저장 글을 불러와 다시 수정합니다."
    >
      <PostEditor postId={id} />
    </AdminShell>
  );
}
