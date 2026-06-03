import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import React from "react";

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role !== "SELLER") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo Section */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-linear-to-r from-emerald-900 to-teal-950 text-white font-bold text-lg tracking-wide shadow-xs">
          AasaMedChem <span className="ml-2 text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 font-medium">SELLER</span>
        </div>

        {/* User Card */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <p className="font-semibold text-sm truncate">{session.user.name}</p>
          <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/seller"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/seller/products"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            My Products
          </Link>
          <Link
            href="/seller/quotations"
            className="flex items-center px-4 py-2.5 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Client Quotations
          </Link>
        </nav>

        {/* Footer / Sign Out */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/30">
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full text-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-lg transition-all"
            >
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-xs">
          <h2 className="font-semibold text-lg text-gray-800">Seller Dashboard</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>Welcome, <strong>{session.user.name}</strong></span>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
