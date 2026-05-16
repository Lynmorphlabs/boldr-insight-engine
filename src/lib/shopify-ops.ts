/* ============================================================================
 * SHOPIFY OPS — connector lane, demo-safe mock data layer.
 *
 * This is the "swap-in" point for the real Shopify Admin API. For v1 we
 * simulate the Admin API with seeded mock tables so the demo is stable.
 * When credentials are available, replace `getShopifyLookup` with real
 * fetches — the consuming UI stays unchanged.
 *
 * Tables (mock):
 *   - shopifyOrders    (order_id, customer_email, order_status, fulfillment, ...)
 *   - shopifyInventory (sku, product_name, variant_name, available_quantity, ...)
 *   - shopifyShippingOptions (rate card for express/standard)
 * ========================================================================== */

import type { Ticket } from "@/data";

export type ShopifyConnectionMode = "demo" | "live";
export const SHOPIFY_CONNECTION_MODE: ShopifyConnectionMode = "demo";

/* -------------------- ORDERS -------------------- */

export interface ShopifyOrder {
  order_id: string;
  customer_email: string;
  order_status: "open" | "cancelled" | "refunded" | "exchanged";
  fulfillment_status:
    | "unfulfilled"
    | "in_transit"
    | "out_for_delivery"
    | "delivered"
    | "returned"
    | "lost"
    | "cancelled";
  shipping_method: "Standard" | "Express" | "Tracked Standard";
  estimated_delivery: string; // ISO date
  tracking_url: string | null;
  created_at: string; // ISO date
  notes?: string;
}

export const shopifyOrders: ShopifyOrder[] = [
  // TKT-1002 — Luke Moore — express shipping pre-purchase (no order yet)
  {
    order_id: "BLD-52504",
    customer_email: "lukem@protonmail.com",
    order_status: "open",
    fulfillment_status: "unfulfilled",
    shipping_method: "Standard",
    estimated_delivery: "2025-12-08",
    tracking_url: null,
    created_at: "2025-11-29",
  },
  // TKT-1005 — Xin Joshi — UK customs query
  {
    order_id: "BLD-28131",
    customer_email: "xin_joshi@yahoo.com",
    order_status: "open",
    fulfillment_status: "in_transit",
    shipping_method: "Tracked Standard",
    estimated_delivery: "2025-12-19",
    tracking_url: "https://track.dhl.com/BLD-28131",
    created_at: "2025-12-08",
    notes: "UK destination — DDU; customer pays duty on arrival.",
  },
  // TKT-1007 — Luke Nair — discount code (no order yet, cart context)
  {
    order_id: "BLD-11504",
    customer_email: "luke_nair@icloud.com",
    order_status: "open",
    fulfillment_status: "unfulfilled",
    shipping_method: "Standard",
    estimated_delivery: "2025-12-24",
    tracking_url: null,
    created_at: "2025-12-14",
    notes: "Discount code BOLDR10 expired 2025-11-30.",
  },
  // TKT-1009 — Vikram — Where is my order
  {
    order_id: "BLD-76540",
    customer_email: "vikram_miller@protonmail.com",
    order_status: "open",
    fulfillment_status: "in_transit",
    shipping_method: "Tracked Standard",
    estimated_delivery: "2025-12-27",
    tracking_url: "https://track.singpost.com/BLD-76540",
    created_at: "2025-12-14",
    notes: "Held in transit at SG hub since 2025-12-20.",
  },
  // TKT-1029 — Hui Joshi — wrong item received
  {
    order_id: "BLD-36772",
    customer_email: "hui_joshi@hotmail.com",
    order_status: "exchanged",
    fulfillment_status: "delivered",
    shipping_method: "Tracked Standard",
    estimated_delivery: "2026-02-01",
    tracking_url: "https://track.singpost.com/BLD-36772",
    created_at: "2026-01-22",
    notes: "Picked Journey 38mm Black, customer wanted Olive. Exchange ticket open.",
  },
  // TKT-1040 — Evelyn — order not received / presumed lost
  {
    order_id: "BLD-13248",
    customer_email: "evelynm@outlook.com",
    order_status: "open",
    fulfillment_status: "lost",
    shipping_method: "Tracked Standard",
    estimated_delivery: "2026-01-30",
    tracking_url: "https://track.singpost.com/BLD-13248",
    created_at: "2026-01-18",
    notes: "Last scan 2026-01-24 — no movement for 14 days. Carrier marked unrecoverable.",
  },
  // TKT-1043 — Mei — refund status
  {
    order_id: "BLD-56025",
    customer_email: "mei.lim@hotmail.com",
    order_status: "refunded",
    fulfillment_status: "returned",
    shipping_method: "Standard",
    estimated_delivery: "2026-02-15",
    tracking_url: null,
    created_at: "2026-02-01",
    notes: "Refund issued 2026-02-22, SGD 395 to original payment method. 5-7 business days to appear.",
  },
  // TKT-1057 — Kai — change delivery address
  {
    order_id: "BLD-68446",
    customer_email: "kai74@icloud.com",
    order_status: "open",
    fulfillment_status: "unfulfilled",
    shipping_method: "Standard",
    estimated_delivery: "2026-03-23",
    tracking_url: null,
    created_at: "2026-03-16",
    notes: "Not yet picked — address change still possible before 2026-03-18.",
  },
  // TKT-1056 — Lucas — tracking number not updating
  {
    order_id: "BLD-27477",
    customer_email: "lucas.mehta@outlook.com",
    order_status: "open",
    fulfillment_status: "in_transit",
    shipping_method: "Tracked Standard",
    estimated_delivery: "2026-05-12",
    tracking_url: "https://track.singpost.com/BLD-27477",
    created_at: "2026-05-04",
    notes: "Carrier scan delayed — manifest accepted, awaiting linehaul scan.",
  },
  // TKT-1055 — Scarlett — cancel order before shipping
  {
    order_id: "BLD-65724",
    customer_email: "scarlett.taylor@gmail.com",
    order_status: "open",
    fulfillment_status: "unfulfilled",
    shipping_method: "Standard",
    estimated_delivery: "2026-05-19",
    tracking_url: null,
    created_at: "2026-05-12",
    notes: "Eligible to cancel — no fulfilment started yet.",
  },
];

