import { NextResponse } from "next/server";

export const runtime = "edge";

type SupabaseRpcOptions = {
  functionName: string;
  body: Record<string, unknown>;
};

function supabaseRestUrl() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!rawUrl) {
    return null;
  }

  const withProtocol = rawUrl.trim().startsWith("http") ? rawUrl.trim() : `https://${rawUrl.trim()}`;

  return `${new URL(withProtocol).origin}/rest/v1`;
}

async function callSupabaseRpc<T>({ functionName, body }: SupabaseRpcOptions) {
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
    postId?: string;
    authorName?: string;
    body?: string;
    isSecret?: boolean;
    password?: string;
  } | null;

  const postId = payload?.postId?.trim();
  const authorName = payload?.authorName?.trim();
  const body = payload?.body?.trim();
  const isSecret = Boolean(payload?.isSecret);
  const password = payload?.password?.trim() ?? "";

  if (!postId || !authorName || !body) {
    return NextResponse.json({ ok: false, message: "이름과 댓글 내용을 입력해 주세요." }, { status: 400 });
  }

  if (isSecret && password.length < 4) {
    return NextResponse.json({ ok: false, message: "비밀글 비밀번호는 4자 이상 입력해 주세요." }, { status: 400 });
  }

  const { data, error } = await callSupabaseRpc<unknown[]>({
    functionName: "create_public_comment",
    body: {
      target_post_id: postId,
      visitor_name: authorName,
      comment_body: body,
      secret: isSecret,
      secret_password: isSecret ? password : null,
    },
  });

  if (error) {
    return NextResponse.json({ ok: false, message: `댓글 저장 실패: ${error}` }, { status: 500 });
  }

  return NextResponse.json({ ok: true, comment: data?.[0] ?? null });
}
