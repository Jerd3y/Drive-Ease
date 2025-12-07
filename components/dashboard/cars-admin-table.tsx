"use client";

import * as React from "react";
import Link from "next/link";
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconGripVertical,
  IconLayoutColumns,
  IconPlus,
  IconEdit,
  IconTrash,
  IconPhoto,
  IconEye,
  IconToggleLeft,
  IconToggleRight,
  IconCurrencyPeso,
  IconLayoutGrid,
  IconTable,
} from "@tabler/icons-react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { generateCarImageUrl } from "@/lib/utils";
import { EditCarDialog } from "@/components/dashboard/edit-car-dialog";
import { CarsAdminCards } from "@/components/dashboard/cars-admin-cards";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  pricePerDay: number;
  available: boolean;
  class: string;
  fuelType: string;
  cityMpg?: number;
  highwayMpg?: number;
  transmission?: string;
  drive?: string;
  images?: string | string[] | null;
}

interface CarsAdminTableProps {
  cars: Car[];
}

function DragHandle({ id }: { id: string }) {
  const { attributes, listeners } = useSortable({
    id,
  });

  return (
    <Button
      {...attributes}
      {...listeners}
      variant="ghost"
      size="icon"
      className="text-muted-foreground size-7 hover:bg-transparent"
    >
      <IconGripVertical className="text-muted-foreground size-3" />
      <span className="sr-only">Drag to reorder</span>
    </Button>
  );
}

