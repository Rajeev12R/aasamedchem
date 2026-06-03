"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DimensionType, ProductStatus } from "@prisma/client";

type SerializedProduct = {
  id: string;
  name: string;
  sku: string;
  category: string | null;
  description: string | null;
  dimensionType: DimensionType;
  baseUnit: string;
  inventoryQuantity: string;
  reservedQuantity: string;
  basePrice: string;
  status: ProductStatus;
};

interface Props {
  products: SerializedProduct[];
  categories: string[];
  baseUrl?: string;
}

export default function ProductsListClient({ products, categories, baseUrl = "/admin/products" }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDimension, setSelectedDimension] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    const matchesDimension =
      selectedDimension === "all" || p.dimensionType === selectedDimension;

    return matchesSearch && matchesCategory && matchesDimension;
  });

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to delete product");
        return;
      }

      toast.success("Product deleted successfully");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
      {/* Search & Filters Header */}
      <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="w-full md:w-80">
          <input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Filters */}
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={selectedDimension}
            onChange={(e) => setSelectedDimension(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="all">All Dimensions</option>
            <option value="WEIGHT">WEIGHT (g/kg)</option>
            <option value="VOLUME">VOLUME (mL/L)</option>
            <option value="COUNT">COUNT (items)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {filteredProducts.length === 0 ? (
        <div className="p-8 text-center text-gray-500 text-sm">
          No products matched your search filters.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700 font-semibold">
                <th className="px-6 py-3">Product Details</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3">Dimension</th>
                <th className="px-6 py-3 text-right">Available Stock</th>
                <th className="px-6 py-3 text-right">Reserved</th>
                <th className="px-6 py-3 text-right">Total Inventory</th>
                <th className="px-6 py-3 text-right">Base Price (INR)</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProducts.map((p) => {
                const total = parseFloat(p.inventoryQuantity);
                const reserved = parseFloat(p.reservedQuantity);
                const available = total - reserved;

                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">SKU: {p.sku}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {p.category ?? "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">
                      {p.dimensionType}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      {available.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                      <span className="text-xs text-gray-400">{p.baseUnit}</span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500 text-xs">
                      {reserved > 0 ? (
                        <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-medium">
                          {reserved.toLocaleString(undefined, { maximumFractionDigits: 4 })} {p.baseUnit}
                        </span>
                      ) : (
                        "0"
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 text-xs">
                      {total.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                      <span className="text-[10px] text-gray-400">{p.baseUnit}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                      ₹{parseFloat(p.basePrice).toFixed(4)}
                      <span className="text-[10px] text-gray-400"> / {p.baseUnit}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                            : "bg-red-100 text-red-800 border border-red-200"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex gap-2">
                        <Link
                          href={`${baseUrl}/${p.id}/edit`}
                          className="px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-medium border border-blue-100 transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          disabled={deletingId === p.id}
                          className="px-3 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-medium border border-red-100 transition-colors disabled:opacity-50"
                        >
                          {deletingId === p.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
