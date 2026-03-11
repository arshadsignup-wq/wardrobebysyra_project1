import type { OrderStatus, OrderSource, DeliveryZone } from "@/lib/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW_ORDER: "New Order",
  SENT_TO_TAILOR: "Sent to Tailor",
  READY: "Ready",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW_ORDER: "bg-sky-50 text-sky-700",
  SENT_TO_TAILOR: "bg-violet-50 text-violet-700",
  READY: "bg-emerald-50 text-emerald-700",
  DISPATCHED: "bg-amber-50 text-amber-700",
  DELIVERED: "bg-teal-50 text-teal-700",
};

export const STATUS_FLOW: OrderStatus[] = [
  "NEW_ORDER",
  "SENT_TO_TAILOR",
  "READY",
  "DISPATCHED",
  "DELIVERED",
];

export function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current);
  if (idx === -1 || idx === STATUS_FLOW.length - 1) return null;
  return STATUS_FLOW[idx + 1];
}

export const SOURCE_LABELS: Record<OrderSource, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  WHATSAPP: "WhatsApp",
  WEBSITE: "Website",
};

export const DELIVERY_CHARGES: Record<DeliveryZone, number> = {
  INSIDE_DHAKA: 80,
  OUTSIDE_DHAKA: 130,
};

export const DELIVERY_ZONE_LABELS: Record<DeliveryZone, string> = {
  INSIDE_DHAKA: "Inside Dhaka (৳80)",
  OUTSIDE_DHAKA: "Outside Dhaka (৳130)",
};
