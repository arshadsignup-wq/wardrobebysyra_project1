import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("GET /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};

    if (body.customerName !== undefined) data.customerName = body.customerName;
    if (body.phone !== undefined) data.phone = body.phone;
    if (body.address !== undefined) data.address = body.address;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl || null;
    if (body.sizeDetails !== undefined) data.sizeDetails = body.sizeDetails || null;
    if (body.notes !== undefined) data.notes = body.notes || null;
    if (body.status !== undefined) data.status = body.status;
    if (body.source !== undefined) data.source = body.source;
    if (body.deliveryZone !== undefined) data.deliveryZone = body.deliveryZone;
    if (body.orderDate) data.createdAt = new Date(body.orderDate + "T00:00:00");

    // Recalculate COD if any pricing field changes
    if (
      body.totalPrice !== undefined ||
      body.advanceAmount !== undefined ||
      body.deliveryCharge !== undefined
    ) {
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
      const delivery =
        body.deliveryCharge !== undefined
          ? parseInt(body.deliveryCharge)
          : existing.deliveryCharge;

      data.totalPrice = total;
      data.advanceAmount = advance;
      data.deliveryCharge = delivery;
      data.codAmount = total + delivery - advance;
    }

    const order = await prisma.order.update({
      where: { id },
      data,
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("PATCH /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/orders/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete order" },
      { status: 500 }
    );
  }
}
