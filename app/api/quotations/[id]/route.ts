import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { QuotationStatus, OrderStatus } from "@prisma/client";
import Decimal from "decimal.js";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(
  request: Request,
  { params }: Params
) {
  const { id } = await params;
  const session = await auth();

  // Enforce ADMIN or SELLER authorization
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { status: "APPROVED" | "REJECTED" };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { status } = body;
  if (status !== "APPROVED" && status !== "REJECTED") {
    return Response.json(
      { error: "Invalid status value. Must be APPROVED or REJECTED" },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Find the quotation
      const quotation = await tx.quotation.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!quotation) {
        throw new Error("Quotation not found");
      }

      if (quotation.status !== "PENDING") {
        throw new Error(`Quotation has already been processed: status is ${quotation.status}`);
      }

      if (status === "APPROVED") {
        // Double check stock and create Order
        const orderItemsToCreate = [];

        for (const item of quotation.items) {
          const product = item.product;

          // Available stock to fulfill is the total stock (reserved stock is already set aside for this quote, so we must make sure inventoryQuantity >= orderedQuantityBase)
          const inventoryQty = new Decimal(product.inventoryQuantity);
          const orderedQty = new Decimal(item.orderedQuantityBase);

          if (inventoryQty.lt(orderedQty)) {
            throw new Error(
              `Cannot approve quotation. Fulfilling this order requires ${orderedQty.toString()} ${product.baseUnit} of ${product.name}, but inventory only has ${inventoryQty.toString()} ${product.baseUnit}.`
            );
          }

          orderItemsToCreate.push({
            productId: item.productId,
            orderedQuantityDisplay: item.orderedQuantityDisplay,
            orderedUnit: item.orderedUnit,
            orderedQuantityBase: item.orderedQuantityBase,
            unitPriceBase: item.unitPriceBase,
            lineTotal: item.lineTotal,
          });

          // Deduct from inventory and release reservation
          await tx.product.update({
            where: { id: product.id },
            data: {
              inventoryQuantity: {
                decrement: orderedQty,
              },
              reservedQuantity: {
                decrement: orderedQty,
              },
            },
          });
        }

        // Create the Order
        const order = await tx.order.create({
          data: {
            buyerId: quotation.buyerId,
            quotationId: quotation.id,
            totalPrice: quotation.totalPrice,
            status: OrderStatus.PENDING,
            items: {
              create: orderItemsToCreate,
            },
          },
        });

        // Mark Quotation as APPROVED
        const updatedQuotation = await tx.quotation.update({
          where: { id },
          data: { status: QuotationStatus.APPROVED },
        });

        return { quotation: updatedQuotation, order };
      } else {
        // Status is REJECTED
        // Release reserved stock for each product
        for (const item of quotation.items) {
          const orderedQty = new Decimal(item.orderedQuantityBase);
          await tx.product.update({
            where: { id: item.productId },
            data: {
              reservedQuantity: {
                decrement: orderedQty,
              },
            },
          });
        }

        // Mark Quotation as REJECTED
        const updatedQuotation = await tx.quotation.update({
          where: { id },
          data: { status: QuotationStatus.REJECTED },
        });

        return { quotation: updatedQuotation };
      }
    });

    return Response.json(result);
  } catch (err: unknown) {
    return Response.json(
      { error: (err as Error).message ?? "Failed to process quotation" },
      { status: 400 }
    );
  }
}
