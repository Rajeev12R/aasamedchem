import { prisma } from "@/app/lib/prisma";
import BuyerProductsCatalogClient from "./BuyerProductsCatalogClient";

export default async function BuyerProductsPage() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });

  const categories = Array.from(
    new Set(
      products
        .map((p) => p.category)
        .filter((c): c is string => c !== null && c !== "")
    )
  );

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
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Chemical Catalog
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Select products, select your preferred volume/weight unit, and submit quotation requests.
        </p>
      </div>

      <BuyerProductsCatalogClient
        products={serializedProducts}
        categories={categories}
      />
    </div>
  );
}
