import type { SkinProfile, SkinAnalysis, RecommendedIngredient, RecommendedProduct } from "./types";
import { INGREDIENTS, PRODUCTS, MOCK_FOOD_RECOMMENDATIONS } from "./data";
import { generateId } from "./utils";

// Analyze a skin profile and generate recommendations
// In production this would call the OpenAI API; here we run client-side logic
export async function analyzeSkinProfile(profile: SkinProfile): Promise<SkinAnalysis> {
  // Simulate async API delay
  await new Promise((r) => setTimeout(r, 1500));

  const matchedIngredients: RecommendedIngredient[] = [];
  const matchedProducts: RecommendedProduct[] = [];

  // Match ingredients to concerns
  for (const ingredient of INGREDIENTS) {
    const overlap = ingredient.concerns.filter((c) => profile.concerns.includes(c as SkinProfile["concerns"][number]));
    if (overlap.length > 0 && ingredient.skinTypes.includes(profile.skinType)) {
      matchedIngredients.push({
        ingredient,
        reason: `Addresses ${overlap.map((c) => c.replace(/-/g, " ")).join(", ")} which are in your top concerns.`,
        priority: overlap.length >= 2 ? "essential" : overlap.length === 1 ? "recommended" : "optional",
        step: "serum",
        concentrationNote: `Effective at ${ingredient.concentrationRange.optimal}${ingredient.concentrationRange.unit}. Start at the lower end (${ingredient.concentrationRange.min}${ingredient.concentrationRange.unit}) if new to the ingredient.`,
      });
    }
  }

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
      });
    }
  }

  matchedIngredients.sort((a, b) => {
    const p = { essential: 0, recommended: 1, optional: 2 };
    return p[a.priority] - p[b.priority];
  });

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
    recommendedIngredients: matchedIngredients.slice(0, 6),
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
    foodRecommendations: MOCK_FOOD_RECOMMENDATIONS,
  };
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
