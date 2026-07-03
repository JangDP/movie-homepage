export type LitePostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  category_id: string;
  published_at: string | null;
  thumbnail_url: string | null;
};

function supabaseRestBase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return url ? `${url}/rest/v1` : null;
}

function supabaseHeaders() {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    return null;
  }

  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

export async function fetchPublishedPostsLite(limit?: number) {
  const base = supabaseRestBase();
  const headers = supabaseHeaders();

  if (!base || !headers) {
    return [];
  }

  const search = new URLSearchParams({
    select: "id,slug,title,excerpt,category_id,published_at,thumbnail_url",
    status: "eq.published",
    order: "published_at.desc",
  });

  if (limit) {
    search.set("limit", String(limit));
  }

  try {
    const response = await fetch(`${base}/posts?${search.toString()}`, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      return [];
    }

    return (await response.json()) as LitePostRow[];
  } catch {
    return [];
  }
}
