import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminMfaManager } from "@/components/AdminMfaManager";

export const metadata: Metadata = {
  title: "Admin OTP",
  robots: { index: false, follow: false },
};

export default function AdminMfaPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
          <p className="text-center text-sm text-zinc-500">OTP 화면을 불러오는 중입니다.</p>
        </main>
      }
    >
      <AdminMfaManager />
    </Suspense>
  );
}
