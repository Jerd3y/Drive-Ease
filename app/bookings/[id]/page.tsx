import Link from "next/link";
import { notFound } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    CarFront,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    MapPin,
    Phone,
    User,
    FileText,
    CreditCard,
    Fuel,
    Gauge,
    Settings2
} from "lucide-react";
import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import type { BookingStatus } from "@prisma/client";
import { ROUTES } from "@/constants/routes";
import { BOOKING_STATUS_LABELS } from "@/constants/config";
import { format, differenceInDays } from "date-fns";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface BookingDetailPageProps {
    params: {
        id: string;
    };
}

export default async function BookingDetailPage({ params }: BookingDetailPageProps) {
    const user = await requireAuth();

    // @ts-expect-error - Prisma Accelerate extension causes type conflicts with include/select
    const booking = await prisma.booking.findUnique({
        where: {
            id: params.id,
            userId: user.id, // Ensure the booking belongs to the current user
        },
        include: {
            car: true,
        },
    });

    if (!booking) {
        notFound();
    }

    const getStatusVariant = (status: BookingStatus): "default" | "secondary" | "destructive" | "outline" => {
        switch (status) {
            case "confirmed":
                return "default";
            case "pending":
                return "secondary";
            case "completed":
                return "outline";
            case "cancelled":
                return "destructive";
            default:
                return "outline";
        }
    };

    const getStatusIcon = (status: BookingStatus) => {
        switch (status) {
            case "confirmed":
                return CheckCircle2;
            case "pending":
                return AlertCircle;
            case "completed":
                return CheckCircle2;
            case "cancelled":
                return XCircle;
            default:
                return FileText;
        }
    };

    const getStatusLabel = (status: BookingStatus): string => {
        return BOOKING_STATUS_LABELS[status] || status.charAt(0).toUpperCase() + status.slice(1);
    };

    const duration = differenceInDays(new Date(booking.endDate), new Date(booking.startDate)) + 1;
    const StatusIcon = getStatusIcon(booking.status);

    // Parse car images
    const carImages = Array.isArray(booking.car.images)
        ? booking.car.images
        : typeof booking.car.images === 'string'
            ? JSON.parse(booking.car.images || '[]')
            : [];
    const primaryImage = carImages[0] || '/car-placeholder.png';

    return (
        <div className="min-h-screen bg-background">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <div className="mb-6">
                    <Button asChild variant="ghost">
                        <Link href={ROUTES.BOOKINGS}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Bookings
                        </Link>
                    </Button>
                </div>

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
                        <p className="text-muted-foreground">
                            Booking ID: <span className="font-mono text-sm">{booking.id}</span>
                        </p>
                    </div>
                    <Badge variant={getStatusVariant(booking.status)} className="gap-1.5 text-sm px-3 py-1">
                        <StatusIcon className="h-4 w-4" />
                        {getStatusLabel(booking.status)}
                    </Badge>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Car Information */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CarFront className="h-5 w-5" />
                                    Vehicle Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex gap-6">
                                    <div className="w-48 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                        <Image
                                            src={primaryImage}
                                            alt={`${booking.car.make} ${booking.car.model}`}
                                            className="w-full h-full object-cover"
                                            width={192}
                                            height={128}
                                        />
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div>
                                            <h3 className="text-2xl font-bold">
                                                {booking.car.make} {booking.car.model}
                                            </h3>
                                            <p className="text-muted-foreground">{booking.car.year}</p>
                                        </div>

                                        {/* Car Features */}
                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Fuel className="h-4 w-4 text-muted-foreground" />
                                                <span>{booking.car.fuelType}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Settings2 className="h-4 w-4 text-muted-foreground" />
                                                <span>{booking.car.transmission}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Gauge className="h-4 w-4 text-muted-foreground" />
                                                <span>{booking.car.combinationMpg} MPG</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <CarFront className="h-4 w-4 text-muted-foreground" />
                                                <span>{booking.car.class}</span>
                                            </div>
                                        </div>

                                        <Button asChild variant="outline" size="sm" className="mt-2">
                                            <Link href={ROUTES.CAR_DETAIL(booking.car.id)}>
                                                View Full Car Details
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Rental Period */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Rental Period
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <p className="text-sm text-muted-foreground mb-1">Pickup Date</p>
                                        <p className="text-lg font-semibold">
                                            {format(new Date(booking.startDate), "EEEE, MMMM dd, yyyy")}
                                        </p>
                                    </div>
                                    <div className="p-4 rounded-lg bg-muted/50 border">
                                        <p className="text-sm text-muted-foreground mb-1">Return Date</p>
                                        <p className="text-lg font-semibold">
                                            {format(new Date(booking.endDate), "EEEE, MMMM dd, yyyy")}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                                    <Clock className="h-5 w-5 text-primary" />
                                    <span className="font-medium">
                                        Total Duration: {duration} {duration === 1 ? "day" : "days"}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Location Details */}
                        {(booking.pickupLocation || booking.dropoffLocation) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5" />
                                        Location Details
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {booking.pickupLocation && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Pickup Location</p>
                                                <p className="font-medium">{booking.pickupLocation}</p>
                                            </div>
                                        )}
                                        {booking.dropoffLocation && (
                                            <div>
                                                <p className="text-sm text-muted-foreground mb-1">Drop-off Location</p>
                                                <p className="font-medium">{booking.dropoffLocation}</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Contact Information */}
                        {(booking.phoneNumber || booking.emergencyContact) && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Contact Information
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {booking.phoneNumber && (
                                            <div className="flex items-center gap-3">
                                                <Phone className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Phone Number</p>
                                                    <p className="font-medium">{booking.phoneNumber}</p>
                                                </div>
                                            </div>
                                        )}
                                        {booking.emergencyContact && (
                                            <div className="flex items-center gap-3">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Emergency Contact</p>
                                                    <p className="font-medium">{booking.emergencyContact}</p>
                                                    {booking.emergencyPhone && (
                                                        <p className="text-sm text-muted-foreground">{booking.emergencyPhone}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Special Requests */}
                        {booking.specialRequests && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5" />
                                        Special Requests
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">{booking.specialRequests}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar - Price Summary */}
                    <div className="space-y-6">
                        <Card className="sticky top-6">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5" />
                                    Payment Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Daily Rate</span>
                                        <span>₱{booking.car.pricePerDay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Duration</span>
                                        <span>{duration} {duration === 1 ? "day" : "days"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Subtotal</span>
                                        <span>₱{(booking.car.pricePerDay * duration).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <Separator />

                                <div className="flex justify-between items-center">
                                    <span className="font-semibold">Total Amount</span>
                                    <span className="text-2xl font-bold text-primary">
                                        ₱{booking.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </span>
                                </div>

                                {/* Payment Method */}
                                <div className="rounded-lg border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20 p-3 mt-4">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-700 dark:text-green-400 text-sm">
                                                Payment: Face to Face
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Pay upon vehicle pickup
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <Separator />

                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Booked on: {format(new Date(booking.createdAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                                    <p>Last updated: {format(new Date(booking.updatedAt), "MMM dd, yyyy 'at' h:mm a")}</p>
                                </div>

                                {/* Actions */}
                                {booking.status === "pending" && (
                                    <Button asChild className="w-full">
                                        <Link href={`/bookings/${booking.id}/complete`}>
                                            Complete Booking Details
                                        </Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
