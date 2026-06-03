import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import Decimal from "decimal.js";

export default async function AdminDashboardPage() {
  // Fetch dashboard metrics
  const totalProducts = await prisma.product.count();
  const activeProducts = await prisma.product.count({
    where: { status: "ACTIVE" },
  });

  const pendingQuotations = await prisma.quotation.count({
    where: { status: "PENDING" },
  });

  const ordersCount = await prisma.order.count();

  // Sum of total order prices (in INR)
  const salesAggregate = await prisma.order.aggregate({
    _sum: {
      totalPrice: true,
    },
  });
  const totalSales = salesAggregate._sum.totalPrice
    ? new Decimal(salesAggregate._sum.totalPrice.toString()).toFixed(2)
    : "0.00";

  // Recent pending quotations
  const recentQuotations = await prisma.quotation.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { name: true, email: true } },
    },
  });

  // Low stock products (available stock <= 0)
  const products = await prisma.product.findMany({
    where: {
      status: "ACTIVE",
    },
  });

  const lowStockProducts = products.filter((p) => {
    const total = new Decimal(p.inventoryQuantity);
    const reserved = new Decimal(p.reservedQuantity);
    return total.sub(reserved).lte(0);
  });

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Products Catalog</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold">{totalProducts}</span>
            <span className="text-xs text-green-600 font-medium">({activeProducts} Active)</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Pending Quotations</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-600">{pendingQuotations}</span>
            <span className="text-xs text-amber-500 font-medium">Awaiting action</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Total Orders</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-blue-600">{ordersCount}</span>
            <span className="text-xs text-blue-500 font-medium">Converted quotes</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <span className="text-sm font-medium text-gray-500">Total Revenue (INR)</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-600">₹{totalSales}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Quotations */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg text-gray-800">Recent Quotations</h3>
            <Link
              href="/admin/quotations"
              className="text-xs text-blue-600 font-semibold hover:underline"
            >
              View All
            </Link>
          </div>

          {recentQuotations.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">No recent quotations.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentQuotations.map((q) => (
                <div key={q.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{q.buyer.name}</p>
                    <p className="text-xs text-gray-400">{q.buyer.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-700">
                      ₹{new Decimal(q.totalPrice.toString()).toFixed(2)}
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
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            Low Stock Alerts
            {lowStockProducts.length > 0 && (
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                {lowStockProducts.length}
              </span>
            )}
          </h3>

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
                    <p className="text-[10px] text-gray-400 mt-1">
                      Total: {p.inventoryQuantity.toString()} {p.baseUnit} | Res:{" "}
                      {p.reservedQuantity.toString()} {p.baseUnit}
                    </p>
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