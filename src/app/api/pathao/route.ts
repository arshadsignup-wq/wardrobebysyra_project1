import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pathaoFetch } from "@/lib/pathao";

export async function POST(request: NextRequest) {
  try {
    const { orderId, cityId, zoneId, areaId, storeId } = await request.json();

    if (!orderId || !storeId) {
      return NextResponse.json(
        { error: "Order ID and store ID are required" },
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

    if (!process.env.PATHAO_CLIENT_ID || !process.env.PATHAO_CLIENT_SECRET) {
      return NextResponse.json(
        { error: "Pathao API credentials not configured. Add PATHAO_CLIENT_ID and PATHAO_CLIENT_SECRET to your .env file." },
        { status: 500 }
      );
    }

    const payload: Record<string, unknown> = {
      store_id: storeId,
      merchant_order_id: `WBS-${order.orderNumber}`,
      recipient_name: order.customerName,
      recipient_phone: order.phone,
      recipient_address: order.address,
      delivery_type: 48,
      item_type: 2,
      special_instruction: order.notes || "",
      item_quantity: 1,
      item_weight: 0.5,
      item_description: `Wardrobe By Syra Order #${order.orderNumber}`,
      amount_to_collect: order.codAmount,
    };

    // Include location IDs if provided (optional per Pathao docs)
    if (cityId) payload.recipient_city = cityId;
    if (zoneId) payload.recipient_zone = zoneId;
    if (areaId) payload.recipient_area = areaId;

    const res = await pathaoFetch("/aladdin/api/v1/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Pathao API error:", data);
      return NextResponse.json(
        { error: data.message || "Pathao API error", details: data.errors },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      consignment_id: data.data?.consignment_id,
      data: data.data,
    });
  } catch (error) {
    console.error("Pathao create order error:", error);
    return NextResponse.json(
      { error: "Failed to create Pathao order" },
      { status: 500 }
    );
  }
}
