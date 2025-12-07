"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { format, differenceInDays } from "date-fns";
import { CalendarIcon, CalendarDays, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";
import { IconCurrencyPeso } from "@tabler/icons-react";

const bookingFormSchema = z.object({
  dateRange: z.object({
    from: z.date({
      message: "Start date is required",
    }),
    to: z.date({
      message: "End date is required",
    }),
  }).refine((data) => data.to > data.from, {
    message: "End date must be after start date",
    path: ["to"],
  }).refine((data) => {
    const days = differenceInDays(data.to, data.from);
    return days >= 1;
  }, {
    message: "Minimum rental period is 1 day",
    path: ["to"],
  }),
});

type BookingFormData = z.infer<typeof bookingFormSchema>;

interface BookingFormProps {
  carId: string;
  pricePerDay: number;
  onSuccess?: () => void;
}

export function BookingForm({ carId, pricePerDay, onSuccess }: BookingFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<BookingFormData>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      dateRange: {
        from: undefined,
        to: undefined,
      },
    },
  });

  const dateRange = form.watch("dateRange");

  const calculateTotal = () => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    const days = differenceInDays(dateRange.to, dateRange.from) + 1;
    return days * pricePerDay;
  };

  const calculateDays = () => {
    if (!dateRange?.from || !dateRange?.to) return 0;
    return differenceInDays(dateRange.to, dateRange.from) + 1;
  };

  const onSubmit = async (data: BookingFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          carId,
          startDate: data.dateRange.from.toISOString(),
          endDate: data.dateRange.to.toISOString(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create booking");
      }

      toast.success("Booking created successfully!");
      onSuccess?.();
      router.push(`/bookings/${result.booking.id}/complete`);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create booking"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isRangeComplete = dateRange?.from && dateRange?.to;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="dateRange"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-base font-semibold">Select Rental Period</FormLabel>
              <FormDescription>
                Choose your pickup and return dates
              </FormDescription>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-auto py-3",
                          !field.value?.from && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.from ? (
                          format(field.value.from, "LLL dd, y")
                        ) : (
                          <span>Pickup Date</span>
                        )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal h-auto py-3",
                          !field.value?.to && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {field.value?.to ? (
                          format(field.value.to, "LLL dd, y")
                        ) : (
                          <span>Return Date</span>
                        )}
                      </Button>
                    </div>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={field.value?.from}
                    selected={field.value as DateRange}
                    onSelect={(range) => {
                      field.onChange(range);
                      if (range?.from && range?.to) {
                        setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    disabled={(date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      return date < today;
                    }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {isRangeComplete && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Rental Period</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{calculateDays()} {calculateDays() === 1 ? 'day' : 'days'}</div>
                    <div className="text-xs text-muted-foreground">
                      {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd, yyyy")}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <IconCurrencyPeso className="h-4 w-4" />
                      <span>Price per day</span>
                    </div>
                    <span className="font-medium">₱{pricePerDay.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Total days</span>
                    </div>
                    <span className="font-medium">{calculateDays()}</span>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-base font-semibold">Total Amount</span>
                    <span className="text-2xl font-bold text-primary">
                      ₱{calculateTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={isLoading || !isRangeComplete}
          size="lg"
        >
          {isLoading ? (
            <>
              <span className="mr-2">Processing...</span>
              <Progress value={33} className="w-20 h-1" />
            </>
          ) : (
            "Confirm Booking"
          )}
        </Button>

        {!isRangeComplete && (
          <p className="text-xs text-center text-muted-foreground">
            Please select both start and end dates to continue
          </p>
        )}
      </form>
    </Form>
  );
}
