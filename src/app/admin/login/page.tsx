import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminLoginForm } from "@/components/AdminLoginForm";

export const metadata: Metadata = {
  title: "Admin Login",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
          <p className="text-center text-sm text-zinc-500">Loading login...</p>
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
