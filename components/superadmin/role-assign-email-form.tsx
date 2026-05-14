"use client";

import { useActionState, useEffect, useRef } from "react";
import { createStaffAccountAction, type RoleAssignByEmailActionState } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initialState: RoleAssignByEmailActionState = null;

const ROLE_OPTIONS = [
  { value: "admin", label: "Store admin" },
  { value: "staff", label: "Staff" },
  { value: "superadmin", label: "Superadmin" },
  { value: "customer", label: "Customer (shop only)" }
] as const;

export function RoleAssignEmailForm() {
  const [state, formAction, isPending] = useActionState(createStaffAccountAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="mt-6 max-w-xl space-y-5">
      {state?.message ? (
        <div
          role="status"
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <p>{state.message}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label htmlFor="invite-email" className="text-sm font-medium text-foreground">
          Email address
        </label>
        <Input
          id="invite-email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          required
          className="h-12 rounded-2xl"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="invite-name" className="text-sm font-medium text-foreground">
          Display name <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <Input id="invite-name" name="fullName" placeholder="e.g. Ben" className="h-12 rounded-2xl" />
      </div>

      <div className="space-y-2">
        <label htmlFor="invite-role" className="text-sm font-medium text-foreground">
          What they can access
        </label>
        <select
          id="invite-role"
          name="role"
          defaultValue="admin"
          className="h-12 w-full max-w-md rounded-2xl border border-border bg-card px-3 text-sm"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          New people get a setup email. If they’re already in the list, only their access is updated (no new invite).
        </p>
      </div>

      <Button type="submit" size="lg" className="min-w-[200px]" disabled={isPending}>
        {isPending ? "Working…" : "Send invite & assign"}
      </Button>
    </form>
  );
}