/* -------------------- INVENTORY -------------------- */

export interface ShopifyInventoryRow {
  sku: string;
  product_name: string;
  variant_name: string;
  available_quantity: number;
  location: "SG Warehouse" | "UK 3PL" | "US 3PL";
  low_stock_threshold: number;
  updated_at: string;
}

export const shopifyInventory: ShopifyInventoryRow[] = [
  { sku: "BLD-EXP-TI-40", product_name: "Expedition Titanium", variant_name: "40mm · Brushed", available_quantity: 142, location: "SG Warehouse", low_stock_threshold: 25, updated_at: "2026-05-15" },
  { sku: "BLD-EXP-TI-40", product_name: "Expedition Titanium", variant_name: "40mm · Brushed", available_quantity: 38, location: "UK 3PL", low_stock_threshold: 15, updated_at: "2026-05-15" },
  { sku: "BLD-JRN-TI-38", product_name: "Journey Titanium", variant_name: "38mm · Brushed", available_quantity: 4, location: "SG Warehouse", low_stock_threshold: 20, updated_at: "2026-05-15" },
  { sku: "BLD-JRN-TI-38", product_name: "Journey Titanium", variant_name: "38mm · Brushed", available_quantity: 0, location: "UK 3PL", low_stock_threshold: 15, updated_at: "2026-05-15" },
  { sku: "BLD-EXP-TI-40-LE", product_name: "Expedition Titanium — Ember LE", variant_name: "40mm · PVD Bronze", available_quantity: 0, location: "SG Warehouse", low_stock_threshold: 5, updated_at: "2026-05-15" },
];

/* -------------------- SHIPPING -------------------- */

export interface ShopifyShippingOption {
  method: "Standard" | "Express" | "Tracked Standard";
  destination: "SG" | "ROW";
  price_sgd: number;
  eta_days: string;
  cutoff: string;
}

export const shopifyShippingOptions: ShopifyShippingOption[] = [
  { method: "Standard",         destination: "SG",  price_sgd: 0,  eta_days: "2-3 business days",  cutoff: "Order by 3pm SGT" },
  { method: "Express",          destination: "SG",  price_sgd: 18, eta_days: "Next business day",  cutoff: "Order by 1pm SGT" },
  { method: "Tracked Standard", destination: "ROW", price_sgd: 25, eta_days: "7-12 business days", cutoff: "Order by 3pm SGT" },
  { method: "Express",          destination: "ROW", price_sgd: 65, eta_days: "3-5 business days",  cutoff: "Order by 1pm SGT" },
];

/* -------------------- CLASSIFIER + LOOKUP -------------------- */

export type ShopifyLookupKind =
  | "order_status"
  | "stock_availability"
  | "shipping_options"
  | "discount_code"
  | "refund_status"
  | "cancel_order"
  | "address_change"
  | "exchange";

