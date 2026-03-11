import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [monthlyOrders, monthlyRevenue, pendingDeliveries, totalOrders] =
    await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.order.count({
        where: {
          status: { in: ["NEW_ORDER", "ADVANCE_PAID", "SENT_TO_TAILOR", "READY", "DISPATCHED"] },
        },
      }),
      prisma.order.count(),
    ]);

  return NextResponse.json({
    monthlyOrders,
    monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
    pendingDeliveries,
    totalOrders,
  });
}
