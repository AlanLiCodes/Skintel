"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/lib/store";
import { generateId } from "@/lib/utils";
import {
  SKIN_TYPE_DESCRIPTIONS,
  SKIN_CONCERN_LABELS,
  AGE_RANGE_LABELS,
  PRODUCT_CATEGORY_LABELS,
} from "@/lib/data";
import type {
  SkinType,
  SkinConcern,
  AgeRange,
  CurrentProduct,
  ProductCategory,
} from "@/lib/types";
import {
  ChevronRight,
  ChevronLeft,
  Check,
  Plus,
  X,
  FileText,
} from "lucide-react";

const STEPS = [
  { id: 1, title: "About You", description: "Age range and skin type" },
  { id: 2, title: "Skin Concerns", description: "What you want to address" },
  { id: 3, title: "Current Routine", description: "Products you're using now" },
  { id: 4, title: "Allergies & Notes", description: "Sensitivities and derm notes" },
  { id: 5, title: "Goals", description: "What you want to achieve" },
];

const AGE_RANGES: AgeRange[] = ["under-18", "18-24", "25-34", "35-44", "45-54", "55+"];
const SKIN_TYPES: SkinType[] = ["dry", "oily", "combination", "normal", "sensitive"];
const SKIN_CONCERNS: SkinConcern[] = [
  "acne", "hyperpigmentation", "anti-aging", "dryness", "oiliness",
  "redness", "pores", "texture", "dark-circles", "fine-lines",
  "eczema", "rosacea", "melasma", "scarring", "uneven-tone",
];
const PRODUCT_CATEGORIES: ProductCategory[] = [
  "cleanser", "toner", "serum", "moisturizer", "sunscreen",
  "eye-cream", "exfoliant", "mask", "retinol", "spot-treatment",
];

