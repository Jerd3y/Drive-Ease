"use client";

import {
  Gauge,
  Fuel,
  Settings,
  Calendar,
  CarFront,
  Zap,
  CircleDot,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CarProps } from "@/types";
import { generateCarImageUrl, calculateCarRent } from "@/lib/utils";
import { CarImage } from "@/components/shared/car-image";

interface CarDetailsProps {
  isOpen: boolean;
  closeModal: () => void;
  car: CarProps;
}

const CarDetails = ({ isOpen, closeModal, car }: CarDetailsProps) => {
  const carRent = calculateCarRent(car.city_mpg, car.year);

  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const detailItems = [
    { label: "Make", value: car.make, icon: CarFront },
    { label: "Model", value: car.model, icon: CarFront },
    { label: "Year", value: car.year, icon: Calendar },
    { label: "Class", value: car.class, icon: CarFront },
    { label: "Transmission", value: car.transmission === "a" ? "Automatic" : "Manual", icon: Settings },
    { label: "Drive", value: car.drive.toUpperCase(), icon: Gauge },
    { label: "Fuel Type", value: car.fuel_type, icon: Fuel },
    { label: "City MPG", value: `${car.city_mpg} MPG`, icon: Fuel },
    { label: "Highway MPG", value: `${car.highway_mpg} MPG`, icon: Fuel },
    { label: "Combination MPG", value: `${car.combination_mpg} MPG`, icon: Fuel },
    { label: "Cylinders", value: car.cylinders, icon: Zap },
    { label: "Displacement", value: `${car.displacement}L`, icon: CircleDot },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold capitalize">
            {car.make} {car.model}
          </DialogTitle>
          <DialogDescription className="text-base">
            {car.year} • {formatLabel(car.class)} • {car.fuel_type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-semibold text-muted-foreground">
              ₱
            </span>
            <span className="text-4xl font-extrabold">{carRent.toLocaleString()}</span>
            <span className="text-sm font-medium text-muted-foreground">
              /day
            </span>
          </div>

          <div className="relative w-full h-64 rounded-lg overflow-hidden bg-muted">
            <CarImage
              src={car.images && car.images[0] ? car.images[0] : generateCarImageUrl(car)}
              alt={`${car.make} ${car.model}`}
              fill
              priority
              className="object-contain"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="relative w-full h-20 rounded-lg overflow-hidden bg-muted">
              <CarImage
                src={car.images && car.images[1] ? car.images[1] : generateCarImageUrl(car, "29")}
                alt={`${car.make} ${car.model} view 2`}
                fill
                className="object-contain"
              />
            </div>
            <div className="relative w-full h-20 rounded-lg overflow-hidden bg-muted">
              <CarImage
                src={car.images && car.images[2] ? car.images[2] : generateCarImageUrl(car, "33")}
                alt={`${car.make} ${car.model} view 3`}
                fill
                className="object-contain"
              />
            </div>
            <div className="relative w-full h-20 rounded-lg overflow-hidden bg-muted">
              <CarImage
                src={car.images && car.images[3] ? car.images[3] : generateCarImageUrl(car, "13")}
                alt={`${car.make} ${car.model} view 4`}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Settings className="size-3" />
              <span>{car.transmission === "a" ? "Automatic" : "Manual"}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Gauge className="size-3" />
              <span>{car.drive.toUpperCase()}</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Fuel className="size-3" />
              <span>{car.city_mpg} MPG City</span>
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1.5">
              <Fuel className="size-3" />
              <span>{car.highway_mpg} MPG Highway</span>
            </Badge>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Specifications</h3>
            <div className="grid grid-cols-2 gap-4">
              {detailItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-muted-foreground">
                        {item.label}
                      </p>
                      <p className="text-base font-semibold">{item.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetails;
