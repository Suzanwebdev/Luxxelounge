"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { upsertProductAction, deleteProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatGhs } from "@/lib/utils";

type Category = { id: string; name: string };
type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  status: string;
  regular_price: number;
  sale_price: number | null;
  stock_qty: number;
  tags: string[] | null;
  metadata: { colors?: string[] } | null;
  categories: { name: string | null } | { name: string | null }[] | null;
  product_images: { image_url: string | null }[] | null;
};

function pickCategoryName(categories: ProductRow["categories"]) {
  const cat = Array.isArray(categories) ? categories[0] : categories;
  return cat?.name || "Uncategorized";
}

export function ProductsManager({
  products,
  categories
}: {
  products: ProductRow[];
  categories: Category[];
}) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const defaultCategory = categories[0]?.id || "";

  const previewImages = useMemo(() => {
    if (localPreviewUrls.length > 0) return localPreviewUrls;
    return (editing?.product_images || [])
      .map((img) => img.image_url || "")
      .filter(Boolean);
  }, [localPreviewUrls, editing]);

  useEffect(() => {
    return () => {
      localPreviewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [localPreviewUrls]);

  function handleFileSelection(files: FileList) {
    const list = Array.from(files);
    setUploadError(null);
    setSelectedFiles(list);
    setLocalPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return list.map((file) => URL.createObjectURL(file));
    });
  }

  async function uploadSelectedFiles(files: File[]) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setUploadError("Supabase is not configured in this environment.");
      return [] as string[];
    }

    setUploading(true);
    const nextUrls: string[] = [];
    for (const file of files) {
      const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        upsert: true
      });
      if (error) {
        setUploadError(`Could not upload "${file.name}". Please try again.`);
        continue;
      }
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      nextUrls.push(data.publicUrl);
    }
    setUploading(false);
    return nextUrls;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">{editing ? "Edit Product" : "Create Product"}</h2>
        <form
          action={(formData) => {
            startTransition(async () => {
              if (editing) formData.set("id", editing.id);
              const imageUrls = selectedFiles.length > 0 ? await uploadSelectedFiles(selectedFiles) : [];
              formData.set("imageUrls", JSON.stringify(imageUrls));
              await upsertProductAction(formData);
              setEditing(null);
              setSelectedFiles([]);
              setLocalPreviewUrls((prev) => {
                prev.forEach((url) => URL.revokeObjectURL(url));
                return [];
              });
              setUploadError(null);
            });
          }}
          className="mt-4 space-y-3"
        >
          <Input name="name" placeholder="Product name" defaultValue={editing?.name} required />
          <Input name="slug" placeholder="product-slug" defaultValue={editing?.slug} />
          <Textarea name="description" placeholder="Product description" defaultValue={editing?.description ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="regularPrice" type="number" min={0} placeholder="Regular price" defaultValue={editing?.regular_price} required />
            <Input name="salePrice" type="number" min={0} placeholder="Sale price (optional)" defaultValue={editing?.sale_price ?? ""} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              name="stockQty"
              type="number"
              min={0}
              placeholder="Stock quantity (e.g. 25)"
              defaultValue={editing?.stock_qty ?? 0}
              required
            />
            <Input name="tags" placeholder="Tags: New, Best Seller, Sale" defaultValue={editing?.tags?.join(", ")} />
          </div>
          <div className="grid grid-cols-1 gap-3">
            <Input
              name="colors"
              placeholder="Colors: Walnut, Matte Black, Champagne Beige"
              defaultValue={editing?.metadata?.colors?.join(", ") ?? ""}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              name="status"
              defaultValue={editing?.status ?? "active"}
              className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <select
              name="categoryId"
              defaultValue={editing?.category_id || defaultCategory}
              key={editing?.id ?? "new"}
              className="h-11 rounded-2xl border border-border bg-card px-3 text-sm"
            >
              {categories.length === 0 ? (
                <option value="">No categories — sync Categories page first</option>
              ) : (
                categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))
              )}
            </select>
          </div>
          <div className="rounded-2xl border border-border p-3">
            <p className="mb-2 text-sm text-muted-foreground">Upload product images (multiple allowed)</p>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = event.target.files;
                if (files && files.length > 0) handleFileSelection(files);
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Selected images are previewed now and uploaded when you save the product.
            </p>
            {uploading ? <p className="mt-2 text-xs text-muted-foreground">Uploading selected images...</p> : null}
            {uploadError ? <p className="mt-2 text-xs text-destructive">{uploadError}</p> : null}
            {previewImages.length > 0 ? (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {previewImages.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preview ${index + 1}`} className="h-16 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={isPending || uploading}>
              {editing ? "Update Product" : "Create Product"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setSelectedFiles([]);
                  setLocalPreviewUrls((prev) => {
                    prev.forEach((url) => URL.revokeObjectURL(url));
                    return [];
                  });
                  setUploadError(null);
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">Product Catalog</h2>
        <div className="mt-4 space-y-3">
          {products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              No products in the database. Create one with the form on the left, or sync categories first if the
              category list is empty.
            </p>
          ) : null}
          {products.map((product) => (
            <article key={product.id} className="rounded-2xl border border-border p-3">
              <p className="font-medium">{product.name}</p>
              <p className="text-xs text-muted-foreground">{pickCategoryName(product.categories)} • {product.status}</p>
              <p className="mt-1 text-sm">
                {formatGhs(Number(product.sale_price ?? product.regular_price))} • Stock {product.stock_qty}
              </p>
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedFiles([]);
                    setLocalPreviewUrls((prev) => {
                      prev.forEach((url) => URL.revokeObjectURL(url));
                      return [];
                    });
                    setUploadError(null);
                    setEditing(product);
                  }}
                >
                  Edit
                </Button>
                <form
                  action={(formData) =>
                    startTransition(async () => {
                      await deleteProductAction(formData);
                    })
                  }
                >
                  <input type="hidden" name="id" value={product.id} />
                  <Button type="submit" size="sm" variant="ghost">
                    Delete
                  </Button>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
