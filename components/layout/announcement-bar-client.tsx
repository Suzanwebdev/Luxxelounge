"use client";

import * as React from "react";

const DEFAULT_TEXT = "Fast delivery • Authentic products • Easy returns";

/**
 * Client-side announcement avoids async Server Components + Suspense in the root layout,
 * which can interact badly with streaming/CSS ordering in production.
 */
export function AnnouncementBarClient() {
  const [text, setText] = React.useState(DEFAULT_TEXT);

  React.useEffect(() => {
    let cancelled = false;
    fetch("/api/storefront/announcement", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { text?: string } | null) => {
        if (!cancelled && data && typeof data.text === "string" && data.text.trim()) {
          setText(data.text.trim());
        }
      })
      .catch(() => {
        /* keep default */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="border-b border-border bg-accent/60 py-2 text-center text-xs tracking-wide text-muted-foreground">
      {text}
    </div>
  );
}
