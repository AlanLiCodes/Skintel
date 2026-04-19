import type {
  SkinConcern,
  SkinProfile,
  SkinAnalysis,
  RecommendedIngredient,
  RecommendedProduct,
} from "./types";
import { INGREDIENTS, PRODUCTS } from "./data";
import { generateId } from "./utils";

/** Profile concerns plus related tags so melasma / scarring / dark circles still match library ingredients. */
function expandedConcernSet(concerns: SkinConcern[]): Set<SkinConcern> {
  const set = new Set<SkinConcern>();
  for (const c of concerns) {
    set.add(c);
    switch (c) {
      case "melasma":
        set.add("hyperpigmentation");
        set.add("uneven-tone");
        break;
      case "dark-circles":
        set.add("fine-lines");
        set.add("uneven-tone");
        break;
      case "scarring":
        set.add("texture");
        set.add("hyperpigmentation");
        set.add("acne");
        break;
      default:
        break;
    }
  }
  return set;
}

function buildIngredientRec(
  ingredient: (typeof INGREDIENTS)[number],
  overlap: SkinConcern[],
  priority: RecommendedIngredient["priority"],
  reason: string
): RecommendedIngredient {
  return {
    ingredient,
    reason,
    priority,
    step: "serum",
    concentrationNote: `Effective at ${ingredient.concentrationRange.optimal}${ingredient.concentrationRange.unit}. Start at the lower end (${ingredient.concentrationRange.min}${ingredient.concentrationRange.unit}) if new to the ingredient.`,
  };
}

function matchRecommendedIngredients(profile: SkinProfile): RecommendedIngredient[] {
  const expanded = expandedConcernSet(profile.concerns);
  const out: RecommendedIngredient[] = [];
  const seen = new Set<string>();

  const overlapOf = (ing: (typeof INGREDIENTS)[number]) =>
    ing.concerns.filter((c) => expanded.has(c));

  // 1) Concern match + skin type (strict)
  for (const ingredient of INGREDIENTS) {
    const overlap = overlapOf(ingredient);
    if (overlap.length === 0 || !ingredient.skinTypes.includes(profile.skinType)) continue;
    seen.add(ingredient.id);
    out.push(
      buildIngredientRec(
        ingredient,
        overlap,
        overlap.length >= 2 ? "essential" : "recommended",
        `Addresses ${overlap.map((c) => c.replace(/-/g, " ")).join(", ")} — aligned with your concerns and ${profile.skinType} skin.`
      )
    );
  }

  // 2) Concern match, any skin type (still personalized by concern)
  for (const ingredient of INGREDIENTS) {
    if (seen.has(ingredient.id)) continue;
    const overlap = overlapOf(ingredient);
    if (overlap.length === 0) continue;
    seen.add(ingredient.id);
    out.push(
      buildIngredientRec(
        ingredient,
        overlap,
        overlap.length >= 2 ? "recommended" : "optional",
        `Addresses ${overlap.map((c) => c.replace(/-/g, " ")).join(", ")} — check suitability for ${profile.skinType} skin and patch test if unsure.`
      )
    );
  }

  // 3) Skin-type fit when concern data is still thin
  for (const ingredient of INGREDIENTS) {
    if (seen.has(ingredient.id)) continue;
    if (!ingredient.skinTypes.includes(profile.skinType)) continue;
    seen.add(ingredient.id);
    out.push(
      buildIngredientRec(
        ingredient,
        [],
        "optional",
        `Commonly used for ${profile.skinType} skin — pair with your goals and introduce actives gradually.`
      )
    );
  }

  out.sort((a, b) => {
    const p = { essential: 0, recommended: 1, optional: 2 };
    return p[a.priority] - p[b.priority];
  });

  if (out.length >= 6) return out.slice(0, 6);

  // 4) Fill up to 6 from the rest of the library if still short
  for (const ingredient of INGREDIENTS) {
    if (out.length >= 6) break;
    if (seen.has(ingredient.id)) continue;
    seen.add(ingredient.id);
    out.push(
      buildIngredientRec(
        ingredient,
        [],
        "optional",
        "Foundational ingredient to review with your routine and a professional if you have medical skin conditions."
      )
    );
  }

  return out.slice(0, 6);
}

