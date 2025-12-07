import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AnalyticsCharts } from "@/components/dashboard/analytics-charts";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  await requireAdmin();

  // 1. Total Revenue
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const totalRevenueResult = await prisma.booking.aggregate({
    _sum: { totalPrice: true },
    where: { status: { in: ["confirmed", "completed"] } },
  });
  const totalRevenue = totalRevenueResult._sum.totalPrice || 0;

  // 2. Monthly Revenue
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const bookings = await prisma.booking.findMany({
    where: {
      status: { in: ["confirmed", "completed"] },
      createdAt: {
        gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
      },
    },
    select: {
      createdAt: true,
      totalPrice: true,
    },
  });

  const monthlyData: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bookings.forEach((booking: any) => {
    const month = new Date(booking.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    monthlyData[month] = (monthlyData[month] || 0) + booking.totalPrice;
  });
  const monthlyRevenue = Object.entries(monthlyData).map(([month, revenue]) => ({
    month,
    revenue,
  }));

  // 3. Popular Cars
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const popularCarGroups = await prisma.booking.groupBy({
    by: ["carId"],
    _count: { carId: true },
    orderBy: { _count: { carId: "desc" } },
    take: 5,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const carIds = popularCarGroups.map((g: any) => g.carId);
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const cars = await prisma.car.findMany({
    where: { id: { in: carIds } },
    select: { id: true, make: true, model: true, year: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const popularCars = popularCarGroups.map((group: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const car = cars.find((c: any) => c.id === group.carId);
    return {
      car: car || { make: "Unknown", model: "Car", year: 0 },
      count: group._count.carId,
    };
  });

  // 4. Booking Trends
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const bookingTrendsData = await prisma.booking.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookingTrends = bookingTrendsData.map((t: any) => ({
    status: t.status,
    count: t._count.status,
  }));

  const analyticsData = {
    totalRevenue,
    monthlyRevenue,
    popularCars,
    bookingTrends,
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="flex items-center justify-between px-4 lg:px-6">
                <div>
                  <h1 className="text-3xl font-bold mb-2">Analytics & Reports</h1>
                  <p className="text-muted-foreground">
                    View insights and export reports
                  </p>
                </div>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
              </div>
              <AnalyticsCharts data={analyticsData} />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
