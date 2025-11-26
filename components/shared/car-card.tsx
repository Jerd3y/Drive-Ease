"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Gauge, Fuel, Settings, CheckCircle2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CarProps } from "@/types";
import { calculateCarRent, generateCarImageUrl } from "@/lib/utils";
import CarDetails from "@/components/shared/car-details";
import { IconCarFilled } from "@tabler/icons-react";
import { CarImage } from "@/components/shared/car-image";

interface CarCardProps {
  car: CarProps;
}

const CarCard = ({ car }: CarCardProps) => {
  const { city_mpg, year, make, model, transmission, drive, price_per_day, id, available } = car;

  const [isOpen, setIsOpen] = useState(false);

  const carRent = price_per_day || calculateCarRent(city_mpg, year);
  const isAvailable = available !== false;

  const handleOpenModal = () => {
    setIsOpen(true);
  };

  return (
    <>
      <Card className="group flex flex-col overflow-hidden transition-all hover:shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <CardTitle className="text-xl font-semibold capitalize">
              {make} {model}
            </CardTitle>
            {isAvailable ? (
              <Badge className="bg-green-500 text-white border-transparent hover:bg-green-600 gap-1.5">
                <CheckCircle2 className="h-3 w-3" />
                Available
              </Badge>
            ) : (
              <Badge variant="destructive" className="gap-1.5">
                <XCircle className="h-3 w-3" />
                Unavailable
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col gap-4">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-muted-foreground">
              ₱
            </span>
            <span className="text-3xl font-extrabold">{carRent.toLocaleString()}</span>
            <span className="text-sm font-medium text-muted-foreground">
              /day
            </span>
          </div>

          <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
            <CarImage
              src={car.images && car.images[0] ? car.images[0] : generateCarImageUrl(car)}
              alt={`${make} ${model}`}
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="relative">
            <div className="flex flex-wrap gap-2 group-hover:opacity-0 transition-opacity">
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Settings className="size-3" />
                <span>{transmission === "a" ? "Automatic" : "Manual"}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Gauge className="size-3" />
                <span>{drive.toUpperCase()}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1.5">
                <Fuel className="size-3" />
                <span>{city_mpg} MPG</span>
              </Badge>
            </div>

            <div className="absolute inset-0 hidden items-center justify-center group-hover:flex">
              <Button
                className="rounded-full"
                onClick={handleOpenModal}
                aria-label="View more car details"
              >
                View More
                <ChevronRight className="ml-2 size-4" />
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-4">
          {id ? (
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                asChild
                className="rounded-full"
                variant="outline"
                aria-label="View car details"
              >
                <Link href={`/cars/${id}`} className="flex items-center justify-center">
                  <ChevronRight className="mr-1 size-4" />
                  Details
                </Link>
              </Button>
              <Button
                asChild
                className="rounded-full"
                variant="default"
                disabled={!isAvailable}
                aria-label="Book this car"
              >
                <Link href={`/cars/${id}`} className="flex items-center justify-center">
                  <IconCarFilled className="fill-primary-foreground/25 stroke-primary-foreground mr-1" />
                  Book Now
                </Link>
              </Button>
            </div>
          ) : (
            <Button
              className="w-full rounded-full"
              variant="outline"
              onClick={handleOpenModal}
              aria-label="View car details"
            >
              View More Details
              <ChevronRight className="ml-2 size-4" />
            </Button>
          )}
        </CardFooter>
      </Card>

      <CarDetails
        isOpen={isOpen}
        closeModal={() => setIsOpen(false)}
        car={car}
      />
    </>
  );
};

export default CarCard;
