import HeroSection from "@/components/layout/hero-section"
import Features from "@/components/layout/features"
import { CarsSection } from "@/components/cars/cars-section"
import FooterSection from "@/components/layout/footer"

export const dynamic = 'force-dynamic'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  return (
    <main>
      <HeroSection />
      <CarsSection
        title="Our Fleet"
        description="Discover our wide selection of premium vehicles for every journey"
        limit={12}
        showFilters={true}
        showSearch={true}
        searchParams={resolvedSearchParams}
        layout="carousel"
      />
      <Features />
      <FooterSection />
    </main>
  )
}
