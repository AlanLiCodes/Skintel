# Skintel — AI-Powered Skincare Intelligence

Skintel is a full-stack Next.js application that helps users build a personalized skincare routine using AI-powered ingredient and product analysis.

## Features

- **Skin Profile Builder** — Onboarding: age range, skin type, concerns, current products, allergies, optional derm notes
- **AI Analysis** — Recommended ingredients (rule-based from the library), mock catalog products, AM/PM routine, and **nutrition** suggestions via OpenAI when configured
- **Ingredient Library** — Breakdowns with concentration ranges, interactions, functions, and pH where applicable
- **Product Finder** — Search products from a local SQLite DB built from [LauraAddams Skincare API](https://github.com/LauraAddams/skincareAPI)-style CSV seeds; optional **nearby retailers** by ZIP (Google Places + Geocoding)
- **AI Chat** — GPT-4o-mini advisor (requires `OPENAI_API_KEY`)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Product database (SQLite)

`data/skincare.db` is **not** in the repo (it is gitignored). After cloning, generate it once:

```bash
python3 scripts/build_skincare_db.py
```

This reads CSV files from `scripts/seed_data/` and writes `data/skincare.db`. Use **Python 3** (stdlib only: `csv`, `sqlite3`). Then start or restart `npm run dev` so the API routes pick up the database.

## Environment variables (optional)

Create `.env.local` in the project root (never commit real keys):

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | AI **chat** (`/api/chat`) and **nutrition** section on Analyze (`/api/nutrition`) |
| `GOOGLE_PLACES_API_KEY` | **Nearby stores** on the Products page and Analyze (`/api/stores`; enable Geocoding API + Places API in Google Cloud) |

**Without `OPENAI_API_KEY`:** chat shows a demo message; nutrition on Analyze falls back to built-in placeholder lists. **Without `GOOGLE_PLACES_API_KEY`:** store lookup returns an error until a key is set.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Zustand** (state + `localStorage` persistence)
- **better-sqlite3** (read-only access to `data/skincare.db`)
- **OpenAI API** (chat + nutrition JSON)
- **Google Maps Platform** (Geocoding + Places for store search)
- **react-dropzone** / **lucide-react**
