import { ProductsManager } from "@/components/admin/products-manager";
import { getAdminCategories, getAdminProducts } from "@/lib/admin/queries";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getAdminProducts(), getAdminCategories()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl">Products</h1>
        <p className="mt-1 text-sm text-muted-foreground">Create, edit, and remove catalog items.</p>
      </div>
      <ProductsManager products={products} categories={categories} />
    </div>
  );
}
