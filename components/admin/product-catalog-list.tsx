"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { bulkDeleteProductsAction, deleteProductAction, setProductStatusAction } from "@/app/admin/actions";
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

function firstProductImageUrl(product: AdminProductRow): string | null {
  const imgs = product.product_images || [];
  for (const img of imgs) {
    const u = String(img?.image_url || "").trim();
    if (u) return u;
  }
  return null;
}

function catalogFlashNotice(created?: boolean, updated?: boolean): { text: string; variant: "success" } | null {
  if (created) return { text: "Product created successfully.", variant: "success" };
  if (updated) return { text: "Product updated successfully.", variant: "success" };
  return null;
}

export function ProductCatalogList({
  products,
  showCreatedToast,
  showUpdatedToast
}: {
  products: AdminProductRow[];
  showCreatedToast?: boolean;
  showUpdatedToast?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState<{ text: string; variant: "success" | "error" } | null>(
    catalogFlashNotice(showCreatedToast, showUpdatedToast)
  );
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected((prev) => prev.filter((id) => products.some((p) => p.id === id)));
  }, [products]);

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

  const filteredIds = useMemo(() => filtered.map((p) => p.id), [filtered]);
  const allFilteredSelected =
    filteredIds.length > 0 && filteredIds.every((id) => selected.includes(id));
  const validSelected = useMemo(
    () => [...new Set(selected)].filter((id) => products.some((p) => p.id === id)),
    [selected, products]
  );
  const selectedVisibleCount = useMemo(
    () => validSelected.filter((id) => filteredIds.includes(id)).length,
    [validSelected, filteredIds]
  );

  function toggleSelectAllFiltered() {
    setSelected((prev) => {
      if (filteredIds.length === 0) return prev;
      const every = filteredIds.every((id) => prev.includes(id));
      if (every) {
        return prev.filter((id) => !filteredIds.includes(id));
      }
      return [...new Set([...prev, ...filteredIds])];
    });
  }

  function toggleRow(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function runBulkDelete() {
    const ids = [...new Set(selected)].filter((id) => products.some((p) => p.id === id));
    if (ids.length === 0) return;
    const preview = products
      .filter((p) => ids.includes(p.id))
      .slice(0, 5)
      .map((p) => p.name);
    const extra = ids.length > preview.length ? ` and ${ids.length - preview.length} more` : "";
    const label = preview.length ? `${preview.join(", ")}${extra}` : `${ids.length} product(s)`;
    if (!window.confirm(`Permanently delete ${ids.length} product(s)?\n\n${label}\n\nThis cannot be undone.`)) {
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.set("ids", JSON.stringify(ids));
      const result = await bulkDeleteProductsAction(fd);
      if (!result?.ok) {
        setNotice({ text: result?.message ?? "Bulk delete failed.", variant: "error" });
        return;
      }
      setNotice({ text: result.message, variant: "success" });
      setSelected((prev) => prev.filter((id) => !ids.includes(id)));
      router.refresh();
    });
  }

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

      {products.length > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-muted/20 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          {filtered.length > 0 ? (
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border border-border accent-primary"
                checked={allFilteredSelected}
                onChange={toggleSelectAllFiltered}
                aria-label={allFilteredSelected ? "Deselect all products in this view" : "Select all products in this view"}
              />
              <span>
                Select all in view ({filtered.length})
                {query.trim() ? " — matches search" : ""}
              </span>
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">No products match this search.</p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {validSelected.length > 0 ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {validSelected.length} selected
                  {query.trim() && selectedVisibleCount < validSelected.length
                    ? ` (${selectedVisibleCount} shown in list)`
                    : null}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  disabled={isPending}
                  onClick={runBulkDelete}
                >
                  Delete selected
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={isPending} onClick={() => setSelected([])}>
                  Clear selection
                </Button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}

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
          const thumb = firstProductImageUrl(product);
          return (
            <article
              key={product.id}
              className="flex gap-3 rounded-2xl border border-border bg-card p-4 md:items-start md:justify-between md:gap-4"
            >
              <label className="flex shrink-0 cursor-pointer items-start pt-1 md:pt-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border border-border accent-primary"
                  checked={selected.includes(product.id)}
                  onChange={() => toggleRow(product.id)}
                  aria-label={`Select ${product.name}`}
                />
              </label>
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-border bg-muted md:h-[5.5rem] md:w-[5.5rem]">
                {thumb ? (
                  <Image
                    src={thumb}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 80px, 88px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-1 text-center text-[10px] leading-tight text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${statusBadgeClass(product.status)}`}
                    >
                      {product.status}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${stockStatus.className}`}
                    >
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
              <div className="flex shrink-0 flex-wrap gap-2 md:flex-col md:items-stretch">
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
                      setSelected((prev) => prev.filter((x) => x !== product.id));
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
            </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
