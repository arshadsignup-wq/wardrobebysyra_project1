"use client";

import { useEffect, useState, use } from "react";
import OrderForm from "@/components/OrderForm";

export default function EditOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [order, setOrder] = useState<Record<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setOrder({
          id: data.id,
          customerName: data.customerName,
          phone: data.phone,
          address: data.address,
          imageUrl: data.imageUrl || "",
          sizeDetails: data.sizeDetails || "",
          totalPrice: String(data.totalPrice),
          advanceAmount: String(data.advanceAmount),
          notes: data.notes || "",
        });
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading order...</div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Edit Order #{order?.id ? "" : ""}
      </h1>
      {order && <OrderForm initialData={order} isEdit />}
    </div>
  );
}
