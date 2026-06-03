"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type DimensionType = "WEIGHT" | "VOLUME" | "COUNT";

const UNIT_OPTIONS: Record<DimensionType, string[]> = {
  WEIGHT: ["g", "kg"],
  VOLUME: ["mL", "L"],
  COUNT: ["item"],
};

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category: "",
    description: "",
    dimensionType: "WEIGHT" as DimensionType,
    quantity: "",
    unit: "g",
    basePrice: "",
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to create product");
        return;
      }

      toast.success("Product created successfully");
      router.push("/admin/products");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">
        Create Product
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            required
            placeholder="e.g. Acetone"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            className="border rounded px-3 py-2"
          />
        </div>

        {/* SKU */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            SKU <span className="text-red-500">*</span>
          </label>
          <input
            required
            placeholder="e.g. ACE-001"
            value={form.sku}
            onChange={(e) =>
              setForm((f) => ({ ...f, sku: e.target.value }))
            }
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Category */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <input
            placeholder="e.g. Solvents"
            value={form.category}
            onChange={(e) =>
              setForm((f) => ({ ...f, category: e.target.value }))
            }
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Description</label>
          <textarea
            placeholder="Optional product description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            className="border rounded px-3 py-2 min-h-[80px]"
          />
        </div>

        {/* Dimension Type */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
            Dimension Type <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-3">
            {(["WEIGHT", "VOLUME", "COUNT"] as DimensionType[]).map(
              (dim) => (
                <label
                  key={dim}
                  className={`flex items-center gap-2 border rounded px-4 py-2 cursor-pointer ${
                    form.dimensionType === dim
                      ? "border-blue-600 bg-blue-50"
                      : ""
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
              )
            )}
          </div>
        </div>

        {/* Quantity + Unit */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">
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
              onChange={(e) =>
                setForm((f) => ({ ...f, quantity: e.target.value }))
              }
              className="border rounded px-3 py-2 flex-1"
            />
            <select
              value={form.unit}
              onChange={(e) =>
                setForm((f) => ({ ...f, unit: e.target.value }))
              }
              className="border rounded px-3 py-2"
            >
              {UNIT_OPTIONS[form.dimensionType].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">
            Will be stored in base unit (
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
          <label className="text-sm font-medium">
            Base Price (per base unit){" "}
            <span className="text-red-500">*</span>
          </label>
          <input
            required
            type="number"
            step="any"
            min="0"
            placeholder="e.g. 0.375"
            value={form.basePrice}
            onChange={(e) =>
              setForm((f) => ({ ...f, basePrice: e.target.value }))
            }
            className="border rounded px-3 py-2"
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Product"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border px-6 py-2 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
