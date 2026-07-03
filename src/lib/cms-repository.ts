import { siteConfig } from "@/data/site-config";
import type { Database } from "@/types/database";
import type { Category, ContentCategory, NavItem, Post, SiteConfig } from "@/types/site";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type ReactionType = Database["public"]["Tables"]["post_reactions"]["Row"]["reaction_type"];

export type Comment = {
  id: string;
  postId: string;
  parentId: string | null;
  authorName: string;
  body: string;
  isAdminReply: boolean;
  createdAt: string;
};

export type ReactionCounts = Record<ReactionType, number>;

export type PostLookupResult =
  | { post: Post; error: null }
  | { post: null; error: string | null };

const emptyReactionCounts: ReactionCounts = {
  like: 0,
  watched: 0,
  excited: 0,
  dislike: 0,
};

function supabaseRestBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return url ? `${url}/rest/v1` : null;
}

function supabaseHeaders(extra?: HeadersInit) {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    return null;
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

async function restGet<T>(path: string, init?: RequestInit) {
  const base = supabaseRestBase();
  const headers = supabaseHeaders();

  if (!base || !headers) {
    return { data: null as T | null, error: "Supabase environment variables are missing." };
  }

  const response = await fetch(`${base}${path}`, {
    headers,
    cache: "force-cache",
    ...init,
  });

  if (!response.ok) {
    return { data: null as T | null, error: await response.text() };
  }

  return { data: (await response.json()) as T, error: null };
}

async function restPost<T>(path: string, body: unknown) {
  const base = supabaseRestBase();
  const headers = supabaseHeaders({ "Content-Type": "application/json" });

  if (!base || !headers) {
    return { data: null as T | null, error: "Supabase environment variables are missing." };
  }

  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    return { data: null as T | null, error: await response.text() };
  }

  return { data: (await response.json()) as T, error: null };
}

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body ?? "",
    category: row.category_id,
    author: row.author ?? "편집부",
    publishedAt: row.published_at ?? "",
    readTime: row.read_time ?? "3분",
    image: row.thumbnail_url ?? "",
    imageAlt: row.image_alt ?? row.title,
    tags: row.tags ?? [],
    status: row.status,
    featured: row.featured ?? false,
    viewCount: row.view_count ?? 0,
  };
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    label: row.label,
    href: row.href,
    description: row.description ?? "",
    order: row.sort_order ?? 0,
    visible: row.visible ?? true,
  };
}

function mapComment(row: CommentRow): Comment {
  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id ?? null,
    authorName: row.author_name,
    body: row.body,
    isAdminReply: Boolean(row.is_admin_reply),
    createdAt: row.created_at,
  };
}

function normalizeCategory(value: string) {
  return value.replace(/^\//, "").toLowerCase();
}

function queryString(params: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value !== "undefined") {
      search.set(key, String(value));
    }
  });

  return `?${search.toString()}`;
}

export async function getSiteConfigFromSupabase(): Promise<SiteConfig> {
  const { data, error } = await restGet<Array<{ value: SiteConfig }>>(
    `/site_settings${queryString({ select: "value", key: "eq.site_config", limit: 1 })}`,
  );

  if (error || !data?.[0]?.value) {
    return siteConfig;
  }

  return data[0].value;
}

export async function getCategoriesFromSupabase(): Promise<Category[]> {
  const { data, error } = await restGet<CategoryRow[]>(
    `/categories${queryString({ select: "*", visible: "eq.true", order: "sort_order.asc" })}`,
  );

  if (error || !data) {
    return [];
  }

  return data.map(mapCategory);
}

export async function getNavigationMenusFromSupabase(): Promise<NavItem[]> {
  const { data, error } = await restGet<Array<{ value: NavItem[] }>>(
    `/site_settings${queryString({ select: "value", key: "eq.navigation_menus", limit: 1 })}`,
  );

  if (error || !Array.isArray(data?.[0]?.value)) {
    return siteConfig.menus;
  }

  return data[0].value
    .filter((item) => item.active !== false)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

export async function getPostsFromSupabase(options?: {
  category?: ContentCategory;
  status?: "draft" | "published" | "deleted";
  featured?: boolean;
  limit?: number;
  query?: string;
}): Promise<Post[]> {
  const params: Record<string, string | number | boolean | undefined> = {
    select: "*",
    order: "published_at.desc",
  };

  if (options?.category) {
    params.category_id = `eq.${options.category}`;
  }

  if (options?.status) {
    params.status = `eq.${options.status}`;
  } else {
    params.status = "neq.deleted";
  }

  if (typeof options?.featured === "boolean") {
    params.featured = `eq.${options.featured}`;
  }

  if (options?.query) {
    const keyword = `*${options.query}*`;
    params.or = `(title.ilike.${keyword},excerpt.ilike.${keyword},body.ilike.${keyword})`;
  }

  if (options?.limit) {
    params.limit = options.limit;
  }

  const { data, error } = await restGet<PostRow[]>(`/posts${queryString(params)}`);

  if (error || !data) {
    return [];
  }

  return data.map(mapPost);
}

export async function getPostBySlugFromSupabase(category: ContentCategory, slug: string) {
  const result = await getPostDetailFromSupabase(category, slug);
  return result.post;
}

export async function getPostDetailFromSupabase(
  category: ContentCategory,
  slug: string,
): Promise<PostLookupResult> {
  const { data, error } = await restGet<PostRow[]>(
    `/posts${queryString({ select: "*", slug: `eq.${slug}`, status: "eq.published" })}`,
  );

  if (error) {
    return { post: null, error };
  }

  const requestedCategory = normalizeCategory(String(category));
  const matchedRow = (data ?? []).find((row) => {
    const rowCategory = normalizeCategory(row.category_id);
    return rowCategory === requestedCategory || rowCategory === `${requestedCategory}s`;
  });

  return {
    post: matchedRow ? mapPost(matchedRow) : null,
    error: null,
  };
}

export async function getRelatedPostsFromSupabase(category: ContentCategory, currentPostId: string) {
  const { data, error } = await restGet<PostRow[]>(
    `/posts${queryString({
      select: "*",
      category_id: `eq.${category}`,
      status: "eq.published",
      id: `neq.${currentPostId}`,
      limit: 3,
    })}`,
  );

  if (error || !data) {
    return [];
  }

  return data.map(mapPost);
}

export async function getComments(postId: string): Promise<Comment[]> {
  const { data, error } = await restGet<CommentRow[]>(
    `/comments${queryString({
      select: "*",
      post_id: `eq.${postId}`,
      status: "eq.approved",
      is_deleted: "eq.false",
      order: "created_at.desc",
    })}`,
  );

  if (error || !data) {
    return [];
  }

  return data.map(mapComment);
}

export async function getReactionCounts(postSlug: string): Promise<ReactionCounts> {
  const { data, error } = await restGet<Array<{ reaction_type: ReactionType }>>(
    `/post_reactions${queryString({ select: "reaction_type", post_slug: `eq.${postSlug}` })}`,
  );

  if (error || !data) {
    return emptyReactionCounts;
  }

  return data.reduce<ReactionCounts>((counts, row) => {
    counts[row.reaction_type] += 1;
    return counts;
  }, { ...emptyReactionCounts });
}

export async function incrementPostView(postId: string) {
  const { data, error } = await restPost<number>("/rpc/increment_post_view", {
    target_post_id: postId,
  });

  if (error) {
    return null;
  }

  return data;
}
