import type { ReactNode } from "react";

type LinkedCustomer = { email: string; full_name: string | null; phone: string | null };

export type AdminOrderRowForCustomerBlock = {
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  shipping_address: unknown;
  billing_address: unknown;
  customers?: LinkedCustomer | LinkedCustomer[] | null;
};

function normalizeLinkedCustomer(raw: AdminOrderRowForCustomerBlock["customers"]): LinkedCustomer | null {
  if (!raw) return null;
  if (Array.isArray(raw)) return raw[0] ?? null;
  return raw;
}

function addressLines(addr: unknown): string[] {
  if (!addr || typeof addr !== "object" || Array.isArray(addr)) return [];
  const o = addr as Record<string, unknown>;
  const lines: string[] = [];
  const name = o.full_name ?? o.contact_name;
  if (typeof name === "string" && name.trim()) lines.push(name.trim());
  const line1 = o.line1 ?? o.address_line1;
  if (typeof line1 === "string" && line1.trim()) lines.push(line1.trim());
  const city = typeof o.city === "string" ? o.city.trim() : "";
  const region = typeof (o.region ?? o.state) === "string" ? String(o.region ?? o.state).trim() : "";
  const country = typeof o.country === "string" ? o.country.trim() : "";
  const loc = [city, region, country].filter(Boolean).join(", ");
  if (loc) lines.push(loc);
  const phone = o.phone ?? o.phone_number;
  if (typeof phone === "string" && phone.trim()) lines.push(`Phone: ${phone.trim()}`);
  return lines;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-xs text-foreground">{children}</div>
    </div>
  );
}

export function OrderCustomerBlock({ order }: { order: AdminOrderRowForCustomerBlock }) {
  const linked = normalizeLinkedCustomer(order.customers);
  const shipLines = addressLines(order.shipping_address);
  const billLines = addressLines(order.billing_address);
  const showBilling = billLines.length > 0 && billLines.join("|") !== shipLines.join("|");

  const guestEmail = order.guest_email?.trim() || null;
  const guestPhone = order.guest_phone?.trim() || null;
  const notes = order.notes?.trim() || null;

  return (
    <div className="max-w-[22rem] space-y-2.5">
      {linked ? (
        <Row label="Registered customer">
          <div className="space-y-0.5">
            {linked.full_name ? <p>{linked.full_name}</p> : null}
            <p className="break-all text-muted-foreground">{linked.email}</p>
            {linked.phone ? <p>{linked.phone}</p> : null}
          </div>
        </Row>
      ) : null}

      {!linked && (guestEmail || guestPhone) ? (
        <Row label="Guest contact">
          <div className="space-y-0.5">
            {guestEmail ? <p className="break-all">{guestEmail}</p> : null}
            {guestPhone ? <p>{guestPhone}</p> : null}
          </div>
        </Row>
      ) : null}

      {linked && guestEmail && guestEmail.toLowerCase() !== linked.email.toLowerCase() ? (
        <Row label="Guest email on order">
          <p className="break-all text-muted-foreground">{guestEmail}</p>
        </Row>
      ) : null}

      {linked && guestPhone ? (
        <Row label="Guest phone on order">
          <p>{guestPhone}</p>
        </Row>
      ) : null}

      {shipLines.length > 0 ? (
        <Row label="Shipping">
          <ul className="list-inside list-disc space-y-0.5">
            {shipLines.map((line, i) => (
              <li key={`s-${i}`} className="marker:text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </Row>
      ) : null}

      {showBilling ? (
        <Row label="Billing">
          <ul className="list-inside list-disc space-y-0.5">
            {billLines.map((line, i) => (
              <li key={`b-${i}`} className="marker:text-muted-foreground">
                {line}
              </li>
            ))}
          </ul>
        </Row>
      ) : null}

      {notes ? (
        <Row label="Notes">
          <p className="whitespace-pre-wrap text-muted-foreground">{notes}</p>
        </Row>
      ) : null}

      {!linked && !guestEmail && !guestPhone && shipLines.length === 0 && !notes ? (
        <p className="text-xs text-muted-foreground">No contact or address captured for this order.</p>
      ) : null}
    </div>
  );
}
