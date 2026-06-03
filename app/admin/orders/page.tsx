import { prisma } from "@/app/lib/prisma";
import OrdersListClient from "./OrdersListClient";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const serializedOrders = orders.map((o) => ({
    id: o.id,
    buyer: {
      name: o.buyer.name,
      email: o.buyer.email,
    },
    status: o.status,
    totalPrice: o.totalPrice.toString(),
    createdAt: o.createdAt.toISOString(),
    items: o.items.map((item) => ({
      id: item.id,
      orderedQuantityDisplay: item.orderedQuantityDisplay.toString(),
      orderedUnit: item.orderedUnit,
      orderedQuantityBase: item.orderedQuantityBase.toString(),
      unitPriceBase: item.unitPriceBase.toString(),
      lineTotal: item.lineTotal.toString(),
      product: {
        name: item.product.name,
        sku: item.product.sku,
        baseUnit: item.product.baseUnit,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          Customer Orders
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Monitor order status, track deliveries, and manage cancellations.
        </p>
      </div>

      <OrdersListClient orders={serializedOrders} />
    </div>
  );
}
