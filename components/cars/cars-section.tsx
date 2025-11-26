import { CarProps } from "@/types";
import { unstable_cache } from "next/cache";
import { generateCarImageUrl } from "@/lib/utils";
import { CarsGrid } from "./cars-grid";
import { prisma } from "@/lib/prisma";
import { Prisma, PrismaClient } from "@prisma/client";
import { carSchema } from "@/types";

interface CarsSectionProps {
    title?: string;
    description?: string;
    limit?: number;
    showFilters?: boolean;
    showSearch?: boolean;
    searchParams?: { [key: string]: string | string[] | undefined };
}

export async function getCars(
    limit = 12,
    searchParams?: { [key: string]: string | string[] | undefined }
): Promise<{ cars: CarProps[]; total: number }> {
    try {
        const { manufacturer, model, fuel, year, limit: paramLimit } = searchParams || {};

        // Create a where clause based on searchParams
        const where: Prisma.CarWhereInput = {};

        if (manufacturer) {
            where.make = {
                contains: manufacturer as string,
                mode: 'insensitive',
            };
        }

        if (model) {
            where.model = {
                contains: model as string,
                mode: 'insensitive',
            };
        }

        if (fuel) {
            where.fuelType = {
                contains: fuel as string,
                mode: 'insensitive',
            };
        }

        if (year) {
            where.year = parseInt(year as string);
        }

        // Allow limit override from params, but default to prop limit
        const take = paramLimit ? parseInt(paramLimit as string) : limit;

        const getCachedCars = unstable_cache(
            async (take: number, where: Prisma.CarWhereInput) => {
                return await Promise.all([
                    (prisma as unknown as PrismaClient).car.findMany({
                        take,
                        where,
                        orderBy: { createdAt: "desc" },
                    }),
                    (prisma as unknown as PrismaClient).car.count({ where }),
                ]);
            },
            ["cars-list"],
            { revalidate: 60, tags: ["cars"] }
        );

        const [cars, total] = await getCachedCars(take, where);

        const transformedCars = cars.map((car) => ({
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
            images:
                car.images && (car.images as string[]).length > 0
                    ? (car.images as string[])
                    : [generateCarImageUrl({ make: car.make, model: car.model, year: car.year } as CarProps)],
            location: car.location ?? undefined,
        }));

        const validatedCars = transformedCars.map((car) => carSchema.parse(car));

        return { cars: validatedCars, total };
    } catch (error) {
        console.error("Error fetching cars:", error);
        return { cars: [], total: 0 };
    }
}

export async function CarsSection({
    title = "Our Fleet",
    description = "Discover our wide selection of premium vehicles",
    limit = 12,
    showFilters = false,
    showSearch = false,
    searchParams,
}: CarsSectionProps) {
    const { cars, total } = await getCars(limit, searchParams);

    if (cars.length === 0) {
        return (
            <section id="cars" className="py-12 md:py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center">
                        <h2 className="text-balance text-4xl font-medium lg:text-5xl">
                            {title}
                        </h2>
                        <p className="text-muted-foreground mt-4 text-lg">
                            No cars available at the moment. Please check back later.
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section id="cars" className="py-12 md:py-20">
            <div className="mx-auto max-w-7xl px-6">
                <div className="mb-12 text-center">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl">
                        {title}
                    </h2>
                    <p className="text-muted-foreground mt-4 text-lg">{description}</p>
                </div>

                <CarsGrid
                    initialCars={cars}
                    total={total}
                    showFilters={showFilters}
                    showSearch={showSearch}
                />
            </div>
        </section>
    );
}
