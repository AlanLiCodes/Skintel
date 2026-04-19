// Skin profile types
export type SkinType = "dry" | "oily" | "combination" | "normal" | "sensitive";

export type SkinConcern =
  | "acne"
  | "hyperpigmentation"
  | "anti-aging"
  | "dryness"
  | "oiliness"
  | "redness"
  | "pores"
  | "texture"
  | "dark-circles"
  | "fine-lines"
  | "eczema"
  | "rosacea"
  | "melasma"
  | "scarring"
  | "uneven-tone";

export type AgeRange = "under-18" | "18-24" | "25-34" | "35-44" | "45-54" | "55+";

export interface SkinProfile {
  id: string;
  createdAt: string;
  updatedAt: string;
  ageRange: AgeRange;
  skinType: SkinType;
  concerns: SkinConcern[];
  allergies: string[];
  currentProducts: CurrentProduct[];
  goals: string;
  prescriptionNote?: string;
  location?: string;
  skinImageUrl?: string;
}

export interface CurrentProduct {
  id: string;
  name: string;
  category: ProductCategory;
  brand?: string;
}

export type ProductCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "moisturizer"
  | "sunscreen"
  | "eye-cream"
  | "exfoliant"
  | "mask"
  | "oil"
  | "mist"
  | "spot-treatment"
  | "retinol"
  | "prescription";

// Ingredient types
export interface Ingredient {
  id: string;
  name: string;
  inci: string;
  description: string;
  benefits: string[];
  concerns: SkinConcern[];
  skinTypes: SkinType[];
  concentrationRange: {
    min: number;
    max: number;
    optimal: number;
    unit: string;
  };
  function: IngredientFunction[];
  safetyRating: "low" | "moderate" | "high";
  comedogenic: number; // 0-5 scale
  interactions: {
    compatible: string[];
    avoid: string[];
  };
  sources: string[];
  ph?: {
    min: number;
    max: number;
  };
  tags: string[];
}

export type IngredientFunction =
  | "humectant"
  | "emollient"
  | "occlusive"
  | "exfoliant"
  | "antioxidant"
  | "brightener"
  | "anti-inflammatory"
  | "anti-acne"
  | "retinoid"
  | "peptide"
  | "vitamin"
  | "sunscreen-filter"
  | "preservative"
  | "emulsifier"
  | "pH-adjuster"
  | "film-former";

// Product types
export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  size: string;
  description: string;
  keyIngredients: string[];
  allIngredients: string[];
  concerns: SkinConcern[];
  skinTypes: SkinType[];
  rating: number;
  reviewCount: number;
  imageUrl: string;
  purchaseLinks: PurchaseLink[];
  tags: string[];
}

export interface PurchaseLink {
  retailer: string;
  url: string;
  price: number;
  inStock: boolean;
}

export interface StoreLocation {
  name: string;
  address: string;
  distance: number;
  hasProduct: boolean;
  phone?: string;
  hours?: string;
}

// AI Analysis types
export interface SkinAnalysis {
  id: string;
  profileId: string;
  createdAt: string;
  summary: string;
  primaryConcerns: AnalysisConcern[];
  recommendedIngredients: RecommendedIngredient[];
  recommendedProducts: RecommendedProduct[];
  routineSuggestion: RoutineSuggestion;
  foodRecommendations: FoodRecommendations;
  imageAnalysis?: ImageAnalysis;
}

export interface AnalysisConcern {
  concern: SkinConcern;
  severity: "mild" | "moderate" | "severe";
  explanation: string;
  priority: number;
}

export interface RecommendedIngredient {
  ingredient: Ingredient;
  reason: string;
  priority: "essential" | "recommended" | "optional";
  step: ProductCategory;
  concentrationNote: string;
}

export interface RecommendedProduct {
  product: Product;
  matchScore: number;
  reason: string;
  step: ProductCategory;
  pros: string[];
  cons: string[];
}

export interface RoutineSuggestion {
  am: RoutineStep[];
  pm: RoutineStep[];
  weekly: RoutineStep[];
}

export interface RoutineStep {
  order: number;
  category: ProductCategory;
  instruction: string;
  productId?: string;
  ingredientIds?: string[];
}

export interface FoodRecommendations {
  beneficial: FoodItem[];
  avoid: FoodItem[];
  supplements: FoodItem[];
}

export interface FoodItem {
  name: string;
  reason: string;
  category: string;
}

export interface ImageAnalysis {
  detectedConcerns: SkinConcern[];
  hydrationLevel: "low" | "normal" | "high";
  notes: string;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  profileId?: string;
  messages: ChatMessage[];
  createdAt: string;
}
