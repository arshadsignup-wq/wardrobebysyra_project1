// Re-export types for use in client components
// The Prisma client.ts uses node:process which doesn't work in browser

export const OrderStatus = {
  NEW_ORDER: "NEW_ORDER",
  ADVANCE_PAID: "ADVANCE_PAID",
  SENT_TO_TAILOR: "SENT_TO_TAILOR",
  READY: "READY",
  DISPATCHED: "DISPATCHED",
  DELIVERED: "DELIVERED",
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  phone: string;
  address: string;
  imageUrl: string | null;
  sizeDetails: string | null;
  totalPrice: number;
  advanceAmount: number;
  codAmount: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
