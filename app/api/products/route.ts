import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import {
  convertToBaseUnit,
  DimensionType,
} from "@/app/lib/conversions";
import {
  DimensionType as PrismaDimensionType,
} from "@prisma/client";

type CreateProductBody = {
  name: string;
  sku: string;
  category?: string;
  description?: string;
  dimensionType: "WEIGHT" | "VOLUME" | "COUNT";
  quantity: string;
  unit: string;
  basePrice: string;
};

const BASE_UNIT: Record<DimensionType, string> = {
  WEIGHT: "g",
  VOLUME: "mL",
  COUNT: "item",
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: CreateProductBody;
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
  } = body;

  if (!name || !sku || !dimensionType || !quantity || !unit || !basePrice) {
    return Response.json(
      { error: "Missing required fields: name, sku, dimensionType, quantity, unit, basePrice" },
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
    const product = await prisma.product.create({
      data: {
        name,
        sku,
        category: category ?? null,
        description: description ?? null,
        dimensionType: dimensionType as PrismaDimensionType,
        baseUnit,
        inventoryQuantity,
        basePrice,
        sellerId: session.user.id,
      },
    });

    return Response.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = (err as Error).message ?? "Database error";
    // Prisma unique constraint on SKU
    if (message.includes("Unique constraint")) {
      return Response.json(
        { error: "SKU already exists" },
        { status: 409 }
      );
    }
    return Response.json(
      { error: "Failed to create product" },
      { status: 500 }
    );
  }
}

export async function GET() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  return Response.json(products);
}
