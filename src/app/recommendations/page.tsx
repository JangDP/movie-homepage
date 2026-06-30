import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const metadata = createCategoryMetadata("recommendations");

export default function RecommendationsPage() {
  return <CategoryPage categoryId="recommendations" />;
}
