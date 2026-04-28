"use client";

import { useActionState } from "react";
import { createStaffAccountAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type RoleAssignByEmailActionState =
  | null
  | {
      ok: boolean;
      message: string;
    };

const initialState: RoleAssignByEmailActionState = null;

export function RoleAssignEmailForm() {
  const [state, formAction, isPending] = useActionState(createStaffAccountAction, initialState);

  return (
    <form action={formAction} className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      {state?.message ? (
        <p
          role="status"
          className={`w-full rounded-2xl border px-3 py-2 text-sm ${
            state.ok ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-red-300 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <Input name="email" type="email" placeholder="email@example.com" required className="min-w-[200px] flex-1" />
      <Input name="fullName" placeholder="Full name" className="min-w-[160px] flex-1" />
      <select name="role" className="h-11 rounded-2xl border border-border bg-card px-3 text-sm sm:w-40">
        <option value="customer">Customer</option>
        <option value="staff">Staff</option>
        <option value="admin">Store admin</option>
        <option value="superadmin">Superadmin</option>
      </select>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Assigning..." : "Assign role"}
      </Button>
    </form>
  );
}
