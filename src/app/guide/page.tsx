import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const metadata = createCategoryMetadata("guide");

export default function GuidePage() {
  return <CategoryPage categoryId="guide" />;
}
