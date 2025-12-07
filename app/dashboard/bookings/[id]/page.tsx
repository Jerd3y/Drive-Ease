import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
    IconArrowLeft,
    IconCalendar,
    IconCar,
    IconClock,
    IconCheck,
    IconX,
    IconAlertCircle,
    IconMapPin,
    IconPhone,
    IconUser,
    IconFileDescription,
    IconCreditCard,
    IconGasStation,
    IconManualGearbox,
    IconGauge,
    IconMail,
} from "@tabler/icons-react";
import { format, differenceInDays } from "date-fns";
import Image from "next/image";

interface BookingDetailPageProps {
    params: {
        id: string;
    };
}

export default async function AdminBookingDetailPage({ params }: BookingDetailPageProps) {
    await requireAdmin();

    // @ts-expect-error - Prisma Accelerate extension causes type conflicts
    const booking = await prisma.booking.findUnique({
        where: { id: params.id },
        include: {
            car: true,
            user: true,
        },
    });

    if (!booking) {
        notFound();
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-green-500";
            case "pending":
                return "bg-yellow-500";
            case "completed":
                return "bg-blue-500";
            case "cancelled":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "confirmed":
                return IconCheck;
            case "pending":
                return IconAlertCircle;
            case "completed":
                return IconCheck;
            case "cancelled":
                return IconX;
            default:
                return IconFileDescription;
        }
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
                                <Link href="/dashboard/bookings">
                                    <Button variant="ghost" size="sm" className="mb-4">
                                        <IconArrowLeft className="mr-2 size-4" />
                                        Back to Bookings
                                    </Button>
                                </Link>

                                {/* Header */}
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h1 className="text-3xl font-bold mb-2">Booking Details</h1>
                                        <p className="text-muted-foreground">
                                            ID: <span className="font-mono text-sm">{booking.id}</span>
                                        </p>
                                    </div>
                                    <Badge className={`${getStatusColor(booking.status)} gap-1.5 text-sm px-3 py-1`}>
                                        <StatusIcon className="size-4" />
                                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                                    </Badge>
                                </div>

                                <div className="grid gap-6 lg:grid-cols-3">
                                    {/* Main Content */}
                                    <div className="lg:col-span-2 space-y-6">
                                        {/* Customer Information */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <IconUser className="size-5" />
                                                    Customer Information
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <IconUser className="size-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Name</p>
                                                            <p className="font-medium">{booking.user.name}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <IconMail className="size-4 text-muted-foreground" />
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Email</p>
                                                            <a href={`mailto:${booking.user.email}`} className="font-medium text-primary hover:underline">
                                                                {booking.user.email}
                                                            </a>
                                                        </div>
                                                    </div>
                                                    {booking.phoneNumber && (
                                                        <div className="flex items-center gap-3">
                                                            <IconPhone className="size-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Phone</p>
                                                                <p className="font-medium">{booking.phoneNumber}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {booking.driversLicense && (
                                                        <div className="flex items-center gap-3">
                                                            <IconFileDescription className="size-4 text-muted-foreground" />
                                                            <div>
                                                                <p className="text-sm text-muted-foreground">Driver&apos;s License</p>
                                                                <p className="font-medium">{booking.driversLicense}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>

                                        {/* Vehicle Information */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle className="flex items-center gap-2">
                                                    <IconCar className="size-5" />
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
                                                                <IconGasStation className="size-4 text-muted-foreground" />
                                                                <span>{booking.car.fuelType}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <IconManualGearbox className="size-4 text-muted-foreground" />
                                                                <span>{booking.car.transmission}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <IconGauge className="size-4 text-muted-foreground" />
                                                                <span>{booking.car.combinationMpg} MPG</span>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <IconCar className="size-4 text-muted-foreground" />
                                                                <span>{booking.car.class}</span>
                                                            </div>
                                                        </div>

                                                        <Button asChild variant="outline" size="sm" className="mt-2">
                                                            <Link href={`/dashboard/cars/${booking.car.id}`}>
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
                                                    <IconCalendar className="size-5" />
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
                                                    <IconClock className="size-5 text-primary" />
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
                                                        <IconMapPin className="size-5" />
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

                                        {/* Emergency Contact */}
                                        {booking.emergencyContact && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="flex items-center gap-2">
                                                        <IconPhone className="size-5" />
                                                        Emergency Contact
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="grid md:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground mb-1">Contact Name</p>
                                                            <p className="font-medium">{booking.emergencyContact}</p>
                                                        </div>
                                                        {booking.emergencyPhone && (
                                                            <div>
                                                                <p className="text-sm text-muted-foreground mb-1">Contact Phone</p>
                                                                <p className="font-medium">{booking.emergencyPhone}</p>
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
                                                        <IconFileDescription className="size-5" />
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
                                                    <IconCreditCard className="size-5" />
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
                                                        <IconCheck className="size-4 text-green-600" />
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

                                                {/* Quick Actions */}
                                                <div className="space-y-2 pt-2">
                                                    <Button asChild variant="outline" className="w-full">
                                                        <a href={`mailto:${booking.user.email}`}>
                                                            <IconMail className="mr-2 size-4" />
                                                            Email Customer
                                                        </a>
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
