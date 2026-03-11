import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const monthParam = request.nextUrl.searchParams.get("month");

    let year: number, month: number;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      const [y, m] = monthParam.split("-").map(Number);
      year = y;
      month = m - 1; // JS months are 0-indexed
    } else {
      const now = new Date();
      year = now.getFullYear();
      month = now.getMonth();
    }

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 1);
    const startOfPrevMonth = new Date(year, month - 1, 1);
    const endOfPrevMonth = new Date(year, month, 1);

    const [
      monthlyOrders,
      monthlyRevenue,
      prevMonthOrders,
      prevMonthRevenue,
      pendingDeliveries,
      totalOrders,
      monthOrdersList,
    ] = await Promise.all([
      prisma.order.count({
        where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
      }),
      prisma.order.count({
        where: { createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth } },
      }),
      prisma.order.aggregate({
        _sum: { totalPrice: true },
        where: { createdAt: { gte: startOfPrevMonth, lt: endOfPrevMonth } },
      }),
      prisma.order.count({
        where: {
          status: { in: ["NEW_ORDER", "SENT_TO_TAILOR", "READY", "DISPATCHED"] },
        },
      }),
      prisma.order.count(),
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth, lt: endOfMonth } },
        select: { createdAt: true, totalPrice: true },
      }),
    ]);

    // Build daily chart data
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
      day: i + 1,
      orders: 0,
      revenue: 0,
    }));

    for (const order of monthOrdersList) {
      const day = new Date(order.createdAt).getDate();
      dailyData[day - 1].orders++;
      dailyData[day - 1].revenue += order.totalPrice;
    }

    return NextResponse.json({
      monthlyOrders,
      monthlyRevenue: monthlyRevenue._sum.totalPrice || 0,
      prevMonthOrders,
      prevMonthRevenue: prevMonthRevenue._sum.totalPrice || 0,
      pendingDeliveries,
      totalOrders,
      dailyData,
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
