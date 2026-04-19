"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/data";
import {
  MapPin, Search, X, Check, AlertTriangle,
  ChevronLeft, ChevronRight, Loader2, FlaskConical,
} from "lucide-react";
import type { SkinProfile } from "@/lib/types";

const CATEGORIES = [
  "all","cleanser","toner","serum","moisturizer","sunscreen",
  "eye-cream","exfoliant","mask","oil","spot-treatment","retinol",
];

interface ApiProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  ingredientList: string[];
}

interface NearbyStore {
  placeId: string;
  name: string;
  address: string;
  distanceMiles: number;
  mapsUrl: string;
}

function getPros(product: ApiProduct, profile: SkinProfile | null): string[] {
  if (!profile) return [];
  const ing = product.ingredientList.join(" ").toLowerCase();
  const pros: string[] = [];

  const skinTypeIngs: Record<string, string[]> = {
    dry:         ["hyaluronic acid", "ceramide", "glycerin", "squalane", "shea"],
    oily:        ["niacinamide", "salicylic acid", "zinc", "kaolin"],
    combination: ["niacinamide", "hyaluronic acid", "glycerin"],
    sensitive:   ["aloe", "centella", "allantoin", "oat", "ceramide", "panthenol"],
    normal:      ["vitamin c", "retinol", "peptide"],
  };

  const matched = (skinTypeIngs[profile.skinType] || []).filter(i => ing.includes(i));
  if (matched.length > 0)
    pros.push(`Good for ${profile.skinType} skin: contains ${matched.slice(0, 2).join(", ")}`);
  if (product.ingredientList.length > 10)
    pros.push(`Detailed formula (${product.ingredientList.length} ingredients)`);
  if (product.brand)
    pros.push(`From established brand: ${product.brand}`);
  return pros.slice(0, 3);
}

function getCons(product: ApiProduct, profile: SkinProfile | null): string[] {
  if (!profile) return [];
  const ing = product.ingredientList.join(" ").toLowerCase();
  const cons: string[] = [];

  const allergyFlags = profile.allergies.filter(a => ing.includes(a.toLowerCase()));
  if (allergyFlags.length > 0)
    cons.push(`May contain your allergen: ${allergyFlags[0]}`);
  if (profile.skinType === "sensitive" &&
      ["fragrance", "parfum", "alcohol denat", "menthol"].some(t => ing.includes(t)))
    cons.push("Contains potential irritants for sensitive skin");
  if (product.ingredientList.length === 0)
    cons.push("No ingredient detail in database — verify before buying");
  return cons.slice(0, 2);
}

