import Link from "next/link";
import { INGREDIENTS } from "@/lib/data";
import { cn } from "@/lib/utils";
import { FlaskConical, ArrowRight } from "lucide-react";

const FUNCTION_COLORS: Record<string, string> = {
  humectant: "bg-blue-50 text-blue-700 border-blue-100",
  emollient: "bg-yellow-50 text-yellow-700 border-yellow-100",
  occlusive: "bg-orange-50 text-orange-700 border-orange-100",
  exfoliant: "bg-purple-50 text-purple-700 border-purple-100",
  antioxidant: "bg-green-50 text-green-700 border-green-100",
  brightener: "bg-amber-50 text-amber-700 border-amber-100",
  "anti-inflammatory": "bg-rose-50 text-rose-700 border-rose-100",
  "anti-acne": "bg-cyan-50 text-cyan-700 border-cyan-100",
  retinoid: "bg-indigo-50 text-indigo-700 border-indigo-100",
  peptide: "bg-teal-50 text-teal-700 border-teal-100",
  vitamin: "bg-lime-50 text-lime-700 border-lime-100",
};

export default function IngredientsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900 tracking-tight mb-1">Ingredient Library</h1>
        <p className="text-stone-500 text-sm">
          Evidence-based breakdowns of every ingredient — what it does, how much to use, and what to pair it with.
        </p>
      </div>

      {/* Search hint */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <FlaskConical size={15} className="text-stone-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-stone-500">
          {INGREDIENTS.length} ingredients in the database. <Link href="/profile" className="text-stone-900 font-medium hover:underline">Build your profile</Link> to get personalized ingredient recommendations.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {INGREDIENTS.map((ingredient) => (
          <Link
            key={ingredient.id}
            href={`/ingredients/${ingredient.id}`}
            className="group border border-stone-200 rounded-xl p-5 bg-white hover:border-stone-400 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-stone-900 group-hover:text-stone-700">{ingredient.name}</div>
                <div className="text-xs text-stone-400 font-mono mt-0.5">{ingredient.inci}</div>
              </div>
              <ArrowRight size={14} className="text-stone-300 group-hover:text-stone-600 transition-colors mt-0.5" />
            </div>

            <p className="text-xs text-stone-500 mb-3 line-clamp-2 leading-relaxed">{ingredient.description}</p>

            <div className="flex flex-wrap gap-1 mb-2">
              {ingredient.function.map((f) => (
                <span
                  key={f}
                  className={cn(
                    "text-xs px-2 py-0.5 rounded-full border font-medium capitalize",
                    FUNCTION_COLORS[f] ?? "bg-stone-50 text-stone-600 border-stone-200"
                  )}
                >
                  {f.replace(/-/g, " ")}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400">
              <span>Optimal: {ingredient.concentrationRange.optimal}{ingredient.concentrationRange.unit}</span>
              <span>·</span>
              <span className={cn(
                "font-medium",
                ingredient.safetyRating === "low" ? "text-green-600" :
                ingredient.safetyRating === "moderate" ? "text-amber-600" : "text-red-600"
              )}>
                {ingredient.safetyRating === "low" ? "Low concern" :
                 ingredient.safetyRating === "moderate" ? "Moderate concern" : "High concern"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
