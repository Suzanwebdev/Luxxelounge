"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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

function getStockStatus(stockQty: number) {
  if (stockQty <= 0) {
    return {
      label: "Out of stock",
      className: "border-red-300 bg-red-50 text-red-700"
    };
  }
  if (stockQty <= 5) {
    return {
      label: "Low stock",
      className: "border-amber-300 bg-amber-50 text-amber-700"
    };
  }
  return {
    label: "In stock",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700"
  };
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
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<"success" | "error" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedCount, setUploadedCount] = useState(0);
  const [totalToUpload, setTotalToUpload] = useState(0);
  const [uploadingFileNames, setUploadingFileNames] = useState<string[]>([]);
  const router = useRouter();
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
    setFormMessage(null);
    setFormMessageType(null);
    setUploadedCount(0);
    setTotalToUpload(list.length);
    setUploadingFileNames([]);
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
    setUploadError(null);
    setUploadedCount(0);
    setTotalToUpload(files.length);
    setUploadingFileNames(files.map((file) => file.name));

    const nextUrls: string[] = [];
    const uploadTasks = files.map(async (file) => {
      const path = `admin/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, "-")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        upsert: true
      });
      if (error) {
        setUploadingFileNames((prev) => prev.filter((name) => name !== file.name));
        return { ok: false as const, fileName: file.name };
      }

      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      setUploadedCount((prev) => prev + 1);
      setUploadingFileNames((prev) => prev.filter((name) => name !== file.name));
      return { ok: true as const, fileName: file.name, url: data.publicUrl };
    });

    const results = await Promise.all(uploadTasks);
    for (const result of results) {
      if (result.ok) {
        nextUrls.push(result.url);
      } else {
        setUploadError(`Some images failed to upload. Please retry failed files.`);
      }
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
              if (selectedFiles.length > 0 && imageUrls.length !== selectedFiles.length) {
                setFormMessage("Some selected images did not upload. Please retry before saving.");
                setFormMessageType("error");
                return;
              }
              formData.set("imageUrls", JSON.stringify(imageUrls));
              const result = await upsertProductAction(formData);
              if (!result?.ok) {
                setFormMessage(result?.message ?? "Could not save product. Please try again.");
                setFormMessageType("error");
                return;
              }
              setEditing(null);
              setSelectedFiles([]);
              setUploadedCount(0);
              setTotalToUpload(0);
              setUploadingFileNames([]);
              setLocalPreviewUrls((prev) => {
                prev.forEach((url) => URL.revokeObjectURL(url));
                return [];
              });
              setUploadError(null);
              setFormMessage(result.message);
              setFormMessageType("success");
              router.refresh();
            });
          }}
          className="mt-4 space-y-3"
        >
          {formMessage ? (
            <p className={`rounded-xl border px-3 py-2 text-sm ${formMessageType === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"}`}>
              {formMessage}
            </p>
          ) : null}
          <Input name="name" placeholder="Product name" defaultValue={editing?.name} required />
          <Input name="slug" placeholder="product-slug" defaultValue={editing?.slug} />
          <Textarea name="description" placeholder="Product description" defaultValue={editing?.description ?? ""} />
          <div className="grid grid-cols-2 gap-3">
            <Input name="regularPrice" type="number" min={0} placeholder="Regular price" defaultValue={editing?.regular_price} required />
            <Input name="salePrice" type="number" min={0} placeholder="Sale price (optional)" defaultValue={editing?.sale_price ?? ""} />
          </div>
          <div className="space-y-2 rounded-2xl border border-border p-3">
            <p className="text-sm font-medium">Inventory</p>
            <Input
              name="stockQty"
              type="number"
              min={0}
              placeholder="Stock quantity (e.g. 25)"
              defaultValue={editing?.stock_qty ?? 0}
              required
            />
            <p className="text-xs text-muted-foreground">Set `0` if the product is out of stock.</p>
          </div>
          <div className="grid grid-cols-1 gap-3">
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
            {uploading ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Uploading images... {uploadedCount}/{totalToUpload} completed
              </p>
            ) : null}
            {!uploading && totalToUpload > 0 && uploadedCount === totalToUpload ? (
              <p className="mt-2 text-xs text-emerald-700">All selected images uploaded successfully.</p>
            ) : null}
            {uploading && uploadingFileNames.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                In progress: {uploadingFileNames.slice(0, 2).join(", ")}
                {uploadingFileNames.length > 2 ? ` +${uploadingFileNames.length - 2} more` : ""}
              </p>
            ) : null}
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
              {uploading ? "Uploading images..." : editing ? "Update Product" : "Create Product"}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null);
                  setSelectedFiles([]);
                  setUploadedCount(0);
                  setTotalToUpload(0);
                  setUploadingFileNames([]);
                  setLocalPreviewUrls((prev) => {
                    prev.forEach((url) => URL.revokeObjectURL(url));
                    return [];
                  });
                  setUploadError(null);
                  setFormMessage(null);
                  setFormMessageType(null);
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
          {products.map((product) => {
            const stockStatus = getStockStatus(product.stock_qty);
            return (
              <article key={product.id} className="rounded-2xl border border-border p-3">
                <span className={`mb-2 inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${stockStatus.className}`}>
                  {stockStatus.label}
                </span>
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
                      setUploadedCount(0);
                      setTotalToUpload(0);
                      setUploadingFileNames([]);
                      setLocalPreviewUrls((prev) => {
                        prev.forEach((url) => URL.revokeObjectURL(url));
                        return [];
                      });
                      setUploadError(null);
                      setFormMessage(null);
                      setFormMessageType(null);
                      setEditing(product);
                    }}
                  >
                    Edit
                  </Button>
                  <form
                    action={(formData) =>
                      startTransition(async () => {
                        const result = await deleteProductAction(formData);
                        if (!result?.ok) {
                          setFormMessage(result?.message ?? "Could not delete product. Please try again.");
                          setFormMessageType("error");
                          return;
                        }
                        setFormMessage(result.message);
                        setFormMessageType("success");
                        router.refresh();
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
            );
          })}
        </div>
      </section>
    </div>
  );
}
