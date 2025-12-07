import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth-utils";
import { z } from "zod";

const completeBookingSchema = z.object({
  phoneNumber: z.string().min(10),
  driversLicenseNumber: z.string().min(5),
  pickupLocation: z.string().min(1),
  dropoffLocation: z.string().min(1),
  emergencyContactName: z.string().min(2),
  emergencyContactPhone: z.string().min(10),
  specialRequests: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const data = completeBookingSchema.parse(body);

    // Verify booking belongs to user
    // @ts-expect-error - Prisma Accelerate extension causes type conflicts
    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Store additional information in proper schema fields
    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        phoneNumber: data.phoneNumber,
        driversLicense: data.driversLicenseNumber,
        pickupLocation: data.pickupLocation,
        dropoffLocation: data.dropoffLocation,
        emergencyContact: data.emergencyContactName,
        emergencyPhone: data.emergencyContactPhone,
        specialRequests: data.specialRequests,
        status: booking.status === "pending" ? "confirmed" : booking.status,
      },
    });

    // In a production app, you'd want to store this in a separate table
    // For now, we'll return success
    return NextResponse.json({
      success: true,
      message: "Booking information saved successfully",
      booking: updatedBooking,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error completing booking:", error);
    return NextResponse.json(
      { error: "Failed to save booking information" },
      { status: 500 }
    );
  }
}

