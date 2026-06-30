"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

type AdminAuthGateProps = {
  children: React.ReactNode;
};

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "missing-config">("loading");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      if (!supabase) {
        setStatus("missing-config");
        return;
      }

      const { data } = await supabase.auth.getSession();

      if (!mounted) {
        return;
      }

      if (!data.session) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setStatus("ready");
    }

    checkSession();

    const {
      data: { subscription },
    } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        setStatus("ready");
      }) ?? { data: { subscription: null } };

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [pathname, router]);

  if (status === "missing-config") {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-lg border border-red-900 bg-red-950/30 p-6">
          <h1 className="text-xl font-black text-white">Supabase config is missing</h1>
          <p className="mt-3 text-sm leading-6 text-red-100">
            Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.
          </p>
        </div>
      </main>
    );
  }

  if (status !== "ready") {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-100">
        <p className="text-center text-sm text-zinc-500">Checking admin session...</p>
      </main>
    );
  }

  return <>{children}</>;
}
