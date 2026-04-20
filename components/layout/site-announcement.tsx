import { Suspense } from "react";
import { getSiteAnnouncement, HOME_CONTENT_DEFAULTS } from "@/lib/storefront/queries";

function AnnouncementFallback() {
  return (
    <div className="border-b border-border bg-accent/60 py-2 text-center text-xs tracking-wide text-muted-foreground">
      {HOME_CONTENT_DEFAULTS.announcement}
    </div>
  );
}

async function SiteAnnouncementBarInner() {
  const text = await getSiteAnnouncement();

  return (
    <div className="border-b border-border bg-accent/60 py-2 text-center text-xs tracking-wide text-muted-foreground">
      {text}
    </div>
  );
}

/** Root layout must stay resilient: Suspense + fetch-based announcement (no cookies in RSC). */
export function SiteAnnouncementBar() {
  return (
    <Suspense fallback={<AnnouncementFallback />}>
      <SiteAnnouncementBarInner />
    </Suspense>
  );
}
