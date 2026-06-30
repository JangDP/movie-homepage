"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

import { getMediaAssets } from "@/lib/media";
import type { CmsMediaAsset } from "@/types/cms";

type MediaPickerProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (asset: CmsMediaAsset) => void;
};

export function MediaPicker({
  open,
  title = "미디어 선택",
  onClose,
  onSelect,
}: MediaPickerProps) {
  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLoading(true);
    getMediaAssets()
      .then(setAssets)
      .finally(() => setLoading(false));
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 px-4 py-8">
      <div className="mx-auto flex max-h-[86vh] max-w-5xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
          >
            닫기
          </button>
        </div>

        <div className="overflow-y-auto p-5">
          {loading ? (
            <p className="py-10 text-center text-sm text-zinc-500">미디어를 불러오는 중...</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {assets.map((asset) => (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-lg border border-zinc-800 bg-black"
                >
                  <div className="relative aspect-[16/10] bg-zinc-900">
                    <Image
                      src={asset.url}
                      alt={asset.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="text-sm font-bold text-white">{asset.title}</h3>
                      <p className="mt-1 truncate text-xs text-zinc-500">{asset.url}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(asset);
                        onClose();
                      }}
                      className="w-full rounded bg-red-700 px-3 py-2 text-xs font-bold text-white hover:bg-red-600"
                    >
                      이 이미지 선택
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
