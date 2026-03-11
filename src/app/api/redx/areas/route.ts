import { NextRequest, NextResponse } from "next/server";

const REDX_PRODUCTION_URL = "https://openapi.redx.com.bd/v1.0.0-beta";
const REDX_SANDBOX_URL = "https://sandbox.redx.com.bd/v1.0.0-beta";

interface RedxArea {
  id: number;
  name: string;
  district_name?: string;
  post_code?: string;
}

let cachedAreas: RedxArea[] | null = null;

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.toLowerCase() || "";
    const token = process.env.REDX_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json({ error: "RedX token not configured" }, { status: 500 });
    }

    // Cache areas in memory to avoid hitting RedX API every time
    if (!cachedAreas) {
      const baseUrl = process.env.REDX_SANDBOX === "true" ? REDX_SANDBOX_URL : REDX_PRODUCTION_URL;
      const res = await fetch(`${baseUrl}/areas`, {
        headers: {
          "Accept": "application/json",
          "API-ACCESS-TOKEN": `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        return NextResponse.json({ error: "Failed to fetch areas from RedX" }, { status: 500 });
      }

      const data = await res.json();
      cachedAreas = data.areas || [];
    }

    // Filter by search term
    let results = cachedAreas!;
    if (search.length >= 2) {
      results = cachedAreas!.filter((a) =>
        a.name.toLowerCase().includes(search)
      );
    } else {
      results = [];
    }

    return NextResponse.json({ areas: results.slice(0, 20) });
  } catch (error) {
    console.error("RedX areas error:", error);
    return NextResponse.json({ error: "Failed to fetch areas" }, { status: 500 });
  }
}
