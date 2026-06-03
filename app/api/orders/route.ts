import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";

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
      const orders = await prisma.order.findMany({
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
      return Response.json(orders);
    }

    if (role === "BUYER") {
      const orders = await prisma.order.findMany({
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
      return Response.json(orders);
    }

    if (role === "SELLER") {
      const orders = await prisma.order.findMany({
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
      return Response.json(orders);
    }

    return Response.json([]);
  } catch (err: unknown) {
    return Response.json(
      { error: "Database error" },
      { status: 500 }
    );
  }
}
