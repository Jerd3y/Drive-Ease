import { notFound } from "next/navigation";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { carSchema, CarProps } from "@/types";
import CarCard from "@/components/shared/car-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookingForm } from "@/components/bookings/booking-form";
import { requireAuth } from "@/lib/auth-utils";
import Link from "next/link";
import { ArrowLeft, Fuel, Gauge, Settings, CarFront, Calendar, Zap, CircleDot, MapPin, CheckCircle2 } from "lucide-react";
import { generateCarImageUrl } from "@/lib/utils";
import Image from "next/image";
import { ROUTES } from "@/constants/routes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export default async function CarDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const getCachedCar = unstable_cache(
    async (id: string) => {
      return await prisma.car.findUnique({
        where: { id },
      });
    },
    ["car-details"],
    { revalidate: 60, tags: ["car"] }
  );

  const car = await getCachedCar(params.id);

  if (!car) {
    notFound();
  }

  const carData = carSchema.parse({
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
  });

  // Get related cars (same make or class)
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const relatedCars = await prisma.car.findMany({
    where: {
      id: { not: car.id },
      OR: [
        { make: car.make },
        { class: car.class },
      ],
    },
    take: 4,
  });

  const relatedCarsData: CarProps[] = relatedCars.map((c: {
    id: string;
    cityMpg: number;
    class: string;
    combinationMpg: number;
    cylinders: number;
    displacement: number;
    drive: string;
    fuelType: string;
    highwayMpg: number;
    make: string;
    model: string;
    transmission: string;
    year: number;
    pricePerDay: number | null;
    available: boolean | null;
    description: string | null;
    images: unknown;
    location: string | null;
  }) =>
    carSchema.parse({
      id: c.id,
      city_mpg: c.cityMpg,
      class: c.class,
      combination_mpg: c.combinationMpg,
      cylinders: c.cylinders,
      displacement: c.displacement,
      drive: c.drive,
      fuel_type: c.fuelType,
      highway_mpg: c.highwayMpg,
      make: c.make,
      model: c.model,
      transmission: c.transmission,
      year: c.year,
      price_per_day: c.pricePerDay ?? undefined,
      available: c.available ?? undefined,
      description: c.description ?? undefined,
      images: c.images ? (c.images as string[]) : undefined,
      location: c.location ?? undefined,
    })
  );

  const user = await requireAuth().catch(() => null);

  const allImages =
    carData.images && carData.images.length > 0
      ? carData.images
      : [generateCarImageUrl(carData)];

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Button asChild variant="ghost" className="mb-6">
          <Link href={ROUTES.HOME}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cars
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-2 mb-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Carousel className="w-full">
              <CarouselContent>
                {allImages.map((img, idx) => (
                  <CarouselItem key={idx}>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                      <Image
                        src={img}
                        alt={`${car.make} ${car.model} - Image ${idx + 1}`}
                        fill
                        className="object-contain"
                        priority={idx === 0}
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {allImages.length > 1 && (
                <>
                  <CarouselPrevious className="left-4" />
                  <CarouselNext className="right-4" />
                </>
              )}
            </Carousel>
          </div>

          {/* Car Info & Booking */}
          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-2">
                    {car.make} {car.model}
                  </h1>
                  <div className="flex items-center gap-3 text-muted-foreground mb-4">
                    <Calendar className="h-4 w-4" />
                    <span className="text-lg">{car.year}</span>
                    {car.location && (
                      <>
                        <Separator orientation="vertical" className="h-4" />
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm">{car.location}</span>
                      </>
                    )}
                  </div>
                </div>
                {car.available ? (
                  <Badge variant="default" className="gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Available
                  </Badge>
                ) : (
                  <Badge variant="destructive">Unavailable</Badge>
                )}
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl font-bold">₱{car.pricePerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span className="text-lg text-muted-foreground">/day</span>
              </div>
            </div>

            {user && car.available && (
              <Card className="border-primary/20 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Book This Car</CardTitle>
                  <CardDescription>
                    Select your rental dates and confirm your booking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BookingForm
                    carId={car.id}
                    pricePerDay={car.pricePerDay}
                  />
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground mb-4">
                    Please sign in to book this car
                  </p>
                  <Button asChild size="lg">
                    <Link href={ROUTES.LOGIN}>Sign In to Book</Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Tabs for Details */}
        <Tabs defaultValue="specifications" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
          </TabsList>

          <TabsContent value="specifications" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
                <CardDescription>
                  Detailed technical information about this vehicle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">City MPG</p>
                      <p className="text-xl font-bold">{car.cityMpg}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Highway MPG</p>
                      <p className="text-xl font-bold">{car.highwayMpg}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <Gauge className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Combined MPG</p>
                      <p className="text-xl font-bold">{car.combinationMpg}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <Fuel className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Fuel Type</p>
                      <p className="text-xl font-bold capitalize">{car.fuelType}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Transmission</p>
                      <p className="text-xl font-bold">
                        {car.transmission === "a" ? "Automatic" : "Manual"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <CarFront className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Drive Type</p>
                      <p className="text-xl font-bold uppercase">{car.drive}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <Zap className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Cylinders</p>
                      <p className="text-xl font-bold">{car.cylinders}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <CircleDot className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Displacement</p>
                      <p className="text-xl font-bold">{car.displacement}L</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="p-2 rounded-md bg-background">
                      <CarFront className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-1">Class</p>
                      <p className="text-xl font-bold capitalize">{car.class}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="description" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>About This Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                {car.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {car.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Experience the perfect blend of performance and comfort with the {car.make} {car.model}.
                    This {car.year} model offers exceptional fuel efficiency and a smooth driving experience,
                    making it ideal for your next adventure.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Key Features</CardTitle>
                <CardDescription>
                  What makes this vehicle special
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">
                      {car.transmission === "a" ? "Automatic" : "Manual"} Transmission
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">
                      {car.combinationMpg} MPG Combined
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">
                      {car.drive.toUpperCase()} Drive
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                    <span className="text-sm font-medium">
                      {car.cylinders} Cylinder Engine
                    </span>
                  </div>
                  {car.location && (
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                      <span className="text-sm font-medium">
                        Available in {car.location}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Related Cars */}
        {relatedCarsData.length > 0 && (
          <div className="mt-12">
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-2">Similar Vehicles</h2>
              <p className="text-muted-foreground">
                Explore other cars you might like
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {relatedCarsData.map((relatedCar: CarProps) => (
                <CarCard
                  key={relatedCar.id || `${relatedCar.make}-${relatedCar.model}-${relatedCar.year}`}
                  car={relatedCar}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

