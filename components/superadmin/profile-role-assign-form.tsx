import { assignProfileRoleAction } from "@/app/superadmin/actions";
import { Button } from "@/components/ui/button";

type ProfileRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
};

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "customer", label: "Customer" },
  { value: "staff", label: "Staff" },
  { value: "admin", label: "Store admin" },
  { value: "superadmin", label: "Superadmin" }
];

export function ProfileRoleAssignForm({ profile }: { profile: ProfileRow }) {
  const roleValue = ROLE_OPTIONS.some((o) => o.value === profile.role) ? profile.role : "customer";

  return (
    <form action={assignProfileRoleAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="profileId" value={profile.id} />
      <label className="sr-only" htmlFor={`role-${profile.id}`}>
        Role for {profile.email}
      </label>
      <select
        id={`role-${profile.id}`}
        name="role"
        defaultValue={roleValue}
        className="h-10 min-w-[11rem] rounded-2xl border border-border bg-background px-3 text-sm"
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline">
        Save role
      </Button>
    </form>
  );
}
