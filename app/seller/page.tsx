import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import Decimal from "decimal.js";
import Link from "next/link";

export default async function SellerDashboardPage() {
  const session = await auth();

  if (!session) return null;

  const sellerId = session.user.id;

  // Seller specific metrics
  const totalProducts = await prisma.product.count({
    where: { sellerId },
  });

  const activeProducts = await prisma.product.count({
    where: { sellerId, status: "ACTIVE" },
  });

  // Count quotations containing at least one product from this seller
  const quotationsCount = await prisma.quotation.count({
    where: {
      items: {
        some: {
          product: {
            sellerId,
          },
        },
      },
    },
  });

  // Recent client quotations containing this seller's products
  const recentQuotations = await prisma.quotation.findMany({
    where: {
      items: {
        some: {
          product: {
            sellerId,
          },
        },
      },
    },
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        where: {
          product: {
            sellerId,
          },
        },
        include: {
          product: true,
        },
      },
    },
  });

  // Low stock products alert
  const sellerProducts = await prisma.product.findMany({
    where: { sellerId, status: "ACTIVE" },
  });

  const lowStockProducts = sellerProducts.filter((p) => {
    const total = new Decimal(p.inventoryQuantity);
    const reserved = new Decimal(p.reservedQuantity);
    return total.sub(reserved).lte(0);
  });

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">My Listed Products</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{totalProducts}</span>
            <span className="text-xs text-green-600 font-medium">({activeProducts} Active)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Quotations Received</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">{quotationsCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Low Stock Warnings</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-bold ${
                lowStockProducts.length > 0 ? "text-red-600" : "text-gray-800"
              }`}
            >
              {lowStockProducts.length}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Client Quotations */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-800">Recent Quotations</h3>
            <Link
              href="/seller/quotations"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All
            </Link>
          </div>

          {recentQuotations.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No quotations received yet.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentQuotations.map((q) => {
                // Calculate portion of total price belonging to this seller
                const sellerTotal = q.items.reduce((sum, item) => {
                  return sum.add(new Decimal(item.lineTotal.toString()));
                }, new Decimal(0));

                return (
                  <div key={q.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{q.buyer.name}</p>
                      <p className="text-xs text-gray-400">{q.buyer.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-700">
                        ₹{sellerTotal.toFixed(2)}
                      </span>
                      <p className="mt-0.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            q.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : q.status === "APPROVED"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {q.status}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Low Stock Products</h3>

          {lowStockProducts.length === 0 ? (
            <p className="text-sm text-green-600 bg-green-50 p-4 rounded-lg font-medium">
              ✓ All products are sufficiently stocked.
            </p>
          ) : (
            <div className="space-y-3">
              {lowStockProducts.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 border border-red-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{p.name}</p>
                    <p className="text-xs text-gray-500">SKU: {p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">
                      Out of Stock
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}