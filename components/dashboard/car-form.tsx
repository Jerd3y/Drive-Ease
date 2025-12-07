"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { z } from "zod"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { createCarSchema } from "@/lib/schemas/admin"
import { IconPhoto, IconX } from "@tabler/icons-react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

// Use z.input to get the input type (before defaults are applied)
type CreateCarFormData = z.input<typeof createCarSchema>

const carClasses = [
    "compact",
    "midsize",
    "suv",
    "luxury",
    "sports",
    "truck",
    "van",
    "economy",
]

const driveTypes = ["fwd", "rwd", "awd", "4wd"]

const fuelTypes = ["gas", "diesel", "electric", "hybrid"]

const transmissionTypes = ["automatic", "manual", "cvt"]

interface ImageFile {
    file: File
    preview: string
}

export function CarForm() {
    const router = useRouter()
    const [isLoading, setIsLoading] = React.useState(false)
    const [images, setImages] = React.useState<ImageFile[]>([])
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const form = useForm<CreateCarFormData>({
        resolver: zodResolver(createCarSchema),
        defaultValues: {
            make: "",
            model: "",
            year: new Date().getFullYear(),
            class: "",
            fuelType: "",
            cityMpg: 20,
            highwayMpg: 30,
            combinationMpg: 25,
            cylinders: 4,
            displacement: 2.0,
            drive: "",
            transmission: "",
            pricePerDay: 50.0,
            available: true,
            description: "",
            location: "",
        },
    })

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
        const maxSize = 5 * 1024 * 1024 // 5MB

        Array.from(files).forEach((file) => {
            if (!validTypes.includes(file.type)) {
                toast.error(`${file.name}: Invalid file type. Only JPEG, PNG, and WebP are allowed.`)
                return
            }

            if (file.size > maxSize) {
                toast.error(`${file.name}: File size must be less than 5MB`)
                return
            }

            const reader = new FileReader()
            reader.onload = (e) => {
                const preview = e.target?.result as string
                setImages((prev) => [...prev, { file, preview }])
            }
            reader.readAsDataURL(file)
        })

        // Reset input to allow selecting the same file again
        if (fileInputRef.current) {
            fileInputRef.current.value = ""
        }
    }

    const handleRemoveImage = (index: number) => {
        setImages((prev) => {
            const updated = [...prev]
            updated.splice(index, 1)
            return updated
        })
    }

    const handleSubmit = async (data: CreateCarFormData) => {
        try {
            setIsLoading(true)

            // Create car first
            const response = await fetch("/api/admin/cars", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            const result = await response.json()

            if (!response.ok) {
                if (result.details) {
                    // Zod validation errors
                    const errors = result.details as Array<{ path: string[]; message: string }>
                    errors.forEach((error) => {
                        const field = error.path[0] as keyof CreateCarFormData
                        form.setError(field, {
                            type: "server",
                            message: error.message,
                        })
                    })
                } else {
                    toast.error(result.error || "Failed to create car")
                }
                return
            }

            const carId = result.car.id

            // Upload images if any
            if (images.length > 0) {
                const uploadPromises = images.map((imageFile) => {
                    const formData = new FormData()
                    formData.append("image", imageFile.file)

                    return fetch(`/api/admin/cars/${carId}/image`, {
                        method: "POST",
                        body: formData,
                    })
                        .then((res) => res.json())
                        .catch((error) => {
                            console.error("Error uploading image:", error)
                            return { error: "Failed to upload image" }
                        })
                })

                const uploadResults = await Promise.all(uploadPromises)
                const failedUploads = uploadResults.filter((r) => r.error)

                if (failedUploads.length > 0) {
                    toast.warning(
                        `Car created but ${failedUploads.length} image(s) failed to upload`
                    )
                } else {
                    toast.success(`Car created successfully with ${images.length} image(s)!`)
                }
            } else {
                toast.success("Car created successfully!")
            }

            // Redirect to cars list
            router.push("/dashboard/cars")
            router.refresh()
        } catch (error) {
            console.error("Error creating car:", error)
            toast.error("An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Car Details</CardTitle>
                <CardDescription>
                    Enter the details of the new car.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Basic Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="make"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Make *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Toyota" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="model"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Model *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="e.g., Camry" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="year"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Year *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1900"
                                                    max={new Date().getFullYear() + 1}
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="class"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select class" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {carClasses.map((carClass) => (
                                                        <SelectItem key={carClass} value={carClass}>
                                                            {carClass.charAt(0).toUpperCase() + carClass.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Performance */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Performance</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cityMpg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>City MPG *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="highwayMpg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Highway MPG *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="combinationMpg"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Combination MPG *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="cylinders"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cylinders *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    min="1"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseInt(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="displacement"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Displacement (L) *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.1"
                                                    min="0.1"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseFloat(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Drivetrain */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Drivetrain</h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="drive"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Drive Type *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select drive type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {driveTypes.map((drive) => (
                                                        <SelectItem key={drive} value={drive}>
                                                            {drive.toUpperCase()}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="transmission"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Transmission *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select transmission" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {transmissionTypes.map((transmission) => (
                                                        <SelectItem key={transmission} value={transmission}>
                                                            {transmission.charAt(0).toUpperCase() +
                                                                transmission.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="fuelType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fuel Type *</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select fuel type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {fuelTypes.map((fuel) => (
                                                        <SelectItem key={fuel} value={fuel}>
                                                            {fuel.charAt(0).toUpperCase() + fuel.slice(1)}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Pricing & Availability */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Pricing & Availability</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="pricePerDay"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price Per Day (₱) *</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    {...field}
                                                    onChange={(e) =>
                                                        field.onChange(parseFloat(e.target.value) || 0)
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription>Default: ₱50.00</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="available"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                />
                                            </FormControl>
                                            <div className="space-y-1 leading-none">
                                                <FormLabel>Available for rent</FormLabel>
                                                <FormDescription>
                                                    Uncheck if car is currently unavailable
                                                </FormDescription>
                                            </div>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Additional Information</h3>
                            <div className="grid grid-cols-1 gap-4">
                                <FormField
                                    control={form.control}
                                    name="location"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="e.g., Manila, Makati"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter car description..."
                                                    className="min-h-24"
                                                    {...field}
                                                    value={field.value || ""}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Car Images</h3>
                            <div className="space-y-4">
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/webp"
                                        multiple
                                        onChange={handleImageSelect}
                                        className="hidden"
                                        id="car-images"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoading}
                                    >
                                        <IconPhoto className="mr-2 size-4" />
                                        Select Images
                                    </Button>
                                    <FormDescription className="mt-2">
                                        Select one or more images (JPEG, PNG, or WebP). Max 5MB per image.
                                    </FormDescription>
                                </div>

                                {images.length > 0 && (
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                        {images.map((imageFile, index) => (
                                            <div
                                                key={index}
                                                className="relative group aspect-video rounded-lg overflow-hidden border bg-muted"
                                            >
                                                <Image
                                                    src={imageFile.preview}
                                                    alt={`Preview ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                                                    onClick={() => handleRemoveImage(index)}
                                                    disabled={isLoading}
                                                >
                                                    <IconX className="size-4" />
                                                    <span className="sr-only">Remove image</span>
                                                </Button>
                                                <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                                                    {imageFile.file.name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? "Creating..." : "Create Car"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
