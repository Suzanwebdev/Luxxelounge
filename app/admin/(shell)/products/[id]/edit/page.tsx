import { notFound } from "next/navigation";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import type { AdminProductRow } from "@/lib/admin/admin-product-types";
import { getAdminCategories, getAdminHomeTrendingProductSlug, getAdminProductById } from "@/lib/admin/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories, trendingSlug] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories(),
    getAdminHomeTrendingProductSlug()
  ]);
  if (!product) notFound();

  const slug = String(product.slug || "").trim();
  const isHomeTrending = Boolean(slug && trendingSlug && trendingSlug === slug);

  return (
    <ProductEditorForm categories={categories} product={product as AdminProductRow} isHomeTrending={isHomeTrending} />
  );
}