// Analyze a skin profile and generate recommendations
// In production this would call the OpenAI API; here we run client-side logic
export async function analyzeSkinProfile(profile: SkinProfile): Promise<SkinAnalysis> {
  // Simulate async API delay
  await new Promise((r) => setTimeout(r, 1500));

  const matchedIngredients = matchRecommendedIngredients(profile);
  const matchedProducts: RecommendedProduct[] = [];

  // Match products to concerns & skin type
  for (const product of PRODUCTS) {
    const concernOverlap = product.concerns.filter((c) => profile.concerns.includes(c as SkinProfile["concerns"][number]));
    const typeMatch = product.skinTypes.includes(profile.skinType);
    const score = Math.min(100, concernOverlap.length * 25 + (typeMatch ? 25 : 0) + Math.floor(Math.random() * 20));

    if (score > 30) {
      matchedProducts.push({
        product,
        matchScore: score,
        reason: `${typeMatch ? "Formulated for your skin type" : "Generally suitable"}.${concernOverlap.length ? ` Targets ${concernOverlap.map((c) => c.replace(/-/g, " ")).join(", ")}.` : ""}`,
        step: product.category,
        pros: buildProductPros(product, profile),
        cons: buildProductCons(product, profile),
      });
    }
  }

  matchedProducts.sort((a, b) => b.matchScore - a.matchScore);

  return {
    id: generateId(),
    profileId: profile.id,
    createdAt: new Date().toISOString(),
    summary: buildSummary(profile),
    primaryConcerns: profile.concerns.slice(0, 3).map((c, i) => ({
      concern: c,
      severity: i === 0 ? "moderate" : "mild",
      explanation: getConcernExplanation(c),
      priority: i + 1,
    })),
    recommendedIngredients: matchedIngredients,
    recommendedProducts: matchedProducts.slice(0, 6),
    routineSuggestion: {
      am: [
        { order: 1, category: "cleanser", instruction: "Start with a gentle, pH-balanced cleanser." },
        { order: 2, category: "toner", instruction: "Apply a hydrating toner to damp skin." },
        { order: 3, category: "serum", instruction: "Layer your active serum (e.g. vitamin C)." },
        { order: 4, category: "moisturizer", instruction: "Seal in moisture with a lightweight moisturizer." },
        { order: 5, category: "sunscreen", instruction: "Always finish with SPF 30+ — non-negotiable." },
      ],
      pm: [
        { order: 1, category: "cleanser", instruction: "Double-cleanse if wearing sunscreen or makeup." },
        { order: 2, category: "toner", instruction: "Rebalance with a hydrating toner." },
        { order: 3, category: "serum", instruction: "Apply your PM actives (retinol, AHA/BHA)." },
        { order: 4, category: "moisturizer", instruction: "Use a richer moisturizer to support overnight repair." },
      ],
      weekly: [
        { order: 1, category: "exfoliant", instruction: "Exfoliate 1–2× per week. Do not over-exfoliate." },
        { order: 2, category: "mask", instruction: "Use a targeted mask based on current concerns." },
      ],
    },
    foodRecommendations: { beneficial: [], avoid: [], supplements: [] },
  };
}

function buildProductPros(product: typeof PRODUCTS[number], profile: SkinProfile): string[] {
  const pros: string[] = [];

  // Skin type match
  if (product.skinTypes.includes(profile.skinType)) {
    pros.push(`Formulated for ${profile.skinType} skin`);
  }

  // Concern overlap
  const concernOverlap = product.concerns.filter((c) =>
    profile.concerns.includes(c as SkinProfile["concerns"][number])
  );
  if (concernOverlap.length > 0) {
    pros.push(`Directly targets your concern${concernOverlap.length > 1 ? "s" : ""}: ${concernOverlap.map((c) => c.replace(/-/g, " ")).join(", ")}`);
  }

  // High rating
  if (product.rating >= 4.7) {
    pros.push(`Highly rated (${product.rating}/5 from ${product.reviewCount.toLocaleString()} reviews)`);
  }

  // Allergy-safe tags
  if (product.tags.includes("fragrance-free") && profile.allergies.some((a) => /fragrance/i.test(a))) {
    pros.push("Fragrance-free — safe for your listed sensitivity");
  }

  // Affordable
  if (product.price < 20) {
    pros.push("Budget-friendly — accessible price point");
  }

  // Derm recommended
  if (product.tags.includes("derm-recommended")) {
    pros.push("Dermatologist-recommended formula");
  }

  // Multiple concerns addressed
  if (concernOverlap.length >= 2) {
    pros.push("Addresses multiple concerns in a single product");
  }

  return pros.slice(0, 4);
}

