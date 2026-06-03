import { prisma } from "@/app/lib/prisma";
import QuotationsListClient from "./QuotationsListClient";

export default async function AdminQuotationsPage() {
  const quotations = await prisma.quotation.findMany({
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

  // Serialize decimals and other non-serializeable fields
  const serializedQuotations = quotations.map((q) => ({
    id: q.id,
    buyer: {
      name: q.buyer.name,
      email: q.buyer.email,
    },
    status: q.status,
    totalPrice: q.totalPrice.toString(),
    createdAt: q.createdAt.toISOString(),
    items: q.items.map((item) => ({
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
          Incoming Quotations
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, approve, or reject quotations submitted by buyers. Approved quotations are converted into orders.
        </p>
      </div>

      <QuotationsListClient quotations={serializedQuotations} />
    </div>
  );
}
