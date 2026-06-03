import { prisma } from "@/app/lib/prisma";
import { notFound } from "next/navigation";
import EditProductForm from "./EditProductForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
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
      <EditProductForm product={serializedProduct} />
    </div>
  );
}
