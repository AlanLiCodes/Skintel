import { NextRequest, NextResponse } from "next/server";
import { getDb, parseProduct, type DbProduct } from "@/lib/db";

const CONCERN_INGREDIENTS: Record<string, string[]> = {
  acne:              ["salicylic acid", "niacinamide", "benzoyl peroxide", "tea tree", "zinc", "sulfur", "retinol", "azelaic acid"],
  hyperpigmentation: ["vitamin c", "ascorbic acid", "niacinamide", "kojic acid", "arbutin", "tranexamic acid", "azelaic acid", "retinol"],
  "anti-aging":      ["retinol", "retinyl", "peptide", "palmitoyl", "hyaluronic acid", "vitamin c", "collagen", "adenosine"],
  dryness:           ["hyaluronic acid", "glycerin", "ceramide", "shea butter", "squalane", "urea", "sodium pca", "panthenol"],
  oiliness:          ["niacinamide", "salicylic acid", "zinc", "kaolin", "charcoal", "witch hazel"],
  redness:           ["centella asiatica", "allantoin", "azelaic acid", "aloe vera", "green tea", "oat", "madecassoside", "bisabolol"],
  pores:             ["niacinamide", "salicylic acid", "retinol", "glycolic acid", "zinc", "kaolin"],
  texture:           ["glycolic acid", "lactic acid", "salicylic acid", "retinol", "niacinamide"],
  "fine-lines":      ["retinol", "retinyl", "peptide", "hyaluronic acid", "vitamin c", "adenosine"],
  "dark-circles":    ["vitamin c", "caffeine", "retinol", "peptide", "niacinamide"],
  eczema:            ["ceramide", "colloidal oatmeal", "allantoin", "panthenol", "shea butter", "glycerin"],
  rosacea:           ["azelaic acid", "centella asiatica", "aloe vera", "green tea", "allantoin", "niacinamide"],
  melasma:           ["tranexamic acid", "kojic acid", "arbutin", "niacinamide", "vitamin c", "azelaic acid"],
  scarring:          ["vitamin c", "retinol", "niacinamide", "centella asiatica", "madecassoside"],
  "uneven-tone":     ["niacinamide", "vitamin c", "kojic acid", "glycolic acid", "arbutin", "azelaic acid"],
};

const SKIN_TYPE_GOOD: Record<string, string[]> = {
  dry:         ["hyaluronic acid", "ceramide", "glycerin", "shea butter", "squalane"],
  oily:        ["niacinamide", "salicylic acid", "zinc", "kaolin"],
  combination: ["niacinamide", "hyaluronic acid", "glycerin"],
  sensitive:   ["aloe vera", "centella asiatica", "allantoin", "oat", "ceramide", "panthenol"],
  normal:      ["vitamin c", "retinol", "peptide", "hyaluronic acid"],
};

const SKIN_TYPE_BAD: Record<string, string[]> = {
  dry:       ["alcohol denat", "salicylic acid", "kaolin"],
  oily:      ["mineral oil", "petrolatum", "lanolin", "coconut oil"],
  sensitive: ["fragrance", "parfum", "alcohol denat", "menthol"],
  combination: [],
  normal:    [],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { skinType = "normal", concerns = [], allergies = [] } = body;

  try {
    const db = getDb();

    // Gather relevant ingredients for all concerns
    const relevantIngs = Array.from(
      new Set((concerns as string[]).flatMap((c) => CONCERN_INGREDIENTS[c] ?? []))
    );
    if (relevantIngs.length === 0) relevantIngs.push("hyaluronic acid");

    // Find products whose ingredient_list contains at least one relevant ingredient
    const clauses = relevantIngs.map(() => `ingredient_list LIKE ?`).join(" OR ");
    const likeParams = relevantIngs.map((i) => `%${i}%`);

    const rows = db.prepare(`
      SELECT * FROM products
      WHERE (${clauses})
      LIMIT 300
    `).all(...likeParams) as DbProduct[];

    const goodIngs    = SKIN_TYPE_GOOD[skinType]  ?? [];
    const badIngs     = SKIN_TYPE_BAD[skinType]   ?? [];
    const allergyList = (allergies as string[]).map((a: string) => a.toLowerCase());

    const scored = rows.map((row) => {
      const parsed = parseProduct(row);
      const ingText = parsed.ingredientList.join(" ").toLowerCase();

      let score = 0;
      const matchedConcernIngs: string[] = [];

      for (const term of relevantIngs) {
        if (ingText.includes(term)) {
          score += 10;
          matchedConcernIngs.push(term);
        }
      }
      for (const g of goodIngs)  { if (ingText.includes(g)) score += 5; }
      for (const b of badIngs)   { if (ingText.includes(b)) score -= 15; }

      const allergenHits: string[] = [];
      for (const a of allergyList) {
        if (ingText.includes(a)) { score -= 50; allergenHits.push(a); }
      }

      if (parsed.ingredientList.length > 8) score += 2;

      const top3 = matchedConcernIngs.slice(0, 3);
      const reason = top3.length > 0
        ? `Contains ${top3.join(", ")} — matched to your concerns.`
        : "Potentially suitable for your skin profile.";

      // Pros
      const pros: string[] = [];
      const matchedGood = goodIngs.filter((g) => ingText.includes(g)).slice(0, 2);
      if (matchedGood.length > 0)
        pros.push(`Good for ${skinType} skin: contains ${matchedGood.join(", ")}`);
      if (matchedConcernIngs.length > 1)
        pros.push(`Addresses ${matchedConcernIngs.length} of your concern ingredients`);
      if (parsed.ingredientList.length > 10)
        pros.push(`Detailed formula (${parsed.ingredientList.length} ingredients)`);

      // Cons
      const cons: string[] = [];
      if (allergenHits.length > 0)
        cons.push(`May contain your allergen: ${allergenHits[0]}`);
      const badHit = badIngs.find((b) => ingText.includes(b));
      if (badHit)
        cons.push(`Contains ${badHit} — may not suit ${skinType} skin`);
      if (parsed.ingredientList.length === 0)
        cons.push("No ingredient detail available — verify before purchasing");

      return { product: parsed, score, reason, pros: pros.slice(0, 3), cons: cons.slice(0, 2) };
    });

    scored.sort((a, b) => b.score - a.score);

    // Deduplicate by name prefix
    const seen = new Set<string>();
    const results = [];
    for (const item of scored) {
      const key = item.product.name.slice(0, 25).toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        results.push(item);
      }
      if (results.length >= 12) break;
    }

    return NextResponse.json({ recommendations: results });
  } catch (err) {
    console.error("Recommend error:", err);
    return NextResponse.json({ error: "Database not ready." }, { status: 503 });
  }
}
