import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { updateBookingStatusSchema, updateBookingSchema } from "@/lib/schemas/admin";
import { z } from "zod";
import { sendBookingStatusUpdateEmail } from "@/lib/email";
import type { BookingStatus } from "@prisma/client";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Try full update schema first, fallback to status-only
    let validatedData: z.infer<typeof updateBookingSchema> | z.infer<typeof updateBookingStatusSchema>;
    try {
      validatedData = updateBookingSchema.parse(body);
    } catch {
      validatedData = updateBookingStatusSchema.parse(body);
    }

    // @ts-expect-error - Prisma Accelerate extension causes type conflicts with include/select
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        car: {
          select: { make: true, model: true, year: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    // Transform data for Prisma - use proper BookingStatus type
    const prismaData: {
      status?: BookingStatus;
      startDate?: Date;
      endDate?: Date;
      totalPrice?: number;
    } = {};
    
    if (validatedData.status !== undefined) {
      prismaData.status = validatedData.status as BookingStatus;
    }
    if ('startDate' in validatedData && validatedData.startDate !== undefined) {
      prismaData.startDate = validatedData.startDate;
    }
    if ('endDate' in validatedData && validatedData.endDate !== undefined) {
      prismaData.endDate = validatedData.endDate;
    }
    if ('totalPrice' in validatedData && validatedData.totalPrice !== undefined) {
      prismaData.totalPrice = validatedData.totalPrice;
    }

    
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: prismaData,
      include: {
        car: {
          select: { make: true, model: true, year: true },
        },
        user: {
          select: { name: true, email: true },
        },
      },
    });

    // Send status update email if status changed (don't await - send in background)
    if (validatedData.status && validatedData.status !== booking.status) {
      sendBookingStatusUpdateEmail({
        userName: updatedBooking.user.name || 'Customer',
        userEmail: updatedBooking.user.email,
        carMake: updatedBooking.car.make,
        carModel: updatedBooking.car.model,
        carYear: updatedBooking.car.year,
        startDate: updatedBooking.startDate,
        endDate: updatedBooking.endDate,
        totalPrice: updatedBooking.totalPrice,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
      }).catch(err => console.error('Failed to send status update email:', err));
    }

    return NextResponse.json({ booking: updatedBooking, success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating booking:", error);
    return NextResponse.json(
      { error: "Failed to update booking" },
      { status: 500 }
    );
  }
}
