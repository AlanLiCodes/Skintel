import { notFound } from "next/navigation";
import Link from "next/link";
import { INGREDIENTS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ChevronLeft, Check, AlertTriangle, FlaskConical } from "lucide-react";

export function generateStaticParams() {
  return INGREDIENTS.map((i) => ({ slug: i.id }));
}

export default function IngredientDetailPage({ params }: { params: { slug: string } }) {
  const ingredient = INGREDIENTS.find((i) => i.id === params.slug);
  if (!ingredient) notFound();

  const concMin = ingredient.concentrationRange.min;
  const concMax = ingredient.concentrationRange.max;
  const concOptimal = ingredient.concentrationRange.optimal;
  const unit = ingredient.concentrationRange.unit;

  // Position of optimal on scale
  const optimalPct = ((concOptimal - concMin) / (concMax - concMin)) * 100;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Back */}
      <Link href="/ingredients" className="inline-flex items-center gap-1 text-sm text-stone-500 hover:text-stone-900 mb-6 transition-colors">
        <ChevronLeft size={14} />
        Ingredient library
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900 tracking-tight">{ingredient.name}</h1>
            <div className="text-sm text-stone-400 font-mono mt-1">{ingredient.inci}</div>
          </div>
          <div className={cn(
            "text-xs font-semibold px-3 py-1.5 rounded-full",
            ingredient.safetyRating === "low" ? "bg-green-50 text-green-700 border border-green-200" :
            ingredient.safetyRating === "moderate" ? "bg-amber-50 text-amber-700 border border-amber-200" :
            "bg-red-50 text-red-700 border border-red-200"
          )}>
            {ingredient.safetyRating === "low" ? "Low Concern" :
             ingredient.safetyRating === "moderate" ? "Moderate Concern" : "High Concern"}
          </div>
        </div>
        <div className="flex flex-wrap gap-1">
          {ingredient.function.map((f) => (
            <span key={f} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full capitalize">{f.replace(/-/g, " ")}</span>
          ))}
        </div>
      </div>

      {/* Description */}
      <div className="mb-8">
        <p className="text-stone-600 leading-relaxed">{ingredient.description}</p>
      </div>

      {/* Concentration Visualization */}
      <div className="border border-stone-200 rounded-xl p-5 bg-white mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FlaskConical size={14} className="text-stone-500" />
          <h2 className="font-semibold text-stone-900 text-sm">Concentration Guide</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>Min: {concMin}{unit}</span>
            <span>Optimal: {concOptimal}{unit}</span>
            <span>Max: {concMax}{unit}</span>
          </div>
          {/* Bar */}
          <div className="relative h-3 bg-stone-100 rounded-full overflow-visible">
            <div
              className="absolute inset-y-0 left-0 bg-stone-200 rounded-full"
              style={{ width: "100%" }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-stone-600 rounded-full"
              style={{ width: `${optimalPct}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-stone-900 rounded-full border-2 border-white"
              style={{ left: `calc(${optimalPct}% - 7px)` }}
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-stone-50 rounded-lg p-3 text-center">
              <div className="text-xs text-stone-400 mb-1">Minimum</div>
              <div className="font-semibold text-stone-900">{concMin}{unit}</div>
              <div className="text-xs text-stone-500 mt-0.5">Where it starts working</div>
            </div>
            <div className="bg-stone-900 rounded-lg p-3 text-center">
              <div className="text-xs text-stone-400 mb-1">Optimal</div>
              <div className="font-semibold text-white">{concOptimal}{unit}</div>
              <div className="text-xs text-stone-400 mt-0.5">Best results</div>
            </div>
            <div className="bg-stone-50 rounded-lg p-3 text-center">
              <div className="text-xs text-stone-400 mb-1">Maximum</div>
              <div className="font-semibold text-stone-900">{concMax}{unit}</div>
              <div className="text-xs text-stone-500 mt-0.5">Upper safe limit</div>
            </div>
          </div>
        </div>

        {ingredient.ph && (
          <div className="mt-4 pt-4 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-500 mb-1">Effective pH range</div>
            <div className="text-sm text-stone-700">pH {ingredient.ph.min} – {ingredient.ph.max}</div>
            <p className="text-xs text-stone-400 mt-1">Product must be within this pH range for the ingredient to be active. Check formulation notes.</p>
          </div>
        )}
      </div>

      {/* Benefits */}
      <div className="mb-6">
        <h2 className="font-semibold text-stone-900 mb-3">Benefits</h2>
        <div className="space-y-1.5">
          {ingredient.benefits.map((benefit) => (
            <div key={benefit} className="flex items-center gap-2 text-sm text-stone-700">
              <Check size={13} className="text-green-600 flex-shrink-0" />
              {benefit}
            </div>
          ))}
        </div>
      </div>

      {/* Skin types */}
      <div className="mb-6">
        <h2 className="font-semibold text-stone-900 mb-3">Suitable skin types</h2>
        <div className="flex flex-wrap gap-2">
          {ingredient.skinTypes.map((type) => (
            <span key={type} className="text-sm bg-stone-50 border border-stone-200 text-stone-600 px-3 py-1 rounded-full capitalize">{type}</span>
          ))}
        </div>
      </div>

      {/* Interactions */}
      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        {ingredient.interactions.compatible.length > 0 && (
          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center gap-1.5">
              <Check size={13} />
              Pairs well with
            </h3>
            <div className="space-y-1">
              {ingredient.interactions.compatible.map((id) => (
                <div key={id}>
                  <Link href={`/ingredients/${id}`} className="text-sm text-green-700 hover:text-green-900 hover:underline capitalize">
                    {id.replace(/-/g, " ")}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}
        {ingredient.interactions.avoid.length > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-red-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle size={13} />
              Avoid combining with
            </h3>
            <div className="space-y-1">
              {ingredient.interactions.avoid.map((id) => (
                <div key={id}>
                  <Link href={`/ingredients/${id}`} className="text-sm text-red-700 hover:text-red-900 hover:underline capitalize">
                    {id.replace(/-/g, " ")}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-xs text-red-500 mt-2">These combinations can cause irritation or deactivate one another. Separate AM/PM if you want to use both.</p>
          </div>
        )}
      </div>

      {/* Sources */}
      <div className="border border-stone-200 rounded-xl p-4 bg-stone-50">
        <div className="text-xs font-semibold text-stone-500 mb-1">Sources / Origin</div>
        <div className="text-sm text-stone-700">{ingredient.sources.join(" · ")}</div>
      </div>
    </div>
  );
}