export interface ShopifyLookup {
  kind: ShopifyLookupKind;
  label: string;
  lookupRequired: boolean;
  matched: boolean;                       // did mock tables have a hit
  order?: ShopifyOrder;
  inventory?: ShopifyInventoryRow[];
  shipping?: ShopifyShippingOption[];
  signal?: { tag: string; reason: string };  // marketing/product signal
  draft: string;                          // suggested reply (always human-approved)
  pending?: string;                       // reason it's pending (no real Shopify yet)
}

/** Does this ticket belong on the Shopify Ops lane? */
export function isShopifyOpsTicket(t: Ticket): boolean {
  return t.lane === "order_status";
}

function classifyKind(t: Ticket): ShopifyLookupKind {
  const s = `${t.subject} ${t.body}`.toLowerCase();
  if (/cancel/.test(s)) return "cancel_order";
  if (/refund/.test(s)) return "refund_status";
  if (/address|delivery address/.test(s)) return "address_change";
  if (/wrong item|exchange/.test(s)) return "exchange";
  if (/discount|promo|code/.test(s)) return "discount_code";
  if (/express|urgent|birthday|shipping option|how much.*shipping/.test(s)) return "shipping_options";
  if (/in stock|availability|sold out|restock|waitlist/.test(s)) return "stock_availability";
  return "order_status";
}

const KIND_LABEL: Record<ShopifyLookupKind, string> = {
  order_status: "Order status",
  stock_availability: "Stock availability",
  shipping_options: "Shipping options",
  discount_code: "Discount code",
  refund_status: "Refund status",
  cancel_order: "Cancel order",
  address_change: "Address change",
  exchange: "Exchange / wrong item",
};

