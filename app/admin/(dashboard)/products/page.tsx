import { ProductsManager } from "@/components/admin/products-manager";
import { getAdminCategories, getAdminProducts } from "@/lib/admin/queries";

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([getAdminProducts(), getAdminCategories()]);
  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Catalog</p>
        <h1 className="font-heading text-4xl">Products</h1>
      </div>
      <ProductsManager
        products={products as Parameters<typeof ProductsManager>[0]["products"]}
        categories={categories as Parameters<typeof ProductsManager>[0]["categories"]}
      />
    </section>
  );
}
