import { CategoryPage, createCategoryMetadata } from "@/components/CategoryPage";

export const metadata = createCategoryMetadata("upcoming");

export default function UpcomingPage() {
  return <CategoryPage categoryId="upcoming" />;
}
