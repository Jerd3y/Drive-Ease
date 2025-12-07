"use client";

import * as React from "react";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  IconCheck,
  IconPhone,
  IconIdBadge,
  IconMapPin,
  IconUser,
  IconAlertCircle,
} from "@tabler/icons-react";
import { Separator } from "@/components/ui/separator";

const bookingCompleteSchema = z.object({
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  driversLicenseNumber: z.string().min(5, "Driver's license number is required"),
  pickupLocation: z.string().min(1, "Pickup location is required"),
  dropoffLocation: z.string().min(1, "Dropoff location is required"),
  emergencyContactName: z.string().min(2, "Emergency contact name is required"),
  emergencyContactPhone: z.string().min(10, "Emergency contact phone is required"),
  specialRequests: z.string().optional(),
});

type BookingCompleteFormData = z.infer<typeof bookingCompleteSchema>;

interface BookingCompleteFormProps {
  bookingId: string;
}

export function BookingCompleteForm({ bookingId }: BookingCompleteFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

  const form = useForm<BookingCompleteFormData>({
    resolver: zodResolver(bookingCompleteSchema),
    defaultValues: {
      phoneNumber: "",
      driversLicenseNumber: "",
      pickupLocation: "",
      dropoffLocation: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      specialRequests: "",
    },
  });

  const onSubmit = async (data: BookingCompleteFormData) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to complete booking");
      }

      toast.success("Booking information saved successfully!");
      setIsComplete(true);

      // Redirect to bookings page after a short delay
      setTimeout(() => {
        router.push("/bookings");
        router.refresh();
      }, 2000);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save information"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <IconCheck className="size-8 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">Information Saved Successfully!</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          Your booking details have been saved. We&apos;ll contact you soon with
          confirmation and next steps.
        </p>
        <p className="text-sm text-muted-foreground">
          Redirecting to your bookings...
        </p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Contact Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Contact Information</h3>
            <p className="text-sm text-muted-foreground">
              How we can reach you about your booking
            </p>
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <IconPhone className="size-4" />
                  Phone Number
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="+63 912 345 6789"
                    type="tel"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  We&apos;ll use this to contact you about your booking
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="driversLicenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <IconIdBadge className="size-4" />
                  Driver&apos;s License Number
                </FormLabel>
                <FormControl>
                  <Input placeholder="DL123456789" {...field} />
                </FormControl>
                <FormDescription>
                  Required for vehicle pickup verification
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Location Information Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Pickup & Dropoff</h3>
            <p className="text-sm text-muted-foreground">
              Where you&apos;d like to pick up and return the vehicle
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="pickupLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <IconMapPin className="size-4" />
                    Pickup Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter pickup address or location"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Where would you like to pick up the vehicle?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dropoffLocation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <IconMapPin className="size-4" />
                    Dropoff Location
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter dropoff address or location"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Where would you like to return the vehicle?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Emergency Contact Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Emergency Contact</h3>
            <p className="text-sm text-muted-foreground">
              Contact person in case of emergency
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="emergencyContactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <IconUser className="size-4" />
                    Emergency Contact Name
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Full Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emergencyContactPhone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <IconPhone className="size-4" />
                    Emergency Contact Phone
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+63 912 345 6789"
                      type="tel"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Special Requests Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Special Requests</h3>
            <p className="text-sm text-muted-foreground">
              Any additional information or special requirements
            </p>
          </div>

          <FormField
            control={form.control}
            name="specialRequests"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Any special requests, notes, or requirements..."
                    className="resize-none min-h-24"
                    rows={4}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Let us know if you have any special requirements or requests
                  for your rental
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Payment Method Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold mb-1">Payment Method</h3>
            <p className="text-sm text-muted-foreground">
              How you will pay for your rental
            </p>
          </div>

          <div className="rounded-lg border-2 border-green-500/30 bg-green-50 dark:bg-green-950/20 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-green-500/10">
                <IconCheck className="size-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-green-700 dark:text-green-400">
                  Payment: Face to Face
                </p>
                <p className="text-sm text-muted-foreground">
                  Pay in cash or card upon vehicle pickup. No advance payment required.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/bookings")}
            className="flex-1"
            disabled={isLoading}
          >
            Skip for Now
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="mr-2">Saving...</span>
              </>
            ) : (
              <>
                <IconCheck className="mr-2 size-4" />
                Save & Complete Booking
              </>
            )}
          </Button>
        </div>

        {/* Info Note */}
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
          <div className="flex gap-3">
            <IconAlertCircle className="size-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium mb-1">Important Information</p>
              <p className="text-muted-foreground">
                All information is required for your booking. You can update
                these details later if needed. A confirmation email will be
                sent to your registered email address.
              </p>
            </div>
          </div>
        </div>
      </form>
    </Form>
  );
}
