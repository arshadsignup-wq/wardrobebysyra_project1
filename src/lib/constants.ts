import type { OrderStatus } from "@/lib/types";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  NEW_ORDER: "New Order",
  ADVANCE_PAID: "Advance Paid",
  SENT_TO_TAILOR: "Sent to Tailor",
  READY: "Ready",
  DISPATCHED: "Dispatched",
  DELIVERED: "Delivered",
};

export const STATUS_COLORS: Record<OrderStatus, string> = {
  NEW_ORDER: "bg-blue-100 text-blue-800",
  ADVANCE_PAID: "bg-yellow-100 text-yellow-800",
  SENT_TO_TAILOR: "bg-purple-100 text-purple-800",
  READY: "bg-green-100 text-green-800",
  DISPATCHED: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-emerald-100 text-emerald-800",
};

export const STATUS_FLOW: OrderStatus[] = [
  "NEW_ORDER",
  "ADVANCE_PAID",
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
