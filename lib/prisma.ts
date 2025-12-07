import { PrismaClient, Prisma } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  prismaBase: PrismaClient | undefined;
};

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const useAccelerate = databaseUrl.startsWith("prisma://") || 
                        databaseUrl.startsWith("prisma+postgres://") ||
                        databaseUrl.includes("accelerate") || 
                        databaseUrl.includes("prisma-data-platform");

  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  if (useAccelerate) {
    return baseClient.$extends(withAccelerate());
  }

  return baseClient;
}

// Function to create base Prisma client for Better Auth
// Better Auth needs direct database connection, not Accelerate
function createBasePrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const useAccelerate = databaseUrl.startsWith("prisma://") || 
                        databaseUrl.startsWith("prisma+postgres://") ||
                        databaseUrl.includes("accelerate") || 
                        databaseUrl.includes("prisma-data-platform");

  // For Better Auth, use DIRECT_DATABASE_URL if available
  // Better Auth does not support Prisma Accelerate extensions
  let directDatabaseUrl = databaseUrl;
  let useDirectUrl = false;
  
  if (useAccelerate) {
    // Check if DIRECT_DATABASE_URL is set (should be set in .env)
    if (process.env.DIRECT_DATABASE_URL) {
      directDatabaseUrl = process.env.DIRECT_DATABASE_URL;
      useDirectUrl = true;
    } else {
      // Try to use Accelerate URL without extension as fallback
      // This may work in some cases but is not recommended
      console.warn(
        "⚠️  WARNING: DATABASE_URL uses Prisma Accelerate but DIRECT_DATABASE_URL is not set.\n" +
        "Better Auth may not work correctly. Please add DIRECT_DATABASE_URL to your .env file:\n\n" +
        "DIRECT_DATABASE_URL=\"postgresql://user:password@host:5432/database?schema=public\"\n\n" +
        "Get your direct connection string from:\n" +
        "- Your Prisma Data Platform dashboard (look for 'Direct connection' or 'Connection string')\n" +
        "- Your database provider dashboard (Supabase, Neon, AWS RDS, etc.)\n" +
        "- Your original PostgreSQL connection string (before enabling Accelerate)\n\n" +
        "Attempting to use Accelerate URL as fallback (this may fail)..."
      );
      // Use Accelerate URL directly - this will likely fail but won't crash the app immediately
      directDatabaseUrl = databaseUrl;
    }
  }

  const clientConfig: {
    datasources?: { db: { url: string } };
    log: Prisma.LogLevel[];
  } = {
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  };

  // Only override datasource URL if we're using a different URL
  if (useDirectUrl || useAccelerate) {
    clientConfig.datasources = {
      db: {
        url: directDatabaseUrl,
      },
    };
  }

  return new PrismaClient(clientConfig);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Base Prisma client for Better Auth - uses direct connection even if Accelerate is configured
export const prismaBase = globalForPrisma.prismaBase ?? createBasePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaBase = prismaBase;
}

