import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { updateCarSchema } from "@/lib/schemas/admin";
import { z } from "zod";
import { Prisma } from "@prisma/client";


export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const validatedData = updateCarSchema.parse(body);
    

    // Check if car exists first
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Prisma Accelerate extension causes type conflicts
    const existingCar = await prisma.car.findUnique({
      where: { id },
    });

    if (!existingCar) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    // Transform camelCase to snake_case for Prisma
    const prismaData: {
      pricePerDay?: number;
      cityMpg?: number;
      highwayMpg?: number;
      combinationMpg?: number;
      fuelType?: string;
      available?: boolean;
      make?: string;
      model?: string;
      year?: number;
      class?: string;
      cylinders?: number;
      displacement?: number;
      drive?: string;
      transmission?: string;
      description?: string | null;
      location?: string | null;
      images?: Prisma.InputJsonValue;
    } = {};
    if (validatedData.pricePerDay !== undefined) prismaData.pricePerDay = validatedData.pricePerDay;
    if (validatedData.cityMpg !== undefined) prismaData.cityMpg = validatedData.cityMpg;
    if (validatedData.highwayMpg !== undefined) prismaData.highwayMpg = validatedData.highwayMpg;
    if (validatedData.combinationMpg !== undefined) prismaData.combinationMpg = validatedData.combinationMpg;
    if (validatedData.fuelType !== undefined) prismaData.fuelType = validatedData.fuelType;
    if (validatedData.available !== undefined) prismaData.available = validatedData.available;
    if (validatedData.make !== undefined) prismaData.make = validatedData.make;
    if (validatedData.model !== undefined) prismaData.model = validatedData.model;
    if (validatedData.year !== undefined) prismaData.year = validatedData.year;
    if (validatedData.class !== undefined) prismaData.class = validatedData.class;
    if (validatedData.cylinders !== undefined) prismaData.cylinders = validatedData.cylinders;
    if (validatedData.displacement !== undefined) prismaData.displacement = validatedData.displacement;
    if (validatedData.drive !== undefined) prismaData.drive = validatedData.drive;
    if (validatedData.transmission !== undefined) prismaData.transmission = validatedData.transmission;
    if (validatedData.description !== undefined) prismaData.description = validatedData.description ?? null;
    if (validatedData.location !== undefined) prismaData.location = validatedData.location ?? null;
    if (validatedData.images !== undefined) prismaData.images = validatedData.images as Prisma.InputJsonValue;

    
    const updatedCar = await prisma.car.update({
      where: { id },
      data: prismaData,
    });

    return NextResponse.json({ car: updatedCar, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating car:", error);
    return NextResponse.json(
      { error: "Failed to update car" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;


    const car = await prisma.car.delete({
      where: { id },
    });

    if (!car) {
      return NextResponse.json(
        { error: "Car not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting car:", error);
    return NextResponse.json(
      { error: "Failed to delete car" },
      { status: 500 }
    );
  }
}
