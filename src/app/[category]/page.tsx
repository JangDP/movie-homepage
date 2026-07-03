import { CategoryPage, createDynamicCategoryMetadata } from "@/components/CategoryPage";
import type { ContentCategory } from "@/types/site";

export const runtime = "edge";

type DynamicCategoryPageProps = {
  params: Promise<{
    category: ContentCategory;
  }>;
};

export async function generateMetadata({ params }: DynamicCategoryPageProps) {
  const { category } = await params;

  try {
    return await createDynamicCategoryMetadata(category);
  } catch {
    return {
      title: String(category),
      robots: {
        index: true,
        follow: true,
      },
    };
  }
}

export default async function DynamicCategoryPage({ params }: DynamicCategoryPageProps) {
  const { category } = await params;

  return <CategoryPage categoryId={category} />;
}
