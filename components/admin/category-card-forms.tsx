"use client";

import * as React from "react";
import { clearCategoryCardImageAction, createCategoryAction, updateCategoryCardAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function useImagePreview(initialUrl?: string | null) {
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(initialUrl || null);

  const onFileChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPreviewUrl(initialUrl || null);
      return;
    }
    const next = URL.createObjectURL(file);
    setPreviewUrl((prev) => {
      if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
      return next;
    });
  }, [initialUrl]);

  React.useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return { previewUrl, onFileChange };
}

export function CategoryCardUpdateForm({
  id,
  defaultName,
  defaultSlug,
  currentImageUrl
}: {
  id: string;
  defaultName: string;
  defaultSlug: string;
  currentImageUrl?: string | null;
}) {
  const { previewUrl, onFileChange } = useImagePreview(currentImageUrl);

  return (
    <div className="space-y-2">
      <form action={updateCategoryCardAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Input name="name" defaultValue={defaultName} className="h-8 w-36 text-xs" />
        <Input name="slug" defaultValue={defaultSlug} className="h-8 w-28 text-xs" />
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="block text-xs file:mr-2 file:rounded-md file:border-0 file:bg-muted file:px-2 file:py-1"
        />
        <Button type="submit" size="sm" variant="outline">
          Save card
        </Button>
      </form>
      {previewUrl ? (
        <div className="relative h-14 w-24 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Selected category preview" className="h-full w-full object-cover" />
        </div>
      ) : null}
      {currentImageUrl ? (
        <form action={clearCategoryCardImageAction}>
          <input type="hidden" name="id" value={id} />
          <Button type="submit" size="sm" variant="ghost">
            Remove image
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function CategoryQuickAddForm() {
  const { previewUrl, onFileChange } = useImagePreview(null);

  return (
    <form action={createCategoryAction} className="mt-4 flex max-w-xl flex-col gap-3">
      <Input name="name" placeholder="Category name" required className="flex-1" />
      <div className="flex flex-wrap items-center gap-3">
        <Input name="slug" placeholder="slug (optional)" className="flex-1 sm:max-w-[12rem]" />
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2"
        />
        <Button type="submit">Add</Button>
      </div>
      {previewUrl ? (
        <div className="relative h-20 w-32 overflow-hidden rounded-lg border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="New category preview" className="h-full w-full object-cover" />
        </div>
      ) : null}
    </form>
  );
}
