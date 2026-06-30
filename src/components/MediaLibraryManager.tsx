"use client";

import Image from "next/image";
import { ChangeEvent, DragEvent, useEffect, useRef, useState } from "react";

import {
  MEDIA_BUCKET,
  createStoragePath,
  getMediaAssets,
  mediaUsageOptions,
  type MediaUsage,
} from "@/lib/media";
import { supabase } from "@/lib/supabase";
import type { CmsMediaAsset } from "@/types/cms";

type UploadState = {
  type: "idle" | "success" | "error";
  message: string;
};

export function MediaLibraryManager() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [assets, setAssets] = useState<CmsMediaAsset[]>([]);
  const [usage, setUsage] = useState<MediaUsage>("thumbnail");
  const [uploadState, setUploadState] = useState<UploadState>({
    type: "idle",
    message: "",
  });
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  useEffect(() => {
    getMediaAssets().then(setAssets);
  }, []);

  async function uploadFiles(files: FileList | File[]) {
    if (!supabase) {
      setUploadState({
        type: "error",
        message: "Supabase 환경변수가 없습니다. .env.local을 확인하세요.",
      });
      return;
    }

    const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setUploadState({ type: "error", message: "이미지 파일을 선택하세요." });
      return;
    }

    setUploading(true);
    setUploadState({ type: "idle", message: "" });

    const uploadedAssets: CmsMediaAsset[] = [];

    for (const file of imageFiles) {
      const storagePath = createStoragePath(file);
      const { error: uploadError } = await supabase.storage
        .from(MEDIA_BUCKET)
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
        });

      if (uploadError) {
        setUploading(false);
        setUploadState({
          type: "error",
          message: `업로드 실패: ${uploadError.message}`,
        });
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from(MEDIA_BUCKET)
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;
      const title = file.name.replace(/\.[^/.]+$/, "");

      const { data, error: insertError } = await supabase
        .from("media_assets")
        .insert({
          title,
          url: publicUrl,
          alt: title,
          type: "image",
          usage: [usage],
          storage_path: storagePath,
          file_size: file.size,
          mime_type: file.type,
        })
        .select("*")
        .single();

      if (insertError) {
        setUploading(false);
        setUploadState({
          type: "error",
          message: `미디어 DB 저장 실패: ${insertError.message}`,
        });
        return;
      }

      uploadedAssets.push({
        id: data.id,
        title: data.title,
        url: data.url,
        alt: data.alt ?? data.title,
        type: "image",
        usage: (data.usage ?? []) as CmsMediaAsset["usage"],
        storagePath: data.storage_path ?? undefined,
        fileSize: data.file_size ?? undefined,
        mimeType: data.mime_type ?? undefined,
        createdAt: data.created_at ?? "",
      });
    }

    setUploading(false);
    setAssets((current) => [...uploadedAssets, ...current]);
    setUploadState({
      type: "success",
      message: `${uploadedAssets.length}개 이미지 업로드 완료`,
    });
  }

  function onFileChange(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void uploadFiles(event.target.files);
      event.target.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragActive(false);

    if (event.dataTransfer.files) {
      void uploadFiles(event.dataTransfer.files);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setUploadState({ type: "success", message: "이미지 URL을 복사했습니다." });
  }

  return (
    <div className="grid gap-5">
      <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
        <div className="mb-4 grid gap-4 md:grid-cols-[1fr_220px] md:items-end">
          <div>
            <h2 className="text-lg font-bold text-white">이미지 업로드</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Supabase Storage의 media 버킷에 이미지를 업로드합니다.
            </p>
          </div>
          <label className="block text-sm font-semibold text-zinc-300">
            용도
            <select
              value={usage}
              onChange={(event) => setUsage(event.target.value as MediaUsage)}
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none"
            >
              {mediaUsageOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
            dragActive
              ? "border-red-600 bg-red-950/20"
              : "border-zinc-700 bg-zinc-950"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={onFileChange}
          />
          <p className="text-lg font-bold text-white">이미지를 여기에 끌어다 놓으세요</p>
          <p className="mt-2 text-sm text-zinc-500">PNG, JPG, WebP, GIF 파일을 지원합니다.</p>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "파일 선택"}
          </button>
        </div>

        {uploadState.message ? (
          <div
            className={`mt-4 rounded border px-4 py-3 text-sm font-bold ${
              uploadState.type === "success"
                ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
                : "border-red-900 bg-red-950/40 text-red-200"
            }`}
          >
            {uploadState.message}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
        <h2 className="text-lg font-bold text-white">업로드된 이미지</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <article
              key={asset.id}
              className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
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
                <div className="flex flex-wrap gap-2">
                  {asset.usage.map((item) => (
                    <span key={item} className="rounded bg-zinc-900 px-2 py-1 text-xs text-zinc-400">
                      {item}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
                    onClick={() => setUploadState({ type: "success", message: `${asset.title} 이미지를 선택했습니다.` })}
                  >
                    선택
                  </button>
                  <button
                    type="button"
                    className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
                    onClick={() => void copyUrl(asset.url)}
                  >
                    URL 복사
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
