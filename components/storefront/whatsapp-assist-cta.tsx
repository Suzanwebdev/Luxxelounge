"use client";

import * as React from "react";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  WHATSAPP_INTENT_OPTIONS,
  buildWhatsAppProductHref,
  trackWhatsAppClick,
  type WhatsAppIntentId,
  type WhatsAppSource
} from "@/lib/storefront/whatsapp";
import type { Product } from "@/lib/storefront/mock-data";

type WhatsAppAssistCtaProps = {
  product: Product;
  source: WhatsAppSource;
  ctaLabel: string;
  helperText: string;
  className?: string;
};

export function WhatsAppAssistCta({ product, source, ctaLabel, helperText, className }: WhatsAppAssistCtaProps) {
  const [selected, setSelected] = React.useState<WhatsAppIntentId[]>([]);

  const href = React.useMemo(
    () => buildWhatsAppProductHref({ product, source, intents: selected }),
    [product, source, selected]
  );

  if (!href) return null;

  const toggleIntent = (intentId: WhatsAppIntentId) => {
    setSelected((prev) =>
      prev.includes(intentId) ? prev.filter((id) => id !== intentId) : [...prev, intentId]
    );
  };

  const onCtaClick = () => {
    trackWhatsAppClick({
      source,
      productId: product.id,
      productSlug: product.slug,
      category: product.category,
      price: product.price,
      intents: selected
    });
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap gap-1.5">
        {WHATSAPP_INTENT_OPTIONS.map((intent) => {
          const active = selected.includes(intent.id);
          return (
            <button
              key={intent.id}
              type="button"
              onClick={() => toggleIntent(intent.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[11px] transition-colors sm:text-xs",
                active
                  ? "border-[hsl(38,28%,48%)] bg-[hsl(38,35%,94%)] text-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent"
              )}
            >
              {intent.label}
            </button>
          );
        })}
      </div>

      <Button asChild variant="outline" className="w-full" onClick={onCtaClick}>
        <a href={href} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="mr-2 h-4 w-4" />
          {ctaLabel}
        </a>
      </Button>

      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}
