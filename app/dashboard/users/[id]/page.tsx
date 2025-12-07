import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    IconArrowLeft,
    IconCalendar,
    IconCurrencyPeso,
    IconMail,
    IconPhone,
    IconShield,
    IconCar,
    IconReceipt,
    IconCheck,
    IconClock,
} from "@tabler/icons-react";
import Link from "next/link";
import { notFound } from "next/navigation";

interface UserProfilePageProps {
    params: {
        id: string;
    };
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
    await requireAdmin();

    // @ts-expect-error - Prisma Accelerate extension causes type conflicts
    const user = await prisma.user.findUnique({
        where: { id: params.id },
        include: {
            bookings: {
                include: {
                    car: {
                        select: {
                            make: true,
                            model: true,
                            year: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            },
            _count: {
                select: {
                    bookings: true,
                },
            },
        },
    });

    if (!user) {
        notFound();
    }

    // Calculate statistics
    const totalBookings = user.bookings.length;
    const totalSpent = user.bookings.reduce((sum: number, booking: { totalPrice: number }) => sum + booking.totalPrice, 0);
    const activeBookings = user.bookings.filter(
        (b: { status: string }) => b.status === "confirmed" || b.status === "pending"
    ).length;
    const completedBookings = user.bookings.filter((b: { status: string }) => b.status === "completed").length;

    const getStatusColor = (status: string) => {
        switch (status) {
            case "confirmed":
                return "bg-green-500";
            case "pending":
                return "bg-yellow-500";
            case "completed":
                return "bg-blue-500";
            case "cancelled":
                return "bg-red-500";
            default:
                return "bg-gray-500";
        }
    };

    return (
        <SidebarProvider
            style={
                {
                    "--sidebar-width": "calc(var(--spacing) * 72)",
                    "--header-height": "calc(var(--spacing) * 12)",
                } as React.CSSProperties
            }
        >
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col">
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
                            <div className="px-4 lg:px-6">
                                <Link href="/dashboard/users">
                                    <Button variant="ghost" size="sm" className="mb-4">
                                        <IconArrowLeft className="mr-2 size-4" />
                                        Back to Users
                                    </Button>
                                </Link>

                                {/* User Profile Header */}
                                <div className="flex items-start gap-4 mb-6">
                                    <Avatar className="size-20">
                                        <AvatarImage src={user.image || undefined} alt={user.name} />
                                        <AvatarFallback className="text-2xl">
                                            {user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-3xl font-bold">{user.name}</h1>
                                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                                                {user.role === "admin" && <IconShield className="mr-1 size-3" />}
                                                {user.role}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <IconMail className="size-4" />
                                                <span>{user.email}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <IconPhone className="size-4" />
                                                <span>{user.phone || "No phone number"}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <IconCalendar className="size-4" />
                                                <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        {user.emailVerified && (
                                            <div className="flex items-center gap-1 text-green-600 mt-1">
                                                <IconCheck className="size-4" />
                                                <span className="text-sm">Email Verified</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Statistics Cards */}
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
                                            <IconCar className="size-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{totalBookings}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
                                            <IconCurrencyPeso className="size-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                ₱{totalSpent.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
                                            <IconClock className="size-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{activeBookings}</div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">Completed</CardTitle>
                                            <IconReceipt className="size-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{completedBookings}</div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Booking History */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Booking History</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {user.bookings.length === 0 ? (
                                            <div className="text-center py-8 text-muted-foreground">
                                                No bookings yet
                                            </div>
                                        ) : (
                                            <div className="rounded-md border">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Car</TableHead>
                                                            <TableHead>Dates</TableHead>
                                                            <TableHead>Status</TableHead>
                                                            <TableHead className="text-right">Total Price</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {user.bookings.map((booking: { id: string; car: { make: string; model: string; year: number }; startDate: Date; endDate: Date; status: string; totalPrice: number }) => (
                                                            <TableRow key={booking.id}>
                                                                <TableCell>
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {booking.car.make} {booking.car.model}
                                                                        </p>
                                                                        <p className="text-sm text-muted-foreground">
                                                                            {booking.car.year}
                                                                        </p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <div className="text-sm">
                                                                        <p>{new Date(booking.startDate).toLocaleDateString()}</p>
                                                                        <p className="text-muted-foreground">
                                                                            to {new Date(booking.endDate).toLocaleDateString()}
                                                                        </p>
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Badge className={getStatusColor(booking.status)}>
                                                                        {booking.status}
                                                                    </Badge>
                                                                </TableCell>
                                                                <TableCell className="text-right font-semibold">
                                                                    ₱{booking.totalPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
