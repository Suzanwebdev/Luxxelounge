import { notFound } from "next/navigation";
import { ProductEditorForm } from "@/components/admin/product-editor-form";
import type { AdminProductRow } from "@/lib/admin/admin-product-types";
import { getAdminCategories, getAdminProductById } from "@/lib/admin/queries";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminEditProductPage({ params }: Props) {
  const { id } = await params;
  const [product, categories] = await Promise.all([getAdminProductById(id), getAdminCategories()]);
  if (!product) notFound();

  return <ProductEditorForm categories={categories} product={product as AdminProductRow} />;
}