function buildProductCons(product: typeof PRODUCTS[number], profile: SkinProfile): string[] {
  const cons: string[] = [];

  // Not ideal skin type
  if (!product.skinTypes.includes(profile.skinType)) {
    cons.push(`Not specifically formulated for ${profile.skinType} skin`);
  }

  // Allergy risk
  const allergyFlags = profile.allergies.filter((allergy) =>
    product.allIngredients.some((ing) => ing.toLowerCase().includes(allergy.toLowerCase()))
  );
  if (allergyFlags.length > 0) {
    cons.push(`Contains ingredients that may conflict with your sensitivity: ${allergyFlags.join(", ")}`);
  }

  // Price
  if (product.price > 100) {
    cons.push("Premium price point — may not suit all budgets");
  } else if (product.price > 50) {
    cons.push("Mid-to-high price — worth patch testing before committing");
  }

  // Age-related caution
  if (profile.ageRange === "under-18" && product.keyIngredients.includes("retinol")) {
    cons.push("Retinol is not recommended for under 18 — consult a dermatologist first");
  }

  // Sensitive skin + strong actives
  if (profile.skinType === "sensitive" && product.keyIngredients.some((i) => ["aha-bha", "retinol", "vitamin-c"].includes(i))) {
    cons.push("Contains active ingredients — introduce slowly and patch test first");
  }

  // Unaddressed primary concern
  const topConcern = profile.concerns[0];
  if (topConcern && !product.concerns.includes(topConcern as typeof product.concerns[number])) {
    cons.push(`Doesn't directly target your top concern: ${topConcern.replace(/-/g, " ")}`);
  }

  // Low review count
  if (product.reviewCount < 5000) {
    cons.push("Limited reviews — less community data available");
  }

  return cons.slice(0, 3);
}

function buildSummary(profile: SkinProfile): string {
  const concernStr = profile.concerns.slice(0, 3).map((c) => c.replace(/-/g, " ")).join(", ");
  return `Based on your ${profile.skinType} skin type and concerns around ${concernStr}, we've curated a personalized routine focused on barrier support, targeted actives, and long-term skin health. Your routine should be gentle yet effective — prioritizing hydration and sun protection as non-negotiables.`;
}

function getConcernExplanation(concern: string): string {
  const map: Record<string, string> = {
    acne: "Acne is often caused by excess sebum, bacteria, and clogged pores. Targeting with BHAs and anti-inflammatory ingredients is key.",
    hyperpigmentation: "Dark spots result from excess melanin production triggered by UV, hormones, or inflammation. Brightening actives and daily SPF are essential.",
    "anti-aging": "Fine lines and loss of firmness result from declining collagen and elastin. Retinoids and peptides are your best allies.",
    dryness: "The skin barrier is compromised or sebum production is low. Focus on humectants, emollients, and occlusives in that order.",
    oiliness: "Overactive sebaceous glands produce excess sebum. Niacinamide and light moisturizers help regulate without stripping.",
    redness: "Inflammation or a weakened barrier causes flushing. Azelaic acid and barrier-repair ingredients reduce redness safely.",
    pores: "Pores appear larger when clogged with sebum and debris. Chemical exfoliants and niacinamide minimize their appearance.",
    texture: "Rough or bumpy skin is often due to dead cell buildup. Regular exfoliation and hydration will smooth things out.",
    "fine-lines": "Surface fine lines are improved with retinoids, peptides, and consistent hydration to plump the skin.",
    eczema: "A compromised skin barrier with inflammation. Focus on barrier repair — ceramides, oats, and emollients.",
    rosacea: "Chronic inflammation causing redness and sensitivity. Azelaic acid and gentle formulations are the standard approach.",
    melasma: "Deep pigmentation influenced by hormones and UV. Requires consistent SPF, brightening actives, and patience.",
    scarring: "Post-acne marks fade with vitamin C, retinoids, and niacinamide over time. Deeper scars may need professional treatment.",
    "uneven-tone": "Patchiness from UV damage or post-inflammatory marks. Vitamin C, niacinamide, and AHAs even the canvas.",
    "dark-circles": "Can be vascular, pigment-based, or structural. Vitamin C, caffeine, and retinol help depending on the cause.",
  };
  return map[concern] || "Speak with a dermatologist for a personalized assessment of this concern.";
}

// Build a chat message for the AI (OpenAI-compatible format)
export function buildSystemPrompt(profile?: SkinProfile): string {
  const profileContext = profile
    ? `User skin profile: skin type = ${profile.skinType}, age range = ${profile.ageRange}, concerns = ${profile.concerns.join(", ")}, allergies = ${profile.allergies.join(", ") || "none"}.`
    : "No profile provided yet.";

  return `You are Skintel's AI skincare advisor. You give evidence-based, dermatologist-aligned skincare advice. You explain ingredients clearly, including their concentration, function, and interactions. You recommend products across all price points. You ask clarifying questions when needed.

${profileContext}

Guidelines:
- Always recommend SPF during the day
- Flag potential ingredient interactions
- Suggest starting low and slow with actives
- Recommend patch testing new products
- Advise consulting a dermatologist for medical concerns
- Keep answers concise but thorough`;
}