export default function NewProfilePage() {
  const router = useRouter();
  const setProfile = useAppStore((s) => s.setProfile);
  const existingProfile = useAppStore((s) => s.profile);

  const [step, setStep] = useState(1);
  const [ageRange, setAgeRange] = useState<AgeRange>(existingProfile?.ageRange ?? "25-34");
  const [skinType, setSkinType] = useState<SkinType>(existingProfile?.skinType ?? "combination");
  const [concerns, setConcerns] = useState<SkinConcern[]>(existingProfile?.concerns ?? []);
  const [currentProducts, setCurrentProducts] = useState<CurrentProduct[]>(existingProfile?.currentProducts ?? []);
  const [newProduct, setNewProduct] = useState("");
  const [newProductCategory, setNewProductCategory] = useState<ProductCategory>("cleanser");
  const [allergies, setAllergies] = useState<string[]>(existingProfile?.allergies ?? []);
  const [newAllergy, setNewAllergy] = useState("");
  const [prescriptionNote, setPrescriptionNote] = useState(existingProfile?.prescriptionNote ?? "");
  const [goals, setGoals] = useState(existingProfile?.goals ?? "");
  const [location, setLocation] = useState(existingProfile?.location ?? "");

  const toggleConcern = (concern: SkinConcern) => {
    setConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const addProduct = () => {
    if (!newProduct.trim()) return;
    setCurrentProducts((prev) => [
      ...prev,
      { id: generateId(), name: newProduct.trim(), category: newProductCategory },
    ]);
    setNewProduct("");
  };

  const removeProduct = (id: string) => setCurrentProducts((prev) => prev.filter((p) => p.id !== id));

  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    setAllergies((prev) => [...prev, newAllergy.trim()]);
    setNewAllergy("");
  };

  const removeAllergy = (a: string) => setAllergies((prev) => prev.filter((x) => x !== a));

  const handleFinish = () => {
    const profile = {
      id: existingProfile?.id ?? generateId(),
      createdAt: existingProfile?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ageRange,
      skinType,
      concerns,
      allergies,
      currentProducts,
      goals,
      prescriptionNote,
      location,
    };
    setProfile(profile);
    router.push("/analyze");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight mb-1">
          {existingProfile ? "Edit your profile" : "Build your skin profile"}
        </h1>
        <p className="text-stone-500 text-sm">Step {step} of {STEPS.length} — {STEPS[step - 1].description}</p>
      </div>

      {/* Progress */}
      <div className="mb-8">
        <div className="flex gap-1">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                s.id <= step ? "bg-stone-900" : "bg-stone-200"
              )}
            />
          ))}
        </div>
      </div>

      <div className="animate-in">
        {step === 1 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-3">Age range</label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map((range) => (
                  <button
                    key={range}
                    onClick={() => setAgeRange(range)}
                    className={cn(
                      "px-4 py-2 rounded-lg border text-sm font-medium transition-colors",
                      ageRange === range
                        ? "bg-stone-900 text-white border-stone-900"
                        : "border-stone-200 text-stone-600 hover:border-stone-400 hover:text-stone-900"
                    )}
                  >
                    {AGE_RANGE_LABELS[range]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-900 mb-3">Skin type</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SKIN_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSkinType(type)}
                    className={cn(
                      "flex items-start gap-3 p-3.5 rounded-xl border text-left transition-colors",
                      skinType === type
                        ? "bg-stone-900 border-stone-900 text-white"
                        : "border-stone-200 hover:border-stone-400"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center",
                      skinType === type ? "border-white" : "border-stone-400"
                    )}>
                      {skinType === type && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className={cn("font-medium text-sm capitalize", skinType === type ? "text-white" : "text-stone-900")}>
                        {type}
                      </div>
                      <div className={cn("text-xs mt-0.5 leading-relaxed", skinType === type ? "text-stone-300" : "text-stone-500")}>
                        {SKIN_TYPE_DESCRIPTIONS[type]}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1">Skin concerns</label>
            <p className="text-xs text-stone-500 mb-4">Select all that apply.</p>
            <div className="flex flex-wrap gap-2">
              {SKIN_CONCERNS.map((concern) => {
                const selected = concerns.includes(concern);
                return (
                  <button
                    key={concern}
                    onClick={() => toggleConcern(concern)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition-colors",
                      selected
                        ? "bg-stone-900 border-stone-900 text-white"
                        : "border-stone-200 text-stone-600 hover:border-stone-400"
                    )}
                  >
                    {selected && <Check size={12} />}
                    {SKIN_CONCERN_LABELS[concern]}
                  </button>
                );
              })}
            </div>
            {concerns.length > 0 && (
              <p className="text-xs text-stone-500 mt-3">{concerns.length} concern{concerns.length !== 1 ? "s" : ""} selected</p>
            )}
          </div>
        )}

        {step === 3 && (
          <div>
            <label className="block text-sm font-medium text-stone-900 mb-1">Current skincare products</label>
            <p className="text-xs text-stone-500 mb-4">What are you already using?</p>

            {currentProducts.length > 0 && (
              <div className="space-y-2 mb-4">
                {currentProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-lg px-3 py-2">
                    <div>
                      <span className="text-sm font-medium text-stone-900">{product.name}</span>
                      <span className="ml-2 text-xs text-stone-400">{PRODUCT_CATEGORY_LABELS[product.category]}</span>
                    </div>
                    <button onClick={() => removeProduct(product.id)} className="text-stone-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <select
                value={newProductCategory}
                onChange={(e) => setNewProductCategory(e.target.value as ProductCategory)}
                className="flex-shrink-0 text-sm border border-stone-200 rounded-lg px-2 py-2 bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-stone-300"
              >
                {PRODUCT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{PRODUCT_CATEGORY_LABELS[cat]}</option>
                ))}
              </select>
              <input
                value={newProduct}
                onChange={(e) => setNewProduct(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addProduct()}
                placeholder="Product name or brand..."
                className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
              <button onClick={addProduct} className="bg-stone-900 text-white p-2 rounded-lg hover:bg-stone-800">
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-1">Allergies & sensitivities</label>
              <p className="text-xs text-stone-500 mb-4">Fragrance, essential oils, specific ingredients, etc.</p>

              {allergies.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {allergies.map((a) => (
                    <span key={a} className="inline-flex items-center gap-1 bg-red-50 border border-red-200 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {a}
                      <button onClick={() => removeAllergy(a)}><X size={11} /></button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addAllergy()}
                  placeholder="e.g. Fragrance, Coconut oil..."
                  className="flex-1 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-300"
                />
                <button onClick={addAllergy} className="bg-stone-900 text-white p-2 rounded-lg hover:bg-stone-800">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-900 mb-1">Prescription / Dermatologist note</label>
              <p className="text-xs text-stone-500 mb-3">Any derm recommendations or ingredient restrictions.</p>
              <textarea
                value={prescriptionNote}
                onChange={(e) => setPrescriptionNote(e.target.value)}
                placeholder="e.g. Prescribed tretinoin 0.025%, avoid benzoyl peroxide..."
                rows={4}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
              />
              <div className="mt-2 flex items-center gap-2 text-xs text-stone-400">
                <FileText size={12} />
                <span>Image upload for prescription scanning coming soon</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-900 mb-1">
                ZIP code <span className="text-stone-400 font-normal">(optional)</span>
              </label>
              <p className="text-xs text-stone-500 mb-3">Used to find nearby stores carrying your products.</p>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. 90210"
                maxLength={10}
                className="w-40 text-sm border border-stone-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-300"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-1">What are your skin goals?</label>
              <p className="text-xs text-stone-500 mb-3">The more specific, the better your recommendations.</p>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                placeholder="e.g. I want to clear up my jawline acne, fade dark spots, and eventually add retinol slowly..."
                rows={6}
                className="w-full text-sm border border-stone-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-stone-300 resize-none"
              />
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">Profile summary</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-stone-400">Age range</span>
                  <div className="font-medium text-stone-900">{AGE_RANGE_LABELS[ageRange]}</div>
                </div>
                <div>
                  <span className="text-stone-400">Skin type</span>
                  <div className="font-medium text-stone-900 capitalize">{skinType}</div>
                </div>
                <div>
                  <span className="text-stone-400">Concerns</span>
                  <div className="font-medium text-stone-900">{concerns.length > 0 ? `${concerns.length} selected` : "None"}</div>
                </div>
                <div>
                  <span className="text-stone-400">Products</span>
                  <div className="font-medium text-stone-900">{currentProducts.length > 0 ? `${currentProducts.length} added` : "None"}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
        {step > 1 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
          >
            <ChevronLeft size={15} />
            Back
          </button>
        ) : (
          <div />
        )}

        {step < STEPS.length ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 2 && concerns.length === 0}
            className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Continue
            <ChevronRight size={15} />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="inline-flex items-center gap-1.5 bg-stone-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <Check size={15} />
            Save & Analyze
          </button>
        )}
      </div>
    </div>
  );
}
