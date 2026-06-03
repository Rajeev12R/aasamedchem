import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import Link from "next/link";
import ProductsListClient from "@/app/admin/products/ProductsListClient";

export default async function SellerProductsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const products = await prisma.product.findMany({
    where: { sellerId: session.user.id },
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
    status: p.status,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            My Product Listings
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your chemical listings, track reservations, and base pricing.
          </p>
        </div>

        <Link
          href="/seller/products/new"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
        >
          <span>+ Add Product</span>
        </Link>
      </div>

      <ProductsListClient
        products={serializedProducts}
        categories={categories}
        baseUrl="/seller/products"
      />
    </div>
  );
}