export function CarsAdminTable({ cars: initialCars }: CarsAdminTableProps) {
  const router = useRouter();
  const [cars, setCars] = React.useState(initialCars);
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [searchQuery, setSearchQuery] = React.useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = React.useState(false);
  const [selectedCarForUpload, setSelectedCarForUpload] = React.useState<Car | null>(null);
  const [selectedCarForEdit, setSelectedCarForEdit] = React.useState<Car | null>(null);
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"table" | "cards">("table");

  const sortableId = React.useId();
  const sensors = useSensors(
    useSensor(MouseSensor, {}),
    useSensor(TouchSensor, {}),
    useSensor(KeyboardSensor, {})
  );

  const dataIds = React.useMemo<UniqueIdentifier[]>(
    () => cars?.map((car) => car.id) || [],
    [cars]
  );

  const handleDelete = async (carId: string) => {
    if (!confirm("Are you sure you want to delete this car?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to delete car" }));
        throw new Error(errorData.error || "Failed to delete car");
      }

      setCars(cars.filter((c) => c.id !== carId));
      toast.success("Car deleted successfully");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete car";
      toast.error(message);
      console.error("Delete error:", error);
    }
  };

  const handleToggleAvailability = async (carId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/cars/${carId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !currentStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to update car availability" }));
        throw new Error(errorData.error || errorData.details?.[0]?.message || "Failed to update car availability");
      }

      await response.json();
      setCars(cars.map((c) => (c.id === carId ? { ...c, available: !currentStatus } : c)));
      toast.success(`Car marked as ${!currentStatus ? "available" : "unavailable"}`);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update car availability";
      toast.error(message);
      console.error("Toggle availability error:", error);
    }
  };

  const handleBulkDelete = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.error("No cars selected");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.length} car(s)?`)) {
      return;
    }

    try {
      const results = await Promise.allSettled(
        selectedIds.map((id) =>
          fetch(`/api/admin/cars/${id}`, { method: "DELETE" })
        )
      );

      const successful = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
      const failed = results.length - successful;

      setCars(cars.filter((c) => !selectedIds.includes(c.id)));
      setRowSelection({});

      if (failed > 0) {
        toast.warning(`${successful} car(s) deleted, ${failed} failed`);
      } else {
        toast.success(`${selectedIds.length} car(s) deleted successfully`);
      }
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete cars";
      toast.error(message);
      console.error("Bulk delete error:", error);
    }
  };

  const filteredCars = React.useMemo(() => {
    return cars.filter((car) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        car.make.toLowerCase().includes(searchLower) ||
        car.model.toLowerCase().includes(searchLower) ||
        car.class.toLowerCase().includes(searchLower) ||
        car.year.toString().includes(searchLower) ||
        car.fuelType.toLowerCase().includes(searchLower)
      );
    });
  }, [cars, searchQuery]);

  const columns: ColumnDef<Car>[] = React.useMemo(
    () => [
      {
        id: "drag",
        header: () => null,
        cell: ({ row }) => <DragHandle id={row.original.id} />,
        enableHiding: false,
      },
      {
        id: "select",
        header: ({ table }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: "make",
        header: "Car",
        cell: ({ row }) => {
          const car = row.original;
          const imageUrl = Array.isArray(car.images) && car.images.length > 0
            ? car.images[0]
            : typeof car.images === "string"
              ? car.images
              : generateCarImageUrl({
                make: car.make,
                model: car.model,
                year: car.year,
              });

          return (
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={imageUrl}
                  alt={`${car.make} ${car.model}`}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <p className="font-medium">
                  {car.make} {car.model}
                </p>
                <p className="text-sm text-muted-foreground">{car.year}</p>
              </div>
            </div>
          );
        },
        enableHiding: false,
      },
      {
        accessorKey: "class",
        header: "Class",
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.class}
          </Badge>
        ),
      },
      {
        accessorKey: "fuelType",
        header: "Fuel Type",
        cell: ({ row }) => (
          <span className="capitalize">{row.original.fuelType}</span>
        ),
      },
      {
        accessorKey: "pricePerDay",
        header: () => <div className="text-right">Price/Day</div>,
        cell: ({ row }) => (
          <div className="text-right font-semibold">
            <IconCurrencyPeso className="inline size-3" />
            {row.original.pricePerDay.toFixed(2)}
          </div>
        ),
      },
      {
        accessorKey: "available",
        header: "Status",
        cell: ({ row }) => (
          <Badge variant={row.original.available ? "default" : "secondary"}>
            {row.original.available ? "Available" : "Unavailable"}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const car = row.original;

          return (
            <div className="flex items-center justify-end gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
                    size="icon"
                  >
                    <IconDotsVertical />
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
                      setSelectedCarForEdit(car);
                      setEditDialogOpen(true);
                    }}
                  >
                    <IconEdit className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedCarForUpload(car);
                      setUploadDialogOpen(true);
                    }}
                  >
                    <IconPhoto className="mr-2 size-4" />
                    Upload Image
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
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
          );
        },
        enableHiding: false,
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const table = useReactTable({
    data: filteredCars,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active && over && active.id !== over.id) {
      setCars((cars) => {
        const oldIndex = dataIds.indexOf(active.id);
        const newIndex = dataIds.indexOf(over.id);
        return arrayMove(cars, oldIndex, newIndex);
      });
    }
  }

  function DraggableRow({ row }: { row: Row<Car> }) {
    const { transform, transition, setNodeRef, isDragging } = useSortable({
      id: row.original.id,
    });

    return (
      <TableRow
        data-state={row.getIsSelected() && "selected"}
        data-dragging={isDragging}
        ref={setNodeRef}
        className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
        style={{
          transform: CSS.Transform.toString(transform),
          transition: transition,
        }}
      >
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    );
  }

  const handleImageUpload = async (file: File) => {
    if (!selectedCarForUpload) return;

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch(`/api/admin/cars/${selectedCarForUpload.id}/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();

      setCars(
        cars.map((c) =>
          c.id === selectedCarForUpload.id ? { ...c, images: data.images } : c
        )
      );

      toast.success("Image uploaded successfully");
      setUploadDialogOpen(false);
      setSelectedCarForUpload(null);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to upload image";
      toast.error(message);
      console.error("Image upload error:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Search cars..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(value) => {
            if (value === "table" || value === "cards") {
              setViewMode(value);
            }
          }}>
            <ToggleGroupItem value="table" aria-label="Table view">
              <IconTable className="size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="cards" aria-label="Card view">
              <IconLayoutGrid className="size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          {viewMode === "table" && Object.keys(rowSelection).length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <IconTrash className="mr-2 size-4" />
              Delete Selected ({Object.keys(rowSelection).length})
            </Button>
          )}
          {viewMode === "table" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <IconLayoutColumns />
                  <span className="hidden lg:inline">Customize Columns</span>
                  <span className="lg:hidden">Columns</span>
                  <IconChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {table
                  .getAllColumns()
                  .filter(
                    (column) =>
                      typeof column.accessorFn !== "undefined" && column.getCanHide()
                  )
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/cars/new">
              <IconPlus />
              <span className="hidden lg:inline">Add Car</span>
            </Link>
          </Button>
        </div>
      </div>

      {viewMode === "cards" ? (
        <CarsAdminCards cars={filteredCars} />
      ) : (
        <div className="rounded-md border">
          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
            sensors={sensors}
            id={sortableId}
          >
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead key={header.id} colSpan={header.colSpan}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody className="**:data-[slot=table-cell]:first:w-8">
                {table.getRowModel().rows?.length ? (
                  <SortableContext items={dataIds} strategy={verticalListSortingStrategy}>
                    {table.getRowModel().rows.map((row) => (
                      <DraggableRow key={row.id} row={row} />
                    ))}
                  </SortableContext>
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-24 text-center">
                      No cars found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </DndContext>
        </div>
      )}

      {viewMode === "table" && (
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      )}

      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Car Image</DialogTitle>
            <DialogDescription>
              Upload an image for {selectedCarForUpload?.make} {selectedCarForUpload?.model}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
                className="cursor-pointer"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditCarDialog
        car={selectedCarForEdit}
        open={editDialogOpen}
        onOpenChange={(open) => {
          setEditDialogOpen(open);
          if (!open) {
            setSelectedCarForEdit(null);
            // Refresh cars list when dialog closes after successful update
            router.refresh();
          }
        }}
      />
    </div>
  );
}
