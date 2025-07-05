import { notFound } from "next/navigation"
import { getCabinBySlug, getAllCabinSlugs } from "@/data/cabins"
import { Card, CardContent } from "@/components/ui/card"
import CabinCalendarSection from "@/components/CabinCalendarSection"
import { Icon } from "@/utils/icons"
import {
    Users,
    Bed,
    Bath,
    Mountain,
    Tv,
    Snowflake,
    Flame,
    Shield,
    Wifi,
    ChefHat,
    Car,
    Waves,
    TreePine,
    Utensils
} from "lucide-react"

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateStaticParams() {
    const slugs = getAllCabinSlugs()
    return slugs.map((slug) => ({
        slug: slug,
    }))
}

export default async function CabinPage({ params }: PageProps) {
    const { slug } = await params
    const cabin = getCabinBySlug(slug)

    if (!cabin) {
        notFound()
    }

    return (
        <main className="flex min-h-screen flex-col">
            {/* Header with cabin info */}
            <section className="py-8 bg-[var(--light-sand)]">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <span className="text-[var(--green-moss)] font-medium text-lg">{cabin.subtitle}</span>
                                <h1 className="text-4xl md:text-5xl font-serif text-[var(--brown-earth)] font-bold">
                                    {cabin.name}
                                </h1>
                            </div>

                            <p className="text-xl text-[var(--slate-gray)] leading-relaxed">
                                {cabin.description}
                            </p>

                            <div className="flex items-center gap-6 text-[var(--dark-wood)]">
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    <span className="font-medium">{cabin.capacity}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bed className="h-5 w-5" />
                                    <span className="font-medium">{cabin.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Bath className="h-5 w-5" />
                                    <span className="font-medium">{cabin.bathrooms}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <span className="text-3xl font-bold text-[var(--brown-earth)]">
                                    ${cabin.price}/noche
                                </span>
                            </div>
                        </div>

                        {/* Main Image */}
                        <div className="relative h-[400px] lg:h-[500px] rounded-xl overflow-hidden">
                            <div className="absolute inset-0 bg-[var(--slate-gray)]/20 flex items-center justify-center">
                                <p className="text-white font-bold text-xl">Imagen {cabin.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Main Features */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-serif text-[var(--brown-earth)] font-bold">
                                Características principales
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {cabin.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-4 rounded-lg bg-[var(--soft-cream)] hover:bg-[var(--light-sand)] transition-colors"
                                    >
                                        <Icon name={feature.icon} className="h-5 w-5 text-[var(--brown-earth)]" />
                                        <span className="font-medium text-[var(--dark-wood)]">{feature.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Highlights */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-serif text-[var(--dark-wood)] font-medium">
                                    Destacados especiales:
                                </h3>
                                <div className="flex flex-wrap gap-3">
                                    {cabin.highlights.map((highlight, idx) => (
                                        <span
                                            key={idx}
                                            className="px-4 py-2 bg-[var(--green-moss)]/10 text-[var(--green-moss)] text-sm font-medium rounded-full border border-[var(--green-moss)]/20"
                                        >
                                            {highlight}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Complete Services */}
                        <div className="space-y-6">
                            <h2 className="text-3xl font-serif text-[var(--brown-earth)] font-bold">
                                Servicios incluidos
                            </h2>

                            <Card className="bg-[var(--light-sand)] border-[var(--beige-arena)]">
                                <CardContent className="p-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-[var(--slate-gray)]">
                                        <div className="flex items-center gap-2">
                                            <Mountain className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Vista panorámica y a las montañas</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Tv className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Televisor y entretenimiento</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Snowflake className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Aire acondicionado</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Flame className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Chimenea interior</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Extintor de incendios</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Wifi className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>WiFi gratuito</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChefHat className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Cocina completa equipada</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TreePine className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Lugar para fogatas</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Utensils className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Zona para comer al aire libre</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Car className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Estacionamiento gratuito</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Flame className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Parrilla</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Waves className="h-4 w-4 text-[var(--green-moss)]" />
                                            <span>Pileta</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </section>

            {/* Calendar Section */}
            <CabinCalendarSection
                cabin={cabin}
            />
        </main>
    )
} 