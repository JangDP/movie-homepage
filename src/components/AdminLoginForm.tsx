"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";

type LoginState = {
  type: "idle" | "error" | "success";
  message: string;
};

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const isReady = useMemo(() => Boolean(supabase), []);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<LoginState>({ type: "idle", message: "" });

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState({
        type: "error",
        message: "Supabase 환경변수가 없습니다. .env.local을 확인하세요.",
      });
      return;
    }

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setState({ type: "error", message: "이메일과 비밀번호를 입력하세요." });
      return;
    }

    setPending(true);
    setState({ type: "idle", message: "" });

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setPending(false);

    if (error) {
      setState({ type: "error", message: "이메일 또는 비밀번호가 올바르지 않습니다." });
      return;
    }

    setState({ type: "success", message: "로그인 완료" });
    router.replace(nextPath.startsWith("/admin") ? nextPath : "/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-red-500">
          {siteConfig.appearance.logoText}
        </Link>
        <section className="mt-6 rounded-lg border border-zinc-800 bg-black/60 p-6">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
              관리자 로그인
            </p>
            <h1 className="mt-3 text-2xl font-black text-white">CineScope CMS</h1>
            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Supabase Auth 관리자 계정으로 로그인하면 미디어 업로드와 콘텐츠 관리를 사용할 수 있습니다.
            </p>
          </div>

          <form onSubmit={login} className="mt-6 grid gap-4">
            <label className="block text-sm font-semibold text-zinc-300">
              이메일
              <input
                type="email"
                name="email"
                autoComplete="email"
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
              />
            </label>
            <label className="block text-sm font-semibold text-zinc-300">
              비밀번호
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
              />
            </label>
            <button
              type="submit"
              disabled={pending || !isReady}
              className="min-h-11 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "로그인 중..." : "로그인"}
            </button>
          </form>

          {!isReady ? (
            <p className="mt-4 rounded border border-red-900 bg-red-950/40 p-3 text-xs text-red-200">
              Supabase 환경변수가 없습니다.
            </p>
          ) : null}

          {state.message ? (
            <p
              className={`mt-4 rounded border p-3 text-xs font-bold ${
                state.type === "success"
                  ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
                  : "border-red-900 bg-red-950/40 text-red-200"
              }`}
            >
              {state.message}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
