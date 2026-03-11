"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Order, OrderStatus } from "@/lib/types";
import { STATUS_LABELS, STATUS_FLOW } from "@/lib/constants";

function groupOrdersByImage(orders: Order[]) {
  const groups: { imageUrl: string | null; orders: Order[] }[] = [];
  const map = new Map<string, Order[]>();

  for (const order of orders) {
    const key = order.imageUrl || "__no_image__";
    if (!map.has(key)) {
      map.set(key, []);
    }
    map.get(key)!.push(order);
  }

  // Images with multiple orders first, then single orders, "no image" last
  const entries = Array.from(map.entries());
  entries.sort((a, b) => {
    if (a[0] === "__no_image__") return 1;
    if (b[0] === "__no_image__") return -1;
    return b[1].length - a[1].length;
  });

  for (const [key, groupOrders] of entries) {
    groups.push({
      imageUrl: key === "__no_image__" ? null : key,
      orders: groupOrders,
    });
  }

  return groups;
}

export default function OrderListPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeStatus, setActiveStatus] = useState<OrderStatus | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [groupByImage, setGroupByImage] = useState(false);

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

  const imageGroups = useMemo(
    () => (groupByImage ? groupOrdersByImage(orders) : []),
    [orders, groupByImage]
  );

  function renderOrderRow(order: Order) {
    return (
      <tr key={order.id} className="hover:bg-primary/[0.02] transition-colors">
        <td className="px-4 sm:px-6 py-3.5 text-sm font-medium">
          <Link
            href={`/orders/${order.id}`}
            className="text-primary hover:underline"
          >
            #{order.orderNumber}
          </Link>
        </td>
        <td className="px-4 sm:px-6 py-3.5 text-sm text-gray-700">
          {order.customerName}
        </td>
        <td className="px-4 sm:px-6 py-3.5 text-sm text-gray-400 hidden sm:table-cell">
          {order.phone}
        </td>
        <td className="px-4 sm:px-6 py-3.5 text-sm font-medium text-gray-900 hidden md:table-cell">
          ৳{order.totalPrice.toLocaleString()}
        </td>
        <td className="px-4 sm:px-6 py-3.5 text-sm font-medium text-gray-900 hidden md:table-cell">
          ৳{order.codAmount.toLocaleString()}
        </td>
        <td className="px-4 sm:px-6 py-3.5">
          <StatusBadge status={order.status} />
        </td>
        <td className="px-4 sm:px-6 py-3.5 text-sm text-gray-400 hidden lg:table-cell">
          {new Date(order.createdAt).toLocaleDateString()}
        </td>
      </tr>
    );
  }

  function renderTableHead() {
    return (
      <thead className="bg-gray-50/80">
        <tr>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            #
          </th>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Customer
          </th>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden sm:table-cell">
            Phone
          </th>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
            Total
          </th>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
            COD
          </th>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Status
          </th>
          <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">
            Date
          </th>
        </tr>
      </thead>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900">Orders</h1>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
        >
          + New Order
        </Link>
      </div>

      {/* Search + Group toggle */}
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full sm:w-80 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white transition-all"
        />
        <button
          onClick={() => setGroupByImage(!groupByImage)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            groupByImage
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-gray-500 border border-gray-200 hover:border-primary/20 hover:text-primary"
          }`}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
          Group by Image
        </button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStatus("ALL")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
            activeStatus === "ALL"
              ? "bg-primary text-white shadow-sm"
              : "bg-white text-gray-500 border border-gray-200 hover:border-primary/20 hover:text-primary"
          }`}
        >
          All
        </button>
        {STATUS_FLOW.map((status) => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeStatus === status
                ? "bg-primary text-white shadow-sm"
                : "bg-white text-gray-500 border border-gray-200 hover:border-primary/20 hover:text-primary"
            }`}
          >
            {STATUS_LABELS[status]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          Loading...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 shadow-sm">
          No orders found
        </div>
      ) : groupByImage ? (
        /* Grouped by image view */
        <div className="space-y-6">
          {imageGroups.map((group, gi) => (
            <div
              key={group.imageUrl || `no-image-${gi}`}
              className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm"
            >
              {/* Group header with thumbnail */}
              <div className="px-4 sm:px-6 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-3">
                {group.imageUrl ? (
                  <img
                    src={group.imageUrl}
                    alt="Dress"
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-gray-300">
                      <path d="M4 16L8.586 11.414a2 2 0 012.828 0L16 16M14 14l1.586-1.586a2 2 0 012.828 0L20 14M14 8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {group.imageUrl ? "Dress Design" : "No Image"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {group.orders.length} order{group.orders.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  {renderTableHead()}
                  <tbody className="divide-y divide-gray-100">
                    {group.orders.map(renderOrderRow)}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Normal table view */
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              {renderTableHead()}
              <tbody className="divide-y divide-gray-100">
                {orders.map(renderOrderRow)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
