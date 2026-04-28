"use client";

import * as React from "react";
import { useActionState } from "react";
import {
  clearCategoryCardImageAction,
  createCategoryAction,
  type CategoryActionState,
  updateCategoryCardAction
} from "@/app/admin/actions";
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
  isActive,
  currentImageUrl
}: {
  id: string;
  defaultName: string;
  defaultSlug: string;
  isActive: boolean;
  currentImageUrl?: string | null;
}) {
  const { previewUrl, onFileChange } = useImagePreview(currentImageUrl);

  return (
    <div className="space-y-2">
      <form action={updateCategoryCardAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="id" value={id} />
        <Input name="name" defaultValue={defaultName} className="h-8 w-36 text-xs" />
        <Input name="slug" defaultValue={defaultSlug} className="h-8 w-28 text-xs" />
        <select
          name="status"
          defaultValue={isActive ? "active" : "draft"}
          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
        >
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
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
  const [state, formAction, isPending] = useActionState(createCategoryAction, null as CategoryActionState);

  return (
    <form action={formAction} className="mt-4 flex max-w-xl flex-col gap-3">
      {state?.message ? (
        <p className={`rounded-xl border px-3 py-2 text-sm ${state.ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      ) : null}
      <Input name="name" placeholder="Category name" required className="flex-1" />
      <div className="flex flex-wrap items-center gap-3">
        <Input name="slug" placeholder="slug (optional)" className="flex-1 sm:max-w-[12rem]" />
        <select name="status" defaultValue="active" className="h-11 rounded-lg border border-border bg-background px-3 text-sm">
          <option value="active">Active</option>
          <option value="draft">Draft</option>
        </select>
        <input
          name="image"
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="block text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-muted file:px-3 file:py-2"
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Add"}
        </Button>
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
