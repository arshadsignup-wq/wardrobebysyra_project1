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
  const [sendingRedx, setSendingRedx] = useState(false);
  const [showRedxModal, setShowRedxModal] = useState(false);
  const [areaSearch, setAreaSearch] = useState("");
  const [areaResults, setAreaResults] = useState<{ id: number; name: string }[]>([]);
  const [selectedArea, setSelectedArea] = useState<{ id: number; name: string } | null>(null);
  const [searchingAreas, setSearchingAreas] = useState(false);
  const [pickupStore, setPickupStore] = useState(447381);

  const PICKUP_STORES = [
    { id: 349501, name: "Shop Shaptak Square" },
    { id: 447381, name: "Home (Posta)" },
  ];

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

  // Area search with debounce
  useEffect(() => {
    if (areaSearch.length < 2) {
      setAreaResults([]);
      return;
    }
    setSearchingAreas(true);
    const t = setTimeout(() => {
      fetch(`/api/redx/areas?search=${encodeURIComponent(areaSearch)}`)
        .then((r) => r.json())
        .then((data) => {
          setAreaResults(data.areas || []);
          setSearchingAreas(false);
        })
        .catch(() => setSearchingAreas(false));
    }, 300);
    return () => clearTimeout(t);
  }, [areaSearch]);

  async function handleSendToRedx() {
    if (!order || !selectedArea) return;

    setSendingRedx(true);
    try {
      const res = await fetch("/api/redx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          deliveryAreaId: selectedArea.id,
          deliveryAreaName: selectedArea.name,
          pickupStoreId: pickupStore,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast(`Sent to RedX! Tracking: ${data.tracking_id}`);
        setShowRedxModal(false);
        setSelectedArea(null);
        setAreaSearch("");
      } else {
        toast(data.error || "Failed to send to RedX", "error");
      }
    } catch {
      toast("Failed to send to RedX", "error");
    }
    setSendingRedx(false);
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
  const showPrintSlip =
    order.status === "READY" ||
    order.status === "DISPATCHED" ||
    order.status === "DELIVERED";
  const showRedx =
    order.status === "READY" ||
    order.status === "DISPATCHED";

  function handlePrintSlip() {
    if (!order) return;
    const firstName = order.customerName.split(" ")[0];
    const sourceLabel = SOURCE_LABELS[order.source];
    const orderDate = new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<title>Packing Slip - Order #${order.orderNumber}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;700&family=Inter:wght@400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; padding: 28px; color: #1a1a1a; max-width: 420px; margin: 0 auto; }

  .header { text-align: center; padding-bottom: 18px; margin-bottom: 18px; border-bottom: 1px solid #e5e5e5; position: relative; }
  .brand { font-family: 'Playfair Display', serif; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
  .tagline { font-size: 10px; color: #999; letter-spacing: 2px; text-transform: uppercase; margin-top: 2px; }
  .order-meta { font-size: 12px; color: #888; margin-top: 8px; }
  .order-meta span { margin: 0 6px; }

  .thank-you-box { background: linear-gradient(135deg, #fdf6f0 0%, #fef9f5 100%); border: 1px solid #f0e0d0; border-radius: 10px; padding: 16px; margin-bottom: 18px; text-align: center; }
  .thank-you-title { font-family: 'Playfair Display', serif; font-size: 16px; font-weight: 600; color: #8b5e3c; margin-bottom: 6px; }
  .thank-you-msg { font-size: 12px; color: #6b5545; line-height: 1.6; }

  .section { margin-bottom: 16px; }
  .section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1.2px; color: #aaa; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
  .section-title::after { content: ''; flex: 1; height: 1px; background: #eee; }

  .row { display: flex; justify-content: space-between; font-size: 13px; line-height: 1.7; }
  .row .label { color: #777; }
  .row .value { font-weight: 500; text-align: right; max-width: 60%; }

  .customer-name { font-size: 17px; font-weight: 600; margin-bottom: 3px; }
  .customer-detail { font-size: 13px; color: #444; line-height: 1.5; }
  .source-badge { display: inline-block; font-size: 10px; font-weight: 600; background: #f0f0f0; color: #666; padding: 2px 8px; border-radius: 10px; margin-top: 6px; letter-spacing: 0.3px; }

  .cod-box { text-align: center; border: 2.5px solid #1a1a1a; border-radius: 10px; padding: 14px; margin: 18px 0; }
  .cod-label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #666; margin-bottom: 4px; }
  .cod-amount { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; }

  .notes-box { font-size: 12px; color: #555; background: #fafafa; padding: 10px 12px; border-radius: 8px; line-height: 1.6; border-left: 3px solid #ddd; }

  .care-section { background: #f8f8f8; border-radius: 8px; padding: 12px 14px; margin-bottom: 16px; }
  .care-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #999; margin-bottom: 6px; }
  .care-list { font-size: 11px; color: #666; line-height: 1.8; padding-left: 2px; }
  .care-item { display: flex; align-items: baseline; gap: 6px; }
  .care-dot { color: #caa882; font-size: 8px; }

  .footer { text-align: center; padding-top: 16px; border-top: 1px solid #eee; }
  .footer-brand { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #333; margin-bottom: 6px; }
  .footer-links { font-size: 11px; color: #888; margin-bottom: 4px; }
  .footer-links a { color: #8b5e3c; text-decoration: none; }
  .footer-heart { font-size: 11px; color: #bbb; margin-top: 8px; }

  @media print {
    body { padding: 16px; }
    .thank-you-box { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .care-section { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .source-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">Wardrobe By Syra</div>
    <div class="tagline">You Will Love Every Tryon!</div>
    <div class="order-meta">
      Order <strong>#${order.orderNumber}</strong>
      <span>&middot;</span>
      ${orderDate}
    </div>
  </div>

  <div class="thank-you-box">
    <div class="thank-you-title">Dear ${firstName},</div>
    <div class="thank-you-msg">
      Thank you for choosing Wardrobe By Syra! Every stitch in this piece was crafted with love and care, just for you. We hope it brings you as much joy wearing it as we had creating it.
    </div>
  </div>

  <div class="section">
    <div class="section-title">Customer</div>
    <div class="customer-name">${order.customerName}</div>
    <div class="customer-detail">${order.phone}</div>
    <div class="customer-detail">${order.address}</div>
    <div class="source-badge">Ordered via ${sourceLabel}</div>
  </div>

  <div class="section">
    <div class="section-title">Order Details</div>
    <div class="row"><span class="label">Delivery Zone</span><span class="value">${order.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"}</span></div>
    ${order.notes ? `<div style="margin-top:10px"><div class="section-title">Notes</div><div class="notes-box">${order.notes}</div></div>` : ""}
  </div>

  <div class="section">
    <div class="section-title">Pricing</div>
    <div class="row"><span class="label">Product Price</span><span class="value">৳${order.totalPrice.toLocaleString()}</span></div>
    <div class="row"><span class="label">Delivery Charge</span><span class="value">+ ৳${order.deliveryCharge}</span></div>
    <div class="row"><span class="label">Advance Paid</span><span class="value">- ৳${order.advanceAmount.toLocaleString()}</span></div>
  </div>

  <div class="cod-box">
    <div class="cod-label">Collect on Delivery</div>
    <div class="cod-amount">৳${order.codAmount.toLocaleString()}</div>
  </div>

  <div class="care-section">
    <div class="care-title">Garment Care</div>
    <div class="care-list">
      <div class="care-item"><span class="care-dot">&#9679;</span> Dry clean or gentle hand wash recommended</div>
      <div class="care-item"><span class="care-dot">&#9679;</span> Iron on low heat, inside out</div>
      <div class="care-item"><span class="care-dot">&#9679;</span> Store in a cool, dry place away from sunlight</div>
    </div>
  </div>

  <div class="footer">
    <div class="footer-brand">Wardrobe By Syra</div>
    <div class="footer-links" style="margin-bottom:4px;">
      Shop 6A, Level 2, 27 Shaptak Square, Dhanmondi 27, Dhaka
    </div>
    <div class="footer-links">
      WhatsApp: 01953300682
    </div>
    <div class="footer-links" style="margin-top:6px;">
      <a href="https://wardrobebysyra.com">wardrobebysyra.com</a>
      &nbsp;&middot;&nbsp;
      <a href="https://facebook.com/wardrobebysyra">facebook.com/wardrobebysyra</a>
    </div>
    <div class="footer-heart">Made with love in Bangladesh</div>
  </div>
</body>
</html>`);
    win.document.close();
    win.onload = () => win.print();
  }

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
        <div className="flex gap-2 flex-wrap">
          {showRedx && (
            <button
              onClick={() => setShowRedxModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Send to RedX
            </button>
          )}
          {showPrintSlip && (
            <button
              onClick={handlePrintSlip}
              className="px-4 py-2 bg-orange-50 border border-orange-200 text-orange-700 rounded-lg text-sm font-medium hover:bg-orange-100 transition-colors"
            >
              Print Packing Slip
            </button>
          )}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customer</h3>
            <button
              onClick={() => {
                const text = `${order.customerName}\n${order.phone}\n${order.address}\nCOD: ৳${order.codAmount.toLocaleString()}`;
                navigator.clipboard.writeText(text);
                toast("Copied for RedX!");
              }}
              className="px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
            >
              Copy for RedX
            </button>
          </div>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Details</h3>
            <button
              onClick={() => {
                const firstName = order.customerName.split(" ")[0];
                const lines: string[] = [];
                if (order.imageUrl) lines.push(`📸 ${order.imageUrl}`);
                lines.push(`👤 ${firstName}`);
                if (order.sizeDetails) lines.push(`📏 ${order.sizeDetails}`);
                if (order.notes) lines.push(`📝 ${order.notes}`);
                navigator.clipboard.writeText(lines.join("\n"));
                toast("Copied for Tailor!");
              }}
              className="px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
            >
              Copy for Tailor
            </button>
          </div>
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

      {/* RedX Area Modal */}
      {showRedxModal && order && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4 shadow-xl">
            <div className="p-5 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Send to RedX
                </h3>
                <button
                  onClick={() => {
                    setShowRedxModal(false);
                    setSelectedArea(null);
                    setAreaSearch("");
                  }}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none"
                >
                  &times;
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Order #{order.orderNumber} &middot; {order.customerName}
              </p>
            </div>

            <div className="p-5">
              <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                <p className="text-gray-500">Delivery address:</p>
                <p className="font-medium text-gray-900">{order.address}</p>
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pickup From *
              </label>
              <div className="flex gap-2 mb-4">
                {PICKUP_STORES.map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => setPickupStore(store.id)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      pickupStore === store.id
                        ? "bg-red-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {store.name}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select RedX Delivery Area *
              </label>
              <input
                type="text"
                value={areaSearch}
                onChange={(e) => {
                  setAreaSearch(e.target.value);
                  setSelectedArea(null);
                }}
                placeholder="Type area name (e.g. Mirpur, Uttara, Chittagong)..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
              />

              {/* Selected area */}
              {selectedArea && (
                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                  <span className="text-sm font-medium text-green-800">
                    {selectedArea.name}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedArea(null);
                      setAreaSearch("");
                    }}
                    className="ml-auto text-green-600 hover:text-green-800 text-xs"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Search results */}
              {!selectedArea && areaSearch.length >= 2 && (
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchingAreas ? (
                    <p className="p-3 text-sm text-gray-500 text-center">
                      Searching...
                    </p>
                  ) : areaResults.length === 0 ? (
                    <p className="p-3 text-sm text-gray-500 text-center">
                      No areas found
                    </p>
                  ) : (
                    areaResults.map((area) => (
                      <button
                        key={area.id}
                        onClick={() => {
                          setSelectedArea(area);
                          setAreaSearch(area.name);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        {area.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleSendToRedx}
                disabled={!selectedArea || sendingRedx}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingRedx ? "Sending..." : "Confirm & Send"}
              </button>
              <button
                onClick={() => {
                  setShowRedxModal(false);
                  setSelectedArea(null);
                  setAreaSearch("");
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
