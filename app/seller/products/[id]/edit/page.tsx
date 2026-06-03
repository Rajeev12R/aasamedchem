import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import SellerEditProductForm from "./SellerEditProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SellerEditProductPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // Ensure seller owns the product
  if (product.sellerId !== session.user.id) {
    redirect("/seller/products");
  }

  const serializedProduct = {
    id: product.id,
    name: product.name,
    sku: product.sku,
    category: product.category,
    description: product.description,
    dimensionType: product.dimensionType,
    baseUnit: product.baseUnit,
    inventoryQuantity: product.inventoryQuantity.toString(),
    basePrice: product.basePrice.toString(),
    status: product.status,
  };

  return (
    <div className="py-6">
      <SellerEditProductForm product={serializedProduct} />
    </div>
  );
}
