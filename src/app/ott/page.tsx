import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const metadata = createCategoryMetadata("ott");

export default function OttPage() {
  return <CategoryPage categoryId="ott" />;
}
