"use client";

import { useActionState } from "react";
import { syncStorefrontCategoriesAction, type SyncCategoriesState } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const initial: SyncCategoriesState = { ok: null, message: "" };

export function SyncStorefrontCategoriesForm() {
  const [state, formAction, isPending] = useActionState(syncStorefrontCategoriesAction, initial);

  return (
    <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:items-end">
      <form action={formAction}>
        <Button
          type="submit"
          disabled={isPending}
          variant="outline"
          className="w-full border-primary/50 font-semibold text-primary sm:w-auto"
        >
          {isPending ? "Syncing…" : "Sync homepage categories to database"}
        </Button>
      </form>
      {state.message ? (
        <p
          role="status"
          aria-live="polite"
          className={`max-w-md text-sm sm:text-right ${state.ok ? "text-primary" : "text-red-600"}`}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
