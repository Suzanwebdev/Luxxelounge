"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Eye, LayoutTemplate, Megaphone, Sparkles } from "lucide-react";
import { updateHomeContentAction, type HomeContentActionState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-w-[12rem]">
      {pending ? "Saving…" : "Save homepage content"}
    </Button>
  );
}

export type HomeContentEditorInitial = {
  announcement: string;
  heroTitle: string;
  heroTagline: string;
  heroCtaPrimary: string;
  heroCtaSecondary: string;
  promoTitle: string;
  promoSubtitle: string;
  promoEnabled: boolean;
};

type HomeContentEditorProps = {
  initial: HomeContentEditorInitial;
};

export function HomeContentEditor({ initial }: HomeContentEditorProps) {
  const [state, formAction] = useActionState(updateHomeContentAction, null as HomeContentActionState);

  return (
    <form action={formAction} className="space-y-8">
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Updates <code className="rounded bg-muted px-1.5 py-0.5 text-xs">home_content.sections</code> for the live
          storefront. Save to apply everywhere.
        </p>
        <Button variant="outline" size="sm" className="shrink-0 gap-2 border-primary/40" asChild>
          <Link href="/" target="_blank" rel="noreferrer">
            <Eye className="h-4 w-4" />
            Preview live site
          </Link>
        </Button>
      </div>

      {state?.message ? (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-red-500/40 bg-red-500/10 text-red-900 dark:text-red-100"
          }`}
        >
          {state.message}
        </div>
      ) : null}

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Megaphone className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h3 className="font-heading text-lg">Top announcement strip</h3>
              <p className="text-sm text-muted-foreground">
                Shown above the navigation on every page. Keep it short and scannable.
              </p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="announcement">
                Message
              </label>
              <Input
                id="announcement"
                name="announcement"
                defaultValue={initial.announcement}
                placeholder="Fast delivery • Authentic products • Easy returns"
                className="max-w-3xl"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h3 className="font-heading text-lg">Hero overlay</h3>
              <p className="text-sm text-muted-foreground">
                Text over the homepage image slider. Primary button links to{" "}
                <Link href="/shop" className="text-primary underline-offset-2 hover:underline">
                  /shop
                </Link>
                ; secondary to{" "}
                <Link href="/collections" className="text-primary underline-offset-2 hover:underline">
                  /collections
                </Link>
                .
              </p>
            </div>
            <div className="grid max-w-3xl gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="heroTitle">
                  Headline
                </label>
                <Input id="heroTitle" name="heroTitle" defaultValue={initial.heroTitle} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="heroTagline">
                  Supporting line
                </label>
                <Textarea
                  id="heroTagline"
                  name="heroTagline"
                  rows={3}
                  defaultValue={initial.heroTagline}
                  className="resize-y min-h-[5rem]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="heroCtaPrimary">
                    Primary button
                  </label>
                  <Input id="heroCtaPrimary" name="heroCtaPrimary" defaultValue={initial.heroCtaPrimary} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="heroCtaSecondary">
                    Secondary button
                  </label>
                  <Input id="heroCtaSecondary" name="heroCtaSecondary" defaultValue={initial.heroCtaSecondary} required />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <LayoutTemplate className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <h3 className="font-heading text-lg">Mid-page promo panel</h3>
              <p className="text-sm text-muted-foreground">
                The wide “Private Offer” block above testimonials. Toggle off to hide it entirely.
              </p>
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                name="promoEnabled"
                defaultChecked={initial.promoEnabled}
                className="h-4 w-4 rounded border-border"
              />
              Show promo section on homepage
            </label>
            <div className="grid max-w-3xl gap-4 sm:grid-cols-1">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="promoTitle">
                  Title
                </label>
                <Input id="promoTitle" name="promoTitle" defaultValue={initial.promoTitle} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="promoSubtitle">
                  Body copy
                </label>
                <Textarea
                  id="promoSubtitle"
                  name="promoSubtitle"
                  rows={3}
                  defaultValue={initial.promoSubtitle}
                  className="resize-y min-h-[5rem]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">
          Platform-only overrides (rate limits, emergency hero) remain in the superadmin portal.
        </p>
        <SubmitButton />
      </div>
    </form>
  );
}
