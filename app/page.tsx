import HeroSection from "@/components/layout/hero-section"
import Features from "@/components/layout/features"
import { CarsSection } from "@/components/cars/cars-section"
import FooterSection from "@/components/layout/footer"

export default async function Home({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <main>
      <HeroSection />
      <CarsSection
        title="Our Fleet"
        description="Discover our wide selection of premium vehicles for every journey"
        limit={12}
        showFilters={true}
        showSearch={true}
        searchParams={searchParams}
      />
      <Features />
      <FooterSection />
    </main>
  )
}
