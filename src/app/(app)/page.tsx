"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Order } from "@/lib/types";

interface DailyData {
  day: number;
  orders: number;
  revenue: number;
}

interface Stats {
  monthlyOrders: number;
  monthlyRevenue: number;
  prevMonthOrders: number;
  prevMonthRevenue: number;
  pendingDeliveries: number;
  totalOrders: number;
  dailyData: DailyData[];
}

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatMonth(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function getMonthLabel(year: number, month: number) {
  return new Date(year, month).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
}

function GrowthBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
        <span>&#9650;</span> New
      </span>
    );
  }
  const pct = Math.round(((current - previous) / previous) * 100);
  if (pct === 0) return null;
  const isUp = pct > 0;
  return (
    <span
      className={`text-xs font-semibold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 ${
        isUp ? "text-emerald-600 bg-emerald-50" : "text-red-500 bg-red-50"
      }`}
    >
      <span>{isUp ? "\u25B2" : "\u25BC"}</span>
      {Math.abs(pct)}%
    </span>
  );
}

function OrderChart({ dailyData, month, year }: { dailyData: DailyData[]; month: number; year: number }) {
  const maxOrders = Math.max(...dailyData.map((d) => d.orders), 1);
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const today = now.getDate();
  const [hovered, setHovered] = useState<DailyData | null>(null);

  const totalDays = dailyData.length;
  const labelStep = Math.ceil(totalDays / 7);

  return (
    <div>
      {/* Hover info bar */}
      <div className="h-5 mb-3">
        {hovered ? (
          <p className="text-xs text-gray-500 animate-fade-in">
            <span className="font-semibold text-gray-700">
              {hovered.day} {MONTH_SHORT[month]}
            </span>
            {" \u00b7 "}
            {hovered.orders} order{hovered.orders !== 1 ? "s" : ""}
            {" \u00b7 \u09F3"}
            {hovered.revenue.toLocaleString()}
          </p>
        ) : (
          <p className="text-xs text-gray-300">Hover to see daily details</p>
        )}
      </div>

      {/* Y-axis gridlines + bars */}
      <div className="relative">
        {/* Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border-b border-dashed border-gray-100 w-full" />
          ))}
        </div>

        {/* Bars */}
        <div className="relative flex items-end gap-[3px] h-44">
          {dailyData.map((d) => {
            const heightPct = (d.orders / maxOrders) * 100;
            const isToday = isCurrentMonth && d.day === today;
            return (
              <div
                key={d.day}
                className="flex-1 relative cursor-pointer"
                onMouseEnter={() => setHovered(d)}
                onMouseLeave={() => setHovered(null)}
              >
                <div
                  className={`w-full rounded-t-sm transition-all duration-150 ${
                    isToday
                      ? "bg-accent hover:bg-accent-dark"
                      : d.orders > 0
                      ? "bg-primary/50 hover:bg-primary"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                  style={{
                    height: d.orders > 0 ? `${Math.max(heightPct, 5)}%` : "3px",
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex mt-2">
        {dailyData.map((d, i) => (
          <div key={d.day} className="flex-1 text-center">
            {(i % labelStep === 0 || i === totalDays - 1) ? (
              <span className="text-[10px] text-gray-400 font-medium">{d.day}</span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  const fetchStats = useCallback(() => {
    const param = formatMonth(year, month);
    fetch(`/api/orders/stats?month=${param}`)
      .then((r) => r.json())
      .then(setStats);
  }, [year, month]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetch("/api/orders?limit=10")
      .then((r) => r.json())
      .then((orders: Order[]) => setRecentOrders(orders.slice(0, 10)));
  }, []);

  function prevMonth() {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-gray-900">
          Dashboard
        </h1>
        <div className="flex items-center gap-3">
          {/* Month picker */}
          <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 px-1 py-1 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-md hover:bg-gray-50 transition-colors text-gray-400 hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span className="text-sm font-semibold text-gray-700 min-w-[130px] text-center">
              {getMonthLabel(year, month)}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-md hover:bg-gray-50 transition-colors text-gray-400 hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
          <Link
            href="/orders/new"
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors shadow-sm"
          >
            + New Order
          </Link>
        </div>
      </div>

      {/* Main stats area: Chart (left) + Stats Grid (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        {/* Chart Card */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm animate-fade-up stagger-1">
          <div className="flex items-center justify-between mb-1">
            <h2 className="font-display text-base font-semibold text-gray-900">
              Orders This Month
            </h2>
            {stats && (
              <span className="text-xs text-gray-400 font-medium">
                {stats.monthlyOrders} total
              </span>
            )}
          </div>
          {stats?.dailyData ? (
            <OrderChart dailyData={stats.dailyData} month={month} year={year} />
          ) : (
            <div className="h-52 flex items-center justify-center text-gray-300 text-sm">
              Loading chart...
            </div>
          )}
        </div>

        {/* Stats Grid - 2x2 */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Monthly Orders */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col animate-fade-up stagger-1">
            <div className="p-2 rounded-lg bg-sky-50 text-sky-600 w-fit mb-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 12h6M9 16h4" />
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-3">Orders</p>
            <div className="flex items-end gap-2 mt-0.5">
              <p className="text-2xl font-bold text-gray-900">{stats?.monthlyOrders ?? "\u2014"}</p>
              {stats && <GrowthBadge current={stats.monthlyOrders} previous={stats.prevMonthOrders} />}
            </div>
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col animate-fade-up stagger-2">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 w-fit mb-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-3">Revenue</p>
            <div className="flex items-end gap-2 mt-0.5">
              <p className="text-2xl font-bold text-gray-900">
                {stats ? `\u09F3${stats.monthlyRevenue.toLocaleString()}` : "\u2014"}
              </p>
              {stats && <GrowthBadge current={stats.monthlyRevenue} previous={stats.prevMonthRevenue} />}
            </div>
          </div>

          {/* Pending Deliveries */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col animate-fade-up stagger-3">
            <div className="p-2 rounded-lg bg-amber-50 text-amber-600 w-fit mb-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-3">Pending</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.pendingDeliveries ?? "\u2014"}</p>
          </div>

          {/* Total Orders */}
          <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex flex-col animate-fade-up stagger-4">
            <div className="p-2 rounded-lg bg-violet-50 text-violet-600 w-fit mb-auto">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
                <path d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12" />
              </svg>
            </div>
            <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mt-3">Total Orders</p>
            <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats?.totalOrders ?? "\u2014"}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm animate-fade-up stagger-3">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-gray-900">
            Recent Orders
          </h2>
          <Link href="/orders" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
            View all &rarr;
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No orders yet.{" "}
            <Link href="/orders/new" className="text-primary hover:underline font-medium">
              Create your first order
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
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
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    COD
                  </th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.map((order) => (
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
                      <Link
                        href={`/orders/${order.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        {order.customerName}
                      </Link>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm text-gray-400 hidden sm:table-cell">
                      {order.phone}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm font-medium text-gray-900">
                      ৳{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-sm text-gray-500 hidden md:table-cell">
                      ৳{order.codAmount.toLocaleString()}
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
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
