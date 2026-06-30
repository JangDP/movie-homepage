import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { MediaFile } from "@/types/cms";

type MediaFileRow = Database["public"]["Tables"]["media_files"]["Row"];

export const MEDIA_BUCKET = "media";
export const MAX_MEDIA_FILE_SIZE = 20 * 1024 * 1024;
export const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];

export type MediaSort = "newest" | "oldest" | "name" | "size";

export function mapMediaFile(row: MediaFileRow): MediaFile {
  return {
    id: row.id,
    title: row.title,
    alt: row.alt ?? row.title,
    originalUrl: row.original_url,
    webpUrl: row.webp_url,
    thumbnailUrl: row.thumbnail_url,
    originalPath: row.original_path,
    webpPath: row.webp_path,
    thumbnailPath: row.thumbnail_path,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
  };
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  return `${(kb / 1024).toFixed(1)} MB`;
}

export function validateImageFile(file: File) {
  if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
    return "jpg, jpeg, png, webp, gif 형식만 업로드할 수 있습니다.";
  }

  if (file.size > MAX_MEDIA_FILE_SIZE) {
    return "이미지는 최대 20MB까지 업로드할 수 있습니다.";
  }

  return null;
}

function safeBaseName(file: File) {
  return file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "image";
}

function getExtension(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  return extension === "jpeg" ? "jpg" : extension;
}

export function createMediaPaths(file: File) {
  const date = new Date().toISOString().slice(0, 10);
  const id = crypto.randomUUID();
  const baseName = safeBaseName(file);
  const extension = getExtension(file);

  return {
    originalPath: `original/${date}/${id}-${baseName}.${extension}`,
    webpPath: `webp/${date}/${id}-${baseName}.webp`,
    thumbnailPath: `thumbnails/${date}/${id}-${baseName}-thumb.webp`,
  };
}

function blobToFile(blob: Blob, name: string) {
  return new File([blob], name, { type: blob.type || "image/webp" });
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("이미지를 변환할 수 없습니다."));
      },
      "image/webp",
      quality,
    );
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("이미지를 읽을 수 없습니다."));
    };

    image.src = objectUrl;
  });
}

async function createWebpVariant(file: File, maxWidth: number, quality: number) {
  const image = await loadImage(file);
  const scale = Math.min(1, maxWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("이미지 변환을 지원하지 않는 브라우저입니다.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return {
    blob: await canvasToBlob(canvas, quality),
    width: image.naturalWidth,
    height: image.naturalHeight,
  };
}

export async function createImageVersions(file: File) {
  const webp = await createWebpVariant(file, 1920, 0.86);
  const thumbnail = await createWebpVariant(file, 480, 0.78);

  return {
    webpFile: blobToFile(webp.blob, `${safeBaseName(file)}.webp`),
    thumbnailFile: blobToFile(thumbnail.blob, `${safeBaseName(file)}-thumb.webp`),
    width: webp.width,
    height: webp.height,
  };
}

export async function getMediaFiles(options?: {
  search?: string;
  sort?: MediaSort;
}): Promise<MediaFile[]> {
  if (!supabase) {
    return [];
  }

  let query = supabase.from("media_files").select("*");

  if (options?.search) {
    const keyword = `%${options.search}%`;
    query = query.or(`title.ilike.${keyword},alt.ilike.${keyword},original_url.ilike.${keyword}`);
  }

  switch (options?.sort ?? "newest") {
    case "oldest":
      query = query.order("created_at", { ascending: true });
      break;
    case "name":
      query = query.order("title", { ascending: true });
      break;
    case "size":
      query = query.order("size_bytes", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
      break;
  }

  const { data, error } = await query;

  if (error) {
    console.error("[Supabase:media_files]", error.message);
    return [];
  }

  return data.map(mapMediaFile);
}

export async function getMediaUsageCount(file: MediaFile) {
  if (!supabase) {
    return 0;
  }

  const urls = [file.originalUrl, file.webpUrl, file.thumbnailUrl].filter(Boolean);
  let count = 0;

  for (const url of urls) {
    const { count: thumbnailCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("thumbnail_url", url)
      .neq("status", "deleted");

    const { count: ogCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("og_image_url", url)
      .neq("status", "deleted");

    const { count: bodyCount } = await supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .ilike("body", `%${url}%`)
      .neq("status", "deleted");

    count += (thumbnailCount ?? 0) + (ogCount ?? 0) + (bodyCount ?? 0);
  }

  return count;
}

export async function enrichMediaUsage(files: MediaFile[]) {
  const entries = await Promise.all(
    files.map(async (file) => ({
      ...file,
      usedInCount: await getMediaUsageCount(file),
    })),
  );

  return entries;
}

export async function uploadMediaFiles(files: File[], uploadedBy?: string | null) {
  if (!supabase) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const uploaded: MediaFile[] = [];

  for (const file of files) {
    const validationError = validateImageFile(file);

    if (validationError) {
      throw new Error(`${file.name}: ${validationError}`);
    }

    const paths = createMediaPaths(file);
    const versions = await createImageVersions(file);

    const uploads = [
      supabase.storage.from(MEDIA_BUCKET).upload(paths.originalPath, file, {
        contentType: file.type,
        cacheControl: "31536000",
        upsert: false,
      }),
      supabase.storage.from(MEDIA_BUCKET).upload(paths.webpPath, versions.webpFile, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      }),
      supabase.storage.from(MEDIA_BUCKET).upload(paths.thumbnailPath, versions.thumbnailFile, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: false,
      }),
    ];

    const uploadResults = await Promise.all(uploads);
    const failedUpload = uploadResults.find((result) => result.error);

    if (failedUpload?.error) {
      throw new Error(`${file.name} 업로드 실패: ${failedUpload.error.message}`);
    }

    const originalUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(paths.originalPath).data.publicUrl;
    const webpUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(paths.webpPath).data.publicUrl;
    const thumbnailUrl = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(paths.thumbnailPath).data.publicUrl;
    const title = file.name.replace(/\.[^/.]+$/, "");

    const { data, error } = await supabase
      .from("media_files")
      .insert({
        title,
        alt: title,
        original_url: originalUrl,
        webp_url: webpUrl,
        thumbnail_url: thumbnailUrl,
        original_path: paths.originalPath,
        webp_path: paths.webpPath,
        thumbnail_path: paths.thumbnailPath,
        mime_type: file.type,
        size_bytes: file.size,
        width: versions.width,
        height: versions.height,
        uploaded_by: uploadedBy ?? null,
      })
      .select("*")
      .single();

    if (error) {
      throw new Error(`${file.name} DB 저장 실패: ${error.message}`);
    }

    uploaded.push(mapMediaFile(data));
  }

  return uploaded;
}

export async function deleteMediaFile(file: MediaFile) {
  if (!supabase) {
    throw new Error("Supabase가 설정되지 않았습니다.");
  }

  const usedInCount = await getMediaUsageCount(file);

  if (usedInCount > 0) {
    throw new Error("사용 중인 이미지입니다.");
  }

  const { error: removeError } = await supabase.storage.from(MEDIA_BUCKET).remove([
    file.originalPath,
    file.webpPath,
    file.thumbnailPath,
  ]);

  if (removeError) {
    throw new Error(`Storage 삭제 실패: ${removeError.message}`);
  }

  const { error } = await supabase.from("media_files").delete().eq("id", file.id);

  if (error) {
    throw new Error(`DB 삭제 실패: ${error.message}`);
  }
}
