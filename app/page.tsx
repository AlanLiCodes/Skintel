import Link from "next/link";
import { ArrowRight, Sparkles, FlaskConical, MapPin, Leaf, ScanFace, FileText } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "AI Skin Analysis",
    description:
      "Tell us your skin type, concerns, and goals. Our AI builds a personalized routine with the exact ingredients your skin needs.",
  },
  {
    icon: FlaskConical,
    title: "Ingredient Intelligence",
    description:
      "Every ingredient explained — its function, ideal concentration, interactions, and how it works within a formulation.",
  },
  {
    icon: MapPin,
    title: "Find It Near You",
    description:
      "Enter your zip code and we'll show you exactly which local stores carry your recommended products.",
  },
  {
    icon: Leaf,
    title: "Eat for Your Skin",
    description:
      "Beyond topicals — discover which foods support your skin goals and which to limit for better results.",
  },
  {
    icon: ScanFace,
    title: "Skin Image Scan",
    description:
      "Upload a photo of your skin and our AI will identify visible concerns to refine your recommendations.",
  },
  {
    icon: FileText,
    title: "Derm Note Import",
    description:
      "Have a prescription or note from your dermatologist? Upload or type it in to factor it into your routine.",
  },
];

const STEPS = [
  { number: "01", title: "Build your profile", description: "Share your age range, skin type, concerns, current products, and any allergies." },
  { number: "02", title: "AI analyzes your skin", description: "Our AI maps your concerns to the best-fit ingredients and formulations." },
  { number: "03", title: "Get your routine", description: "A full AM/PM routine, ingredient guide, and curated product picks — with explanations." },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 bg-stone-100 text-stone-600 text-xs font-medium px-3 py-1 rounded-full mb-6">
            <Sparkles size={11} />
            AI-Powered Skincare Intelligence
          </div>
          <h1 className="text-5xl sm:text-6xl font-semibold text-stone-900 leading-[1.1] tracking-tight mb-6">
            Know exactly what your skin needs.
          </h1>
          <p className="text-lg text-stone-500 leading-relaxed mb-8 max-w-xl">
            Skintel analyzes your skin profile to recommend the right ingredients, products, and habits — no guesswork, just science.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/profile/new"
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Start your skin profile
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/ingredients"
              className="inline-flex items-center gap-2 text-stone-600 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              Browse ingredients
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 flex gap-8 flex-wrap">
          {[
            { value: "500+", label: "Ingredients analyzed" },
            { value: "2,000+", label: "Products catalogued" },
            { value: "15+", label: "Skin concerns covered" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-semibold text-stone-900">{stat.value}</div>
              <div className="text-sm text-stone-500 mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-stone-50 border-y border-stone-200 py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-stone-900 mb-10">How it works</h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div key={step.number} className="flex gap-4">
                <span className="text-3xl font-light text-stone-300 tabular-nums leading-none mt-0.5">{step.number}</span>
                <div>
                  <div className="font-medium text-stone-900 mb-1">{step.title}</div>
                  <div className="text-sm text-stone-500 leading-relaxed">{step.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-2xl font-semibold text-stone-900 mb-2">Everything your skin routine needs</h2>
        <p className="text-stone-500 mb-10">From ingredient science to where to buy — all in one place.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="p-5 border border-stone-200 rounded-xl bg-white hover:border-stone-300 transition-colors"
              >
                <div className="w-9 h-9 bg-stone-100 rounded-lg flex items-center justify-center mb-3">
                  <Icon size={16} className="text-stone-600" />
                </div>
                <div className="font-medium text-stone-900 mb-1">{feature.title}</div>
                <div className="text-sm text-stone-500 leading-relaxed">{feature.description}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-stone-900 rounded-2xl px-8 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="text-white font-semibold text-xl mb-1">Ready to decode your skin?</div>
            <div className="text-stone-400 text-sm">Build your profile in under 3 minutes. Free, no account required.</div>
          </div>
          <Link
            href="/profile/new"
            className="shrink-0 inline-flex items-center gap-2 bg-white text-stone-900 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Build my skin profile
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>
    </div>
  );
}
