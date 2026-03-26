import { NextResponse } from "next/server";
import { pathaoFetch } from "@/lib/pathao";

let cachedCities: { city_id: number; city_name: string }[] | null = null;

export async function GET() {
  try {
    if (!cachedCities) {
      const res = await pathaoFetch("/aladdin/api/v1/city-list");
      if (!res.ok) {
        const err = await res.text();
        console.error("Pathao cities error:", err);
        return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 });
      }
      const json = await res.json();
      cachedCities = json.data?.data || [];
    }

    return NextResponse.json({ cities: cachedCities });
  } catch (error) {
    console.error("Pathao cities error:", error);
    const msg = error instanceof Error ? error.message : "Failed to fetch cities";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
