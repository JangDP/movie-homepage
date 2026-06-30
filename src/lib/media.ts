import { mediaAssets as fallbackMediaAssets } from "@/data/media";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { CmsMediaAsset } from "@/types/cms";

type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];

export const MEDIA_BUCKET = "media";

export type MediaUsage = CmsMediaAsset["usage"][number];

export const mediaUsageOptions: MediaUsage[] = [
  "banner",
  "thumbnail",
  "body",
  "logo",
  "background",
];

export function mapMediaAsset(row: MediaAssetRow): CmsMediaAsset {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    alt: row.alt ?? row.title,
    type: "image",
    usage: (row.usage ?? []) as CmsMediaAsset["usage"],
    storagePath: row.storage_path ?? undefined,
    fileSize: row.file_size ?? undefined,
    mimeType: row.mime_type ?? undefined,
    createdAt: row.created_at ?? "",
  };
}

export async function getMediaAssets(): Promise<CmsMediaAsset[]> {
  if (!supabase) {
    return fallbackMediaAssets;
  }

  const { data, error } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[Supabase:media_assets]", error.message);
    return fallbackMediaAssets;
  }

  return data.map(mapMediaAsset);
}

export function createStoragePath(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const safeName = file.name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

  return `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName}.${extension}`;
}
