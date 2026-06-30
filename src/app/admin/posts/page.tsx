import type { Metadata } from "next";
import Link from "next/link";

import { AdminCard } from "@/components/AdminCard";
import { AdminPostsTable } from "@/components/AdminPostsTable";
import { AdminShell } from "@/components/AdminShell";
import { getPostsFromSupabase } from "@/lib/cms-repository";

export const metadata: Metadata = {
  title: "\uae00 \uad00\ub9ac",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const runtime = "edge";
export const revalidate = 0;

export default async function AdminPostsPage() {
  const posts = await getPostsFromSupabase();

  return (
    <AdminShell
      title={"\uae00 \uad00\ub9ac"}
      description={"Supabase posts \ud14c\uc774\ube14\uc758 \uae00 \ubaa9\ub85d\uc744 \uad00\ub9ac\ud569\ub2c8\ub2e4."}
    >
      <AdminCard>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{"\uae00 \ubaa9\ub85d"}</h2>
            <p className="mt-1 text-sm text-zinc-500">
              {"\uc0ad\uc81c\ub294 status\ub97c deleted\ub85c \ubc14\uafb8\ub294 soft delete \ubc29\uc2dd\uc73c\ub85c \ucc98\ub9ac\ub429\ub2c8\ub2e4."}
            </p>
          </div>
          <Link
            href="/admin/posts/new"
            className="inline-flex min-h-10 items-center justify-center rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600"
          >
            {"+ \uc0c8 \uae00 \uc791\uc131"}
          </Link>
        </div>

        <AdminPostsTable posts={posts} />
      </AdminCard>
    </AdminShell>
  );
}
