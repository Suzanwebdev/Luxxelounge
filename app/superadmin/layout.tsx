import type { ReactNode } from "react";

/** Auth + shell live in `(dashboard)/layout.tsx`; `/superadmin/login` stays public. */
export default function SuperadminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
