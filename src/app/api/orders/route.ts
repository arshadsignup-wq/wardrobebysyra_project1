import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { OrderStatus } from "@/lib/types";

export async function GET(request: NextRequest) {
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
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const totalPrice = parseInt(body.totalPrice);
  const advanceAmount = parseInt(body.advanceAmount || "500");
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
    },
  });

  return NextResponse.json(order, { status: 201 });
}
