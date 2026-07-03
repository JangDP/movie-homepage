import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const runtime = "edge";

export const metadata = createCategoryMetadata("news");

export default function NewsPage() {
  return <CategoryPage categoryId="news" />;
}
