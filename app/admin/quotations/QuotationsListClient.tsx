"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Decimal from "decimal.js";

type QuotationItem = {
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

type Quotation = {
  id: string;
  buyer: {
    name: string;
    email: string;
  };
  status: "PENDING" | "APPROVED" | "REJECTED";
  totalPrice: string;
  createdAt: string;
  items: QuotationItem[];
};

interface Props {
  quotations: Quotation[];
}

export default function QuotationsListClient({ quotations }: Props) {
  const router = useRouter();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredQuotations = quotations.filter((q) => {
    return filterStatus === "all" || q.status === filterStatus;
  });

  async function handleStatusUpdate(id: string, newStatus: "APPROVED" | "REJECTED") {
    if (!window.confirm(`Are you sure you want to ${newStatus.toLowerCase()} this quotation?`)) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? `Failed to ${newStatus.toLowerCase()} quotation`);
        return;
      }

      toast.success(`Quotation ${newStatus.toLowerCase()} successfully`);
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Filters Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between">
        <h2 className="font-semibold text-gray-700 text-sm">Filter Quotations</h2>
        <div className="flex gap-2">
          {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
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

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200 shadow-xs">
          No quotations found.
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuotations.map((q) => (
            <div
              key={q.id}
              className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
            >
              {/* Card Header */}
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">
                      ID: {q.id.substring(0, 8).toUpperCase()}...
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        q.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : q.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-red-100 text-red-800 border border-red-200"
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>
                  <h3 className="mt-2 font-bold text-gray-900 text-base">
                    {q.buyer.name}{" "}
                    <span className="font-normal text-sm text-gray-500">
                      ({q.buyer.email})
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Submitted on {new Date(q.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center gap-4 self-end md:self-auto">
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-medium">Total Quote Value</p>
                    <p className="text-xl font-bold text-gray-900">
                      ₹{parseFloat(q.totalPrice).toFixed(2)}
                    </p>
                  </div>

                  {q.status === "PENDING" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleStatusUpdate(q.id, "APPROVED")}
                        disabled={processingId === q.id}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                      >
                        {processingId === q.id ? "Processing..." : "Approve"}
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(q.id, "REJECTED")}
                        disabled={processingId === q.id}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
                      >
                        {processingId === q.id ? "Processing..." : "Reject"}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Detail */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50/30 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-right">Requested Qty</th>
                      <th className="px-6 py-3 text-right">Converted Base Qty</th>
                      <th className="px-6 py-3 text-right">Base Rate (INR)</th>
                      <th className="px-6 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {q.items.map((item) => (
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
