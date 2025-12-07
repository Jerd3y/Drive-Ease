"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Car, Fuel, Settings, Calendar, RotateCcw } from "lucide-react";
import { IconCurrencyPeso } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface CarFiltersProps {
  cars: Array<{
    make: string;
    class: string;
    fuel_type: string;
    drive: string;
    transmission: string;
    year: number;
    price_per_day?: number;
    city_mpg: number;
    highway_mpg: number;
    combination_mpg: number;
  }>;
}

export function CarFilters({ cars }: CarFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // Get unique values from cars
  const uniqueMakes = Array.from(new Set(cars.map((car) => car.make))).sort();
  const uniqueClasses = Array.from(new Set(cars.map((car) => car.class))).sort();
  const uniqueFuelTypes = Array.from(
    new Set(cars.map((car) => car.fuel_type))
  ).sort();
  const uniqueDrives = Array.from(new Set(cars.map((car) => car.drive))).sort();
  const uniqueTransmissions = Array.from(
    new Set(cars.map((car) => car.transmission))
  ).sort();

  // Get price range
  const prices = cars
    .map((car) => car.price_per_day || 50)
    .filter((p) => p > 0);
  const minPrice = Math.min(...prices, 0);
  const maxPrice = Math.max(...prices, 1000);

  // Get year range
  const years = cars.map((car) => car.year);
  const minYear = Math.min(...years);
  const maxYear = Math.max(...years);

  // Get MPG range
  const allMpgs = cars.flatMap((car) => [
    car.city_mpg,
    car.highway_mpg,
    car.combination_mpg,
  ]);
  const minMpg = Math.min(...allMpgs);
  const maxMpg = Math.max(...allMpgs);

  // Get current filter values from URL
  const currentMake = searchParams.get("make") || "";
  const currentClass = searchParams.get("class") || "";
  const currentFuelType = searchParams.get("fuel_type") || "";
  const currentDrive = searchParams.get("drive") || "";
  const currentTransmission = searchParams.get("transmission") || "";
  const currentMinPrice = searchParams.get("min_price") || minPrice.toString();
  const currentMaxPrice = searchParams.get("max_price") || maxPrice.toString();
  const currentMinYear = searchParams.get("min_year") || minYear.toString();
  const currentMaxYear = searchParams.get("max_year") || maxYear.toString();
  const currentMinMpg = searchParams.get("min_mpg") || minMpg.toString();
  const currentMaxMpg = searchParams.get("max_mpg") || maxMpg.toString();
  const currentAvailable = searchParams.get("available") || "";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("offset", "0");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const updateRangeFilter = (key: string, value: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value.toString());
    params.set("offset", "0");
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const activeFiltersCount = [
    currentMake,
    currentClass,
    currentFuelType,
    currentDrive,
    currentTransmission,
    currentAvailable,
  ].filter((f) => f && f !== "all").length;

  const hasRangeFilters =
    currentMinPrice !== minPrice.toString() ||
    currentMaxPrice !== maxPrice.toString() ||
    currentMinYear !== minYear.toString() ||
    currentMaxYear !== maxYear.toString() ||
    currentMinMpg !== minMpg.toString() ||
    currentMaxMpg !== maxMpg.toString();

  const totalActiveFilters = activeFiltersCount + (hasRangeFilters ? 1 : 0);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <SlidersHorizontal className="mr-2 h-4 w-4" />
          Filters
          {totalActiveFilters > 0 && (
            <span className="ml-2 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs">
              {totalActiveFilters}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[430px] md:w-[540px] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <SheetHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-primary/10 p-2">
                  <SlidersHorizontal className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Filter Cars</SheetTitle>
                  {totalActiveFilters > 0 && (
                    <Badge variant="secondary" className="mt-1">
                      {totalActiveFilters} active
                    </Badge>
                  )}
                </div>
              </div>
              {totalActiveFilters > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Clear
                </Button>
              )}
            </div>
            <SheetDescription className="text-left">
              Refine your search by applying filters below
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Vehicle Details Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Car className="h-4 w-4 text-primary" />
                Vehicle Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Make Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Make</Label>
                <RadioGroup
                  value={currentMake || "all"}
                  onValueChange={(value) => updateFilter("make", value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="make-all" />
                    <Label htmlFor="make-all" className="font-normal cursor-pointer">
                      All Makes
                    </Label>
                  </div>
                  {uniqueMakes.map((make) => (
                    <div key={make} className="flex items-center space-x-2">
                      <RadioGroupItem value={make} id={`make-${make}`} />
                      <Label htmlFor={`make-${make}`} className="font-normal cursor-pointer">
                        {make}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Class Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Class</Label>
                <RadioGroup
                  value={currentClass || "all"}
                  onValueChange={(value) => updateFilter("class", value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="class-all" />
                    <Label htmlFor="class-all" className="font-normal cursor-pointer">
                      All Classes
                    </Label>
                  </div>
                  {uniqueClasses.map((carClass) => (
                    <div key={carClass} className="flex items-center space-x-2">
                      <RadioGroupItem value={carClass} id={`class-${carClass}`} />
                      <Label htmlFor={`class-${carClass}`} className="font-normal cursor-pointer">
                        {carClass}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Transmission Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                  Transmission
                </Label>
                <RadioGroup
                  value={currentTransmission || "all"}
                  onValueChange={(value) => updateFilter("transmission", value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="transmission-all" />
                    <Label htmlFor="transmission-all" className="font-normal cursor-pointer">
                      All Transmissions
                    </Label>
                  </div>
                  {uniqueTransmissions.map((transmission) => (
                    <div key={transmission} className="flex items-center space-x-2">
                      <RadioGroupItem value={transmission} id={`transmission-${transmission}`} />
                      <Label htmlFor={`transmission-${transmission}`} className="font-normal cursor-pointer">
                        {transmission === "a" ? "Automatic" : "Manual"}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Drive Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Drive Type</Label>
                <RadioGroup
                  value={currentDrive || "all"}
                  onValueChange={(value) => updateFilter("drive", value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="drive-all" />
                    <Label htmlFor="drive-all" className="font-normal cursor-pointer">
                      All Drive Types
                    </Label>
                  </div>
                  {uniqueDrives.map((drive) => (
                    <div key={drive} className="flex items-center space-x-2">
                      <RadioGroupItem value={drive} id={`drive-${drive}`} />
                      <Label htmlFor={`drive-${drive}`} className="font-normal cursor-pointer">
                        {drive.toUpperCase()}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              {/* Fuel Type Filter */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                  Fuel Type
                </Label>
                <RadioGroup
                  value={currentFuelType || "all"}
                  onValueChange={(value) => updateFilter("fuel_type", value)}
                  className="grid grid-cols-2 gap-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="all" id="fuel-all" />
                    <Label htmlFor="fuel-all" className="font-normal cursor-pointer">
                      All Fuel Types
                    </Label>
                  </div>
                  {uniqueFuelTypes.map((fuelType) => (
                    <div key={fuelType} className="flex items-center space-x-2">
                      <RadioGroupItem value={fuelType} id={`fuel-${fuelType}`} />
                      <Label htmlFor={`fuel-${fuelType}`} className="font-normal cursor-pointer">
                        {fuelType}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Price Range Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <IconCurrencyPeso className="h-4 w-4 text-primary" />
                Price Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-price" className="text-xs font-medium text-muted-foreground">
                    Min Price
                  </Label>
                  <Input
                    id="min-price"
                    type="number"
                    min={minPrice}
                    max={maxPrice}
                    value={currentMinPrice}
                    onChange={(e) =>
                      updateRangeFilter("min_price", parseFloat(e.target.value) || minPrice)
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-price" className="text-xs font-medium text-muted-foreground">
                    Max Price
                  </Label>
                  <Input
                    id="max-price"
                    type="number"
                    min={minPrice}
                    max={maxPrice}
                    value={currentMaxPrice}
                    onChange={(e) =>
                      updateRangeFilter("max_price", parseFloat(e.target.value) || maxPrice)
                    }
                    className="h-10"
                  />
                </div>
              </div>
              <Slider
                value={[parseFloat(currentMinPrice), parseFloat(currentMaxPrice)]}
                min={minPrice}
                max={maxPrice}
                step={10}
                onValueChange={([min, max]) => {
                  updateRangeFilter("min_price", min);
                  updateRangeFilter("max_price", max);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>${minPrice}</span>
                <span>${maxPrice}</span>
              </div>
            </CardContent>
          </Card>

          {/* Year Range Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Year Range
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-year" className="text-xs font-medium text-muted-foreground">
                    Min Year
                  </Label>
                  <Input
                    id="min-year"
                    type="number"
                    min={minYear}
                    max={maxYear}
                    value={currentMinYear}
                    onChange={(e) =>
                      updateRangeFilter("min_year", parseInt(e.target.value) || minYear)
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-year" className="text-xs font-medium text-muted-foreground">
                    Max Year
                  </Label>
                  <Input
                    id="max-year"
                    type="number"
                    min={minYear}
                    max={maxYear}
                    value={currentMaxYear}
                    onChange={(e) =>
                      updateRangeFilter("max_year", parseInt(e.target.value) || maxYear)
                    }
                    className="h-10"
                  />
                </div>
              </div>
              <Slider
                value={[parseInt(currentMinYear), parseInt(currentMaxYear)]}
                min={minYear}
                max={maxYear}
                step={1}
                onValueChange={([min, max]) => {
                  updateRangeFilter("min_year", min);
                  updateRangeFilter("max_year", max);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minYear}</span>
                <span>{maxYear}</span>
              </div>
            </CardContent>
          </Card>

          {/* MPG Range Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Fuel className="h-4 w-4 text-primary" />
                Fuel Efficiency (MPG)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min-mpg" className="text-xs font-medium text-muted-foreground">
                    Min MPG
                  </Label>
                  <Input
                    id="min-mpg"
                    type="number"
                    min={minMpg}
                    max={maxMpg}
                    value={currentMinMpg}
                    onChange={(e) =>
                      updateRangeFilter("min_mpg", parseInt(e.target.value) || minMpg)
                    }
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-mpg" className="text-xs font-medium text-muted-foreground">
                    Max MPG
                  </Label>
                  <Input
                    id="max-mpg"
                    type="number"
                    min={minMpg}
                    max={maxMpg}
                    value={currentMaxMpg}
                    onChange={(e) =>
                      updateRangeFilter("max_mpg", parseInt(e.target.value) || maxMpg)
                    }
                    className="h-10"
                  />
                </div>
              </div>
              <Slider
                value={[parseInt(currentMinMpg), parseInt(currentMaxMpg)]}
                min={minMpg}
                max={maxMpg}
                step={1}
                onValueChange={([min, max]) => {
                  updateRangeFilter("min_mpg", min);
                  updateRangeFilter("max_mpg", max);
                }}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{minMpg} MPG</span>
                <span>{maxMpg} MPG</span>
              </div>
            </CardContent>
          </Card>

          {/* Availability Filter Card */}
          <Card className="border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={currentAvailable || "all"}
                onValueChange={(value) => updateFilter("available", value)}
                className="grid grid-cols-2 gap-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="all" id="available-all" />
                  <Label htmlFor="available-all" className="font-normal cursor-pointer">
                    All Cars
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="true" id="available-true" />
                  <Label htmlFor="available-true" className="font-normal cursor-pointer">
                    Available Only
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="false" id="available-false" />
                  <Label htmlFor="available-false" className="font-normal cursor-pointer">
                    Unavailable Only
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}

