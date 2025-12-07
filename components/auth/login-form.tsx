"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Logo } from "@/components/layout/logo"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { Eye, EyeOff } from "lucide-react"
import Image from "next/image"

const loginSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .min(1, { message: "Email is required" })
    .email({ message: "Please enter a valid email address" }),
  password: z
    .string({ message: "Password is required" })
    .min(1, { message: "Password is required" }),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev)
  }

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const handleLogin = async (data: LoginFormData) => {
    try {
      setIsLoading(true)
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      })

      if (result.error) {
        const errorMessage = result.error.message || "Failed to sign in"

        if (
          errorMessage.toLowerCase().includes("email") ||
          errorMessage.toLowerCase().includes("user not found")
        ) {
          form.setError("email", {
            type: "server",
            message: errorMessage,
          })
        } else if (
          errorMessage.toLowerCase().includes("password") ||
          errorMessage.toLowerCase().includes("invalid password") ||
          errorMessage.toLowerCase().includes("incorrect")
        ) {
          form.setError("password", {
            type: "server",
            message: errorMessage,
          })
        } else {
          form.setError("password", {
            type: "server",
            message: errorMessage,
          })
        }
        return
      }

      toast.success("Successfully signed in!")

      const searchParams = new URLSearchParams(window.location.search)
      const redirectTo = searchParams.get("redirect")

      let userRole: string | undefined

      if (result.data?.user) {
        userRole = (result.data.user as { role?: string })?.role
      }

      if (!userRole) {
        const session = await authClient.getSession()
        userRole = (session?.data?.user as { role?: string })?.role
      }

      // Force a refresh to update the session before redirecting
      router.refresh()

      if (redirectTo) {
        if (redirectTo.startsWith("/dashboard") && userRole !== "admin") {
          router.push("/")
        } else {
          router.push(redirectTo)
        }
      } else if (userRole === "admin") {
        router.push("/dashboard")
      } else {
        router.push("/")
      }

      // Dispatch custom event to notify other components (like header) of auth change
      window.dispatchEvent(new Event('custom:auth-changed'))
    } catch {
      form.setError("root", {
        type: "server",
        message: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <Form {...form}>
            <form
              className="p-6 md:p-8"
              onSubmit={form.handleSubmit(handleLogin)}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center gap-4 text-center">
                  <Link href="/" className="mb-2 transition-opacity hover:opacity-80">
                    <Logo />
                  </Link>
                  <h1 className="text-2xl font-bold">Welcome back</h1>
                  <p className="text-muted-foreground text-balance">
                    Login to your Car Rental account
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="m@carrental.com"
                          {...field}
                          aria-invalid={!!fieldState.error}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <div className="flex items-center">
                        <FormLabel>Password</FormLabel>
                        <Link
                          href="/forgot-password"
                          className="ml-auto text-sm underline-offset-2 hover:underline"
                        >
                          Forgot your password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            {...field}
                            aria-invalid={!!fieldState.error}
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={handleTogglePassword}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                            tabIndex={0}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.formState.errors.root && (
                  <FormItem>
                    <FormMessage>
                      {form.formState.errors.root.message}
                    </FormMessage>
                  </FormItem>
                )}

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Signing in..." : "Login"}
                </Button>

                <FormDescription className="text-center">
                  Don&apos;t have an account? <Link href="/signup">Sign up</Link>
                </FormDescription>
              </div>
            </form>
          </Form>
          <div className="bg-muted relative hidden md:block">
            <Image
              src="/car-2.avif"
              alt="Image"
              fill
              className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
              priority
            />
          </div>
        </CardContent>
      </Card>
      <p className="px-6 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{" "}
        <Link href="/terms">Terms of Service</Link>{" "}
        and <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  )
}

