import { requireAuth } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Calendar, CarFront, Clock, CheckCircle2, XCircle, AlertCircle, FileText } from "lucide-react";
import { IconCurrencyPeso } from "@tabler/icons-react";
import type { BookingStatus, Prisma } from "@prisma/client";
import { ROUTES } from "@/constants/routes";
import { BOOKING_STATUS_LABELS } from "@/constants/config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { format, differenceInDays, isPast, isFuture } from "date-fns";

export const dynamic = 'force-dynamic'

type BookingWithCar = Prisma.BookingGetPayload<{
  include: {
    car: {
      select: {
        id: true;
        make: true;
        model: true;
        year: true;
        pricePerDay: true;
      };
    };
  };
}>;

export default async function BookingsPage() {
  const user = await requireAuth();

  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const bookings = (await prisma.booking.findMany({
    where: { userId: user.id },
    include: {
      car: {
        select: {
          id: true,
          make: true,
          model: true,
          year: true,
          pricePerDay: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })) as BookingWithCar[];

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

  const getBookingDuration = (startDate: Date, endDate: Date) => {
    return differenceInDays(endDate, startDate) + 1;
  };

  const getBookingStatus = (booking: BookingWithCar) => {
    const start = new Date(booking.startDate);
    const end = new Date(booking.endDate);


    if (booking.status === "cancelled") return "cancelled";
    if (booking.status === "completed") return "completed";
    if (isPast(end)) return "past";
    if (isFuture(start)) return "upcoming";
    return "active";
  };

  const upcomingBookings = bookings.filter(
    (b) => getBookingStatus(b) === "upcoming" && b.status !== "cancelled"
  );
  const activeBookings = bookings.filter((b) => getBookingStatus(b) === "active");
  const pastBookings = bookings.filter(
    (b) => getBookingStatus(b) === "past" || b.status === "completed"
  );

  const renderBookingCard = (booking: BookingWithCar) => {
    const StatusIcon = getStatusIcon(booking.status);
    const duration = getBookingDuration(
      new Date(booking.startDate),
      new Date(booking.endDate)
    );
    const bookingStatus = getBookingStatus(booking);

    return (
      <Card key={booking.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <CardTitle className="text-xl mb-1">
                {booking.car.make} {booking.car.model}
              </CardTitle>
              <CardDescription className="flex items-center gap-2">
                <CarFront className="h-3.5 w-3.5" />
                {booking.car.year}
              </CardDescription>
            </div>
            <Badge
              variant={getStatusVariant(booking.status)}
              className="gap-1.5"
            >
              <StatusIcon className="h-3 w-3" />
              {getStatusLabel(booking.status)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Pickup Date</span>
              </div>
              <span className="font-medium">
                {format(new Date(booking.startDate), "MMM dd, yyyy")}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>Return Date</span>
              </div>
              <span className="font-medium">
                {format(new Date(booking.endDate), "MMM dd, yyyy")}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Duration</span>
              </div>
              <span className="font-medium">{duration} {duration === 1 ? "day" : "days"}</span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <IconCurrencyPeso className="h-4 w-4" />
                <span className="text-sm">Total Amount</span>
              </div>
              <span className="text-xl font-bold text-primary">
                ₱{booking.totalPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button asChild variant="default" className="flex-1">
              <Link href={`/bookings/${booking.id}`}>
                View Details
              </Link>
            </Button>
            {bookingStatus === "upcoming" && booking.status === "pending" && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/bookings/${booking.id}/complete`}>
                  Complete Booking
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

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
          <h1 className="text-4xl font-bold mb-2">My Bookings</h1>
          <p className="text-muted-foreground text-lg">
            View and manage your car rental bookings
          </p>
        </div>

        {bookings.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia>
                <Calendar className="h-12 w-12 text-muted-foreground" />
              </EmptyMedia>
              <EmptyTitle>No bookings yet</EmptyTitle>
              <EmptyDescription>
                Start exploring our fleet and book your perfect car for your next adventure.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button asChild size="lg">
                <Link href={ROUTES.CARS}>Browse Available Cars</Link>
              </Button>
            </EmptyContent>
          </Empty>
        ) : (
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full max-w-2xl grid-cols-4">
              <TabsTrigger value="all">
                All ({bookings.length})
              </TabsTrigger>
              <TabsTrigger value="upcoming">
                Upcoming ({upcomingBookings.length})
              </TabsTrigger>
              <TabsTrigger value="active">
                Active ({activeBookings.length})
              </TabsTrigger>
              <TabsTrigger value="past">
                Past ({pastBookings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {bookings.map(renderBookingCard)}
              </div>
            </TabsContent>

            <TabsContent value="upcoming" className="mt-6">
              {upcomingBookings.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <Calendar className="h-12 w-12 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>No upcoming bookings</EmptyTitle>
                    <EmptyDescription>
                      You don&apos;t have any upcoming bookings scheduled.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingBookings.map(renderBookingCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="active" className="mt-6">
              {activeBookings.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <CarFront className="h-12 w-12 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>No active bookings</EmptyTitle>
                    <EmptyDescription>
                      You don&apos;t have any active rentals at the moment.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {activeBookings.map(renderBookingCard)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="mt-6">
              {pastBookings.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia>
                      <FileText className="h-12 w-12 text-muted-foreground" />
                    </EmptyMedia>
                    <EmptyTitle>No past bookings</EmptyTitle>
                    <EmptyDescription>
                      Your completed bookings will appear here.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastBookings.map(renderBookingCard)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

