import { Suspense } from "react";
import { AuthExchangeClient } from "./auth-exchange-client";

export const dynamic = "force-dynamic";

export default function AuthExchangePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Opening secure link…</p>
        </div>
      }
    >
      <AuthExchangeClient />
    </Suspense>
  );
}
