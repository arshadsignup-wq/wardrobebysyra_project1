import { NextRequest, NextResponse } from "next/server";
import { pathaoFetch } from "@/lib/pathao";

const zoneCache = new Map<number, { zone_id: number; zone_name: string }[]>();

export async function GET(request: NextRequest) {
  try {
    const cityId = request.nextUrl.searchParams.get("city_id");
    if (!cityId) {
      return NextResponse.json({ error: "city_id is required" }, { status: 400 });
    }

    const id = parseInt(cityId);
    if (!zoneCache.has(id)) {
      const res = await pathaoFetch(`/aladdin/api/v1/cities/${id}/zone-list`);
      if (!res.ok) {
        const err = await res.text();
        console.error("Pathao zones error:", err);
        return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
      }
      const json = await res.json();
      zoneCache.set(id, json.data?.data || []);
    }

    return NextResponse.json({ zones: zoneCache.get(id)! });
  } catch (error) {
    console.error("Pathao zones error:", error);
    return NextResponse.json({ error: "Failed to fetch zones" }, { status: 500 });
  }
}
