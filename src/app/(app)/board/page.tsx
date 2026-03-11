"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_FLOW, STATUS_COLORS } from "@/lib/constants";

export default function KanbanBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  const grouped: Record<OrderStatus, Order[]> = {} as Record<
    OrderStatus,
    Order[]
  >;
  for (const s of STATUS_FLOW) {
    grouped[s] = [];
  }
  for (const order of orders) {
    grouped[order.status]?.push(order);
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading board...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Board</h1>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_FLOW.map((status) => (
          <div
            key={status}
            className="flex-shrink-0 w-72 bg-gray-100 rounded-xl"
          >
            <div className="p-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status]}`}
                >
                  {STATUS_LABELS[status]}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {grouped[status].length}
                </span>
              </div>
            </div>
            <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto">
              {grouped[status].length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-4">
                  No orders
                </p>
              ) : (
                grouped[status].map((order) => (
                  <Link
                    key={order.id}
                    href={`/orders/${order.id}`}
                    className="block bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-primary">
                        #{order.orderNumber}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.phone}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-semibold text-gray-900">
                        ৳{order.totalPrice.toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        COD: ৳{order.codAmount.toLocaleString()}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
