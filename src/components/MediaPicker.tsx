"use client";

import Image from "next/image";
import {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAdminUser } from "@/components/AdminAuthContext";
import { enrichMediaUsage, getMediaFiles, uploadMediaFiles } from "@/lib/media";
import type { MediaFile } from "@/types/cms";

type MediaPickerProps = {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (asset: MediaFile) => void;
};

export function MediaPicker({
  open,
  title = "미디어 선택",
  onClose,
  onSelect,
}: MediaPickerProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const adminUser = useAdminUser();
  const [assets, setAssets] = useState<MediaFile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const loadAssets = useCallback(async () => {
    setLoading(true);
    const files = await getMediaFiles({ search, sort: "newest" });
    setAssets(await enrichMediaUsage(files));
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void loadAssets();
  }, [loadAssets, open]);

  async function upload(files: FileList | File[]) {
    setUploading(true);
    setMessage("이미지를 업로드하는 중입니다.");

    try {
      const uploaded = await uploadMediaFiles(Array.from(files), adminUser.email);
      setAssets((current) => [...uploaded, ...current]);
      setMessage(`${uploaded.length}개 이미지를 업로드했습니다.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void upload(event.target.files);
      event.target.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files) {
      void upload(event.dataTransfer.files);
    }
  }

  function onPaste(event: ClipboardEvent<HTMLDivElement>) {
    const files = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (files.length > 0) {
      event.preventDefault();
      void upload(files);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 px-4 py-8" onPaste={onPaste}>
      <div className="mx-auto flex max-h-[86vh] max-w-6xl flex-col rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl">
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

        <div className="grid gap-5 overflow-y-auto p-5">
          <section
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={onDrop}
            className={`rounded-lg border-2 border-dashed p-5 text-center transition ${
              dragActive ? "border-red-600 bg-red-950/20" : "border-zinc-800 bg-black"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={onFileChange}
            />
            <p className="text-sm font-bold text-white">새 이미지 업로드</p>
            <p className="mt-1 text-xs text-zinc-500">
              드래그 앤 드롭, 파일 선택, Ctrl+V 붙여넣기를 지원합니다.
            </p>
            <button
              type="button"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
              className="mt-4 rounded bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600 disabled:opacity-50"
            >
              {uploading ? "업로드 중..." : "파일 선택"}
            </button>
            {message ? <p className="mt-3 text-xs font-bold text-zinc-400">{message}</p> : null}
          </section>

          <label className="block text-sm font-semibold text-zinc-300">
            검색
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="파일명, alt, URL 검색"
              className="mt-2 w-full rounded border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
            />
          </label>

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
                      src={asset.thumbnailUrl || asset.webpUrl || asset.originalUrl}
                      alt={asset.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <div className="space-y-3 p-4">
                    <div>
                      <h3 className="truncate text-sm font-bold text-white">{asset.title}</h3>
                      <p className="mt-1 truncate text-xs text-zinc-500">{asset.webpUrl}</p>
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
