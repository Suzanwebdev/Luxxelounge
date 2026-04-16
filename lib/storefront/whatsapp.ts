import type { Product } from "@/lib/storefront/mock-data";

const WHATSAPP_BASE = "https://wa.me";
const HIGH_TICKET_THRESHOLD = 5000;
const HIGH_TICKET_CATEGORIES = new Set(["Sofas", "Lounge Chairs", "Dining Set"]);

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
  source: "product-card" | "product-page";
};

export function buildWhatsAppProductHref({ product, source }: BuildWhatsAppHrefInput): string | null {
  const number = getWhatsAppNumber();
  if (!number) return null;

  const origin = getAppOrigin();
  const productUrl = origin ? `${origin}/product/${product.slug}` : `/product/${product.slug}`;
  const context = source === "product-page" ? "product page" : "product card";
  const text = [
    "Hi Luxxelounge,",
    `I am interested in the ${product.name} (${formatPriceGHS(product.price)}).`,
    `Category: ${product.category}.`,
    "Please help with available finishes, delivery timeline, and payment options.",
    `Product link: ${productUrl}`,
    `Source: ${context}`
  ].join(" ");

  return `${WHATSAPP_BASE}/${number}?text=${encodeURIComponent(text)}`;
}
