import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id } });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const data: Record<string, unknown> = {};

  if (body.customerName !== undefined) data.customerName = body.customerName;
  if (body.phone !== undefined) data.phone = body.phone;
  if (body.address !== undefined) data.address = body.address;
  if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
  if (body.sizeDetails !== undefined)
    data.sizeDetails = body.sizeDetails || null;
  if (body.notes !== undefined) data.notes = body.notes || null;
  if (body.status !== undefined) data.status = body.status;

  if (body.totalPrice !== undefined || body.advanceAmount !== undefined) {
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const total =
      body.totalPrice !== undefined
        ? parseInt(body.totalPrice)
        : existing.totalPrice;
    const advance =
      body.advanceAmount !== undefined
        ? parseInt(body.advanceAmount)
        : existing.advanceAmount;

    data.totalPrice = total;
    data.advanceAmount = advance;
    data.codAmount = total - advance;
  }

  const order = await prisma.order.update({
    where: { id },
    data,
  });

  return NextResponse.json(order);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.order.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
