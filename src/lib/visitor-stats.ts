import { supabase } from "@/lib/supabase";

export type VisitorStatsRow = {
  id: string;
  date: string;
  page_views: number;
  unique_visitors: number;
  created_at: string | null;
  updated_at: string | null;
};

export function getKoreaDateKey(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00+09:00`);
  date.setDate(date.getDate() + days);
  return getKoreaDateKey(date);
}

export function getDateRange(days: number, endDateKey = getKoreaDateKey()) {
  return Array.from({ length: days }, (_, index) => addDays(endDateKey, index - days + 1));
}

export function isLikelyBot(userAgent: string) {
  return /bot|crawler|spider|crawling|googlebot|bingbot|yeti|naverbot|daum|slurp|duckduckbot|baiduspider|facebookexternalhit|twitterbot|preview/i.test(
    userAgent,
  );
}

export function normalizePublicPath(pathname: string) {
  if (!pathname || pathname === "") {
    return "/";
  }

  const normalized = pathname.split("?")[0].split("#")[0];
  return normalized || "/";
}

export function shouldTrackPath(pathname: string) {
  const normalized = normalizePublicPath(pathname);

  return (
    !normalized.startsWith("/admin") &&
    !normalized.startsWith("/api") &&
    normalized !== "/robots.txt" &&
    normalized !== "/sitemap.xml" &&
    normalized !== "/rss.xml"
  );
}

export async function trackSiteVisit({
  visitorId,
  pathname,
}: {
  visitorId: string;
  pathname: string;
}) {
  if (!supabase || !visitorId || !shouldTrackPath(pathname)) {
    return null;
  }

  const pagePath = normalizePublicPath(pathname);

  const { data, error } = await supabase.rpc("track_site_visit", {
    input_page_path: pagePath,
    input_visitor_id: visitorId,
  });

  if (error) {
    console.error("[Supabase:track_site_visit]", error.message);
    return null;
  }

  return data as VisitorStatsRow | null;
}

export function calculatePercentChange(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return ((current - previous) / previous) * 100;
}
