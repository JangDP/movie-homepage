import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const runtime = "edge";

export const metadata = createCategoryMetadata("reviews");

export default function ReviewsPage() {
  return <CategoryPage categoryId="reviews" />;
}
