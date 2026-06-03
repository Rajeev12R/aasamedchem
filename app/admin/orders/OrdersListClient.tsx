"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type OrderItem = {
  id: string;
  orderedQuantityDisplay: string;
  orderedUnit: string;
  orderedQuantityBase: string;
  unitPriceBase: string;
  lineTotal: string;
  product: {
    name: string;
    sku: string;
    baseUnit: string;
  };
};

type Order = {
  id: string;
  buyer: {
    name: string;
    email: string;
  };
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "CANCELLED";
  totalPrice: string;
  createdAt: string;
  items: OrderItem[];
};

interface Props {
  orders: Order[];
}

export default function OrdersListClient({ orders }: Props) {
  const router = useRouter();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredOrders = orders.filter((o) => {
    return filterStatus === "all" || o.status === filterStatus;
  });

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update order status");
        router.refresh(); // Refresh to undo the local select change if DB transaction failed
        return;
      }

      toast.success("Order status updated");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <span className="text-gray-700 font-semibold text-sm">Filter Orders</span>
        <div className="flex gap-2">
          {(["all", "PENDING", "PROCESSING", "COMPLETED", "CANCELLED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                filterStatus === status
                  ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200 shadow-xs">
          No orders found.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">
                      ID: {o.id.substring(0, 8).toUpperCase()}...
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        o.status === "PENDING"
                          ? "bg-amber-100 text-amber-850 border border-amber-200"
                          : o.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-800 border border-blue-200"
                          : o.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-gray-900 text-base">
                    {o.buyer.name}{" "}
                    <span className="font-normal text-sm text-gray-500">
                      ({o.buyer.email})
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Created on {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Total Price</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₹{parseFloat(o.totalPrice).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-gray-500">Fulfillment:</label>
                    <select
                      value={o.status}
                      disabled={o.status === "CANCELLED" || updatingId === o.id}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      className="border rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium focus:ring-2 focus:ring-blue-500/20 outline-hidden disabled:opacity-50 disabled:bg-gray-100"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50/30 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-right">Ordered Qty</th>
                      <th className="px-6 py-3 text-right">Base Qty</th>
                      <th className="px-6 py-3 text-right">Rate (INR)</th>
                      <th className="px-6 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {o.items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/20">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-800">{item.product.name}</p>
                          <p className="text-[10px] text-gray-400">SKU: {item.product.sku}</p>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                          {parseFloat(item.orderedQuantityDisplay).toLocaleString()}{" "}
                          <span className="text-gray-400">{item.orderedUnit}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {parseFloat(item.orderedQuantityBase).toLocaleString()}{" "}
                          <span className="text-[10px] text-gray-400">
                            {item.product.baseUnit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          ₹{parseFloat(item.unitPriceBase).toFixed(4)}
                          <span className="text-[10px] text-gray-400"> / {item.product.baseUnit}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          ₹{parseFloat(item.lineTotal).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
