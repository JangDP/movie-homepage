"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";

type LoginState = {
  type: "idle" | "error" | "success";
  message: string;
};

function getSupabaseHost() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    return "설정 없음";
  }

  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function getLoginErrorMessage(message: string, email: string) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("invalid login credentials")) {
    return `로그인 실패: Supabase Auth에서 ${email} 계정의 이메일 또는 비밀번호가 일치하지 않는다고 응답했습니다.`;
  }

  if (lowerMessage.includes("email not confirmed")) {
    return "로그인 실패: 이메일 확인이 완료되지 않은 계정입니다. Supabase Users에서 Auto Confirm 상태를 확인하세요.";
  }

  return `로그인 실패: ${message}`;
}

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/admin";
  const isReady = useMemo(() => Boolean(supabase), []);
  const supabaseHost = useMemo(() => getSupabaseHost(), []);
  const fieldId = useMemo(() => Math.random().toString(36).slice(2), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldsLocked, setFieldsLocked] = useState(true);
  const [pending, setPending] = useState(false);
  const [state, setState] = useState<LoginState>({ type: "idle", message: "" });

  useEffect(() => {
    const timers = [50, 250, 750, 1500].map((delay) =>
      window.setTimeout(() => {
        setEmail("");
        setPassword("");
      }, delay),
    );

    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setState({
        type: "error",
        message: "Supabase 환경변수가 없습니다. .env.local 또는 Cloudflare 환경변수를 확인하세요.",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      setState({ type: "error", message: "이메일과 비밀번호를 입력하세요." });
      return;
    }

    setPending(true);
    setState({ type: "idle", message: "" });

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    setPending(false);

    if (error) {
      setState({ type: "error", message: getLoginErrorMessage(error.message, normalizedEmail) });
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
            <p className="mt-3 rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-500">
              연결된 Supabase 프로젝트:{" "}
              <span className="font-bold text-zinc-300">{supabaseHost}</span>
            </p>
          </div>

          <form onSubmit={login} autoComplete="off" className="mt-6 grid gap-4">
            <input
              type="text"
              name="username"
              tabIndex={-1}
              autoComplete="username"
              className="hidden"
              aria-hidden="true"
            />
            <input
              type="password"
              name="password"
              tabIndex={-1}
              autoComplete="current-password"
              className="hidden"
              aria-hidden="true"
            />

            <label className="block text-sm font-semibold text-zinc-300">
              이메일
              <input
                type="email"
                name={`cms-email-${fieldId}`}
                value={email}
                readOnly={fieldsLocked}
                onFocus={() => setFieldsLocked(false)}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                spellCheck={false}
                className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
              />
            </label>
            <label className="block text-sm font-semibold text-zinc-300">
              비밀번호
              <input
                type="password"
                name={`cms-pass-${fieldId}`}
                value={password}
                readOnly={fieldsLocked}
                onFocus={() => setFieldsLocked(false)}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="off"
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
