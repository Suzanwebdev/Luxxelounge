export const EXPRESS_CHECKOUT_STORAGE_KEY = "luxxelounge_express_checkout_v1";

export type ExpressCheckoutPayload = {
  items: { slug: string; quantity: number; color?: string }[];
};

export function writeExpressCheckout(payload: ExpressCheckoutPayload) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(EXPRESS_CHECKOUT_STORAGE_KEY, JSON.stringify(payload));
}

export function readExpressCheckout(): ExpressCheckoutPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(EXPRESS_CHECKOUT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExpressCheckoutPayload;
    if (!parsed?.items || !Array.isArray(parsed.items) || parsed.items.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearExpressCheckout() {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(EXPRESS_CHECKOUT_STORAGE_KEY);
}