export default function ProductsPage() {
  const profile = useAppStore((s) => s.profile);
  const [products, setProducts]         = useState<ApiProduct[]>([]);
  const [total, setTotal]               = useState(0);
  const [loading, setLoading]           = useState(false);
  const [dbReady, setDbReady]           = useState(true);
  const [search, setSearch]             = useState("");
  const [debouncedSearch, setDebounced] = useState("");
  const [category, setCategory]         = useState("all");
  const [page, setPage]                 = useState(0);
  const [zipCode, setZipCode]           = useState(profile?.location ?? "");
  const [submittedZip, setSubmittedZip] = useState(profile?.location ?? "");
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[] | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError]   = useState<string | null>(null);
  const LIMIT = 24;

  const selectedProduct =
    selectedId ? products.find((p) => p.id === selectedId) : undefined;

  useEffect(() => {
    if (!selectedProduct || !submittedZip) {
      setNearbyStores(null);
      setStoresError(null);
      setStoresLoading(false);
      return;
    }

    let cancelled = false;
    setStoresLoading(true);
    setStoresError(null);
    setNearbyStores(null);

    const params = new URLSearchParams({
      zip: submittedZip,
      brand: selectedProduct.brand ?? "",
      product: selectedProduct.name ?? "",
    });
    fetch(`/api/stores?${params}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setStoresError(data.error);
          setNearbyStores(null);
        } else {
          setNearbyStores(data.stores ?? []);
          setStoresError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStoresError("Could not load nearby stores");
          setNearbyStores(null);
        }
      })
      .finally(() => {
        if (!cancelled) setStoresLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    submittedZip,
    selectedProduct?.id,
    selectedProduct?.brand,
    selectedProduct?.name,
  ]);

  useEffect(() => {
    const t = setTimeout(() => { setDebounced(search); setPage(0); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: debouncedSearch, category,
        limit: String(LIMIT), offset: String(page * LIMIT),
      });
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      if (data.error) { setDbReady(false); return; }
      setProducts(data.products);
      setTotal(data.total);
      setDbReady(true);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, category, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-brand-900 mb-1">Product Finder</h1>
        <p className="text-brand-600 text-sm">
          {dbReady
            ? <>{total.toLocaleString()} products from the <a href="https://github.com/LauraAddams/skincareAPI" target="_blank" rel="noopener noreferrer" className="text-brand-500 hover:underline">LauraAddams Skincare API</a> — US, Korean &amp; Japanese brands.</>
            : "Database is initializing — run the build script to populate it."
          }
          {profile && <> <Link href="/analyze" className="text-brand-500 font-medium hover:underline ml-1">Your personalized picks →</Link></>}
        </p>
      </div>

      {!dbReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-sm text-amber-700">
          Run <code className="bg-amber-100 px-1 rounded">python3 scripts/build_skincare_db.py</code> to build the database.
        </div>
      )}

      {/* ZIP finder */}
      <div className="bg-brand-50 border border-brand-200 rounded-xl p-4 mb-5">
        <div className="flex items-center gap-2 mb-2">
          <MapPin size={14} className="text-brand-500" />
          <span className="text-sm font-semibold text-brand-900">Find products near you</span>
        </div>
        <div className="flex gap-2">
          <input
            value={zipCode}
            onChange={(e) => setZipCode(e.target.value)}
            placeholder="Enter ZIP code..."
            maxLength={10}
            className="w-36 text-sm border border-brand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
          <button
            onClick={() => setSubmittedZip(zipCode)}
            className="bg-brand-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            Find stores
          </button>
        </div>
        {submittedZip && (
          <p className="text-xs text-brand-500 mt-2">
            Showing retailers near <span className="font-medium">{submittedZip}</span> that may carry skincare. Open a product to see nearby places (Google Places).
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products, brands, ingredients..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-brand-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-400 hover:text-brand-700">
              <X size={13} />
            </button>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => { setCategory(cat); setPage(0); }}
              className={cn(
                "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors capitalize",
                category === cat
                  ? "bg-brand-500 text-white border-brand-500"
                  : "border-brand-200 text-brand-600 hover:border-brand-400"
              )}>
              {cat === "all" ? "All" : (PRODUCT_CATEGORY_LABELS[cat] ?? cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="text-xs text-brand-400 mb-4">
        {loading ? "Loading…" : `${total.toLocaleString()} products`}
        {total > LIMIT && ` · page ${page + 1} of ${totalPages}`}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand-400" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isSelected = selectedId === product.id;
            const pros = getPros(product, profile);
            const cons = getCons(product, profile);
            return (
              <div key={product.id} className={cn(
                "border rounded-xl bg-white transition-colors",
                isSelected ? "border-brand-400" : "border-brand-200 hover:border-brand-300"
              )}>
                <button className="w-full text-left p-4" onClick={() => setSelectedId(isSelected ? null : product.id)}>
                  <div className="flex items-start gap-3">
                    {/* Icon placeholder (no images in this dataset) */}
                    <div className="w-12 h-12 bg-brand-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                      <FlaskConical size={18} className="text-brand-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-brand-400 font-semibold uppercase tracking-wide truncate capitalize">{product.brand || "Unknown Brand"}</div>
                      <div className="font-semibold text-brand-900 text-sm leading-tight mt-0.5 line-clamp-2 capitalize">{product.name}</div>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full capitalize">
                          {PRODUCT_CATEGORY_LABELS[product.category] ?? product.category}
                        </span>
                        {product.ingredientList.length > 0 && (
                          <span className="text-xs text-brand-400">{product.ingredientList.length} ingredients</span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>

                {/* Expanded */}
                {isSelected && (
                  <div className="px-4 pb-4 border-t border-brand-100">
                    <div className="pt-3 space-y-3">

                      {/* Pros & Cons */}
                      {(pros.length > 0 || cons.length > 0) && (
                        <div className="grid grid-cols-2 gap-2">
                          {pros.length > 0 && (
                            <div className="bg-green-50 border border-green-100 rounded-lg p-2.5">
                              <div className="text-xs font-semibold text-green-800 mb-1.5 flex items-center gap-1"><Check size={10} /> Pros</div>
                              {pros.map((p, i) => <div key={i} className="text-xs text-green-700 flex gap-1 mt-0.5"><span className="text-green-400">+</span>{p}</div>)}
                            </div>
                          )}
                          {cons.length > 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                              <div className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1"><AlertTriangle size={10} /> Watch out</div>
                              {cons.map((c, i) => <div key={i} className="text-xs text-amber-700 flex gap-1 mt-0.5"><span className="text-amber-400">−</span>{c}</div>)}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Full ingredient list */}
                      {product.ingredientList.length > 0 && (
                        <div>
                          <div className="text-xs font-semibold text-brand-700 mb-1.5">Ingredient list</div>
                          <div className="flex flex-wrap gap-1">
                            {product.ingredientList.slice(0, 20).map((ing, i) => (
                              <span key={i} className="text-xs bg-brand-50 border border-brand-100 text-brand-600 px-2 py-0.5 rounded-full capitalize">{ing}</span>
                            ))}
                            {product.ingredientList.length > 20 && (
                              <span className="text-xs text-brand-400">+{product.ingredientList.length - 20} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Nearby retailers (Google Places) */}
                      {submittedZip && (
                        <div>
                          <div className="text-xs font-semibold text-brand-700 mb-1.5 flex items-center gap-1">
                            <MapPin size={11} /> Near {submittedZip} · {product.brand ? `${product.brand} / ` : ""}{product.name.slice(0, 40)}
                            {product.name.length > 40 ? "…" : ""}
                          </div>
                          {storesLoading && (
                            <div className="flex items-center gap-2 text-xs text-brand-500 py-2">
                              <Loader2 size={14} className="animate-spin" /> Finding stores…
                            </div>
                          )}
                          {storesError && (
                            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">{storesError}</p>
                          )}
                          {!storesLoading && !storesError && nearbyStores && nearbyStores.length === 0 && (
                            <p className="text-xs text-brand-500">No stores found in this area — try another ZIP.</p>
                          )}
                          {!storesLoading && nearbyStores && nearbyStores.length > 0 && (
                            <div className="space-y-1">
                              {nearbyStores.slice(0, 6).map((store) => (
                                <div
                                  key={store.placeId}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-brand-50 rounded-lg px-2.5 py-1.5"
                                >
                                  <div className="text-xs min-w-0">
                                    <span className="font-medium text-brand-900">{store.name}</span>
                                    <span className="text-brand-400 font-normal"> · {store.distanceMiles} mi</span>
                                    {store.address && (
                                      <div className="text-brand-500 font-normal truncate">{store.address}</div>
                                    )}
                                  </div>
                                  <a
                                    href={store.mapsUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-brand-600 font-medium hover:underline shrink-0"
                                  >
                                    Maps →
                                  </a>
                                </div>
                              ))}
                            </div>
                          )}
                          <p className="text-[10px] text-brand-400 mt-1.5 leading-relaxed">
                            Inventory isn&apos;t verified — call ahead to confirm this product.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-brand-200 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <ChevronLeft size={14} /> Prev
          </button>
          <span className="text-sm text-brand-500">Page {page + 1} of {totalPages.toLocaleString()}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-brand-200 rounded-lg text-brand-600 hover:bg-brand-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            Next <ChevronRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