function firstName(t: Ticket) {
  return t.customer.split(" ")[0] || "there";
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function getShopifyLookup(t: Ticket): ShopifyLookup {
  const kind = classifyKind(t);
  const label = KIND_LABEL[kind];
  const order = t.orderId ? shopifyOrders.find((o) => o.order_id === t.orderId) : undefined;
  const fn = firstName(t);

  // --- STOCK / AVAILABILITY -----------------------------------------------
  if (kind === "stock_availability") {
    // Demo-safe: surface all current inventory rows; let CS pick the variant.
    const lowSkus = shopifyInventory.filter((i) => i.available_quantity <= i.low_stock_threshold);
    return {
      kind, label, lookupRequired: true, matched: shopifyInventory.length > 0,
      inventory: shopifyInventory,
      signal: lowSkus.length > 0
        ? { tag: "stock-demand", reason: `${lowSkus.length} variant(s) at or below low-stock threshold` }
        : undefined,
      draft:
        `Hi ${fn},\n\nThanks for asking! Live stock check from our warehouse:\n` +
        shopifyInventory
          .map((i) => `• ${i.product_name} (${i.variant_name}) — ${i.available_quantity} at ${i.location}${i.available_quantity <= i.low_stock_threshold ? " (low stock)" : ""}`)
          .join("\n") +
        `\n\nIf you'd like me to reserve a piece while you decide, just say the word.\n\n— Boldr Customer Care`,
    };
  }

  // --- SHIPPING OPTIONS ---------------------------------------------------
  if (kind === "shipping_options") {
    const isUrgent = /urgent|birthday|tomorrow|asap/.test(t.body.toLowerCase());
    return {
      kind, label, lookupRequired: true, matched: true,
      shipping: shopifyShippingOptions,
      signal: isUrgent
        ? { tag: "gifter-express-demand", reason: "Urgent gift trigger — Gifter persona" }
        : undefined,
      pending: SHOPIFY_CONNECTION_MODE === "demo"
        ? "Live cut-off + courier capacity not connected — using rate card."
        : undefined,
      draft:
        `Hi ${fn},\n\nYes — for SG addresses Express is SGD 18 and arrives next business day (order by 1pm SGT). For international Express it's SGD 65, 3-5 business days. Standard SG is free, 2-3 business days. If it's a birthday gift, I'd recommend SG Express with order placed before today's cut-off.\n\nLet me know which works and I'll keep an eye on the order.\n\n— Boldr Customer Care`,
    };
  }

  // --- DISCOUNT CODE ------------------------------------------------------
  if (kind === "discount_code") {
    return {
      kind, label, lookupRequired: true, matched: !!order,
      order,
      draft: order
        ? `Hi ${fn},\n\nI checked the code on cart ${order.order_id}. ${order.notes ?? "The code is not currently active for this cart."} I've issued a one-time replacement code BOLDR10-WIN that's valid for 72 hours — apply at checkout.\n\n— Boldr Customer Care`
        : `Hi ${fn},\n\nI couldn't find a cart on that account. Could you share the email used at checkout so I can pull it up?\n\n— Boldr Customer Care`,
    };
  }

  // --- ORDER STATUS (Where is my order, tracking) -------------------------
  if (kind === "order_status") {
    return {
      kind, label, lookupRequired: true, matched: !!order,
      order,
      signal: order?.fulfillment_status === "lost"
        ? { tag: "carrier-issue", reason: "Lost-in-transit incident — flag carrier reliability" }
        : undefined,
      draft: order
        ? `Hi ${fn},\n\nI looked up ${order.order_id}. Status: ${order.fulfillment_status.replace(/_/g, " ")} via ${order.shipping_method}. ETA ${fmtDate(order.estimated_delivery)}. ${order.tracking_url ? `Tracking: ${order.tracking_url}` : ""}${order.notes ? `\n\nNote: ${order.notes}` : ""}\n\nLet me know if anything looks off.\n\n— Boldr Customer Care`
        : `Hi ${fn},\n\nI couldn't locate that order under the email on file. Could you double-check the order number, or share the email used at checkout?\n\n— Boldr Customer Care`,
    };
  }

  // --- REFUND -------------------------------------------------------------
  if (kind === "refund_status") {
    return {
      kind, label, lookupRequired: true, matched: !!order,
      order,
      draft: order
        ? `Hi ${fn},\n\nRefund for ${order.order_id} is ${order.order_status === "refunded" ? "complete" : "in progress"}. ${order.notes ?? ""}\n\n— Boldr Customer Care`
        : `Hi ${fn},\n\nI couldn't find a refund record for that order. Could you confirm the order number?\n\n— Boldr Customer Care`,
    };
  }

  // --- CANCEL -------------------------------------------------------------
  if (kind === "cancel_order") {
    const canCancel = order?.fulfillment_status === "unfulfilled";
    return {
      kind, label, lookupRequired: true, matched: !!order,
      order,
      draft: order
        ? canCancel
          ? `Hi ${fn},\n\nGood news — ${order.order_id} hasn't shipped yet, so we can still cancel. Please confirm and I'll process it; the refund will appear in 5-7 business days.\n\n— Boldr Customer Care`
          : `Hi ${fn},\n\n${order.order_id} has already started fulfilment (${order.fulfillment_status.replace(/_/g, " ")}), so we can't cancel — but we can process a return once it arrives. Want me to start that?\n\n— Boldr Customer Care`
        : `Hi ${fn},\n\nI couldn't find that order. Could you share the order number or the email used at checkout?\n\n— Boldr Customer Care`,
    };
  }

  // --- ADDRESS CHANGE ----------------------------------------------------
  if (kind === "address_change") {
    const canChange = order?.fulfillment_status === "unfulfilled";
    return {
      kind, label, lookupRequired: true, matched: !!order,
      order,
      draft: order
        ? canChange
          ? `Hi ${fn},\n\n${order.order_id} hasn't been picked yet, so I can update the address. Please reply with the new full address and I'll confirm once it's changed.\n\n— Boldr Customer Care`
          : `Hi ${fn},\n\n${order.order_id} has already moved to ${order.fulfillment_status.replace(/_/g, " ")}, so I can't change the address at the warehouse. I can request a carrier redirect — share the new address and I'll try.\n\n— Boldr Customer Care`
        : `Hi ${fn},\n\nI couldn't find that order. Could you share the order number?\n\n— Boldr Customer Care`,
    };
  }

  // --- EXCHANGE / WRONG ITEM ----------------------------------------------
  if (kind === "exchange") {
    return {
      kind, label, lookupRequired: true, matched: !!order,
      order,
      signal: { tag: "pick-accuracy", reason: "Wrong-item picked — flag fulfilment QA" },
      draft: order
        ? `Hi ${fn},\n\nReally sorry about that — I see ${order.order_id} on the system. ${order.notes ?? ""} I'll send a prepaid return label and ship the correct item today on Express at no charge.\n\n— Boldr Customer Care`
        : `Hi ${fn},\n\nVery sorry about that. Could you share the order number so I can fix this and arrange a free exchange?\n\n— Boldr Customer Care`,
    };
  }

  // fallback
  return {
    kind, label, lookupRequired: true, matched: false,
    draft: `Hi ${fn},\n\nLooking into this and will get back to you shortly.\n\n— Boldr Customer Care`,
    pending: "No matching record in mock Shopify data.",
  };
}
