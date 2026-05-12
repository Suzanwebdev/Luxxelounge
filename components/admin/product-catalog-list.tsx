"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteProductAction, setProductStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatGhs } from "@/lib/utils";
import { getStockStatus, pickCategoryName, type AdminProductRow } from "@/lib/admin/admin-product-types";

function statusBadgeClass(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "border-emerald-300 bg-emerald-50 text-emerald-800";
  if (s === "draft") return "border-amber-300 bg-amber-50 text-amber-900";
  return "border-border bg-muted text-muted-foreground";
}

export function ProductCatalogList({
  products,
  showCreatedToast
}: {
  products: AdminProductRow[];
  showCreatedToast?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ text: string; variant: "success" | "error" } | null>(
    showCreatedToast ? { text: "Product created successfully.", variant: "success" } : null
  );
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const name = p.name.toLowerCase();
      const slug = (p.slug || "").toLowerCase();
      const cat = pickCategoryName(p.categories).toLowerCase();
      return name.includes(q) || slug.includes(q) || cat.includes(q);
    });
  }, [products, query]);

  return (
    <div className="space-y-5">
      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm ${
            notice.variant === "error"
              ? "border-red-300 bg-red-50 text-red-900"
              : "border-emerald-300 bg-emerald-50 text-emerald-900"
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Input
            type="search"
            placeholder="Search by name, slug, or category…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11"
            aria-label="Search products"
          />
        </div>
        <Button asChild className="shrink-0">
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <div className="space-y-3">
        {products.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No products yet.{" "}
            <Link href="/admin/products/new" className="font-medium text-primary underline-offset-2 hover:underline">
              Create your first product
            </Link>
            , or sync categories first if the category list is empty.
          </p>
        ) : filtered.length === 0 ? (
          <p className="rounded-2xl border border-border bg-muted/30 p-6 text-sm text-muted-foreground">
            No products match &quot;{query.trim()}&quot;. Try a different search.
          </p>
        ) : null}

        {filtered.map((product) => {
          const stockStatus = getStockStatus(product.stock_qty);
          const isDraft = product.status.toLowerCase() === "draft";
          return (
            <article key={product.id} className="rounded-2xl border border-border bg-card p-4 md:flex md:items-start md:justify-between md:gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass(product.status)}`}
                  >
                    {product.status}
                  </span>
                  <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${stockStatus.className}`}>
                    {stockStatus.label}
                  </span>
                </div>
                <p className="font-medium leading-snug">{product.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pickCategoryName(product.categories)} • {product.slug}
                </p>
                <p className="text-sm">
                  {formatGhs(Number(product.sale_price ?? product.regular_price))} • Stock {product.stock_qty}
                </p>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 md:mt-0 md:shrink-0 md:flex-col md:items-stretch">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/admin/products/${product.id}/edit`}>Edit</Link>
                </Button>
                {!isDraft ? (
                  <form
                    className="contents"
                    action={(formData) =>
                      startTransition(async () => {
                        const result = await setProductStatusAction(formData);
                        if (!result?.ok) {
                          setNotice({ text: result?.message ?? "Could not update status.", variant: "error" });
                          return;
                        }
                        setNotice({ text: result.message, variant: "success" });
                        router.refresh();
                      })
                    }
                  >
                    <input type="hidden" name="id" value={product.id} />
                    <input type="hidden" name="status" value="draft" />
                    <Button type="submit" size="sm" variant="outline" disabled={isPending}>
                      Add to draft
                    </Button>
                  </form>
                ) : null}
                <form
                  className="contents"
                  action={(formData) =>
                    startTransition(async () => {
                      const result = await deleteProductAction(formData);
                      if (!result?.ok) {
                        setNotice({ text: result?.message ?? "Could not delete product.", variant: "error" });
                        return;
                      }
                      setNotice({ text: result.message, variant: "success" });
                      router.refresh();
                    })
                  }
                >
                  <input type="hidden" name="id" value={product.id} />
                  <Button type="submit" size="sm" variant="ghost" className="text-destructive hover:text-destructive" disabled={isPending}>
                    Delete
                  </Button>
                </form>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
