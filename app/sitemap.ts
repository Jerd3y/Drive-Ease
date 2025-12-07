import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Get all cars for dynamic routes
  // @ts-expect-error - Prisma Accelerate extension causes type conflicts
  const cars = await prisma.car.findMany({
    select: { id: true, updatedAt: true },
  });

  const carRoutes = cars.map((car: { id: string; updatedAt: Date }) => ({
    url: `${baseUrl}/cars/${car.id}`,
    lastModified: car.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/bookings`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
    ...carRoutes,
  ];
}

