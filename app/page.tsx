import React from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-slate-900 text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black bg-clip-text text-transparent bg-linear-to-r from-blue-400 via-indigo-400 to-emerald-400 tracking-wider">
              AasaMedChem
            </span>
          </div>
          <div>
            <Link
              href="/login"
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/30"
            >
              Sign In to Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 flex flex-col justify-center max-w-7xl mx-auto px-6 py-20 lg:py-32 relative">
        {/* Subtle grid background blur */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-3xl space-y-6 relative z-10 text-center md:text-left mx-auto md:mx-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/20">
            ✨ Next-Gen Chemical Logistics
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Seamless B2B Chemical Procurement & Inventory
          </h1>
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl font-light">
            An advanced order and inventory management system designed for chemical manufacturers, suppliers, and buyers. Automate unit conversions, track stock reservations, and request quotations in real-time.
          </p>

          <div className="pt-6 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Link
              href="/login"
              className="px-8 py-3.5 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all text-center"
            >
              Enter Marketplace
            </Link>
            <a
              href="#features"
              className="px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-semibold rounded-xl transition-all text-center"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-slate-800 bg-slate-950 py-20 lg:py-28 relative">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Engineered for Complex Operations
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto text-sm">
              We handle the heavy lifting of chemical unit mappings, pricing precision, and stock levels so you can execute trades instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-lg">
                ⚖
              </div>
              <h3 className="font-bold text-lg text-white">Dynamic Unit Conversion</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Place orders in <strong className="text-slate-200">kilograms, grams, liters, milliliters, or counts</strong>. The system automatically converts quantities to internal database standard units for accurate billing.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-lg">
                🔐
              </div>
              <h3 className="font-bold text-lg text-white">Role-Based Gatekeeping</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Tailored interfaces for <strong className="text-slate-200">Admins, Sellers, and Buyers</strong>. Ensure operational boundaries are respected with NextAuth-secured routing and API-level authorization.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg">
                ⚡
              </div>
              <h3 className="font-bold text-lg text-white">Transactional Stock Reservation</h3>
              <p className="text-sm text-slate-400 leading-relaxed font-light">
                Pending quotations immediately reserve active stock in PostgreSQL. Stock is only deducted when approved, or returned if rejected, preventing double selling.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950/40 py-8 text-center text-xs text-slate-500">
        <p>&copy; {new Date().getFullYear()} AasaMedChem Marketplace. All rights reserved.</p>
      </footer>
    </div>
  );
}