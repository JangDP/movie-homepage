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
import {
  deleteMediaFile,
  enrichMediaUsage,
  formatFileSize,
  getMediaFiles,
  uploadMediaFiles,
  validateImageFile,
  type MediaSort,
} from "@/lib/media";
import { canDeletePosts } from "@/types/admin";
import type { MediaFile } from "@/types/cms";

type Message = {
  type: "success" | "error" | "info";
  text: string;
};

const sortOptions: Array<{ label: string; value: MediaSort }> = [
  { label: "최신순", value: "newest" },
  { label: "오래된순", value: "oldest" },
  { label: "이름순", value: "name" },
  { label: "용량순", value: "size" },
];

export function MediaLibraryManager() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const adminUser = useAdminUser();
  const canDelete = canDeletePosts(adminUser.role);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<MediaSort>("newest");
  const [message, setMessage] = useState<Message | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    const entries = await getMediaFiles({ search, sort });
    setFiles(await enrichMediaUsage(entries));
    setLoading(false);
  }, [search, sort]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function upload(filesToUpload: FileList | File[]) {
    const imageFiles = Array.from(filesToUpload).filter((file) => file.type.startsWith("image/"));

    if (imageFiles.length === 0) {
      setMessage({ type: "error", text: "업로드할 이미지 파일이 없습니다." });
      return;
    }

    const invalidFile = imageFiles.find((file) => validateImageFile(file));

    if (invalidFile) {
      setMessage({ type: "error", text: `${invalidFile.name}: ${validateImageFile(invalidFile)}` });
      return;
    }

    setUploading(true);
    setMessage({ type: "info", text: "이미지를 업로드하고 WebP/썸네일을 생성하는 중입니다." });

    try {
      const uploaded = await uploadMediaFiles(imageFiles, adminUser.email);
      setFiles((current) => [...uploaded, ...current]);
      setMessage({ type: "success", text: `${uploaded.length}개 이미지를 업로드했습니다.` });
      void loadFiles();
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "업로드에 실패했습니다.",
      });
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
    const pastedFiles = Array.from(event.clipboardData.files).filter((file) =>
      file.type.startsWith("image/"),
    );

    if (pastedFiles.length > 0) {
      event.preventDefault();
      void upload(pastedFiles);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setMessage({ type: "success", text: "이미지 URL을 복사했습니다." });
  }

  async function removeFile(file: MediaFile) {
    if (!canDelete) {
      setMessage({ type: "error", text: "editor 권한은 이미지를 삭제할 수 없습니다." });
      return;
    }

    if ((file.usedInCount ?? 0) > 0) {
      setMessage({ type: "error", text: "사용 중인 이미지입니다." });
      return;
    }

    const confirmed = window.confirm(`${file.title} 이미지를 삭제할까요?`);

    if (!confirmed) {
      return;
    }

    setDeletingId(file.id);

    try {
      await deleteMediaFile(file);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setMessage({ type: "success", text: "이미지를 삭제했습니다." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "삭제에 실패했습니다.",
      });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-5" onPaste={onPaste}>
      <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">이미지 업로드</h2>
            <p className="mt-1 text-sm text-zinc-500">
              드래그 앤 드롭, 파일 선택, Ctrl+V 붙여넣기로 여러 이미지를 업로드할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="min-h-10 rounded bg-red-700 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-50"
          >
            {uploading ? "업로드 중..." : "파일 선택"}
          </button>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`rounded-lg border-2 border-dashed p-8 text-center transition ${
            dragActive ? "border-red-600 bg-red-950/20" : "border-zinc-700 bg-zinc-950"
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
          <p className="text-lg font-bold text-white">이미지를 여기에 놓거나 Ctrl+V로 붙여넣으세요</p>
          <p className="mt-2 text-sm text-zinc-500">
            jpg, jpeg, png, webp, gif / 최대 20MB / 원본, WebP, 썸네일 자동 저장
          </p>
        </div>

        {message ? (
          <div
            className={`mt-4 rounded border px-4 py-3 text-sm font-bold ${
              message.type === "success"
                ? "border-emerald-900 bg-emerald-950/40 text-emerald-200"
                : message.type === "info"
                  ? "border-zinc-800 bg-zinc-950 text-zinc-300"
                  : "border-red-900 bg-red-950/40 text-red-200"
            }`}
          >
            {message.text}
          </div>
        ) : null}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-black/45 p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_220px] lg:items-end">
          <label className="block text-sm font-semibold text-zinc-300">
            검색
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="파일명, alt, URL 검색"
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
            />
          </label>
          <label className="block text-sm font-semibold text-zinc-300">
            정렬
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as MediaSort)}
              className="mt-2 w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-700"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="py-12 text-center text-sm text-zinc-500">미디어를 불러오는 중...</p>
        ) : (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {files.map((file) => (
              <article
                key={file.id}
                className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950"
              >
                <div className="relative aspect-[16/10] bg-zinc-900">
                  <Image
                    src={file.thumbnailUrl || file.webpUrl || file.originalUrl}
                    alt={file.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="truncate text-sm font-bold text-white">{file.title}</h3>
                    <p className="mt-1 truncate text-xs text-zinc-500">{file.webpUrl}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-zinc-500">
                    <span>{formatFileSize(file.sizeBytes)}</span>
                    <span>{file.width && file.height ? `${file.width}x${file.height}` : "-"}</span>
                    <span>{new Date(file.createdAt).toLocaleDateString("ko-KR")}</span>
                    <span className={(file.usedInCount ?? 0) > 0 ? "text-red-300" : "text-emerald-300"}>
                      {(file.usedInCount ?? 0) > 0 ? `사용 중 ${file.usedInCount}` : "미사용"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      className="rounded border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:border-red-700"
                      onClick={() => void copyUrl(file.webpUrl)}
                    >
                      URL 복사
                    </button>
                    <button
                      type="button"
                      disabled={!canDelete || deletingId === file.id || (file.usedInCount ?? 0) > 0}
                      onClick={() => void removeFile(file)}
                      className="rounded border border-red-900 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-950/50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === file.id ? "삭제 중..." : "삭제"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && files.length === 0 ? (
          <p className="py-12 text-center text-sm text-zinc-500">표시할 이미지가 없습니다.</p>
        ) : null}
      </section>
    </div>
  );
}
