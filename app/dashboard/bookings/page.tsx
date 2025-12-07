import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { BookingsTable } from "@/components/dashboard/bookings-table";
import { BookingStats } from "@/components/dashboard/booking-stats";

export const dynamic = 'force-dynamic'

export default async function BookingsAdminPage() {
  await requireAdmin();

  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const bookings = await prisma.booking.findMany({
    include: {
      car: {
        select: {
          make: true,
          model: true,
          year: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const stats = await prisma.booking.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const statsData = {
    pending: stats.find((s: { status: string; _count: { status: number } }) => s.status === "pending")?._count.status || 0,
    confirmed: stats.find((s: { status: string; _count: { status: number } }) => s.status === "confirmed")?._count.status || 0,
    completed: stats.find((s: { status: string; _count: { status: number } }) => s.status === "completed")?._count.status || 0,
    cancelled: stats.find((s: { status: string; _count: { status: number } }) => s.status === "cancelled")?._count.status || 0,
    total: bookings.length,
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
              <div className="px-4 lg:px-6">
                <h1 className="text-3xl font-bold mb-2">Bookings Management</h1>
                <p className="text-muted-foreground">
                  Manage all car rental bookings
                </p>
              </div>
              <BookingStats stats={statsData} />
              <div className="px-4 lg:px-6">
                <BookingsTable bookings={bookings} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

