"use client";

import { useActionState } from "react";
import {
  staffProfileRowManagementAction,
  type StaffRowActionState
} from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "admin", label: "Store admin" },
  { value: "staff", label: "Staff" },
  { value: "superadmin", label: "Superadmin" },
  { value: "customer", label: "Customer" }
];

export function ProfileRoleAssignForm({ profile }: { profile: ProfileRow }) {
  const roleValue = ROLE_OPTIONS.some((o) => o.value === profile.role) ? profile.role : "customer";
  const [state, formAction, pending] = useActionState(staffProfileRowManagementAction, null as StaffRowActionState);
  const isStaffish = roleValue !== "customer";

  return (
    <div className="flex max-w-md flex-col gap-2">
      <form action={formAction} className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <input type="hidden" name="intent" value="assign" />
        <input type="hidden" name="profileId" value={profile.id} />
        <label className="sr-only" htmlFor={`role-${profile.id}`}>
          Role for {profile.email}
        </label>
        <select
          id={`role-${profile.id}`}
          name="role"
          defaultValue={roleValue}
          className="h-10 min-w-[10.5rem] rounded-2xl border border-border bg-background px-3 text-sm"
        >
          {ROLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "…" : "Apply"}
        </Button>
      </form>

      {isStaffish ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <form action={formAction} className="inline">
            <input type="hidden" name="intent" value="resend" />
            <input type="hidden" name="profileId" value={profile.id} />
            <Button type="submit" variant="outline" size="sm" disabled={pending}>
              {pending ? "…" : "Resend setup email"}
            </Button>
          </form>
          <form
            action={formAction}
            className="inline"
            onSubmit={(e) => {
              if (
                !window.confirm(
                  `Remove admin access for ${profile.email}? They will become a customer (storefront only) and will be removed from admin allowlists.`
                )
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="intent" value="remove" />
            <input type="hidden" name="profileId" value={profile.id} />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={pending}
              className="border-red-200 text-red-700 hover:bg-red-50"
            >
              {pending ? "…" : "Remove admin access"}
            </Button>
          </form>
        </div>
      ) : null}

      {state?.message ? (
        <span className={`text-xs ${state.ok ? "text-emerald-700" : "text-red-600"}`} role="status">
          {state.message}
        </span>
      ) : null}
    </div>
  );
}
