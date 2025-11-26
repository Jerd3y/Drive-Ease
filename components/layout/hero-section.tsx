import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HeroHeader } from '@/components/layout/header'
import { CarSearch } from '@/components/cars/car-search'
import { IconChevronRight, IconPlayerPlay, IconTrendingUp, IconStar } from '@tabler/icons-react'
import Image from 'next/image'

export default function HeroSection() {
    return (
        <>
            <HeroHeader />
            <div className="overflow-hidden">
                <section className="bg-linear-to-b to-muted from-background">
                    <div className="relative py-36">
                        <div className="relative z-10 mx-auto w-full max-w-5xl px-6">
                            <div className="md:w-1/2">
                                <div>
                                    <h1 className="max-w-md text-balance text-5xl font-medium md:text-6xl">Rent Your Perfect Car Today</h1>
                                    <p className="text-muted-foreground my-8 max-w-2xl text-balance text-xl">Discover premium vehicles for your next adventure. From economy to luxury, we have the perfect car for every journey.</p>

                                    <div className="flex items-center gap-3 flex-wrap">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="pr-4.5">
                                            <Link href="#cars">
                                                <span className="text-nowrap">Browse Cars</span>
                                                <IconChevronRight className="opacity-50" />
                                            </Link>
                                        </Button>
                                        <Button
                                            asChild
                                            size="lg"
                                            variant="outline"
                                            className="pl-5">
                                            <Link href="/cars">
                                                <IconPlayerPlay className="fill-primary/25 stroke-primary" />
                                                <span className="text-nowrap"> Book Now</span>
                                            </Link>
                                        </Button>
                                    </div>
                                </div>

                                <div className="mt-10">
                                    <p className="text-muted-foreground mb-4">Trusted by customers:</p>
                                    <div className="mt-6 grid max-w-sm grid-cols-3 gap-6">
                                        <div className="flex items-center justify-center">
                                            <div className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                                                <IconStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                4.8 Rating
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className="text-muted-foreground text-sm font-medium flex items-center gap-1">
                                                <IconTrendingUp className="h-4 w-4 text-primary" />
                                                100+ Cars
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-center">
                                            <div className="text-muted-foreground text-sm font-medium">24/7 Support</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="perspective-near mt-24 translate-x-12 md:absolute md:-right-6 md:bottom-16 md:left-1/2 md:top-40 md:mt-0 md:translate-x-0">
                            <div className="before:border-foreground/5 before:bg-foreground/5 relative h-full before:absolute before:-inset-x-4 before:bottom-7 before:top-0 before:skew-x-6 before:rounded-[calc(var(--radius)+1rem)] before:border">
                                <div className="bg-background rounded-(--radius) shadow-foreground/10 ring-foreground/5 relative h-full -translate-y-12 skew-x-6 overflow-hidden border border-transparent shadow-md ring-1">
                                    <Image
                                        src="/car.jpg"
                                        alt="Premium car for rent"
                                        width="1200"
                                        height="800"
                                        className="object-center size-full object-cover"
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}

