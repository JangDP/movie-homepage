import { siteConfig } from "@/data/site-config";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database";
import type { Category, ContentCategory, Post, SiteConfig } from "@/types/site";

type PostRow = Database["public"]["Tables"]["posts"]["Row"];
type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];
type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
type ReactionType = Database["public"]["Tables"]["post_reactions"]["Row"]["reaction_type"];

export type Comment = {
  id: string;
  postId: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type ReactionCounts = Record<ReactionType, number>;

export type PostLookupResult =
  | {
      post: Post;
      error: null;
    }
  | {
      post: null;
      error: string | null;
    };

const emptyReactionCounts: ReactionCounts = {
  like: 0,
  watched: 0,
  excited: 0,
  dislike: 0,
};

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
    authorName: row.author_name,
    body: row.body,
    createdAt: row.created_at,
  };
}

function logSupabaseError(scope: string, error: unknown) {
  console.error(`[Supabase:${scope}]`, error);
}

function normalizeCategory(value: string) {
  return value.replace(/^\//, "").toLowerCase();
}

export async function getSiteConfigFromSupabase(): Promise<SiteConfig> {
  if (!supabase) {
    return siteConfig;
  }

  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "site_config")
    .maybeSingle();

  if (error) {
    logSupabaseError("site_settings", error.message);
    return siteConfig;
  }

  return (data?.value as SiteConfig | null) ?? siteConfig;
}

export async function getCategoriesFromSupabase(): Promise<Category[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    logSupabaseError("categories", error.message);
    return [];
  }

  return data.map(mapCategory);
}

export async function getPostsFromSupabase(options?: {
  category?: ContentCategory;
  status?: "draft" | "published" | "deleted";
  featured?: boolean;
  limit?: number;
  query?: string;
}): Promise<Post[]> {
  if (!supabase) {
    return [];
  }

  let query = supabase.from("posts").select("*").order("published_at", { ascending: false });

  if (options?.category) {
    query = query.eq("category_id", options.category);
  }

  if (options?.status) {
    query = query.eq("status", options.status);
  } else {
    query = query.neq("status", "deleted");
  }

  if (typeof options?.featured === "boolean") {
    query = query.eq("featured", options.featured);
  }

  if (options?.query) {
    const keyword = `%${options.query}%`;
    query = query.or(`title.ilike.${keyword},excerpt.ilike.${keyword},body.ilike.${keyword}`);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError("posts", error.message);
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
  if (!supabase) {
    return {
      post: null,
      error: "Supabase 환경변수가 설정되지 않았습니다.",
    };
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .neq("status", "deleted");

  if (error) {
    logSupabaseError("post_by_slug", error.message);
    return {
      post: null,
      error: error.message,
    };
  }

  const requestedCategory = normalizeCategory(String(category));
  const matchedRow = data.find((row: PostRow) => {
    const rowCategory = normalizeCategory(row.category_id);
    return rowCategory === requestedCategory || rowCategory === `${requestedCategory}s`;
  });

  return {
    post: matchedRow ? mapPost(matchedRow) : null,
    error: null,
  };
}

export async function getRelatedPostsFromSupabase(category: ContentCategory, currentPostId: string) {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("category_id", category)
    .eq("status", "published")
    .neq("id", currentPostId)
    .limit(3);

  if (error) {
    logSupabaseError("related_posts", error.message);
    return [];
  }

  return data.map(mapPost);
}

export async function getComments(postId: string): Promise<Comment[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    logSupabaseError("comments", error.message);
    return [];
  }

  return data.map(mapComment);
}

export async function getReactionCounts(postSlug: string): Promise<ReactionCounts> {
  if (!supabase) {
    return emptyReactionCounts;
  }

  const { data, error } = await supabase
    .from("post_reactions")
    .select("reaction_type")
    .eq("post_slug", postSlug);

  if (error) {
    logSupabaseError("reactions", error.message);
    return emptyReactionCounts;
  }

  return data.reduce<ReactionCounts>((counts, row: { reaction_type: ReactionType }) => {
    counts[row.reaction_type] += 1;
    return counts;
  }, { ...emptyReactionCounts });
}

export async function incrementPostView(postId: string) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase.rpc("increment_post_view", {
    target_post_id: postId,
  });

  if (error) {
    logSupabaseError("views", error.message);
    return null;
  }

  return data;
}
