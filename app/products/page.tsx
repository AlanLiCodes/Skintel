"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { PRODUCTS } from "@/lib/data";
import { cn, formatCurrency, scoreToLabel, scoreToColor } from "@/lib/utils";
import { SKIN_CONCERN_LABELS, PRODUCT_CATEGORY_LABELS } from "@/lib/data";
import type { ProductCategory, SkinConcern } from "@/lib/types";
import { MapPin, Search, Package, Star, Filter, X } from "lucide-react";

const MOCK_STORES = [
  { name: "Target", address: "123 Main St", distance: 0.4, chain: "Target" },
  { name: "CVS Pharmacy", address: "456 Oak Ave", distance: 0.8, chain: "CVS" },
  { name: "Sephora", address: "Shopping Center, Suite 12", distance: 1.2, chain: "Sephora" },
  { name: "ULTA Beauty", address: "789 Commerce Blvd", distance: 2.1, chain: "ULTA" },
  { name: "Walgreens", address: "321 Elm Street", distance: 2.4, chain: "Walgreens" },
];

export default function ProductsPage() {
  const profile = useAppStore((s) => s.profile);
  const analysis = useAppStore((s) => s.analysis);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [zipCode, setZipCode] = useState(profile?.location ?? "");
  const [submittedZip, setSubmittedZip] = useState(profile?.location ?? "");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const filteredProducts = PRODUCTS.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase()) ||
      p.keyIngredients.some((i) => i.includes(search.toLowerCase()));
    const matchesCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(PRODUCTS.map((p) => p.category))) as ProductCategory[];

  const getProductStores = (product: typeof PRODUCTS[0]) => {
    return MOCK_STORES.filter((store) =>
      product.purchaseLinks.some((link) => link.retailer === store.chain)
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight mb-1">Product Finder</h1>
        <p className="text-stone-500 text-sm">
          Browse curated products — see what's in each one and find it near you.
          {profile && (
            <> <Link href="/analyze" className="text-stone-900 font-medium hover:underline">View your personalized picks →</Link></>
          )}
        </p>
      </div>

      {/* ZIP code finder */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <MapPin size={14} className="text-stone-500" />
          <span className="text-sm font-medium text-stone-900">Find products near you</span>
        </div>
        <div className="flex gap-2">
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code..."
            maxLength={10}
            className="w-40 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          <button
            onClick={() => setSubmittedZip(zipCode)}
            className="bg-stone-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Find stores
          </button>
        </div>
        {submittedZip && (
          <p className="text-xs text-stone-500 mt-2">
            Showing stores near <span className="font-medium">{submittedZip}</span>. Click a product to see nearby availability.
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products or ingredients..."
            className="w-full pl-9 pr-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-300"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700">
              <X size={13} />
            </button>
          )}
        </div>

        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setCategoryFilter("all")}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
              categoryFilter === "all" ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"
            )}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
                categoryFilter === cat ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-600 hover:border-stone-400"
              )}
            >
              {PRODUCT_CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-stone-400 mb-4">{filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}</div>

      {/* Product grid */}
      <div className="grid sm:grid-cols-2 gap-4">
        {filteredProducts.map((product) => {
          const isSelected = selectedProduct === product.id;
          const stores = getProductStores(product);
          return (
            <div key={product.id} className={cn(
              "border rounded-xl bg-white transition-colors",
              isSelected ? "border-stone-400" : "border-stone-200 hover:border-stone-300"
            )}>
              <button
                className="w-full text-left p-4"
                onClick={() => setSelectedProduct(isSelected ? null : product.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="w-14 h-14 bg-stone-100 rounded-lg flex-shrink-0 overflow-hidden">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56'%3E%3Crect width='56' height='56' fill='%23e7e5e4'/%3E%3C/svg%3E"; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-stone-400 font-medium uppercase tracking-wide">{product.brand}</div>
                    <div className="font-semibold text-stone-900 text-sm">{product.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-stone-500">{PRODUCT_CATEGORY_LABELS[product.category]}</span>
                      <span className="text-stone-300">·</span>
                      <div className="flex items-center gap-0.5 text-xs text-stone-500">
                        <Star size={10} className="text-amber-400 fill-amber-400" />
                        {product.rating}
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {product.keyIngredients.map((ing) => (
                        <span key={ing} className="text-xs bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-md">{ing.replace(/-/g, " ")}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 font-semibold text-stone-900">{formatCurrency(product.price)}</div>
                </div>
              </button>

              {/* Expanded: store availability */}
              {isSelected && (
                <div className="px-4 pb-4 pt-0 border-t border-stone-100 mt-0">
                  <div className="pt-3">
                    <p className="text-xs text-stone-600 leading-relaxed mb-3">{product.description}</p>

                    {submittedZip && stores.length > 0 ? (
                      <div>
                        <div className="text-xs font-semibold text-stone-500 mb-2 flex items-center gap-1">
                          <MapPin size={11} />
                          Stores near {submittedZip}
                        </div>
                        <div className="space-y-1.5">
                          {stores.map((store) => {
                            const link = product.purchaseLinks.find((l) => l.retailer === store.chain);
                            return (
                              <div key={store.name} className="flex items-center justify-between bg-stone-50 rounded-lg px-3 py-2">
                                <div>
                                  <div className="text-xs font-medium text-stone-900">{store.name}</div>
                                  <div className="text-xs text-stone-400">{store.address} · {store.distance} mi</div>
                                </div>
                                <div className="flex items-center gap-2">
                                  {link && (
                                    <span className={cn(
                                      "text-xs font-medium",
                                      link.inStock ? "text-green-600" : "text-stone-400"
                                    )}>
                                      {link.inStock ? "In stock" : "Out of stock"}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs font-semibold text-stone-500 mb-2">Buy online</div>
                        <div className="flex flex-wrap gap-2">
                          {product.purchaseLinks.map((link) => (
                            <a
                              key={link.retailer}
                              href={link.url}
                              className={cn(
                                "text-xs border px-2.5 py-1 rounded-md font-medium transition-colors",
                                link.inStock
                                  ? "border-stone-200 text-stone-700 hover:bg-stone-50"
                                  : "border-stone-100 text-stone-300"
                              )}
                            >
                              {link.retailer} — {formatCurrency(link.price)}
                              {!link.inStock && " (OOS)"}
                            </a>
                          ))}
                        </div>
                        {!submittedZip && (
                          <p className="text-xs text-stone-400 mt-2">Enter your ZIP code above to see nearby store availability.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
