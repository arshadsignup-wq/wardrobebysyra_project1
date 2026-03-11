"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import type { Order } from "@/lib/types";
import {
  STATUS_LABELS,
  STATUS_FLOW,
  STATUS_COLORS,
  getNextStatus,
  SOURCE_LABELS,
} from "@/lib/constants";
import { toast } from "@/components/Toast";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder(data);
        setLoading(false);
      });
  }, [id]);

  async function handleNextStatus() {
    if (!order) return;
    const next = getNextStatus(order.status);
    if (!next) return;

    setUpdating(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
      toast(`Status updated to ${STATUS_LABELS[next]}`);
    }
    setUpdating(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this order?")) return;

    const res = await fetch(`/api/orders/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast("Order deleted");
      router.push("/orders");
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading order...</div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12 text-gray-500">Order not found</div>
    );
  }

  const nextStatus = getNextStatus(order.status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/orders"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Order #{order.orderNumber}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/orders/${id}/edit`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Status Stepper */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Status</h3>
          {nextStatus && (
            <button
              onClick={handleNextStatus}
              disabled={updating}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {updating
                ? "Updating..."
                : `Move to ${STATUS_LABELS[nextStatus]}`}
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FLOW.map((s, i) => {
            const currentIdx = STATUS_FLOW.indexOf(order.status);
            const isPast = i < currentIdx;
            const isCurrent = i === currentIdx;

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                    isCurrent
                      ? STATUS_COLORS[s]
                      : isPast
                      ? "bg-gray-200 text-gray-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {isPast ? "✓ " : ""}
                  {STATUS_LABELS[s]}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <span className="text-gray-300 hidden sm:inline">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Info */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Customer
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-sm font-medium text-gray-900">
                {order.customerName}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Phone</dt>
              <dd className="text-sm font-medium text-gray-900">
                {order.phone}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Address</dt>
              <dd className="text-sm font-medium text-gray-900">
                {order.address}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Source</dt>
              <dd className="text-sm font-medium text-gray-900">
                {SOURCE_LABELS[order.source]}
              </dd>
            </div>
          </dl>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Product Price</dt>
              <dd className="text-sm font-semibold text-gray-900">
                ৳{order.totalPrice.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">
                Delivery ({order.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"})
              </dt>
              <dd className="text-sm font-medium text-gray-600">
                + ৳{order.deliveryCharge}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-500">Advance Paid</dt>
              <dd className="text-sm font-medium text-green-600">
                - ৳{order.advanceAmount.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="text-sm font-medium text-gray-700">
                COD Amount
              </dt>
              <dd className="text-lg font-bold text-primary">
                ৳{order.codAmount.toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
          <dl className="space-y-3">
            {order.sizeDetails && (
              <div>
                <dt className="text-sm text-gray-500">Size Details</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {order.sizeDetails}
                </dd>
              </div>
            )}
            {order.notes && (
              <div>
                <dt className="text-sm text-gray-500">Notes</dt>
                <dd className="text-sm font-medium text-gray-900">
                  {order.notes}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm text-gray-500">Created</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(order.createdAt).toLocaleString()}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Last Updated</dt>
              <dd className="text-sm font-medium text-gray-900">
                {new Date(order.updatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </div>

        {/* Image */}
        {order.imageUrl && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Image</h3>
            <img
              src={order.imageUrl}
              alt="Order"
              className="rounded-lg max-h-64 object-contain w-full"
            />
          </div>
        )}
      </div>
    </div>
  );
}
