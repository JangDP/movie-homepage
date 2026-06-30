import { siteConfig } from "@/data/site-config";
import {
  getPostBySlugFromSupabase,
  getPostsFromSupabase,
  getRelatedPostsFromSupabase,
} from "@/lib/cms-repository";
import type { BuiltInCategory, ContentCategory } from "@/types/site";

export function getCategory(categoryId: ContentCategory) {
  return siteConfig.categories.find((category) => category.id === categoryId);
}

export async function getPostsByCategory(categoryId: ContentCategory) {
  return getPostsFromSupabase({ category: categoryId, status: "published" });
}

export async function getArticlesByCategory(categoryId: ContentCategory) {
  return getPostsByCategory(categoryId);
}

export async function getPostBySlug(categoryId: ContentCategory, slug: string) {
  return getPostBySlugFromSupabase(categoryId, slug);
}

export async function getRelatedPosts(categoryId: ContentCategory, currentPostId: string) {
  return getRelatedPostsFromSupabase(categoryId, currentPostId);
}

export async function getFeaturedPosts() {
  return getPostsFromSupabase({ featured: true, status: "published", limit: 4 });
}

export async function getFeaturedArticles() {
  return getFeaturedPosts();
}

export async function searchPosts(query: string) {
  return getPostsFromSupabase({ query, status: "published" });
}

export async function searchArticles(query: string) {
  return searchPosts(query);
}

export const categoryPageMap: Record<BuiltInCategory, string> = {
  news: "뉴스",
  reviews: "리뷰",
  guide: "가이드",
  recommendations: "추천",
  upcoming: "개봉예정",
  ott: "OTT",
};
