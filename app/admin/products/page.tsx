import Link from "next/link";
import { prisma } from "@/app/lib/prisma";
import ProductsListClient from "./ProductsListClient";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Extract unique categories for filtering
  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category)
        .filter((c): c is string => c !== null && c !== "")
    )
  );

  // Serialize Decimal objects to strings before sending to Client Component
  const serializedProducts = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    category: p.category,
    description: p.description,
    dimensionType: p.dimensionType,
    baseUnit: p.baseUnit,
    inventoryQuantity: p.inventoryQuantity.toString(),
    reservedQuantity: p.reservedQuantity.toString(),
    basePrice: p.basePrice.toString(),
    status: p.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Products Inventory
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure product dimensions, inventory quantities, and pricing units.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
        >
          <span>+ Create Product</span>
        </Link>
      </div>

      <ProductsListClient
        products={serializedProducts}
        categories={categories}
      />
    </div>
  );
}