import type { Metadata } from "next";

import { AdminShell } from "@/components/AdminShell";
import { PostEditor } from "@/components/PostEditor";

export const metadata: Metadata = {
  title: "새 글 작성",
  robots: { index: false, follow: false },
};

export default function AdminNewPostPage() {
  return (
    <AdminShell
      title="새 글 작성"
      description="티스토리처럼 글을 작성하고 Supabase에 저장하는 CMS 편집기입니다."
    >
      <PostEditor />
    </AdminShell>
  );
}
