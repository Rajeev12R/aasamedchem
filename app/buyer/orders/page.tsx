import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Decimal from "decimal.js";

export default async function BuyerOrdersPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const orders = await prisma.order.findMany({
    where: { buyerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          My Orders
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor status and delivery details for your finalized orders.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200 shadow-xs">
          No active orders found. Once your quotations are approved, they will appear here.
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400">
                      ORDER ID: {o.id.substring(0, 8).toUpperCase()}...
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        o.status === "PENDING"
                          ? "bg-amber-100 text-amber-800 border border-amber-200"
                          : o.status === "PROCESSING"
                          ? "bg-blue-100 text-blue-850 border border-blue-200"
                          : o.status === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-850 border border-emerald-200"
                          : "bg-red-100 text-red-850 border border-red-200"
                      }`}
                    >
                      {o.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Order created on {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="sm:text-right">
                  <p className="text-xs text-gray-500 font-medium">Total Amount</p>
                  <p className="text-xl font-bold text-gray-950 mt-0.5">
                    ₹{new Decimal(o.totalPrice.toString()).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Items */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50/30 text-gray-500 font-semibold uppercase tracking-wider">
                      <th className="px-6 py-3">Product</th>
                      <th className="px-6 py-3 text-right">Quantity Ordered</th>
                      <th className="px-6 py-3 text-right">Base Quantity</th>
                      <th className="px-6 py-3 text-right">Base Rate</th>
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
                          {parseFloat(item.orderedQuantityDisplay.toString()).toLocaleString()}{" "}
                          <span className="text-gray-400">{item.orderedUnit}</span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-600">
                          {parseFloat(item.orderedQuantityBase.toString()).toLocaleString()}{" "}
                          <span className="text-[10px] text-gray-400">
                            {item.product.baseUnit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500">
                          ₹{parseFloat(item.unitPriceBase.toString()).toFixed(4)}
                          <span className="text-[10px] text-gray-400"> / {item.product.baseUnit}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                          ₹{parseFloat(item.lineTotal.toString()).toFixed(2)}
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
