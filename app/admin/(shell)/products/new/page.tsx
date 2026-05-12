import { ProductEditorForm } from "@/components/admin/product-editor-form";
import { getAdminCategories } from "@/lib/admin/queries";

export default async function AdminNewProductPage() {
  const categories = await getAdminCategories();

  return <ProductEditorForm categories={categories} product={null} />;
}
