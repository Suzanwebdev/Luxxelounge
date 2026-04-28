"use client";

import { useActionState, useEffect, useState } from "react";
import { updateHomepageCmsSimpleAction, type CmsPageActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type HomepageCmsEditorProps = {
  initial: {
    status: "draft" | "published";
    heroTitle: string;
    heroTagline: string;
    heroCtaPrimary: string;
    heroCtaSecondary: string;
    slide1Url: string;
    slide2Url: string;
    slide3Url: string;
  };
};

export function HomepageCmsEditor({ initial }: HomepageCmsEditorProps) {
  const [state, formAction, isPending] = useActionState(updateHomepageCmsSimpleAction, null as CmsPageActionState);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({
    1: initial.slide1Url,
    2: initial.slide2Url,
    3: initial.slide3Url
  });

  useEffect(() => {
    return () => {
      Object.values(previewUrls).forEach((url) => {
        if (url?.startsWith("blob:")) URL.revokeObjectURL(url);
      });
    };
  }, [previewUrls]);

  function setSlidePreview(index: number, nextUrl: string) {
    setPreviewUrls((prev) => {
      const prevUrl = prev[index];
      if (prevUrl?.startsWith("blob:") && prevUrl !== nextUrl) {
        URL.revokeObjectURL(prevUrl);
      }
      return { ...prev, [index]: nextUrl };
    });
  }

  return (
    <form action={formAction} className="space-y-6 rounded-3xl border border-border bg-card p-5">
      {state?.message ? (
        <p
          role="status"
          className={`rounded-2xl border px-3 py-2 text-sm ${
            state.ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Hero text</h2>
        <Input name="heroTitle" defaultValue={initial.heroTitle} placeholder="Hero title" required />
        <Textarea name="heroTagline" defaultValue={initial.heroTagline} placeholder="Hero tagline" rows={3} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input name="heroCtaPrimary" defaultValue={initial.heroCtaPrimary} placeholder="Primary button text" />
          <Input name="heroCtaSecondary" defaultValue={initial.heroCtaSecondary} placeholder="Secondary button text" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-heading text-xl">Slider images</h2>
        <p className="text-sm text-muted-foreground">Paste image URLs or upload new images for each slide.</p>

        {[1, 2, 3].map((index) => (
          <div key={index} className="space-y-2 rounded-2xl border border-border p-3">
            <p className="text-sm font-medium">Slide {index}</p>
            <Input
              name={`slide${index}Url`}
              defaultValue={initial[`slide${index}Url` as keyof typeof initial]}
              placeholder="https://..."
              onChange={(event) => setSlidePreview(index, event.target.value.trim())}
            />
            <Input
              name={`slide${index}File`}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setSlidePreview(index, URL.createObjectURL(file));
              }}
            />
            {previewUrls[index] ? (
              <div className="overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrls[index]} alt={`Slide ${index} preview`} className="h-28 w-full rounded-lg object-cover" />
              </div>
            ) : null}
          </div>
        ))}
      </section>

      <section className="space-y-2">
        <label className="text-sm font-medium" htmlFor="status">Status</label>
        <select
          id="status"
          name="status"
          defaultValue={initial.status}
          className="h-11 w-44 rounded-xl border border-border bg-background px-3 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </section>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : "Save homepage CMS"}
        </Button>
      </div>
    </form>
  );
}
