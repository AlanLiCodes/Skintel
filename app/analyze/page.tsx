"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { analyzeSkinProfile } from "@/lib/ai";
import {
  SKIN_CONCERN_LABELS,
  PRODUCT_CATEGORY_LABELS,
  MOCK_FOOD_RECOMMENDATIONS,
} from "@/lib/data";
import { cn, scoreToLabel, scoreToColor, safetyLabel } from "@/lib/utils";
import type { FoodRecommendations, SkinAnalysis } from "@/lib/types";
import {
  Sparkles, FlaskConical, Package, Leaf,
  ChevronRight, Check, AlertTriangle, Info, MapPin,
  Apple, Coffee, Loader2,
} from "lucide-react";

interface DbRec {
  product: {
    id: string; name: string; brand: string; category: string;
    ingredientList: string[];
  };
  score: number;
  reason: string;
  pros: string[];
  cons: string[];
}

interface NearbyStore {
  placeId: string;
  name: string;
  address: string;
  distanceMiles: number;
  mapsUrl: string;
}

const TABS = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "ingredients", label: "Ingredients", icon: FlaskConical },
  { id: "products", label: "Products", icon: Package },
  { id: "routine", label: "Routine", icon: Check },
  { id: "food", label: "Nutrition", icon: Leaf },
];

