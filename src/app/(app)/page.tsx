"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Order } from "@/lib/types";

interface Stats {
  monthlyOrders: number;
  monthlyRevenue: number;
  pendingDeliveries: number;
  totalOrders: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders/stats")
      .then((r) => r.json())
      .then(setStats);
    fetch("/api/orders?limit=10")
      .then((r) => r.json())
      .then((orders: Order[]) => setRecentOrders(orders.slice(0, 10)));
  }, []);

  const statCards = [
    {
      label: "Monthly Orders",
      value: stats?.monthlyOrders ?? "—",
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Monthly Revenue",
      value: stats ? `৳${stats.monthlyRevenue.toLocaleString()}` : "—",
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Pending Deliveries",
      value: stats?.pendingDeliveries ?? "—",
      color: "bg-orange-50 text-orange-700",
    },
    {
      label: "Total Orders",
      value: stats?.totalOrders ?? "—",
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/orders/new"
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          + New Order
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className={`${card.color} rounded-xl p-4 sm:p-6`}
          >
            <p className="text-sm font-medium opacity-80">{card.label}</p>
            <p className="text-2xl sm:text-3xl font-bold mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Orders
          </h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No orders yet.{" "}
            <Link href="/orders/new" className="text-primary hover:underline">
              Create your first order
            </Link>
          </div>
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
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 sm:px-6 py-3 text-sm font-medium text-gray-900">
                      <Link
                        href={`/orders/${order.id}`}
                        className="hover:text-primary"
                      >
                        #{order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900">
                      <Link
                        href={`/orders/${order.id}`}
                        className="hover:text-primary"
                      >
                        {order.customerName}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-600 hidden sm:table-cell">
                      {order.phone}
                    </td>
                    <td className="px-4 sm:px-6 py-3 text-sm text-gray-900">
                      ৳{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3">
                      <StatusBadge status={order.status} />
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
