import { requireAdmin } from "@/lib/auth-utils";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SiteHeader } from "@/components/dashboard/site-header";
import {
    SidebarInset,
    SidebarProvider,
} from "@/components/ui/sidebar";
import { CarForm } from "@/components/dashboard/car-form";

export default async function AddCarPage() {
    await requireAdmin();

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
                            <div className="flex items-center justify-between px-4 lg:px-6">
                                <div>
                                    <h1 className="text-3xl font-bold mb-2">Add New Car</h1>
                                    <p className="text-muted-foreground">
                                        Add a new car to your inventory
                                    </p>
                                </div>
                            </div>
                            <div className="px-4 lg:px-6 max-w-4xl">
                                <CarForm />
                            </div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
