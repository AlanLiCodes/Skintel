import { NextRequest, NextResponse } from "next/server";
import type { FoodRecommendations, FoodItem, SkinProfile } from "@/lib/types";

function normalizeItems(v: unknown): FoodItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => Boolean(x) && typeof x === "object")
    .map((x) => ({
      name: String(x.name ?? "").trim().slice(0, 140),
      reason: String(x.reason ?? "").trim().slice(0, 500),
      category: String(x.category ?? "General").trim().slice(0, 72) || "General",
    }))
    .filter((x) => x.name.length > 0);
}

function parseFoodResponse(raw: string): FoodRecommendations | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const o = parsed as Record<string, unknown>;
  const beneficial = normalizeItems(o.beneficial);
  const avoid = normalizeItems(o.avoid);
  const supplements = normalizeItems(o.supplements);
  if (beneficial.length === 0 && avoid.length === 0 && supplements.length === 0) return null;
  return { beneficial, avoid, supplements };
}

const SYSTEM = `You are a nutrition science writer for a skincare app. Given a user's skin profile, suggest diet guidance tied to skin health (inflammation, barrier, aging, acne-related patterns, etc.).

Return ONLY a single JSON object (no markdown) with exactly these keys:
- "beneficial": array of 5–7 foods to emphasize
- "avoid": array of 4–6 things to limit or personalize (e.g. high glycemic load, some dairy — frame as "may worsen for some" where evidence is mixed)
- "supplements": array of 3–5 optional supplements with cautious wording

Each array item MUST be an object: {"name":"...","reason":"one or two sentences","category":"short label e.g. Protein, Vegetable, Beverage, Mineral"}.

Rules:
- Tailor names and reasons to the user's skin type, age range, concerns, allergies, and stated goals.
- Respect food allergies: never recommend items containing their allergens; suggest safe alternatives.
- Not a doctor: avoid prescribing; supplements must mention talking to a clinician before starting.
- Keep reasons concise and practical.`;

export async function POST(req: NextRequest) {
  let profile: SkinProfile | undefined;
  try {
    const body = await req.json();
    profile = body.profile as SkinProfile | undefined;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!profile?.skinType || !Array.isArray(profile.concerns)) {
    return NextResponse.json({ error: "Valid profile with skinType and concerns is required" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 503 });
  }

  const payload = {
    skinType: profile.skinType,
    ageRange: profile.ageRange,
    concerns: profile.concerns,
    allergies: profile.allergies ?? [],
    goals: profile.goals ?? "",
    prescriptionNote: profile.prescriptionNote ?? "",
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Skin profile (JSON):\n${JSON.stringify(payload)}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 2200,
      temperature: 0.55,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Nutrition service temporarily unavailable" },
      { status: 502 }
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return NextResponse.json({ error: "Empty model response" }, { status: 502 });
  }

  const food = parseFoodResponse(content);
  if (!food) {
    return NextResponse.json({ error: "Could not parse nutrition response" }, { status: 502 });
  }

  return NextResponse.json(food);
}
