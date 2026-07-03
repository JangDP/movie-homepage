import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const runtime = "edge";

export const metadata = createCategoryMetadata("recommendations");

export default function RecommendationsPage() {
  return <CategoryPage categoryId="recommendations" />;
}
