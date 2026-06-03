import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { convertToBaseUnit, DimensionType } from "@/app/lib/conversions";
import Decimal from "decimal.js";

type RequestItem = {
  productId: string;
  quantity: string; // e.g. "1.5" or "10"
  unit: string;     // e.g. "kg", "g", "mL", "L", "item"
};

export async function POST(request: Request) {
  const session = await auth();

  if (!session || session.user.role !== "BUYER") {
    return Response.json(
      { error: "Unauthorized. Only buyers can create quotations." },
      { status: 401 }
    );
  }

  let body: { items: RequestItem[] };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { items } = body;
  if (!items || !Array.isArray(items) || items.length === 0) {
    return Response.json(
      { error: "Missing items in quotation request" },
      { status: 400 }
    );
  }

  try {
    // We will perform stock check and calculations inside a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      let totalPrice = new Decimal(0);
      const itemsToCreate = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product with ID ${item.productId} not found`);
        }

        if (product.status !== "ACTIVE") {
          throw new Error(`Product ${product.name} is not active`);
        }

        // Convert ordered quantity to base unit
        const orderedQtyBase = convertToBaseUnit(
          item.quantity,
          item.unit,
          product.dimensionType as DimensionType
        );

        // Check if there is enough available stock
        const availableStock = new Decimal(product.inventoryQuantity).sub(
          new Decimal(product.reservedQuantity)
        );

        if (availableStock.lt(orderedQtyBase)) {
          throw new Error(
            `Insufficient stock for ${product.name}. Available: ${availableStock.toString()} ${product.baseUnit}, Requested: ${orderedQtyBase.toString()} ${product.baseUnit}`
          );
        }

        // Line total = baseQuantity * basePrice
        const lineTotal = orderedQtyBase.mul(new Decimal(product.basePrice));
        totalPrice = totalPrice.add(lineTotal);

        itemsToCreate.push({
          productId: product.id,
          orderedQuantityDisplay: new Decimal(item.quantity),
          orderedUnit: item.unit,
          orderedQuantityBase: orderedQtyBase,
          unitPriceBase: new Decimal(product.basePrice),
          lineTotal,
        });

        // Reserve stock
        await tx.product.update({
          where: { id: product.id },
          data: {
            reservedQuantity: {
              increment: orderedQtyBase,
            },
          },
        });
      }

      // Create Quotation
      const quotation = await tx.quotation.create({
        data: {
          buyerId: session.user.id,
          totalPrice,
          items: {
            create: itemsToCreate.map((item) => ({
              productId: item.productId,
              orderedQuantityDisplay: item.orderedQuantityDisplay,
              orderedUnit: item.orderedUnit,
              orderedQuantityBase: item.orderedQuantityBase,
              unitPriceBase: item.unitPriceBase,
              lineTotal: item.lineTotal,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return quotation;
    });

    return Response.json(result, { status: 201 });
  } catch (err: unknown) {
    return Response.json(
      { error: (err as Error).message ?? "Failed to create quotation" },
      { status: 400 }
    );
  }
}

export async function GET() {
  const session = await auth();

  if (!session) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { role, id: userId } = session.user;

  try {
    if (role === "ADMIN") {
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
      return Response.json(quotations);
    }

    if (role === "BUYER") {
      const quotations = await prisma.quotation.findMany({
        where: { buyerId: userId },
        orderBy: { createdAt: "desc" },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
      return Response.json(quotations);
    }

    if (role === "SELLER") {
      // Find quotations that contain products created by this seller
      const quotations = await prisma.quotation.findMany({
        where: {
          items: {
            some: {
              product: {
                sellerId: userId,
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        include: {
          buyer: { select: { id: true, name: true, email: true } },
          items: {
            where: {
              product: {
                sellerId: userId,
              },
            },
            include: {
              product: true,
            },
          },
        },
      });
      return Response.json(quotations);
    }

    return Response.json([]);
  } catch (err: unknown) {
    return Response.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}