export default function AnalyzePage() {
  const router = useRouter();
  const profile = useAppStore((s) => s.profile);
  const existingAnalysis = useAppStore((s) => s.analysis);
  const setAnalysis = useAppStore((s) => s.setAnalysis);
  const isAnalyzing = useAppStore((s) => s.isAnalyzing);
  const setIsAnalyzing = useAppStore((s) => s.setIsAnalyzing);

  const [activeTab, setActiveTab] = useState("overview");
  const [localAnalysis, setLocalAnalysis] = useState<SkinAnalysis | null>(existingAnalysis);
  const [dbProducts, setDbProducts]   = useState<DbRec[]>([]);
  const [dbLoading, setDbLoading]     = useState(false);
  const [dbError, setDbError]         = useState(false);

  const [storePanelProductId, setStorePanelProductId] = useState<string | null>(null);
  const [storeZipInput, setStoreZipInput] = useState(() => profile?.location ?? "");
  const [storeSubmittedZip, setStoreSubmittedZip] = useState("");
  const [nearbyStores, setNearbyStores] = useState<NearbyStore[] | null>(null);
  const [storesLoading, setStoresLoading] = useState(false);
  const [storesError, setStoresError] = useState<string | null>(null);

  const selectedStoreProduct = storePanelProductId
    ? dbProducts.find((r) => r.product.id === storePanelProductId)?.product
    : undefined;

  useEffect(() => {
    if (!selectedStoreProduct || !storeSubmittedZip.trim()) {
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
      zip: storeSubmittedZip.trim(),
      brand: selectedStoreProduct.brand ?? "",
      product: selectedStoreProduct.name ?? "",
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
    storeSubmittedZip,
    selectedStoreProduct?.id,
    selectedStoreProduct?.brand,
    selectedStoreProduct?.name,
  ]);

  const toggleStorePanel = (rec: DbRec) => {
    const id = rec.product.id;
    if (storePanelProductId === id) {
      setStorePanelProductId(null);
      return;
    }
    setStorePanelProductId(id);
    const z = storeZipInput.trim() || profile?.location?.trim() || "";
    if (z) {
      setStoreZipInput(z);
      setStoreSubmittedZip(z);
    } else {
      setStoreSubmittedZip("");
      setNearbyStores(null);
      setStoresError(null);
    }
  };

  const submitStoreZip = () => {
    const z = storeZipInput.trim();
    if (!z) {
      setStoresError("Enter a ZIP or postal code");
      setNearbyStores(null);
      return;
    }
    setStoresError(null);
    setStoreSubmittedZip(z);
  };

  const fetchDbProducts = async () => {
    if (!profile) return;
    setDbLoading(true);
    setDbError(false);
    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType:  profile.skinType,
          concerns:  profile.concerns,
          allergies: profile.allergies,
        }),
      });
      const data = await res.json();
      if (data.error) { setDbError(true); return; }
      setDbProducts(data.recommendations ?? []);
    } catch {
      setDbError(true);
    } finally {
      setDbLoading(false);
    }
  };

  useEffect(() => {
    if (!profile) {
      router.push("/profile");
      return;
    }

    if (!existingAnalysis) {
      runAnalysis();
    }
  }, []);

  const runAnalysis = async () => {
    if (!profile) return;
    setIsAnalyzing(true);
    try {
      const [result, nutritionRes] = await Promise.all([
        analyzeSkinProfile(profile),
        fetch("/api/nutrition", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profile }),
        }).catch(() => null),
      ]);

      let foodRecommendations: FoodRecommendations = MOCK_FOOD_RECOMMENDATIONS;
      if (nutritionRes?.ok) {
        try {
          const raw = (await nutritionRes.json()) as FoodRecommendations & { error?: string };
          if (
            !raw.error &&
            Array.isArray(raw.beneficial) &&
            (raw.beneficial.length > 0 ||
              (Array.isArray(raw.avoid) && raw.avoid.length > 0) ||
              (Array.isArray(raw.supplements) && raw.supplements.length > 0))
          ) {
            foodRecommendations = {
              beneficial: raw.beneficial ?? [],
              avoid: raw.avoid ?? [],
              supplements: raw.supplements ?? [],
            };
          }
        } catch {
          /* keep fallback */
        }
      }

      const merged: SkinAnalysis = { ...result, foodRecommendations };
      setAnalysis(merged);
      setLocalAnalysis(merged);
    } finally {
      setIsAnalyzing(false);
    }
    fetchDbProducts();
  };

  // Fetch DB products when tab becomes active
  useEffect(() => {
    if (activeTab === "products" && dbProducts.length === 0 && !dbLoading) {
      fetchDbProducts();
    }
  }, [activeTab]);

  if (!profile) return null;

  if (isAnalyzing || !localAnalysis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
        <div className="text-stone-600 text-sm">Analyzing your skin profile...</div>
      </div>
    );
  }

  const analysis = localAnalysis;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">Your skin analysis</h1>
          <p className="text-stone-500 text-sm mt-1 capitalize">{profile.skinType} skin · {profile.concerns.length} concerns analyzed</p>
        </div>
        <div className="flex gap-2">
          <Link href="/profile" className="text-sm text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors">
            Edit profile
          </Link>
          <button
            onClick={runAnalysis}
            className="text-sm bg-stone-900 text-white px-3 py-1.5 rounded-lg hover:bg-stone-800 transition-colors"
          >
            Re-analyze
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-stone-100 p-1 rounded-xl mb-6 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex-1 min-w-fit flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
              activeTab === id
                ? "bg-white text-stone-900 shadow-sm"
                : "text-stone-500 hover:text-stone-700"
            )}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="animate-in">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={15} className="text-stone-600" />
                <span className="text-sm font-semibold text-stone-900">AI Summary</span>
              </div>
              <p className="text-sm text-stone-600 leading-relaxed">{analysis.summary}</p>
            </div>

            {/* Primary concerns */}
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-3">Top concerns identified</h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {analysis.primaryConcerns.map((concern) => (
                  <div key={concern.concern} className="border border-stone-200 rounded-xl p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-stone-900">{SKIN_CONCERN_LABELS[concern.concern]}</span>
                      <span className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        concern.severity === "mild" ? "bg-green-50 text-green-700" :
                        concern.severity === "moderate" ? "bg-amber-50 text-amber-700" :
                        "bg-red-50 text-red-700"
                      )}>
                        {concern.severity}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">{concern.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="border border-stone-200 rounded-xl p-4 text-center bg-white">
                <div className="text-2xl font-semibold text-stone-900">{analysis.recommendedIngredients.length}</div>
                <div className="text-xs text-stone-500 mt-1">Ingredients recommended</div>
              </div>
              <div className="border border-stone-200 rounded-xl p-4 text-center bg-white">
                <div className="text-2xl font-semibold text-stone-900">{analysis.recommendedProducts.length}</div>
                <div className="text-xs text-stone-500 mt-1">Product matches</div>
              </div>
              <div className="border border-stone-200 rounded-xl p-4 text-center bg-white">
                <div className="text-2xl font-semibold text-stone-900">{analysis.foodRecommendations.beneficial.length}</div>
                <div className="text-xs text-stone-500 mt-1">Beneficial foods</div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid sm:grid-cols-2 gap-3">
              <button onClick={() => setActiveTab("ingredients")} className="flex items-center justify-between border border-stone-200 rounded-xl p-4 hover:bg-stone-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <FlaskConical size={16} className="text-stone-500" />
                  <div>
                    <div className="text-sm font-medium text-stone-900">View ingredient guide</div>
                    <div className="text-xs text-stone-500">{analysis.recommendedIngredients.filter(i => i.priority === "essential").length} essential ingredients</div>
                  </div>
                </div>
                <ChevronRight size={15} className="text-stone-400" />
              </button>
              <button onClick={() => setActiveTab("routine")} className="flex items-center justify-between border border-stone-200 rounded-xl p-4 hover:bg-stone-50 transition-colors text-left">
                <div className="flex items-center gap-3">
                  <Check size={16} className="text-stone-500" />
                  <div>
                    <div className="text-sm font-medium text-stone-900">Your AM/PM routine</div>
                    <div className="text-xs text-stone-500">{analysis.routineSuggestion.am.length + analysis.routineSuggestion.pm.length} steps total</div>
                  </div>
                </div>
                <ChevronRight size={15} className="text-stone-400" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "ingredients" && (
          <div className="space-y-4">
            <p className="text-sm text-stone-500">Ingredients ranked by priority for your skin concerns and type.</p>
            {analysis.recommendedIngredients.length === 0 && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
                No ingredient picks in this snapshot. Click <span className="font-medium text-stone-800">Re-analyze</span> above to refresh recommendations, or adjust your profile concerns and try again.
              </div>
            )}
            {analysis.recommendedIngredients.map((rec) => {
              const safety = safetyLabel(rec.ingredient.safetyRating);
              return (
                <div key={rec.ingredient.id} className="border border-stone-200 rounded-xl p-5 bg-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-semibold text-stone-900">{rec.ingredient.name}</span>
                        <span className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          rec.priority === "essential" ? "bg-stone-900 text-white" :
                          rec.priority === "recommended" ? "bg-stone-100 text-stone-700" :
                          "bg-stone-50 text-stone-500"
                        )}>
                          {rec.priority}
                        </span>
                      </div>
                      <div className="text-xs text-stone-400 font-mono">{rec.ingredient.inci}</div>
                    </div>
                    <div className={cn("text-xs font-medium", safety.color)}>{safety.label}</div>
                  </div>

                  <p className="text-sm text-stone-600 mb-3 leading-relaxed">{rec.ingredient.description}</p>

                  {/* Concentration */}
                  <div className="bg-stone-50 rounded-lg p-3 mb-3">
                    <div className="text-xs font-semibold text-stone-500 mb-1">Concentration & Function</div>
                    <p className="text-xs text-stone-600 leading-relaxed">{rec.concentrationNote}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {rec.ingredient.function.map((f) => (
                        <span key={f} className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full capitalize">{f.replace(/-/g, " ")}</span>
                      ))}
                    </div>
                  </div>

                  {/* Interactions */}
                  <div className="grid sm:grid-cols-2 gap-2 mb-3">
                    {rec.ingredient.interactions.compatible.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-2.5">
                        <div className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><Check size={11} /> Pairs well with</div>
                        <div className="text-xs text-green-600">{rec.ingredient.interactions.compatible.join(", ")}</div>
                      </div>
                    )}
                    {rec.ingredient.interactions.avoid.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-2.5">
                        <div className="text-xs font-semibold text-red-700 mb-1 flex items-center gap-1"><AlertTriangle size={11} /> Avoid combining with</div>
                        <div className="text-xs text-red-600">{rec.ingredient.interactions.avoid.join(", ")}</div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-stone-500">{rec.reason}</p>
                    <Link
                      href={`/ingredients/${rec.ingredient.id}`}
                      className="text-xs text-stone-900 font-medium hover:underline"
                    >
                      Full guide →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-brand-600">
                Real products from Open Beauty Facts matched to your skin profile and concerns.
              </p>
              <button
                onClick={fetchDbProducts}
                className="text-xs text-brand-500 hover:text-brand-700 hover:underline"
              >
                Refresh
              </button>
            </div>

            {dbLoading && (
              <div className="flex items-center justify-center py-16">
                <Loader2 size={22} className="animate-spin text-brand-400" />
                <span className="ml-2 text-sm text-brand-500">Finding products for your profile…</span>
              </div>
            )}

            {dbError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                Could not load products — database may still be building.
                Run <code className="bg-amber-100 px-1 rounded">python3 scripts/extract_products.py</code> to populate it.
              </div>
            )}

            {!dbLoading && !dbError && dbProducts.length === 0 && (
              <div className="text-center py-12 text-brand-400 text-sm">No matching products found. Try adjusting your profile concerns.</div>
            )}

            {!dbLoading && dbProducts.map((rec, idx) => (
              <div key={rec.product.id} className="border border-brand-200 rounded-xl p-5 bg-white">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-16 h-16 bg-brand-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                    <span className="text-brand-300 text-sm font-bold">{rec.product.brand.slice(0,2).toUpperCase() || "??"}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-xs text-brand-400 font-semibold uppercase tracking-wide">{rec.product.brand || "Unknown Brand"}</div>
                        <div className="font-semibold text-brand-900">{rec.product.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full capitalize">
                            {PRODUCT_CATEGORY_LABELS[rec.product.category] ?? rec.product.category}
                          </span>
                        </div>
                      </div>
                      <div className={cn("text-xs font-semibold flex-shrink-0", scoreToColor(rec.score))}>
                        {scoreToLabel(rec.score)}
                      </div>
                    </div>

                    {/* Matched ingredient tags */}
                    {rec.product.ingredientList.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {rec.product.ingredientList.slice(0, 6).map((ing) => (
                          <span key={ing} className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full capitalize">{ing}</span>
                        ))}
                      </div>
                    )}

                    <p className="text-xs text-brand-500 mt-2 leading-relaxed">{rec.reason}</p>

                    {/* Pros & Cons */}
                    {(rec.pros.length > 0 || rec.cons.length > 0) && (
                      <div className="mt-3 grid sm:grid-cols-2 gap-2">
                        {rec.pros.length > 0 && (
                          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
                            <div className="text-xs font-semibold text-green-800 mb-1.5 flex items-center gap-1">
                              <Check size={11} /> Pros for your skin
                            </div>
                            <ul className="space-y-1">
                              {rec.pros.map((pro, i) => (
                                <li key={i} className="text-xs text-green-700 flex items-start gap-1.5">
                                  <span className="text-green-400 mt-0.5 flex-shrink-0">+</span>{pro}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {rec.cons.length > 0 && (
                          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                            <div className="text-xs font-semibold text-amber-800 mb-1.5 flex items-center gap-1">
                              <AlertTriangle size={11} /> Watch out for
                            </div>
                            <ul className="space-y-1">
                              {rec.cons.map((con, i) => (
                                <li key={i} className="text-xs text-amber-700 flex items-start gap-1.5">
                                  <span className="text-amber-400 mt-0.5 flex-shrink-0">−</span>{con}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Ingredient preview */}
                    {rec.product.ingredientList.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-brand-100">
                        <div className="text-xs font-semibold text-brand-600 mb-1">Ingredients</div>
                        <p className="text-xs text-brand-500 leading-relaxed line-clamp-3 capitalize">
                          {rec.product.ingredientList.join(", ")}
                        </p>
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t border-brand-100">
                      <div className="flex items-center gap-2">
                        <MapPin size={11} className="text-brand-400 shrink-0" />
                        <button
                          type="button"
                          onClick={() => toggleStorePanel(rec)}
                          className="text-xs text-brand-500 hover:text-brand-700 hover:underline text-left"
                        >
                          {storePanelProductId === rec.product.id
                            ? "Hide nearby stores"
                            : "Find this product near you →"}
                        </button>
                      </div>

                      {storePanelProductId === rec.product.id && (
                        <div className="mt-3 rounded-lg border border-brand-200 bg-brand-50/90 p-3 space-y-3">
                          <div className="flex flex-wrap items-end gap-2">
                            <div className="flex flex-col gap-0.5">
                              <label className="text-[10px] font-semibold uppercase tracking-wide text-brand-600">
                                ZIP / postal code
                              </label>
                              <input
                                value={storeZipInput}
                                onChange={(e) => setStoreZipInput(e.target.value)}
                                placeholder="e.g. 90210"
                                maxLength={10}
                                className="w-36 text-sm border border-brand-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-300 bg-white"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={submitStoreZip}
                              className="bg-brand-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-brand-600 transition-colors"
                            >
                              Find stores
                            </button>
                          </div>

                          {storesLoading && (
                            <div className="flex items-center gap-2 text-xs text-brand-500 py-1">
                              <Loader2 size={14} className="animate-spin" /> Finding stores…
                            </div>
                          )}
                          {storesError && (
                            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5">
                              {storesError}
                            </p>
                          )}
                          {!storesLoading && !storesError && nearbyStores && nearbyStores.length === 0 && (
                            <p className="text-xs text-brand-500">No stores found — try another ZIP.</p>
                          )}
                          {!storesLoading && nearbyStores && nearbyStores.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-xs font-semibold text-brand-800">
                                Near {storeSubmittedZip} · {rec.product.brand || "Skincare"}
                              </div>
                              {nearbyStores.slice(0, 6).map((store) => (
                                <div
                                  key={store.placeId}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-white rounded-lg border border-brand-100 px-2.5 py-1.5"
                                >
                                  <div className="text-xs min-w-0">
                                    <span className="font-medium text-brand-900">{store.name}</span>
                                    <span className="text-brand-400"> · {store.distanceMiles} mi</span>
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
                          <p className="text-[10px] text-brand-400 leading-relaxed">
                            Inventory isn&apos;t verified — call ahead to confirm this product.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "routine" && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {/* AM routine */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-amber-100 text-amber-700 rounded-md flex items-center justify-center text-xs font-bold">AM</span>
                  Morning Routine
                </h3>
                <div className="space-y-2">
                  {analysis.routineSuggestion.am.map((step) => (
                    <div key={step.order} className="flex gap-3 p-3 border border-stone-100 rounded-xl bg-white">
                      <div className="w-6 h-6 bg-stone-100 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-stone-500">{step.order}</div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900 capitalize">{PRODUCT_CATEGORY_LABELS[step.category]}</div>
                        <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{step.instruction}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PM routine */}
              <div>
                <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 bg-indigo-100 text-indigo-700 rounded-md flex items-center justify-center text-xs font-bold">PM</span>
                  Evening Routine
                </h3>
                <div className="space-y-2">
                  {analysis.routineSuggestion.pm.map((step) => (
                    <div key={step.order} className="flex gap-3 p-3 border border-stone-100 rounded-xl bg-white">
                      <div className="w-6 h-6 bg-stone-100 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-stone-500">{step.order}</div>
                      <div>
                        <div className="text-xs font-semibold text-stone-900 capitalize">{PRODUCT_CATEGORY_LABELS[step.category]}</div>
                        <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{step.instruction}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weekly */}
            <div>
              <h3 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-stone-100 text-stone-700 rounded-md flex items-center justify-center text-xs font-bold">WK</span>
                Weekly treatments
              </h3>
              <div className="grid sm:grid-cols-2 gap-2">
                {analysis.routineSuggestion.weekly.map((step) => (
                  <div key={step.order} className="flex gap-3 p-3 border border-stone-100 rounded-xl bg-white">
                    <div className="w-6 h-6 bg-stone-100 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold text-stone-500">{step.order}</div>
                    <div>
                      <div className="text-xs font-semibold text-stone-900 capitalize">{PRODUCT_CATEGORY_LABELS[step.category]}</div>
                      <div className="text-xs text-stone-500 mt-0.5">{step.instruction}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <Info size={15} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Always patch test new products for 48 hours before full application. Introduce one new active at a time and wait 2–3 weeks before adding another. Consult a board-certified dermatologist for persistent or severe concerns.
              </p>
            </div>
          </div>
        )}

        {activeTab === "food" && (
          <div className="space-y-6">
            <p className="text-sm text-stone-500 leading-relaxed">
              Diet plays a significant role in skin health. These recommendations are based on your concerns and skin type.
            </p>

            {/* Beneficial foods */}
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Apple size={14} className="text-green-600" />
                Eat more of these
              </h2>
              <div className="space-y-2">
                {analysis.foodRecommendations.beneficial.map((item) => (
                  <div key={item.name} className="flex gap-3 p-3.5 border border-stone-100 rounded-xl bg-white">
                    <div className="flex-shrink-0 w-20 text-right">
                      <span className="text-xs bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-900">{item.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Avoid */}
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <AlertTriangle size={14} className="text-amber-600" />
                Limit or avoid
              </h2>
              <div className="space-y-2">
                {analysis.foodRecommendations.avoid.map((item) => (
                  <div key={item.name} className="flex gap-3 p-3.5 border border-stone-100 rounded-xl bg-white">
                    <div className="flex-shrink-0 w-20 text-right">
                      <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">{item.category}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-900">{item.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Supplements */}
            <div>
              <h2 className="text-sm font-semibold text-stone-900 mb-3 flex items-center gap-2">
                <Coffee size={14} className="text-stone-500" />
                Consider supplementing
              </h2>
              <div className="space-y-2">
                {analysis.foodRecommendations.supplements.map((item) => (
                  <div key={item.name} className="flex gap-3 p-3.5 border border-stone-100 rounded-xl bg-white">
                    <div className="flex-shrink-0 w-20 text-right">
                      <span className="text-xs bg-stone-50 text-stone-600 border border-stone-200 px-2 py-0.5 rounded-full">{item.category}</span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-stone-900">{item.name}</div>
                      <div className="text-xs text-stone-500 mt-0.5 leading-relaxed">{item.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-stone-400 mt-3">
                Consult your doctor before starting any supplement regimen.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
