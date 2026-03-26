import { NextRequest, NextResponse } from "next/server";
import { pathaoFetch } from "@/lib/pathao";

const areaCache = new Map<number, { area_id: number; area_name: string }[]>();

export async function GET(request: NextRequest) {
  try {
    const zoneId = request.nextUrl.searchParams.get("zone_id");
    if (!zoneId) {
      return NextResponse.json({ error: "zone_id is required" }, { status: 400 });
    }

    const id = parseInt(zoneId);
    if (!areaCache.has(id)) {
      const res = await pathaoFetch(`/aladdin/api/v1/zones/${id}/area-list`);
      if (!res.ok) {
        const err = await res.text();
        console.error("Pathao areas error:", err);
        return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
      }
      const json = await res.json();
      areaCache.set(id, json.data?.data || []);
    }

    return NextResponse.json({ areas: areaCache.get(id)! });
  } catch (error) {
    console.error("Pathao areas error:", error);
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
  }
}
