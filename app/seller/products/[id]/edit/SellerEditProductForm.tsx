"use client";

import { useState } from "react";
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
  basePrice: string;
  status: ProductStatus;
};

const UNIT_OPTIONS: Record<DimensionType, string[]> = {
  WEIGHT: ["g", "kg"],
  VOLUME: ["mL", "L"],
  COUNT: ["item"],
};

export default function SellerEditProductForm({ product }: { product: SerializedProduct }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: product.name,
    sku: product.sku,
    category: product.category ?? "",
    description: product.description ?? "",
    dimensionType: product.dimensionType,
    quantity: product.inventoryQuantity,
    unit: product.baseUnit,
    basePrice: product.basePrice,
    status: product.status,
  });

  function handleDimensionChange(dim: DimensionType) {
    const defaultUnit = UNIT_OPTIONS[dim][0];
    setForm((f) => ({
      ...f,
      dimensionType: dim,
      unit: defaultUnit,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to update product");
        return;
      }

      toast.success("Product updated successfully");
      router.push("/seller/products");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl border border-gray-200 shadow-xs">
      <h1 className="text-2xl font-bold mb-6 text-gray-900">Edit Product</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            placeholder="e.g. Acetone"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
          />
        </div>

        {/* SKU */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            required
            placeholder="e.g. ACE-001"
            value={form.sku}
            onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Category</label>
          <input
            placeholder="e.g. Solvents"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">Description</label>
          <textarea
            placeholder="Optional product description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="border rounded-lg px-3 py-2 min-h-[80px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
          />
        </div>

        {/* Dimension Type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Dimension Type <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {(["WEIGHT", "VOLUME", "COUNT"] as DimensionType[]).map((dim) => (
              <label
                key={dim}
                className={`flex items-center gap-2 border rounded-lg px-4 py-2.5 cursor-pointer text-sm font-medium transition-all ${
                  form.dimensionType === dim
                    ? "border-emerald-600 bg-emerald-50/50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <input
                  type="radio"
                  name="dimensionType"
                  value={dim}
                  checked={form.dimensionType === dim}
                  onChange={() => handleDimensionChange(dim)}
                  className="sr-only"
                />
                {dim}
              </label>
            ))}
          </div>
        </div>

        {/* Quantity + Unit */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Inventory Quantity <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              required
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 25.5"
              value={form.quantity}
              onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
              className="border rounded-lg px-3 py-2 flex-1 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
            />
            <select
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-sm"
            >
              {UNIT_OPTIONS[form.dimensionType].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            Will be converted and stored in base unit (
            {form.dimensionType === "WEIGHT"
              ? "g"
              : form.dimensionType === "VOLUME"
              ? "mL"
              : "item"}
            )
          </p>
        </div>

        {/* Base Price */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Base Price (per base unit) <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 0.375"
            value={form.basePrice}
            onChange={(e) => setForm((f) => ({ ...f, basePrice: e.target.value }))}
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-hidden"
          />
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">
            Product Status <span className="text-red-500">*</span>
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProductStatus }))}
            className="border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-emerald-500/20 outline-hidden text-sm"
          >
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm"
          >
            {loading ? "Saving..." : "Save Product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-6 py-2.5 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
