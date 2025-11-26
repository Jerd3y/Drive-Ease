import { prisma } from "@/lib/prisma";
import { carSchema, CarProps } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CarsGrid } from "@/components/cars/cars-grid";
import { CarSearch } from "@/components/cars/car-search";
import { CarFilters } from "@/components/cars/car-filters";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, CarFront } from "lucide-react";
import { ROUTES } from "@/constants/routes";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";

import { PrismaClient } from "@prisma/client";

const basePrisma = prisma as unknown as PrismaClient;

async function getCarsByClass(classFilter?: string) {
  try {
    const cars = await basePrisma.car.findMany({
      where: classFilter ? { class: classFilter, available: true } : { available: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        cityMpg: true,
        class: true,
        combinationMpg: true,
        cylinders: true,
        displacement: true,
        drive: true,
        fuelType: true,
        highwayMpg: true,
        make: true,
        model: true,
        transmission: true,
        year: true,
        pricePerDay: true,
        available: true,
        description: true,
        images: true,
        location: true,
      },
    });

    return cars.map((car) =>
      carSchema.parse({
        id: car.id,
        city_mpg: car.cityMpg,
        class: car.class,
        combination_mpg: car.combinationMpg,
        cylinders: car.cylinders,
        displacement: car.displacement,
        drive: car.drive,
        fuel_type: car.fuelType,
        highway_mpg: car.highwayMpg,
        make: car.make,
        model: car.model,
        transmission: car.transmission,
        year: car.year,
        price_per_day: car.pricePerDay ?? undefined,
        available: car.available ?? undefined,
        description: car.description ?? undefined,
        images: car.images ? (car.images as string[]) : undefined,
        location: car.location ?? undefined,
      })
    );
  } catch (error) {
    console.error("Error fetching cars:", error);
    return [];
  }
}

async function getCarClasses() {
  try {
    const classes = await basePrisma.car.findMany({
      where: { available: true },
      select: { class: true },
      distinct: ["class"],
      orderBy: { class: "asc" },
    });

    return classes.map((c) => c.class);
  } catch (error) {
    console.error("Error fetching car classes:", error);
    return [];
  }
}

function formatClassName(className: string): string {
  return className
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export default async function CarsPage() {
  const [allCars, carClasses, carsForFilters] = await Promise.all([
    getCarsByClass(),
    getCarClasses(),
    basePrisma.car.findMany({
      where: { available: true },
      select: {
        make: true,
        class: true,
        fuelType: true,
        drive: true,
        transmission: true,
        year: true,
        cityMpg: true,
        highwayMpg: true,
        combinationMpg: true,
      },
      take: 100,
    }),
  ]);

  // Transform cars for filters component
  const filterCars = carsForFilters.map((car: {
    make: string;
    class: string;
    fuelType: string;
    drive: string;
    transmission: string;
    year: number;
    cityMpg: number;
    highwayMpg: number;
    combinationMpg: number;
  }) => ({
    make: car.make,
    class: car.class,
    fuel_type: car.fuelType,
    drive: car.drive,
    transmission: car.transmission,
    year: car.year,
    price_per_day: 50,
    city_mpg: car.cityMpg,
    highway_mpg: car.highwayMpg,
    combination_mpg: car.combinationMpg,
  }));

  // Group cars by class
  const carsByClass: Record<string, CarProps[]> = {};
  allCars.forEach((car) => {
    if (!carsByClass[car.class]) {
      carsByClass[car.class] = [];
    }
    carsByClass[car.class].push(car);
  });

  // Default to first class if available
  const defaultClass = carClasses.length > 0 ? carClasses[0] : "all";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="mb-6">
          <Button asChild variant="ghost">
            <Link href={ROUTES.HOME}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Our Fleet</h1>
          <p className="text-muted-foreground text-lg">
            Explore our wide selection of vehicles organized by category
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto">
            <CarSearch />
            <div className="flex items-center gap-4 flex-wrap justify-center w-full">
              <CarFilters cars={filterCars} />
            </div>
          </div>
        </div>

        {carClasses.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <CarFront className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No cars available</EmptyTitle>
              <EmptyDescription>
                We don&apos;t have any cars available at the moment. Please check back later.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Tabs defaultValue={defaultClass} className="w-full">
            <div className="overflow-x-auto mb-6">
              <TabsList className="inline-flex w-full min-w-max">
                <TabsTrigger value="all" className="whitespace-nowrap">
                  All Cars ({allCars.length})
                </TabsTrigger>
                {carClasses.map((carClass) => {
                  const count = carsByClass[carClass]?.length || 0;
                  return (
                    <TabsTrigger
                      key={carClass}
                      value={carClass}
                      className="whitespace-nowrap"
                    >
                      {formatClassName(carClass)} ({count})
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            <TabsContent value="all" className="mt-6">
              {allCars.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <CarFront className="h-12 w-12 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>No cars found</EmptyTitle>
                    <EmptyDescription>
                      We couldn&apos;t find any available cars. Try adjusting your filters.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <CarsGrid
                  initialCars={allCars}
                  total={allCars.length}
                  showFilters={false}
                  showSearch={false}
                />
              )}
            </TabsContent>

            {carClasses.map((carClass) => {
              const classCars = carsByClass[carClass] || [];
              return (
                <TabsContent key={carClass} value={carClass} className="mt-6">
                  {classCars.length === 0 ? (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia>
                          <CarFront className="h-12 w-12 text-muted-foreground" />
                        </EmptyMedia>
                        <EmptyTitle>No {formatClassName(carClass)} available</EmptyTitle>
                        <EmptyDescription>
                          We don&apos;t have any {formatClassName(carClass).toLowerCase()} available at the moment.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  ) : (
                    <CarsGrid
                      initialCars={classCars}
                      total={classCars.length}
                      showFilters={false}
                      showSearch={false}
                    />
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </div>
    </div>
  );
}

