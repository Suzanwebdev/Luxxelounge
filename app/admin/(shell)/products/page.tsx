import Link from "next/link";
import { ProductCatalogList } from "@/components/admin/product-catalog-list";
import { getAdminProducts } from "@/lib/admin/queries";

type Props = {
  searchParams?: Promise<{ created?: string; updated?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  const params = searchParams ? await searchParams : undefined;
  const products = await getAdminProducts();
  const showCreatedToast = params?.created === "1";
  const showUpdatedToast = params?.updated === "1";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl">Products</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search, edit, move to draft, or delete catalog items.{" "}
            <Link href="/admin/products/new" className="text-primary underline-offset-2 hover:underline">
              Add a product
            </Link>
            .
          </p>
        </div>
      </div>
      <ProductCatalogList
        products={products}
        showCreatedToast={showCreatedToast}
        showUpdatedToast={showUpdatedToast}
      />
    </div>
  );
}
