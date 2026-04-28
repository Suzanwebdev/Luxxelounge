"use client";

import { useActionState, useMemo, useState } from "react";
import { upsertCmsPageAction, type CmsPageActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { CmsPageRow } from "@/lib/admin/queries";

type CmsEditorProps = {
  pages: CmsPageRow[];
};

function prettyJson(value: Record<string, unknown>) {
  return JSON.stringify(value || {}, null, 2);
}

const EMPTY_PAGE_CONTENT = "{\n  \"title\": \"\",\n  \"body\": \"\"\n}";

export function CmsEditor({ pages }: CmsEditorProps) {
  const [selectedKey, setSelectedKey] = useState<string>(pages[0]?.page_key ?? "");
  const selectedPage = useMemo(() => pages.find((p) => p.page_key === selectedKey) ?? null, [pages, selectedKey]);
  const [state, formAction, isPending] = useActionState(upsertCmsPageAction, null as CmsPageActionState);

  return (
    <div className="grid gap-6 lg:grid-cols-[300px,1fr]">
      <aside className="rounded-3xl border border-border bg-card p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">CMS pages</p>
        <div className="space-y-2">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              onClick={() => setSelectedKey(page.page_key)}
              className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                selectedKey === page.page_key
                  ? "border-primary/40 bg-primary/10 text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-muted/50"
              }`}
            >
              <p className="font-medium text-foreground">{page.title}</p>
              <p className="text-xs">{page.page_key} • {page.status}</p>
            </button>
          ))}
        </div>
      </aside>

      <form action={formAction} className="space-y-4 rounded-3xl border border-border bg-card p-5">
        <h2 className="font-heading text-2xl">CMS Editor</h2>
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

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="pageKey">Page key</label>
            <Input id="pageKey" name="pageKey" defaultValue={selectedPage?.page_key || ""} placeholder="homepage" required />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="title">Title</label>
            <Input id="title" name="title" defaultValue={selectedPage?.title || ""} placeholder="Homepage" required />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={selectedPage?.status || "draft"}
            className="h-11 w-44 rounded-xl border border-border bg-background px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="content">Content JSON</label>
          <Textarea
            id="content"
            name="content"
            rows={16}
            className="font-mono text-xs"
            defaultValue={selectedPage ? prettyJson(selectedPage.content) : EMPTY_PAGE_CONTENT}
            placeholder={EMPTY_PAGE_CONTENT}
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Save CMS page"}
          </Button>
        </div>
      </form>
    </div>
  );
}
