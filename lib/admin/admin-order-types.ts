export type AdminOrderCustomer = {
  email: string;
  full_name: string | null;
  phone: string | null;
};

export type AdminOrderItem = {
  id: string;
  product_name: string | null;
  sku: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
};

export type AdminOrderPayment = {
  id: string;
  provider: string;
  provider_ref: string | null;
  amount: number;
  status: string;
  paid_at: string | null;
  created_at: string | null;
};

export type AdminOrderShipment = {
  id: string;
  carrier: string | null;
  tracking_number: string | null;
  status: string;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string | null;
};

export type AdminOrderRow = {
  id: string;
  order_number: string | null;
  status: string;
  subtotal_amount: number;
  discount_amount: number;
  shipping_amount: number;
  total_amount: number;
  currency: string;
  created_at: string | null;
  placed_at: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  notes: string | null;
  shipping_address: unknown;
  billing_address: unknown;
  customer_id: string | null;
  customers?: AdminOrderCustomer | AdminOrderCustomer[] | null;
  order_items?: AdminOrderItem[] | null;
  payments?: AdminOrderPayment[] | null;
  shipments?: AdminOrderShipment[] | null;
};
