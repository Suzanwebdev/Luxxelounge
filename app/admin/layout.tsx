import type { ReactNode } from "react";

/** Auth and shell live in `(dashboard)/layout.tsx`; `/admin/login` stays public under `/admin`. */
export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return children;
}
