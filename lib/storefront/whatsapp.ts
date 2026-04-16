import type { Product } from "@/lib/storefront/mock-data";

const WHATSAPP_BASE = "https://wa.me";
const HIGH_TICKET_THRESHOLD = 5000;
const HIGH_TICKET_CATEGORIES = new Set(["Sofas", "Lounge Chairs", "Dining Set"]);
export const WHATSAPP_INTENT_OPTIONS = [
  { id: "availability", label: "Availability" },
  { id: "custom_size", label: "Custom size" },
  { id: "delivery_timeline", label: "Delivery timeline" },
  { id: "payment_plan", label: "Payment plan" }
] as const;
export type WhatsAppIntentId = (typeof WHATSAPP_INTENT_OPTIONS)[number]["id"];
export type WhatsAppSource = "product-card" | "product-page" | "cart";

function sanitizePhoneNumber(input: string): string {
  return input.replace(/[^\d]/g, "");
}

function getAppOrigin(): string {
  const envOrigin = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_BASE_URL || "";
  if (envOrigin) return envOrigin.replace(/\/+$/, "");
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
}

function formatPriceGHS(amount: number): string {
  return `GH₵${amount.toLocaleString("en-GH")}`;
}

export function isHighTicketProduct(product: Product): boolean {
  return product.price >= HIGH_TICKET_THRESHOLD || HIGH_TICKET_CATEGORIES.has(product.category);
}

export function getWhatsAppNumber(): string {
  return sanitizePhoneNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "");
}

type BuildWhatsAppHrefInput = {
  product: Product;
  source: WhatsAppSource;
  intents?: readonly WhatsAppIntentId[];
};

export function buildWhatsAppProductHref({ product, source, intents = [] }: BuildWhatsAppHrefInput): string | null {
  const number = getWhatsAppNumber();
  if (!number) return null;

  const origin = getAppOrigin();
  const productUrl = origin ? `${origin}/product/${product.slug}` : `/product/${product.slug}`;
  const context =
    source === "product-page" ? "product page" : source === "product-card" ? "product card" : "cart";
  const intentLabels = intents
    .map((id) => WHATSAPP_INTENT_OPTIONS.find((item) => item.id === id)?.label)
    .filter(Boolean);
  const text = [
    "Hi Luxxelounge,",
    `I am interested in the ${product.name} (${formatPriceGHS(product.price)}).`,
    `Category: ${product.category}.`,
    intentLabels.length > 0
      ? `I need help with: ${intentLabels.join(", ")}.`
      : "Please help with available finishes, delivery timeline, and payment options.",
    `Product link: ${productUrl}`,
    `Source: ${context}`
  ].join(" ");

  return `${WHATSAPP_BASE}/${number}?text=${encodeURIComponent(text)}`;
}

type WhatsAppTrackPayload = {
  source: WhatsAppSource;
  productId: string;
  productSlug: string;
  category: string;
  price: number;
  intents: readonly WhatsAppIntentId[];
};

export function trackWhatsAppClick(payload: WhatsAppTrackPayload): void {
  if (typeof window === "undefined") return;

  const eventPayload = {
    event: "whatsapp_click",
    source: payload.source,
    product_id: payload.productId,
    product_slug: payload.productSlug,
    category: payload.category,
    price: payload.price,
    intents: payload.intents.join(",")
  };

  const windowAny = window as Window & {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  };

  windowAny.dataLayer?.push(eventPayload);
  windowAny.gtag?.("event", "whatsapp_click", eventPayload);
  window.dispatchEvent(new CustomEvent("luxxelounge:whatsapp_click", { detail: eventPayload }));
}
