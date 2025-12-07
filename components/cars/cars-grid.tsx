"use client";

import { useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CarProps } from "@/types";
import CarCard from "@/components/shared/car-card";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CarSearch } from "./car-search";
import { CarFilters } from "./car-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { useCars } from "@/hooks/use-cars";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { APP_CONFIG, SORT_OPTIONS } from "@/constants/config";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface CarsGridProps {
  initialCars: CarProps[];
  total?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  layout?: "grid" | "carousel";
}

export function CarsGrid({
  initialCars,
  total,
  showFilters = false,
  showSearch = false,
  layout = "grid",
}: CarsGridProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use optimized custom hook for data fetching
  const { cars, total: totalCount, isLoading, error, refetch } = useCars({
    initialCars,
    initialTotal: total || initialCars.length,
    limit: APP_CONFIG.DEFAULT_CAR_LIMIT,
  });

  const sortBy = searchParams.get("sort_by") || "created_at";
  const sortOrder = searchParams.get("sort_order") || "desc";
  const currentSortValue = useMemo(() => `${sortBy}_${sortOrder}`, [sortBy, sortOrder]);

  const handleSortChange = useCallback((value: string) => {
    // Prevent unnecessary updates if the value hasn't changed
    if (value === currentSortValue) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());

    // Split on the last underscore to handle fields with underscores (e.g., "created_at_desc")
    const lastUnderscoreIndex = value.lastIndexOf("_");
    if (lastUnderscoreIndex === -1) {
      console.error("Invalid sort value format:", value);
      return;
    }

    const newSortBy = value.substring(0, lastUnderscoreIndex);
    const newSortOrder = value.substring(lastUnderscoreIndex + 1);

    // Validate sort order
    if (newSortOrder !== "asc" && newSortOrder !== "desc") {
      console.error("Invalid sort order:", newSortOrder);
      return;
    }

    // Only update if values actually changed
    if (newSortBy === sortBy && newSortOrder === sortOrder) {
      return;
    }

    params.set("sort_by", newSortBy);
    params.set("sort_order", newSortOrder);
    params.set("offset", "0");

    router.replace(`/?${params.toString()}`, { scroll: false });
  }, [searchParams, router, sortBy, sortOrder, currentSortValue]);

  const hasActiveFilters = useMemo(() => {
    return Array.from(searchParams.entries()).some(
      ([key, value]) =>
        key !== "q" &&
        key !== "sort_by" &&
        key !== "sort_order" &&
        key !== "offset" &&
        key !== "limit" &&
        value
    );
  }, [searchParams]);

  // Show error state
  if (error && cars.length === 0) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error loading cars</AlertTitle>
        <AlertDescription className="flex items-center justify-between">
          <span>{error.message}</span>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading skeleton only on initial load
  if (isLoading && cars.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      {(showSearch || showFilters) && (
        <div className="flex flex-col gap-4">
          {showSearch && (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <CarSearch />
              </div>
              {showFilters && <CarFilters cars={cars} />}
            </div>
          )}

          {/* Sort and Results Count */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-muted-foreground">
              {totalCount > 0 ? (
                <>
                  Showing {cars.length} of {totalCount} cars
                </>
              ) : (
                "No cars found"
              )}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={currentSortValue}
                onValueChange={handleSortChange}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SORT_OPTIONS.NEWEST_FIRST}>Newest First</SelectItem>
                  <SelectItem value={SORT_OPTIONS.OLDEST_FIRST}>Oldest First</SelectItem>
                  <SelectItem value={SORT_OPTIONS.PRICE_LOW_TO_HIGH}>Price: Low to High</SelectItem>
                  <SelectItem value={SORT_OPTIONS.PRICE_HIGH_TO_LOW}>Price: High to Low</SelectItem>
                  <SelectItem value={SORT_OPTIONS.YEAR_NEWEST}>Year: Newest</SelectItem>
                  <SelectItem value={SORT_OPTIONS.YEAR_OLDEST}>Year: Oldest</SelectItem>
                  <SelectItem value={SORT_OPTIONS.MPG_HIGHEST}>
                    MPG: Highest
                  </SelectItem>
                  <SelectItem value={SORT_OPTIONS.MPG_LOWEST}>MPG: Lowest</SelectItem>
                  <SelectItem value={SORT_OPTIONS.MAKE_A_TO_Z}>Make: A-Z</SelectItem>
                  <SelectItem value={SORT_OPTIONS.MAKE_Z_TO_A}>Make: Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Cars Grid or Carousel */}
      {cars.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No cars found</EmptyTitle>
            <EmptyDescription>
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : "We couldn't find any cars matching your criteria."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : layout === "carousel" ? (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {cars.map((car, index) => (
              <CarouselItem
                key={car.id || `${car.make}-${car.model}-${car.year}-${index}`}
                className="pl-4 md:basis-1/2 lg:basis-1/3"
              >
                <CarCard car={car} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="hidden md:flex" />
          <CarouselNext className="hidden md:flex" />
        </Carousel>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car, index) => (
            <CarCard
              key={car.id || `${car.make}-${car.model}-${car.year}-${index}`}
              car={car}
            />
          ))}
        </div>
      )}

      {/* Pagination - Note: Pagination is handled by the API, but we can add it here if needed */}
      {isLoading && cars.length > 0 && (
        <div className="flex justify-center">
          <div className="text-sm text-muted-foreground">Loading more cars...</div>
        </div>
      )}
    </div>
  );
}
