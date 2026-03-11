"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";
import { SOURCE_LABELS, DELIVERY_CHARGES, DELIVERY_ZONE_LABELS } from "@/lib/constants";
import type { OrderSource, DeliveryZone } from "@/lib/types";

interface OrderData {
  id?: string;
  customerName: string;
  phone: string;
  address: string;
  imageUrl: string;
  sizeDetails: string;
  totalPrice: string;
  advanceAmount: string;
  deliveryZone: DeliveryZone;
  source: OrderSource;
  notes: string;
  orderDate: string;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const defaultData: OrderData = {
  customerName: "",
  phone: "",
  address: "",
  imageUrl: "",
  sizeDetails: "",
  totalPrice: "",
  advanceAmount: "500",
  deliveryZone: "INSIDE_DHAKA",
  source: "FACEBOOK",
  notes: "",
  orderDate: todayStr(),
};

export default function OrderForm({
  initialData,
  isEdit = false,
}: {
  initialData?: Partial<OrderData> & { id?: string };
  isEdit?: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState<OrderData>({ ...defaultData, ...initialData });
  const [loading, setLoading] = useState(false);
  const [advancePaid, setAdvancePaid] = useState(
    initialData ? parseInt(String(initialData.advanceAmount || "0")) > 0 : true
  );

  const deliveryCharge = DELIVERY_CHARGES[form.deliveryZone];
  const totalWithDelivery = (parseInt(form.totalPrice) || 0) + deliveryCharge;
  const codAmount = totalWithDelivery - (parseInt(form.advanceAmount) || 0);

  useEffect(() => {
    if (initialData) {
      setForm({ ...defaultData, ...initialData });
    }
  }, [initialData]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const url = isEdit ? `/api/orders/${initialData?.id}` : "/api/orders";
    const method = isEdit ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        deliveryCharge,
      }),
    });

    if (res.ok) {
      const order = await res.json();
      toast(isEdit ? "Order updated!" : "Order created!");
      router.push(`/orders/${order.id}`);
    } else {
      toast("Something went wrong", "error");
    }

    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">
          Customer Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Customer Name *
            </label>
            <input
              name="customerName"
              value={form.customerName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order Date *
            </label>
            <input
              name="orderDate"
              type="date"
              value={form.orderDate}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">
          Order Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Source *
            </label>
            <select
              name="source"
              value={form.source}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
            >
              {(Object.keys(SOURCE_LABELS) as OrderSource[]).map((key) => (
                <option key={key} value={key}>
                  {SOURCE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <input
              name="imageUrl"
              value={form.imageUrl}
              onChange={handleChange}
              placeholder="https://..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size Details
            </label>
            <input
              name="sizeDetails"
              value={form.sizeDetails}
              onChange={handleChange}
              placeholder="e.g., Bust: 36, Waist: 30"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Zone *
            </label>
            <select
              name="deliveryZone"
              value={form.deliveryZone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary bg-white"
            >
              {(Object.keys(DELIVERY_ZONE_LABELS) as DeliveryZone[]).map((key) => (
                <option key={key} value={key}>
                  {DELIVERY_ZONE_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Any special instructions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 sm:p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Price (BDT) *
            </label>
            <input
              name="totalPrice"
              type="number"
              value={form.totalPrice}
              onChange={handleChange}
              required
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Advance Payment
            </label>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setAdvancePaid(true);
                  setForm({ ...form, advanceAmount: "500" });
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  advancePaid
                    ? "bg-primary text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                Advance Paid
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdvancePaid(false);
                  setForm({ ...form, advanceAmount: "0" });
                }}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  !advancePaid
                    ? "bg-red-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                No Advance
              </button>
            </div>
            {advancePaid && (
              <input
                name="advanceAmount"
                type="number"
                value={form.advanceAmount}
                onChange={handleChange}
                min="0"
                placeholder="500"
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              />
            )}
          </div>
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Product Price</span>
              <span>৳{(parseInt(form.totalPrice) || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Charge ({form.deliveryZone === "INSIDE_DHAKA" ? "Inside Dhaka" : "Outside Dhaka"})</span>
              <span>+ ৳{deliveryCharge}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Advance Paid</span>
              <span>- ৳{(parseInt(form.advanceAmount) || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
              <span>COD Amount</span>
              <span className="text-primary">৳{codAmount >= 0 ? codAmount.toLocaleString() : 0}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
        >
          {loading
            ? "Saving..."
            : isEdit
            ? "Update Order"
            : "Create Order"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
