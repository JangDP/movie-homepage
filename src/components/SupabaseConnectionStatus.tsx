import { testSupabaseConnection } from "@/lib/supabase";

export async function SupabaseConnectionStatus() {
  const status = await testSupabaseConnection();

  return (
    <div
      className={`rounded-lg border p-4 ${
        status.ok
          ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
          : "border-red-950 bg-red-950/30 text-red-200"
      }`}
    >
      <p className="text-sm font-bold">{status.ok ? "Supabase 연결됨" : "Supabase 연결 확인 필요"}</p>
      <p className="mt-1 text-xs opacity-80">{status.message}</p>
    </div>
  );
}
