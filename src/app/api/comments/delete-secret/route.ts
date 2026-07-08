import { NextResponse } from "next/server";

export const runtime = "edge";

function supabaseRestUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!rawUrl) {
    return null;
  }

  const withProtocol = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;

  return `${new URL(withProtocol).origin}/rest/v1`;
}

async function callSupabaseRpc<T>(functionName: string, body: Record<string, unknown>) {
  const baseUrl = supabaseRestUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!baseUrl || !anonKey) {
    return { data: null as T | null, error: "Supabase 환경변수가 설정되지 않았습니다." };
  }

  const response = await fetch(`${baseUrl}/rpc/${functionName}`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return { data: null as T | null, error: await response.text() };
  }

  return { data: (await response.json()) as T, error: null };
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => null)) as {
    commentId?: string;
    password?: string;
  } | null;

  const commentId = payload?.commentId?.trim();
  const password = payload?.password?.trim();

  if (!commentId || !password) {
    return NextResponse.json({ ok: false, message: "비밀번호를 입력해 주세요." }, { status: 400 });
  }

  const { data, error } = await callSupabaseRpc<
    Array<{ ok: boolean; message: string; deleted_id: string | null }>
  >("delete_secret_comment", {
    target_comment_id: commentId,
    secret_password: password,
  });

  if (error) {
    return NextResponse.json({ ok: false, message: `비밀글 삭제 실패: ${error}` }, { status: 500 });
  }

  const first = data?.[0];

  if (!first?.ok) {
    return NextResponse.json({ ok: false, message: first?.message || "비밀번호가 올바르지 않습니다." }, { status: 403 });
  }

  return NextResponse.json({
    ok: true,
    deletedIds: (data ?? []).map((item) => item.deleted_id).filter(Boolean),
  });
}
