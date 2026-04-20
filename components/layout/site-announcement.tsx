import { getSiteAnnouncement } from "@/lib/storefront/queries";

export async function SiteAnnouncementBar() {
  const text = await getSiteAnnouncement();

  return (
    <div className="border-b border-border bg-accent/60 py-2 text-center text-xs tracking-wide text-muted-foreground">
      {text}
    </div>
  );
}
