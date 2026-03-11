"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_FLOW } from "@/lib/constants";

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeStatus !== "ALL") params.set("status", activeStatus);
    if (search) params.set("search", search);

    const res = await fetch(`/api/orders?${params}`);
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  }, [activeStatus, search]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Debounced search
  const [searchInput, setSearchInput] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          + New Order
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
        />
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStatus("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            activeStatus === "ALL"
              ? "bg-primary text-white"
              : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {STATUS_FLOW.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeStatus === status
                ? "bg-primary text-white"
                : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    #
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Customer
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">
                    Phone
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    Total
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                    COD
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-primary hover:underline"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900">
                      {order.customerName}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {order.phone}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 hidden md:table-cell">
                      ৳{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900 hidden md:table-cell">
                      ৳{order.codAmount.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
