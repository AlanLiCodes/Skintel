# Skintel — AI-Powered Skincare Intelligence

Skintel is a full-stack Next.js application that helps users build a personalized skincare routine using AI-powered ingredient and product analysis.

## Features

- **Skin Profile Builder** — 5-step onboarding: age range, skin type, concerns, current products, allergies
- **AI Analysis** — Matches your profile to recommended ingredients, products, and a full AM/PM routine
- **Ingredient Library** — Deep breakdowns with concentration ranges, interactions, functions, and pH requirements
- **Product Finder** — Search by concern, see key ingredients, purchase links, and store availability by ZIP code
- **AI Chat** — Conversational skincare advisor powered by GPT-4o-mini (requires OpenAI API key)
- **Nutrition Guide** — Foods to eat/avoid and supplements for your skin concerns
- **Skin Image Scan** — Upload a photo for AI-powered visible concern detection (beta)
- **Prescription Import** — Type in your derm's notes to factor them into your analysis

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## AI Chat (Optional)

To enable the full AI chat feature, add your OpenAI API key:

```bash
cp .env.local.example .env.local
# Then edit .env.local and add your key
```

Without the key, the app runs in demo mode — all analysis, recommendations, and ingredient data are fully functional without an API key.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state management + localStorage persistence)
- **OpenAI API** (chat feature)
- **react-dropzone** (image upload)
- **lucide-react** (icons)
