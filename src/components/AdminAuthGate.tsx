"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AdminAuthProvider } from "@/components/AdminAuthContext";
import { supabase } from "@/lib/supabase";
import type { AdminRole, AdminUser } from "@/types/admin";

type AdminAuthGateProps = {
  children: React.ReactNode;
};

type GateStatus = "loading" | "ready" | "forbidden" | "missing-config" | "error";

function mapAdminUser(row: {
  id: string;
  email: string;
  role: AdminRole;
  created_at: string;
}): AdminUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.created_at,
  };
}

export function AdminAuthGate({ children }: AdminAuthGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [status, setStatus] = useState<GateStatus>("loading");
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      if (!supabase) {
        setStatus("missing-config");
        return;
      }

      setStatus("loading");
      setErrorMessage("");

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!mounted) {
        return;
      }

      if (!session?.user.email) {
        router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      const { data, error } = await supabase
        .from("admin_users")
        .select("id,email,role,created_at")
        .eq("email", session.user.email.toLowerCase())
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
        return;
      }

      if (!data) {
        setStatus("forbidden");
        return;
      }

      setAdminUser(mapAdminUser(data as Parameters<typeof mapAdminUser>[0]));
      setStatus("ready");
    }

    checkSession();

    const {
      data: { subscription },
    } =
      supabase?.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          setAdminUser(null);
          router.replace(`/admin/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        void checkSession();
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
          <h1 className="text-xl font-black text-white">Supabase 설정이 없습니다</h1>
          <p className="mt-3 text-sm leading-6 text-red-100">
            .env.local의 NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인하세요.
          </p>
        </div>
      </main>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-lg border border-zinc-800 bg-black/60 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
            접근 제한
          </p>
          <h1 className="mt-3 text-2xl font-black text-white">관리자 권한이 없습니다.</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            Supabase Auth 로그인은 되었지만 admin_users 테이블에 등록된 이메일이 아닙니다.
          </p>
          <button
            type="button"
            onClick={async () => {
              await supabase?.auth.signOut();
              router.replace("/admin/login");
            }}
            className="mt-5 rounded bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600"
          >
            다른 계정으로 로그인
          </button>
        </div>
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-100">
        <div className="mx-auto max-w-xl rounded-lg border border-red-900 bg-red-950/30 p-6">
          <h1 className="text-xl font-black text-white">관리자 권한 확인 실패</h1>
          <p className="mt-3 text-sm leading-6 text-red-100">{errorMessage}</p>
        </div>
      </main>
    );
  }

  if (status !== "ready" || !adminUser) {
    return (
      <main className="min-h-screen bg-zinc-950 px-4 py-24 text-zinc-100">
        <p className="text-center text-sm text-zinc-500">관리자 권한을 확인하는 중...</p>
      </main>
    );
  }

  return <AdminAuthProvider value={adminUser}>{children}</AdminAuthProvider>;
}
