import { createClient } from "@supabase/supabase-js";

const rawSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function normalizeSupabaseUrl(value: string) {
  const trimmed = value.trim();
  const withProtocol = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  const parsed = new URL(withProtocol);

  return parsed.origin;
}

export const supabaseUrl = rawSupabaseUrl ? normalizeSupabaseUrl(rawSupabaseUrl) : "";
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const defaultFetch = globalThis.fetch.bind(globalThis);

async function loggingFetch(input: RequestInfo | URL, init?: RequestInit) {
  const requestUrl =
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.toString()
        : input.url;
  const isAuthRequest = requestUrl.includes("/auth/v1/");

  if (isAuthRequest) {
    console.log("[Supabase Auth request]", {
      method: init?.method ?? "GET",
      url: requestUrl,
      configuredUrl: supabaseUrl,
      expectedTokenUrl: `${supabaseUrl}/auth/v1/token?grant_type=password`,
    });
  }

  const response = await defaultFetch(input, init);

  if (isAuthRequest) {
    console.log("[Supabase Auth response]", {
      status: response.status,
      statusText: response.statusText,
      url: response.url || requestUrl,
    });
  }

  return response;
}

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey as string, {
      global: {
        fetch: loggingFetch,
      },
    })
  : null;

export function getSupabaseClient() {
  if (!supabase) {
    throw new Error("Supabase 환경변수가 설정되지 않았습니다.");
  }

  return supabase;
}

export function getSupabaseDebugInfo() {
  return {
    rawUrl: rawSupabaseUrl ?? "",
    normalizedUrl: supabaseUrl,
    authTokenUrl: supabaseUrl ? `${supabaseUrl}/auth/v1/token?grant_type=password` : "",
    host: supabaseUrl ? new URL(supabaseUrl).host : "설정 없음",
    isConfigured: isSupabaseConfigured,
  };
}

export async function testSupabaseConnection() {
  if (!supabase) {
    return {
      ok: false,
      message: "NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 없습니다.",
    };
  }

  const { error } = await supabase.from("posts").select("id", { count: "exact", head: true });

  if (error) {
    return {
      ok: false,
      message: error.message,
    };
  }

  return {
    ok: true,
    message: "Supabase 연결 성공",
  };
}
