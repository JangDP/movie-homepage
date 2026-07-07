"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";

type MfaMode = "loading" | "setup" | "verify" | "forbidden" | "missing-config" | "error";

type EnrolledFactor = {
  id: string;
  status?: string;
  friendly_name?: string | null;
};

type SetupFactor = {
  id: string;
  qrCode: string;
  secret: string;
  uri: string;
};

function safeAdminNextPath(value: string | null) {
  if (!value || !value.startsWith("/admin") || value.startsWith("/admin/login")) {
    return "/admin";
  }

  if (value.startsWith("/admin/mfa")) {
    return "/admin";
  }

  return value;
}

function MfaQrCode({ qrCode }: { qrCode: string }) {
  const value = qrCode.trim();

  if (!value || value.startsWith("otpauth://")) {
    return null;
  }

  if (value.startsWith("<svg")) {
    return (
      <div
        className="mx-auto max-w-[260px] rounded bg-white p-4"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[260px] rounded bg-white p-4">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={value} alt="OTP 등록 QR 코드" className="h-auto w-full" />
    </div>
  );
}

export function AdminMfaManager() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = useMemo(() => safeAdminNextPath(searchParams.get("next")), [searchParams]);
  const [mode, setMode] = useState<MfaMode>("loading");
  const [email, setEmail] = useState("");
  const [factor, setFactor] = useState<EnrolledFactor | null>(null);
  const [setupFactor, setSetupFactor] = useState<SetupFactor | null>(null);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function enrollFactor() {
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "시네마틱 유니버스 CMS",
      });

      if (!mounted) {
        return;
      }

      if (error) {
        setMessage(error.message);
        setMode("error");
        return;
      }

      setSetupFactor({
        id: data.id,
        qrCode: data.totp.qr_code ?? "",
        secret: data.totp.secret ?? "",
        uri: "uri" in data.totp ? String(data.totp.uri) : "",
      });
    }

    async function loadMfaState() {
      if (!supabase) {
        setMode("missing-config");
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!mounted) {
        return;
      }

      if (!session?.user.email) {
        router.replace(`/admin/login?next=${encodeURIComponent(nextPath)}`);
        return;
      }

      setEmail(session.user.email);

      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("id,email,role")
        .eq("email", session.user.email.toLowerCase())
        .maybeSingle();

      if (!mounted) {
        return;
      }

      if (!adminUser) {
        setMode("forbidden");
        return;
      }

      const { data: factorData, error: factorError } = await supabase.auth.mfa.listFactors();

      if (!mounted) {
        return;
      }

      if (factorError) {
        setMessage(factorError.message);
        setMode("error");
        return;
      }

      const verifiedFactor = factorData.totp.find((item) => item.status === "verified");

      if (verifiedFactor) {
        setFactor(verifiedFactor);
        setMode("verify");
        return;
      }

      setMode("setup");
      await enrollFactor();
    }

    void loadMfaState();

    return () => {
      mounted = false;
    };
  }, [nextPath, router]);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("Supabase 연결이 없습니다.");
      return;
    }

    const factorId = factor?.id ?? setupFactor?.id;
    const token = code.trim().replace(/\s/g, "");

    if (!factorId) {
      setMessage("OTP factor 정보를 찾을 수 없습니다. 화면을 새로고침해 주세요.");
      return;
    }

    if (!/^\d{6}$/.test(token)) {
      setMessage("OTP 앱에 표시된 6자리 숫자를 입력해 주세요.");
      return;
    }

    setPending(true);
    setMessage("");

    const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
      factorId,
    });

    if (challengeError) {
      setPending(false);
      setMessage(`OTP 확인 준비 실패: ${challengeError.message}`);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challengeData.id,
      code: token,
    });

    setPending(false);

    if (verifyError) {
      setMessage(`OTP 확인 실패: ${verifyError.message}`);
      return;
    }

    setMessage("OTP 확인이 완료되었습니다.");
    router.replace(nextPath);
    router.refresh();
  }

  async function signOut() {
    await supabase?.auth.signOut();
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-16 text-zinc-100">
      <div className="mx-auto max-w-md">
        <Link href="/" className="text-sm font-bold text-red-500">
          {siteConfig.appearance.logoText}
        </Link>

        <section className="mt-6 rounded-lg border border-zinc-800 bg-black/60 p-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">
            관리자 OTP 보안
          </p>
          <h1 className="mt-3 text-2xl font-black text-white">2단계 인증</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Google Authenticator, Microsoft Authenticator 같은 OTP 앱의 6자리 코드를
            입력해야 관리자 페이지에 접근할 수 있습니다.
          </p>

          {email ? <p className="mt-3 text-xs text-zinc-500">{email}</p> : null}

          {mode === "loading" ? (
            <p className="mt-6 text-sm text-zinc-500">OTP 상태를 확인하는 중입니다.</p>
          ) : null}

          {mode === "missing-config" ? (
            <p className="mt-6 rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              Supabase 환경변수가 설정되지 않았습니다.
            </p>
          ) : null}

          {mode === "forbidden" ? (
            <div className="mt-6 rounded border border-red-900 bg-red-950/40 p-3 text-sm text-red-200">
              관리자 권한이 없는 계정입니다.
            </div>
          ) : null}

          {mode === "setup" ? (
            <div className="mt-6 space-y-5">
              <div className="rounded border border-zinc-800 bg-zinc-950 p-4">
                <h2 className="text-sm font-bold text-white">OTP 앱 등록</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  OTP 앱에서 QR 코드를 스캔한 뒤 생성된 6자리 숫자를 입력하세요.
                </p>

                {setupFactor?.qrCode ? (
                  <div className="mt-4">
                    <MfaQrCode qrCode={setupFactor.qrCode} />
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-zinc-500">QR 코드를 만드는 중입니다.</p>
                )}

                {setupFactor?.secret ? (
                  <div className="mt-3 rounded border border-zinc-800 bg-black p-3">
                    <p className="text-xs font-bold text-zinc-300">QR 스캔이 안 될 때</p>
                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                      OTP 앱에서 직접 입력 또는 설정 키 입력을 선택하고 아래 키를 넣으세요.
                    </p>
                    <p className="mt-2 break-all rounded bg-zinc-950 p-2 font-mono text-xs text-zinc-100">
                      {setupFactor.secret}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {mode === "verify" || mode === "setup" ? (
            <form onSubmit={verifyCode} className="mt-6 grid gap-4">
              <label className="block text-sm font-semibold text-zinc-300">
                OTP 6자리 코드
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  autoComplete="one-time-code"
                  className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-lg font-black tracking-[0.4em] text-zinc-100 outline-none focus:border-red-700"
                />
              </label>
              <button
                type="submit"
                disabled={pending}
                className="min-h-11 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pending ? "확인 중..." : mode === "setup" ? "OTP 등록 완료" : "OTP 확인"}
              </button>
            </form>
          ) : null}

          {mode === "error" || message ? (
            <p className="mt-4 rounded border border-red-900 bg-red-950/40 p-3 text-xs font-bold text-red-200">
              {message}
            </p>
          ) : null}

          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-5 rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-300 hover:border-red-700"
          >
            로그아웃
          </button>
        </section>
      </div>
    </main>
  );
}
