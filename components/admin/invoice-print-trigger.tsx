"use client";

import { Button } from "@/components/ui/button";

export function InvoicePrintTrigger() {
  return (
    <Button type="button" size="sm" variant="outline" onClick={() => window.print()}>
      Print invoice
    </Button>
  );
}
