import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";

export default async function BuyerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "BUYER") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Navigation */}
          <div className="flex items-center gap-8">
            <Link
              href="/buyer"
              className="bg-linear-to-r from-blue-700 to-indigo-800 text-white font-bold text-lg px-4 py-1.5 rounded-lg tracking-wide shadow-xs"
            >
              AasaMedChem
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                href="/buyer/products"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md transition-colors"
              >
                Browse Catalog
              </Link>
              <Link
                href="/buyer/quotations"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md transition-colors"
              >
                My Quotations
              </Link>
              <Link
                href="/buyer/orders"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 rounded-md transition-colors"
              >
                My Orders
              </Link>
            </nav>
          </div>

          {/* User Details & Sign Out */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                Buyer Portal
              </span>
              <span className="text-xs text-gray-500 truncate max-w-[150px]">
                {session.user.email}
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="px-4 py-2 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-100 transition-all"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        {children}
      </main>
    </div>
  );
}
