export type AdminProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: string | null;
  status: string;
  regular_price: number;
  sale_price: number | null;
  stock_qty: number;
  tags: string[] | null;
  metadata: { colors?: string[] } | null;
  categories: { name: string | null } | { name: string | null }[] | null;
  product_images: { image_url: string | null }[] | null;
};

export function pickCategoryName(categories: AdminProductRow["categories"]) {
  const cat = Array.isArray(categories) ? categories[0] : categories;
  return cat?.name || "Uncategorized";
}

export function getStockStatus(stockQty: number) {
  if (stockQty <= 0) {
    return {
      label: "Out of stock",
      className: "border-red-300 bg-red-50 text-red-700"
    };
  }
  if (stockQty <= 5) {
    return {
      label: "Low stock",
      className: "border-amber-300 bg-amber-50 text-amber-700"
    };
  }
  return {
    label: "In stock",
    className: "border-emerald-300 bg-emerald-50 text-emerald-700"
  };
}
