import OrderForm from "@/components/OrderForm";

export default function NewOrderPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Order</h1>
      <OrderForm />
    </div>
  );
}
