import { Suspense } from "react";
import { AuthCallbackClient } from "./auth-callback-client";

export const dynamic = "force-dynamic";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Opening secure link…</p>
        </div>
      }
    >
      <AuthCallbackClient />
    </Suspense>
  );
}
