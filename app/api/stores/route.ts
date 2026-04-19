import { NextRequest, NextResponse } from "next/server";

const GEOCODE = "https://maps.googleapis.com/maps/api/geocode/json";
const TEXT_SEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";

function haversineMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

interface GTextResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  geometry?: { location: { lat: number; lng: number } };
}

export async function GET(req: NextRequest) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY is not configured" },
      { status: 503 }
    );
  }

  const zip = req.nextUrl.searchParams.get("zip")?.trim() ?? "";
  const brand = req.nextUrl.searchParams.get("brand")?.trim() ?? "";
  const product = req.nextUrl.searchParams.get("product")?.trim() ?? "";

  if (!zip || zip.length < 3) {
    return NextResponse.json(
      { error: "A valid ZIP or postal code is required" },
      { status: 400 }
    );
  }

  const geoUrl = `${GEOCODE}?${new URLSearchParams({
    address: `${zip}, USA`,
    key,
  })}`;

  const geoRes = await fetch(geoUrl);
  const geoData = await geoRes.json();

  if (geoData.status !== "OK" || !geoData.results?.[0]?.geometry?.location) {
    return NextResponse.json(
      {
        error:
          geoData.status === "ZERO_RESULTS"
            ? "Could not find that location"
            : "Geocoding failed — check the ZIP code",
      },
      { status: 422 }
    );
  }

  const { lat, lng } = geoData.results[0].geometry.location as {
    lat: number;
    lng: number;
  };

  const radius = "12000"; // ~7.5 mi — bias for text search
  const queries: string[] = [
    "beauty supply cosmetics skincare store",
    "pharmacy drugstore",
  ];
  if (brand) queries.push(`${brand} store`);
  else if (product) {
    const short = product.slice(0, 48);
    queries.push(`${short} beauty store`);
  }

  const seen = new Set<string>();
  const merged: GTextResult[] = [];

  for (const query of queries) {
    const url = `${TEXT_SEARCH}?${new URLSearchParams({
      query,
      location: `${lat},${lng}`,
      radius,
      key,
    })}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      continue;
    }
    for (const r of data.results ?? []) {
      if (!r.place_id || seen.has(r.place_id)) continue;
      seen.add(r.place_id);
      merged.push(r);
    }
  }

  const stores = merged
    .filter((r) => r.geometry?.location)
    .map((r) => {
      const loc = r.geometry!.location;
      const distanceMiles = haversineMiles(lat, lng, loc.lat, loc.lng);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        r.name
      )}&query_place_id=${encodeURIComponent(r.place_id)}`;
      return {
        placeId: r.place_id,
        name: r.name,
        address: r.formatted_address ?? "",
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        mapsUrl,
      };
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles)
    .slice(0, 12);

  return NextResponse.json({
    center: { lat, lng },
    stores,
  });
}
