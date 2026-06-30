import type { ContentCategory, EditorBlockType, PostStatus } from "@/types/site";

export type CmsPostDraft = {
  title: string;
  slug: string;
  category: ContentCategory;
  tags: string[];
  thumbnailMediaId?: string;
  excerpt: string;
  body: string;
  status: PostStatus;
  seoTitle?: string;
  metaDescription?: string;
  ogImageMediaId?: string;
};

export type CmsMediaAsset = {
  id: string;
  title: string;
  url: string;
  alt: string;
  type: "image";
  usage: Array<"banner" | "thumbnail" | "body" | "logo" | "background">;
  storagePath?: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
};

export type MediaFile = {
  id: string;
  title: string;
  alt: string;
  originalUrl: string;
  webpUrl: string;
  thumbnailUrl: string;
  originalPath: string;
  webpPath: string;
  thumbnailPath: string;
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  uploadedBy?: string | null;
  createdAt: string;
  usedInCount?: number;
};

export type CmsTheme = {
  id: string;
  name: string;
  description: string;
  accentColor: string;
  previewClassName: string;
};

export type CmsEditorBlock = {
  id: string;
  type: EditorBlockType | "table" | "gallery";
  label: string;
  description: string;
};

export type CmsAdSenseSettings = {
  publisherId: string;
  autoAds: boolean;
  articleTop: boolean;
  articleMiddle: boolean;
  articleBottom: boolean;
  sidebar: boolean;
};
