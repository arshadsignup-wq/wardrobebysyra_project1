import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const REDX_SANDBOX_URL = "https://sandbox.redx.com.bd/v1.0.0-beta";
const REDX_PRODUCTION_URL = "https://openapi.redx.com.bd/v1.0.0-beta";

// Default area ID for RedX — ID 1 works as a universal fallback
// RedX routes the parcel based on the customer address text
const DEFAULT_AREA_ID = 1;

export async function POST(request: NextRequest) {
  try {
    const { orderId, deliveryAreaId, deliveryAreaName, pickupStoreId } = await request.json();

    if (!orderId || !deliveryAreaId) {
      return NextResponse.json(
        { error: "Order ID and delivery area are required" },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    const token = process.env.REDX_ACCESS_TOKEN;
    const storeId = process.env.REDX_PICKUP_STORE_ID;

    if (!token || token === "your-redx-api-token-here") {
      return NextResponse.json(
        { error: "RedX API token not configured. Add REDX_ACCESS_TOKEN to your .env file." },
        { status: 500 }
      );
    }

    const baseUrl = process.env.REDX_SANDBOX === "true" ? REDX_SANDBOX_URL : REDX_PRODUCTION_URL;

    const res = await fetch(`${baseUrl}/parcel`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "API-ACCESS-TOKEN": `Bearer ${token}`,
      },
      body: JSON.stringify({
        customer_name: order.customerName,
        customer_phone: order.phone,
        delivery_area: deliveryAreaName || order.address,
        delivery_area_id: deliveryAreaId,
        customer_address: order.address,
        merchant_invoice_id: `WBS-${order.orderNumber}`,
        cash_collection_amount: order.codAmount,
        parcel_weight: 500,
        instruction: order.notes || "",
        value: order.totalPrice + order.deliveryCharge,
        pickup_store_id: pickupStoreId || parseInt(storeId || "0"),
        parcel_details_json: [
          {
            name: "Wardrobe By Syra Order",
            category: "Fashion",
            qty: 1,
            price: order.totalPrice,
          },
        ],
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("RedX API error:", data);
      return NextResponse.json(
        { error: data.message || "RedX API error", details: data.errors || data.validation_errors },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      tracking_id: data.tracking_id,
      data,
    });
  } catch (error) {
    console.error("RedX create parcel error:", error);
    return NextResponse.json(
      { error: "Failed to create RedX parcel" },
      { status: 500 }
    );
  }
}
