import { auth } from "@/auth";
import Link from "next/link";
import { prisma } from "@/app/lib/prisma";

export default async function BuyerDashboardPage() {
  const session = await auth();

  // Fetch count of quotations and orders for the user
  const quotesCount = await prisma.quotation.count({
    where: { buyerId: session?.user.id },
  });
  const ordersCount = await prisma.order.count({
    where: { buyerId: session?.user.id },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name}!
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          AasaMedChem B2B marketplace. Access chemical catalog, request quotes, and manage orders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Catalog */}
        <Link
          href="/buyer/products"
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            ⚛
          </div>
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-600 transition-colors">
            Chemical Catalog
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Browse active chemical inventory, filter by category/SKU, and dynamically calculate prices in any unit.
          </p>
          <span className="inline-block mt-4 text-xs font-semibold text-blue-600 group-hover:underline">
            Browse Catalog →
          </span>
        </Link>

        {/* Card 2: Quotes */}
        <Link
          href="/buyer/quotations"
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            📋
          </div>
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-amber-600 transition-colors">
            My Quotations
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            View submitted quotations, check their approval status (Pending/Approved/Rejected), and track revisions.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 group-hover:underline">
              View Quotations ({quotesCount}) →
            </span>
          </div>
        </Link>

        {/* Card 3: Orders */}
        <Link
          href="/buyer/orders"
          className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center font-bold text-lg mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
            📦
          </div>
          <h3 className="font-bold text-gray-800 text-lg group-hover:text-emerald-600 transition-colors">
            My Orders
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Track processed orders converted from approved quotations, view delivery status, and history.
          </p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 group-hover:underline">
              Track Orders ({ordersCount}) →
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}