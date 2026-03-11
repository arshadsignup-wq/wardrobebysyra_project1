import type { OrderStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/constants";

const DOT_COLORS: Record<OrderStatus, string> = {
  NEW_ORDER: "bg-sky-500",
  SENT_TO_TAILOR: "bg-violet-500",
  READY: "bg-emerald-500",
  DISPATCHED: "bg-amber-500",
  DELIVERED: "bg-teal-500",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${DOT_COLORS[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}
