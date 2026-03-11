"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_FLOW, STATUS_COLORS } from "@/lib/constants";
import { toast } from "@/components/Toast";

export default function KanbanBoardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const grouped: Record<OrderStatus, Order[]> = {} as Record<
    OrderStatus,
    Order[]
  >;
  for (const s of STATUS_FLOW) {
    grouped[s] = [];
  }
  for (const order of orders) {
    if (grouped[order.status]) {
      grouped[order.status].push(order);
    }
  }

  const handleDragEnd = useCallback(
    async (result: DropResult) => {
      const { draggableId, destination } = result;
      if (!destination) return;

      const newStatus = destination.droppableId as OrderStatus;
      const order = orders.find((o) => o.id === draggableId);
      if (!order || order.status === newStatus) return;

      // Optimistic update
      const prevOrders = [...orders];
      setOrders((prev) =>
        prev.map((o) => (o.id === draggableId ? { ...o, status: newStatus } : o))
      );

      try {
        const res = await fetch(`/api/orders/${draggableId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!res.ok) throw new Error("Failed to update");

        toast(`Moved to ${STATUS_LABELS[newStatus]}`);
      } catch {
        // Revert on failure
        setOrders(prevOrders);
        toast("Failed to update status", "error");
      }
    },
    [orders]
  );

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-400">Loading board...</div>
    );
  }

  return (
    <div className="animate-fade-in">
      <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">Order Board</h1>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_FLOW.map((status) => (
            <Droppable key={status} droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-shrink-0 w-72 rounded-xl transition-all duration-200 ${
                    snapshot.isDraggingOver
                      ? "bg-primary/5 ring-2 ring-primary/20"
                      : "bg-gray-50"
                  }`}
                >
                  <div className="p-3 border-b border-gray-200/60">
                    <div className="flex items-center justify-between">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}
                      >
                        {STATUS_LABELS[status]}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">
                        {grouped[status].length}
                      </span>
                    </div>
                  </div>
                  <div className="p-2 space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto min-h-[60px]">
                    {grouped[status].length === 0 && !snapshot.isDraggingOver ? (
                      <p className="text-center text-sm text-gray-300 py-4">
                        No orders
                      </p>
                    ) : (
                      grouped[status].map((order, index) => (
                        <Draggable
                          key={order.id}
                          draggableId={order.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`bg-white rounded-lg border border-gray-100 p-3 transition-all duration-200 ${
                                snapshot.isDragging
                                  ? "shadow-xl ring-2 ring-primary/20"
                                  : "hover:shadow-md hover:border-primary/10"
                              }`}
                            >
                              <Link
                                href={`/orders/${order.id}`}
                                className="block"
                                onClick={(e) => {
                                  if (snapshot.isDragging) e.preventDefault();
                                }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs font-semibold text-primary">
                                    #{order.orderNumber}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    {new Date(
                                      order.createdAt
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {order.customerName}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {order.phone}
                                </p>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                                  <span className="text-sm font-bold text-gray-900">
                                    ৳{order.totalPrice.toLocaleString()}
                                  </span>
                                  <span className="text-xs text-gray-400 font-medium">
                                    COD: ৳{order.codAmount.toLocaleString()}
                                  </span>
                                </div>
                              </Link>
                            </div>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
