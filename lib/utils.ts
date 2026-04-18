import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateId() {
  return Math.random().toString(36).substring(2, 11);
}

export function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function scoreToLabel(score: number): string {
  if (score >= 90) return "Excellent Match";
  if (score >= 75) return "Great Match";
  if (score >= 60) return "Good Match";
  if (score >= 45) return "Fair Match";
  return "Possible Match";
}

export function scoreToColor(score: number): string {
  if (score >= 90) return "text-emerald-600";
  if (score >= 75) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-orange-600";
}

export function comedogenicLabel(rating: number): string {
  const labels = ["Non-comedogenic", "Slightly comedogenic", "Moderately comedogenic", "Moderately comedogenic", "Highly comedogenic", "Highly comedogenic"];
  return labels[Math.min(rating, 5)] || "Unknown";
}

export function safetyLabel(rating: "low" | "moderate" | "high"): { label: string; color: string } {
  const map = {
    low: { label: "Low Concern", color: "text-emerald-600" },
    moderate: { label: "Moderate Concern", color: "text-amber-600" },
    high: { label: "High Concern", color: "text-red-600" },
  };
  return map[rating];
}
