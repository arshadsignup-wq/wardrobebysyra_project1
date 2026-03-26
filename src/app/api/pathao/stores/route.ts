import { NextResponse } from "next/server";
import { pathaoFetch } from "@/lib/pathao";

let cachedStores: { store_id: number; store_name: string }[] | null = null;

export async function GET() {
  try {
    if (!cachedStores) {
      const res = await pathaoFetch("/aladdin/api/v1/stores");
      if (!res.ok) {
        const err = await res.text();
        console.error("Pathao stores error:", err);
        return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
      }
      const json = await res.json();
      cachedStores = json.data?.data || [];
    }

    return NextResponse.json({ stores: cachedStores });
  } catch (error) {
    console.error("Pathao stores error:", error);
    return NextResponse.json({ error: "Failed to fetch stores" }, { status: 500 });
  }
}
