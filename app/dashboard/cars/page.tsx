import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { CarsAdminTable } from "@/components/dashboard/cars-admin-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { IconPlus } from "@tabler/icons-react";

const basePrisma = prisma as unknown as PrismaClient;

export default async function CarsAdminPage() {
  await requireAdmin();

  const carsData = await basePrisma.car.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Transform cars to match the CarsAdminTable component's expected format
  const cars = carsData.map((car) => {
    let images: string | string[] | null = null;

    if (car.images) {
      if (Array.isArray(car.images)) {
        images = car.images.filter((img): img is string => typeof img === "string");
      } else if (typeof car.images === "string") {
        images = [car.images];
      }
    }

    return {
      id: car.id,
      make: car.make,
      model: car.model,
      year: car.year,
      pricePerDay: car.pricePerDay,
      available: car.available,
      class: car.class,
      fuelType: car.fuelType,
      cityMpg: car.cityMpg,
      highwayMpg: car.highwayMpg,
      transmission: car.transmission,
      drive: car.drive,
      images,
    };
  });

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
                  <h1 className="text-3xl font-bold mb-2">Car Management</h1>
                  <p className="text-muted-foreground">
                    Manage your car inventory
                  </p>
                </div>
                <Link href="/dashboard/cars/new">
                  <Button>
                    <IconPlus className="mr-2 size-4" />
                    Add Car
                  </Button>
                </Link>
              </div>
              <div className="px-4 lg:px-6">
                <CarsAdminTable cars={cars} />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

