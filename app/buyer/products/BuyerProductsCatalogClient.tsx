"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DimensionType } from "@prisma/client";
import { UNITS } from "@/app/lib/conversions";
import Decimal from "decimal.js";

type Product = {
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
};

interface Props {
  products: Product[];
  categories: string[];
}

type CartItem = {
  productId: string;
  quantity: string;
  unit: string;
  error?: string;
  lineTotal: Decimal;
};

const UNIT_OPTIONS: Record<DimensionType, string[]> = {
  WEIGHT: ["g", "kg"],
  VOLUME: ["mL", "L"],
  COUNT: ["item"],
};

export default function BuyerProductsCatalogClient({ products, categories }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  function addToCart(product: Product) {
    // If already in cart, do nothing
    if (cart.some((item) => item.productId === product.id)) {
      toast.info(`${product.name} is already in the cart`);
      return;
    }

    const defaultUnit = UNIT_OPTIONS[product.dimensionType][0];
    setCart([
      ...cart,
      {
        productId: product.id,
        quantity: "1",
        unit: defaultUnit,
        lineTotal: new Decimal(product.basePrice),
      },
    ]);
  }

  function removeFromCart(productId: string) {
    setCart(cart.filter((item) => item.productId !== productId));
  }

  function updateCartItem(
    productId: string,
    field: "quantity" | "unit",
    value: string
  ) {
    const product = products.find((p) => p.id === productId)!;
    const updated = cart.map((item) => {
      if (item.productId !== productId) return item;

      const updatedItem = { ...item };
      if (field === "quantity") {
        updatedItem.quantity = value;
      } else {
        updatedItem.unit = value;
      }

      // Re-calculate pricing and check stock limits
      try {
        if (!updatedItem.quantity || isNaN(parseFloat(updatedItem.quantity))) {
          updatedItem.lineTotal = new Decimal(0);
          updatedItem.error = "Enter a valid quantity";
          return updatedItem;
        }

        const qtyNum = parseFloat(updatedItem.quantity);
        if (qtyNum <= 0) {
          updatedItem.lineTotal = new Decimal(0);
          updatedItem.error = "Quantity must be greater than 0";
          return updatedItem;
        }

        // Calculate base quantity
        const conversionMap = UNITS[product.dimensionType as keyof typeof UNITS];
        const factor = conversionMap[updatedItem.unit as keyof typeof conversionMap];

        const baseQty = new Decimal(updatedItem.quantity).mul(factor);

        // Check stock availability
        const totalStock = new Decimal(product.inventoryQuantity);
        const reservedStock = new Decimal(product.reservedQuantity);
        const availableStock = totalStock.sub(reservedStock);

        if (baseQty.gt(availableStock)) {
          const formattedAvailable = availableStock.toString();
          updatedItem.error = `Exceeds stock limit. Max available: ${formattedAvailable} ${product.baseUnit}`;
        } else {
          updatedItem.error = undefined;
        }

        // Calculate line total
        updatedItem.lineTotal = baseQty.mul(new Decimal(product.basePrice));
      } catch (err) {
        updatedItem.lineTotal = new Decimal(0);
        updatedItem.error = (err as Error).message;
      }

      return updatedItem;
    });

    setCart(updated);
  }

  // Calculate Cart Total
  const cartTotal = cart.reduce((sum, item) => sum.add(item.lineTotal), new Decimal(0));
  const hasCartErrors = cart.some((item) => !!item.error);

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (hasCartErrors) {
      toast.error("Please resolve stock errors in the cart before submitting");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unit: item.unit,
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to place quotation");
        return;
      }

      toast.success("Quotation submitted successfully!");
      setCart([]);
      router.push("/buyer/quotations");
      router.refresh();
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Left: Products List */}
      <div className="lg:col-span-2 space-y-6">
        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
          <input
            placeholder="Search by name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-72 border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-hidden"
          />

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full sm:w-48 border rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500/20 outline-hidden"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Catalog Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-xl border border-gray-200">
            No chemicals available matching your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProducts.map((p) => {
              const available = parseFloat(p.inventoryQuantity) - parseFloat(p.reservedQuantity);
              const isOutOfStock = available <= 0;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-wider">
                        {p.category ?? "General"}
                      </span>
                      <span className="text-xs text-gray-400 font-mono">SKU: {p.sku}</span>
                    </div>

                    <h3 className="font-bold text-gray-900 text-lg mt-3">{p.name}</h3>
                    {p.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {p.description}
                      </p>
                    )}

                    <div className="mt-4 grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-3 text-xs text-gray-600">
                      <div>
                        <p className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">
                          Base Price
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          ₹{parseFloat(p.basePrice).toFixed(4)}
                          <span className="text-[10px] text-gray-400 font-normal"> / {p.baseUnit}</span>
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">
                          Available Stock
                        </p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">
                          {isOutOfStock ? (
                            <span className="text-red-600">Out of Stock</span>
                          ) : (
                            <>
                              {available.toLocaleString(undefined, { maximumFractionDigits: 4 })}{" "}
                              <span className="text-xs font-normal text-gray-400">{p.baseUnit}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(p)}
                    disabled={isOutOfStock}
                    className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
                  >
                    Add to Quote
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right: Shopping Cart Sidebar */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 sticky top-24">
        <h2 className="font-bold text-lg text-gray-900 border-b border-gray-100 pb-4 flex items-center justify-between">
          <span>Quotation Cart</span>
          {cart.length > 0 && (
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">
              {cart.length}
            </span>
          )}
        </h2>

        {cart.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">
            🛒 Your quote cart is empty. Add products from the catalog.
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            <div className="divide-y divide-gray-150 max-h-[350px] overflow-y-auto pr-1">
              {cart.map((item) => {
                const product = products.find((p) => p.id === item.productId)!;

                return (
                  <div key={item.productId} className="py-4 first:pt-0 space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{product.name}</p>
                        <p className="text-[10px] text-gray-400">SKU: {product.sku}</p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.productId)}
                        className="text-xs text-red-500 font-semibold hover:underline"
                      >
                        Remove
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        step="any"
                        min="0.0000000001"
                        value={item.quantity}
                        onChange={(e) =>
                          updateCartItem(item.productId, "quantity", e.target.value)
                        }
                        className="border rounded-lg px-2.5 py-1.5 text-xs bg-white w-24 focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                      />

                      <select
                        value={item.unit}
                        onChange={(e) => updateCartItem(item.productId, "unit", e.target.value)}
                        className="border rounded-lg px-2.5 py-1.5 text-xs bg-white focus:ring-2 focus:ring-blue-500/20 outline-hidden font-medium"
                      >
                        {UNIT_OPTIONS[product.dimensionType].map((u) => (
                          <option key={u} value={u}>
                            {u}
                          </option>
                        ))}
                      </select>

                      <div className="flex-1 text-right">
                        <span className="text-xs font-bold text-gray-900">
                          ₹{item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Unit Conversion Helper Math */}
                    {item.quantity && !isNaN(parseFloat(item.quantity)) && (
                      <div className="text-[10px] text-gray-400 bg-gray-50 p-2 rounded-md font-mono flex flex-col gap-0.5">
                        <span>
                          {item.quantity} {item.unit} ={" "}
                          {new Decimal(item.quantity)
                            .mul(UNITS[product.dimensionType][item.unit as keyof (typeof UNITS)[typeof product.dimensionType]])
                            .toString()}{" "}
                          {product.baseUnit}
                        </span>
                        <span>
                          Rate: ₹{parseFloat(product.basePrice).toFixed(4)} / {product.baseUnit}
                        </span>
                      </div>
                    )}

                    {/* Validation Errors */}
                    {item.error && (
                      <p className="text-[10px] text-red-600 bg-red-50 p-1.5 rounded-sm font-semibold">
                        ⚠️ {item.error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Total Section */}
            <div className="border-t border-gray-200 pt-4 space-y-4">
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-gray-600">Total Quote Amount:</span>
                <span className="text-2xl font-bold text-blue-700">
                  ₹{cartTotal.toFixed(2)}
                </span>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading || hasCartErrors || cart.length === 0}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg text-sm shadow-xs transition-colors disabled:opacity-50 disabled:bg-gray-100 disabled:text-gray-400"
              >
                {loading ? "Submitting Quotation..." : "Submit Quotation Request"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
