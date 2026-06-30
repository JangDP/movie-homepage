"use client";

import { useState } from "react";

type MockSaveBarProps = {
  label?: string;
};

export function MockSaveBar({ label = "Mock 저장" }: MockSaveBarProps) {
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-3 border-t border-zinc-800 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs leading-5 text-zinc-500">
        현재는 mock CMS입니다. 실제 저장은 Supabase 연결 단계에서 같은 필드 이름으로 붙이면 됩니다.
      </p>
      <div className="flex items-center gap-3">
        {saved ? (
          <span className="rounded bg-emerald-950 px-3 py-2 text-xs font-bold text-emerald-300">
            Mock 저장 완료
          </span>
        ) : null}
        <button
          type="button"
          className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white transition hover:bg-red-600"
          onClick={() => {
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2200);
          }}
        >
          {label}
        </button>
      </div>
    </div>
  );
}
