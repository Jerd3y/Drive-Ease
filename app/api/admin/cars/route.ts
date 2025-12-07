import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { createCarSchema } from "@/lib/schemas/admin";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const validatedData = createCarSchema.parse(body);

    // Transform camelCase to Prisma field names
    const prismaData = {
      make: validatedData.make,
      model: validatedData.model,
      year: validatedData.year,
      class: validatedData.class,
      fuelType: validatedData.fuelType,
      cityMpg: validatedData.cityMpg,
      highwayMpg: validatedData.highwayMpg,
      combinationMpg: validatedData.combinationMpg,
      cylinders: validatedData.cylinders,
      displacement: validatedData.displacement,
      drive: validatedData.drive,
      transmission: validatedData.transmission,
      pricePerDay: validatedData.pricePerDay ?? 50.0,
      available: validatedData.available ?? true,
      description: validatedData.description ?? null,
      location: validatedData.location ?? null,
      images: validatedData.images ?? [],
    };

    const newCar = await prisma.car.create({
      data: prismaData,
    });

    return NextResponse.json({ car: newCar, success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating car:", error);
    return NextResponse.json(
      { error: "Failed to create car" },
      { status: 500 }
    );
  }
}

