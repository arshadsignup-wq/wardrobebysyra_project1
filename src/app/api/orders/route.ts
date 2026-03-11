import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as OrderStatus | null;
    const search = searchParams.get("search");

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const totalPrice = parseInt(body.totalPrice);
    const advanceAmount = parseInt(body.advanceAmount || "0");
    const deliveryCharge = parseInt(body.deliveryCharge || "80");
    const codAmount = totalPrice + deliveryCharge - advanceAmount;

    const order = await prisma.order.create({
      data: {
        customerName: body.customerName,
        phone: body.phone,
        address: body.address,
        imageUrl: body.imageUrl || null,
        sizeDetails: body.sizeDetails || null,
        totalPrice,
        advanceAmount,
        deliveryCharge,
        deliveryZone: body.deliveryZone || "INSIDE_DHAKA",
        codAmount,
        source: body.source || "FACEBOOK",
        notes: body.notes || null,
        ...(body.orderDate
          ? { createdAt: new Date(body.orderDate + "T00:00:00") }
          : {}),
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
