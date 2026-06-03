import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { OrderStatus } from "@prisma/client";
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

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SELLER")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { status: OrderStatus };
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { status } = body;
  if (!Object.values(OrderStatus).includes(status)) {
    return Response.json(
      { error: `Invalid status. Allowed values: ${Object.values(OrderStatus).join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!order) {
        throw new Error("Order not found");
      }

      // If already cancelled, do not allow further updates
      if (order.status === OrderStatus.CANCELLED) {
        throw new Error("Cannot modify a cancelled order");
      }

      // If status is transitioning to CANCELLED, restore stock
      if (status === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          const qty = new Decimal(item.orderedQuantityBase);
          await tx.product.update({
            where: { id: item.productId },
            data: {
              inventoryQuantity: {
                increment: qty,
              },
            },
          });
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    return Response.json(result);
  } catch (err: unknown) {
    return Response.json(
      { error: (err as Error).message ?? "Failed to update order status" },
      { status: 400 }
    );
  }
}
