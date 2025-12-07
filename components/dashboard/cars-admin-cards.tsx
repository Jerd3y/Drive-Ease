"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  IconDotsVertical,
  IconEye,
  IconEdit,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
} from "@tabler/icons-react"
import { Gauge, Fuel, Settings, ChevronRight } from "lucide-react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { generateCarImageUrl } from "@/lib/utils"
import { EditCarDialog } from "@/components/dashboard/edit-car-dialog"

interface Car {
  id: string
  make: string
  model: string
  year: number
  pricePerDay: number
  available: boolean
  class: string
  fuelType: string
  cityMpg?: number
  highwayMpg?: number
  combinationMpg?: number
  cylinders?: number
  displacement?: number
  drive?: string
  transmission?: string
  images?: string | string[] | null
  description?: string | null
  location?: string | null
}

interface CarsAdminCardsProps {
  cars: Car[]
}

export function CarsAdminCards({ cars }: CarsAdminCardsProps) {
  const router = useRouter()
  const [selectedCarForEdit, setSelectedCarForEdit] = React.useState<Car | null>(null)
  const [editDialogOpen, setEditDialogOpen] = React.useState(false)

  const handleToggleAvailability = async (carId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ available: !currentStatus }),
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to update availability")
        return
      }

      toast.success(`Car marked as ${!currentStatus ? "available" : "unavailable"}`)
      router.refresh()
    } catch (error) {
      console.error("Error toggling availability:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const handleDelete = async (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        const result = await response.json()
        toast.error(result.error || "Failed to delete car")
        return
      }

      toast.success("Car deleted successfully")
      router.refresh()
    } catch (error) {
      console.error("Error deleting car:", error)
      toast.error("An unexpected error occurred")
    }
  }

  const getCarImage = (car: Car) => {
    if (car.images) {
      if (Array.isArray(car.images) && car.images.length > 0) {
        return car.images[0]
      }
      if (typeof car.images === "string") {
        return car.images
      }
    }
    return generateCarImageUrl({
      make: car.make,
      model: car.model,
      year: car.year,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any)
  }

  if (cars.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No cars found</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cars.map((car) => {
          const imageUrl = getCarImage(car)

          return (
            <Card
              key={car.id}
              className="group flex flex-col overflow-hidden transition-all hover:shadow-lg"
            >
              <CardHeader className="pb-3 relative">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl font-semibold capitalize flex-1">
                    {car.make} {car.model}
                  </CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <IconDotsVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/cars/${car.id}`}>
                          <IconEye className="mr-2 size-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedCarForEdit(car)
                          setEditDialogOpen(true)
                        }}
                      >
                        <IconEdit className="mr-2 size-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleAvailability(car.id, car.available)}
                      >
                        {car.available ? (
                          <>
                            <IconToggleLeft className="mr-2 size-4" />
                            Mark Unavailable
                          </>
                        ) : (
                          <>
                            <IconToggleRight className="mr-2 size-4" />
                            Mark Available
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(car.id)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <IconTrash className="mr-2 size-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{car.year}</p>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-semibold text-muted-foreground">
                    ₱
                  </span>
                  <span className="text-3xl font-extrabold">
                    {car.pricePerDay.toFixed(0)}
                  </span>
                  <span className="text-sm font-medium text-muted-foreground">
                    /day
                  </span>
                </div>

                <div className="relative w-full h-40 rounded-lg overflow-hidden bg-muted">
                  <Image
                    src={imageUrl}
                    alt={`${car.make} ${car.model}`}
                    fill
                    className="object-cover"
                    unoptimized={imageUrl.startsWith("/uploads/")}
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant={car.available ? "default" : "secondary"}>
                    {car.available ? "Available" : "Unavailable"}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {car.class}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {car.fuelType}
                  </Badge>
                  {car.transmission && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Settings className="size-3" />
                      <span>
                        {car.transmission.charAt(0).toUpperCase() +
                          car.transmission.slice(1)}
                      </span>
                    </Badge>
                  )}
                  {car.drive && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Gauge className="size-3" />
                      <span>{car.drive.toUpperCase()}</span>
                    </Badge>
                  )}
                  {car.cityMpg && (
                    <Badge variant="outline" className="flex items-center gap-1.5">
                      <Fuel className="size-3" />
                      <span>{car.cityMpg} MPG</span>
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="flex gap-2 pt-4">
                <Button
                  asChild
                  variant="outline"
                  className="flex-1"
                  size="sm"
                >
                  <Link href={`/cars/${car.id}`}>
                    View Details
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <EditCarDialog
        car={selectedCarForEdit}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open)
          if (!open) {
            setSelectedCarForEdit(null)
            router.refresh()
          }
        }}
      />
    </>
  )
}

