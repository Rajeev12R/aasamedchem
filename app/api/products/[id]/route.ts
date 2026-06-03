import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import {
  convertToBaseUnit,
  DimensionType,
} from "@/app/lib/conversions";
import {
  DimensionType as PrismaDimensionType,
  ProductStatus,
} from "@prisma/client";

const BASE_UNIT: Record<DimensionType, string> = {
  WEIGHT: "g",
  VOLUME: "mL",
  COUNT: "item",
};

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: Request,
  { params }: Params
) {
  const { id } = await params;
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Find the product
  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return Response.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  // If seller, check ownership
  if (session.user.role === "SELLER" && product.sellerId !== session.user.id) {
    return Response.json(
      { error: "Unauthorized to edit this product" },
      { status: 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const {
    name,
    sku,
    category,
    description,
    dimensionType,
    quantity,
    unit,
    basePrice,
    status,
  } = body;

  if (!name || !sku || !dimensionType || !quantity || !unit || !basePrice) {
    return Response.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  let inventoryQuantity: string;
  try {
    const baseQty = convertToBaseUnit(
      quantity,
      unit,
      dimensionType as DimensionType
    );
    inventoryQuantity = baseQty.toString();
  } catch (err) {
    return Response.json(
      { error: (err as Error).message },
      { status: 400 }
    );
  }

  const baseUnit = BASE_UNIT[dimensionType as DimensionType];

  try {
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        sku,
        category: category ?? null,
        description: description ?? null,
        dimensionType: dimensionType as PrismaDimensionType,
        baseUnit,
        inventoryQuantity,
        basePrice,
        status: status as ProductStatus,
      },
    });

    return Response.json(updatedProduct);
  } catch (err: unknown) {
    const message = (err as Error).message ?? "";
    if (message.includes("Unique constraint")) {
      return Response.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: Params
) {
  const { id } = await params;
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return Response.json(
      { error: "Product not found" },
      { status: 404 }
    );
  }

  if (session.user.role === "SELLER" && product.sellerId !== session.user.id) {
    return Response.json(
      { error: "Unauthorized to delete this product" },
      { status: 403 }
    );
  }

  try {
    await prisma.product.delete({
      where: { id },
    });
    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Failed to delete product. It may be linked to active quotations or orders." },
      { status: 500 }
    );
  }
}
