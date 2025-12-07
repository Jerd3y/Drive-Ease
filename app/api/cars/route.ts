import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { carSchema } from "@/types";
import { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");
    const classFilter = searchParams.get("class");
    const fuelType = searchParams.get("fuel_type");
    const drive = searchParams.get("drive");
    const transmission = searchParams.get("transmission");
    const q = searchParams.get("q"); // Full-text search
    const minPrice = searchParams.get("min_price");
    const maxPrice = searchParams.get("max_price");
    const minYear = searchParams.get("min_year");
    const maxYear = searchParams.get("max_year");
    const minMpg = searchParams.get("min_mpg");
    const maxMpg = searchParams.get("max_mpg");
    const available = searchParams.get("available");
    const sortBy = searchParams.get("sort_by") || "created_at";
    const sortOrderParam = searchParams.get("sort_order") || "desc";
    
    // Validate sort order - must be "asc" or "desc"
    const sortOrder = (sortOrderParam === "asc" || sortOrderParam === "desc") 
      ? sortOrderParam 
      : "desc";

    const where: Prisma.CarWhereInput = {};
    const orConditions: Prisma.CarWhereInput[] = [];

    // Full-text search across multiple fields
    if (q) {
      orConditions.push(
        { make: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { class: { contains: q, mode: "insensitive" } },
        { fuelType: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      );
    }

    // Individual field filters
    if (make) {
      where.make = { contains: make, mode: "insensitive" };
    }
    if (model) {
      where.model = { contains: model, mode: "insensitive" };
    }
    if (year) {
      where.year = parseInt(year);
    }
    if (classFilter) {
      where.class = classFilter;
    }
    if (fuelType) {
      where.fuelType = fuelType;
    }
    if (drive) {
      where.drive = drive;
    }
    if (transmission) {
      where.transmission = transmission;
    }

    // Range filters
    if (minPrice || maxPrice) {
      where.pricePerDay = {};
      if (minPrice) {
        where.pricePerDay.gte = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.pricePerDay.lte = parseFloat(maxPrice);
      }
    }

    if (minYear || maxYear) {
      where.year = {};
      if (minYear) {
        where.year.gte = parseInt(minYear);
      }
      if (maxYear) {
        where.year.lte = parseInt(maxYear);
      }
    }

    if (minMpg || maxMpg) {
      const mpgConditions: Prisma.CarWhereInput[] = [];
      if (minMpg || maxMpg) {
        mpgConditions.push({
          cityMpg: {
            ...(minMpg ? { gte: parseInt(minMpg) } : {}),
            ...(maxMpg ? { lte: parseInt(maxMpg) } : {}),
          },
        });
        mpgConditions.push({
          highwayMpg: {
            ...(minMpg ? { gte: parseInt(minMpg) } : {}),
            ...(maxMpg ? { lte: parseInt(maxMpg) } : {}),
          },
        });
        mpgConditions.push({
          combinationMpg: {
            ...(minMpg ? { gte: parseInt(minMpg) } : {}),
            ...(maxMpg ? { lte: parseInt(maxMpg) } : {}),
          },
        });
      }
      if (mpgConditions.length > 0) {
        orConditions.push({ OR: mpgConditions });
      }
    }

    if (orConditions.length > 0) {
      where.OR = orConditions;
    }

    if (available !== null && available !== undefined) {
      where.available = available === "true";
    }

    // Sorting
    const orderBy: Prisma.CarOrderByWithRelationInput = {};
    const validSortOrder = sortOrder === "asc" ? "asc" : "desc";
    
    switch (sortBy) {
      case "price":
        orderBy.pricePerDay = validSortOrder;
        break;
      case "year":
        orderBy.year = validSortOrder;
        break;
      case "city_mpg":
        orderBy.cityMpg = validSortOrder;
        break;
      case "highway_mpg":
        orderBy.highwayMpg = validSortOrder;
        break;
      case "combination_mpg":
        orderBy.combinationMpg = validSortOrder;
        break;
      case "make":
        orderBy.make = validSortOrder;
        break;
      case "model":
        orderBy.model = validSortOrder;
        break;
      case "created_at":
        orderBy.createdAt = validSortOrder;
        break;
      default:
        orderBy.createdAt = validSortOrder;
    }

    // @ts-expect-error - Prisma Accelerate extension causes type conflicts
    const cars = await prisma.car.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy,
    });
    
    // @ts-expect-error - Prisma Accelerate extension causes type conflicts
    const total = await prisma.car.count({ where });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const transformedCars = cars.map((car: any) => ({
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
    }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const validatedCars = transformedCars.map((car: any) => carSchema.parse(car));

    return NextResponse.json({
      cars: validatedCars,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error) {
    console.error("Error fetching cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    );
  }
}

