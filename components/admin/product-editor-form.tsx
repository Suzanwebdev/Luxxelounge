"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { upsertProductAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { AdminProductRow } from "@/lib/admin/admin-product-types";

type Category = { id: string; name: string };

async function optimizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  if (file.size <= 900 * 1024) return file;

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`Could not load image "${file.name}" for optimization.`));
      el.src = objectUrl;
    });

    const maxDim = 1800;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const outW = Math.max(1, Math.round(img.width * scale));
    const outH = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, outW, outH);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), "image/webp", 0.82);
    });
    if (!blob) return file;
    if (blob.size >= file.size) return file;

    const nameWithoutExt = file.name.replace(/\.[^.]+$/, "");
    return new File([blob], `${nameWithoutExt}.webp`, {
      type: "image/webp",
      lastModified: Date.now()
    });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

type ProductEditorFormProps = {
  categories: Category[];
  /** When set, form is in edit mode for this product. */
  product?: AdminProductRow | null;
};

export function ProductEditorForm({ categories, product }: ProductEditorFormProps) {
  const editing = product ?? null;
  const isEdit = Boolean(editing);
  const [isPending, startTransition] = useTransition();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [localPreviewUrls, setLocalPreviewUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formMessageType, setFormMessageType] = useState<"success" | "error" | null>(null);
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

  useEffect(() => {
    if (!formMessage) return;
    const timer = window.setTimeout(() => {
      setFormMessage(null);
      setFormMessageType(null);
    }, 3500);
    return () => window.clearTimeout(timer);
  }, [formMessage]);

  useEffect(() => {
    setSelectedFiles([]);
    setLocalPreviewUrls((prev) => {
      prev.forEach((url) => URL.revokeObjectURL(url));
      return [];
    });
    setUploadError(null);
    setFormMessage(null);
    setFormMessageType(null);
  }, [editing?.id]);

  function handleFileSelection(files: FileList) {
    const incoming = Array.from(files);
    setUploadError(null);
    setFormMessage(null);
    setFormMessageType(null);
    setSelectedFiles((prev) => {
      const map = new Map<string, File>();
      [...prev, ...incoming].forEach((file) => {
        const key = `${file.name}-${file.size}-${file.lastModified}`;
        map.set(key, file);
      });
      return Array.from(map.values());
    });
    setLocalPreviewUrls((prev) => {
      const next = [...prev, ...incoming.map((file) => URL.createObjectURL(file))];
      return next;
    });
  }

  const title = isEdit ? "Edit product" : "Create product";
  const subtitle = isEdit ? "Update details and save changes." : "Add a new catalog item. You will return to the product list when creation succeeds.";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" size="sm" className="-ml-2 text-muted-foreground" asChild>
          <Link href="/admin/products">← Back to catalog</Link>
        </Button>
      </div>

      <div>
        <h1 className="font-heading text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>

      <section className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-5 md:p-8">
        <form
          key={editing?.id ?? "create"}
          action={(formData) => {
            startTransition(async () => {
              setFormMessage(null);
              setFormMessageType(null);
              if (editing) formData.set("id", editing.id);
              formData.delete("images");
              const optimizedFiles = await Promise.all(selectedFiles.map((file) => optimizeImageForUpload(file)));
              optimizedFiles.forEach((file) => {
                formData.append("images", file, file.name);
              });
              formData.set("imageUrls", JSON.stringify([]));
              const result = await upsertProductAction(formData);
              if (!result?.ok) {
                setFormMessage(result?.message ?? "Could not save product. Please try again.");
                setFormMessageType("error");
                return;
              }
              setSelectedFiles([]);
              setLocalPreviewUrls((prev) => {
                prev.forEach((url) => URL.revokeObjectURL(url));
                return [];
              });
              setUploadError(null);
              if (!isEdit) {
                router.push("/admin/products?created=1");
                return;
              }
              setFormMessage(result.message);
              setFormMessageType("success");
              router.refresh();
            });
          }}
          className="space-y-3"
        >
          {formMessage ? (
            <p
              className={`rounded-xl border px-3 py-2 text-sm ${
                formMessageType === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-emerald-300 bg-emerald-50 text-emerald-700"
              }`}
            >
              {formMessage}
            </p>
          ) : null}
          <Input name="name" placeholder="Product name" defaultValue={editing?.name} required />
          <Input name="slug" placeholder="product-slug" defaultValue={editing?.slug} />
          <Textarea name="description" placeholder="Product description" defaultValue={editing?.description ?? ""} />
          <div className="grid gap-3 sm:grid-cols-2">
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
            <p className="text-xs text-muted-foreground">Set 0 if the product is out of stock.</p>
          </div>
          <div className="grid gap-3">
            <Input name="tags" placeholder="Tags: New, Best Seller, Sale" defaultValue={editing?.tags?.join(", ")} />
          </div>
          <div className="grid gap-3">
            <Input
              name="colors"
              placeholder="Colors: Walnut, Matte Black, Champagne Beige"
              defaultValue={editing?.metadata?.colors?.join(", ") ?? ""}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
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
              name="images"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = event.target.files;
                if (files && files.length > 0) handleFileSelection(files);
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Select one or more images. They upload when you save. On edit, new images replace the existing gallery.
            </p>
            {selectedFiles.length > 0 ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {selectedFiles.length} image{selectedFiles.length > 1 ? "s" : ""} selected
              </p>
            ) : null}
            {uploadError ? <p className="mt-2 text-xs text-destructive">{uploadError}</p> : null}
            {previewImages.length > 0 ? (
              <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
                {previewImages.map((url, index) => (
                  <div key={`${url}-${index}`} className="relative overflow-hidden rounded-lg border border-border bg-muted/30">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Preview ${index + 1}`} className="h-16 w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving…" : isEdit ? "Update product" : "Create product"}
            </Button>
            {isEdit ? (
              <Button type="button" variant="outline" asChild>
                <Link href="/admin/products">Cancel</Link>
              </Button>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
