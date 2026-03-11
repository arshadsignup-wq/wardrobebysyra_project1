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

  const order = await prisma.order.create({
    data: {
      customerName: body.customerName,
      phone: body.phone,
      address: body.address,
      imageUrl: body.imageUrl || null,
      sizeDetails: body.sizeDetails || null,
      totalPrice: parseInt(body.totalPrice),
      advanceAmount: parseInt(body.advanceAmount || "500"),
      codAmount:
        parseInt(body.totalPrice) - parseInt(body.advanceAmount || "500"),
      notes: body.notes || null,
    },
  });

  return NextResponse.json(order, { status: 201 });
}
