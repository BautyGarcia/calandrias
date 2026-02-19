import { notFound } from 'next/navigation'
import { StrapiAPI } from '@/lib/strapi'
import CabinCalendarSection from '@/components/CabinCalendarSection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import type { Metadata } from 'next'
import { HotelSchema } from '@/components/SchemaMarkup'
import { ReserveButton } from '@/components/ReserveButton'
import { CABIN_FEATURE_ICONS } from '@/utils/icons'
import {
    Star,
    MapPin,
    Users,
    Bed,
    Bath,
    Heart,
    Snowflake,
    ChefHat,
    Waves
} from 'lucide-react'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

// Helper para construir URL de imagen de Strapi
function getStrapiImageUrl(url: string): string {
    if (url.startsWith('http')) return url
    const strapiUrl = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337'
    return `${strapiUrl}${url}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const strapiApi = new StrapiAPI()
    const cabin = await strapiApi.getCabinBySlug(slug)

    if (!cabin) {
        return {
            title: 'Cabaña no encontrada | Las Calandrias Tandil',
            description: 'La cabaña que buscas no está disponible. Descubre nuestras otras opciones de alojamiento en Tandil.',
        }
    }

    const title = `${cabin.subtitle} - ${cabin.name} | Cabaña en Tandil - Las Calandrias`
    const description = `${cabin.description} ${cabin.capacity}, ${cabin.bedrooms}, ${cabin.bathrooms}. Reservá tu estadía en Las Calandrias, Tandil.`
    const thumbnailUrl = getStrapiImageUrl(cabin.thumbnail.url)

    return {
        title,
        description,
        keywords: [
            `${cabin.subtitle.toLowerCase()}`,
            `cabaña ${cabin.subtitle.toLowerCase()}`,
            'cabañas tandil',
            'alojamiento tandil',
            `cabaña ${cabin.capacity.toLowerCase()}`,
            `cabaña ${cabin.bedrooms.toLowerCase()}`,
            'vacaciones tandil',
            'estadía tandil',
            'las calandrias',
            'sierra tandil',
            'cabañas con pileta',
            'relax tandil'
        ],
        openGraph: {
            title,
            description,
            images: [{
                url: thumbnailUrl,
                width: 1200,
                height: 630,
                alt: `${cabin.subtitle} - Cabaña en Las Calandrias, Tandil`,
            }],
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: [thumbnailUrl],
        },
        alternates: {
            canonical: `/cabanas/${slug}`,
        },
    }
}

export async function generateStaticParams() {
    const strapiApi = new StrapiAPI()
    const cabins = await strapiApi.getCabins()
    
    return cabins.map((cabin) => ({
        slug: cabin.slug,
    }))
}

// Revalidar cada hora
export const revalidate = 3600

export default async function CabinPage({ params }: PageProps) {
    const { slug } = await params
    const strapiApi = new StrapiAPI()
    const cabin = await strapiApi.getCabinBySlug(slug)

    if (!cabin) {
        notFound()
    }

    const thumbnailUrl = getStrapiImageUrl(cabin.thumbnail.url)

    return (
        <>
            {/* Schema Markup específico para la cabaña */}
            <HotelSchema cabin={cabin} />

            <main className="flex min-h-screen flex-col">
                {/* Hero Section con imagen de fondo */}
                <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
                    <Image
                        src={thumbnailUrl}
                        alt={cabin.thumbnail.alternativeText || `${cabin.subtitle} - Cabaña en Las Calandrias`}
                        fill
                        className="object-cover"
                        priority
                    />

                    {/* Overlay gradiente para mejor legibilidad */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                    {/* Contenido sobre la imagen */}
                    <div className="absolute inset-0 flex items-end">
                        <div className="container mx-auto px-4 pb-12">
                            <div className="max-w-3xl text-white space-y-4">
                                {/* Rating y ubicación */}
                                <div className="flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-semibold">{cabin.rating.score}</span>
                                        <span className="text-white/80">({cabin.rating.review_count} reseñas)</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/20 backdrop-blur-sm rounded-full px-3 py-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>Tandil, Buenos Aires</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-[var(--green-moss)]/80 backdrop-blur-sm rounded-full px-3 py-1">
                                        <Heart className="h-4 w-4" />
                                        <span className="text-sm">Pet-friendly</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-4xl md:text-6xl font-serif font-bold drop-shadow-lg">
                                        {cabin.name}
                                    </h1>
                                </div>

                                {/* Info básica */}
                                <div className="flex items-center gap-6 text-lg">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-5 w-5" />
                                        <span>{cabin.capacity}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bed className="h-5 w-5" />
                                        <span>{cabin.bedrooms}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Bath className="h-5 w-5" />
                                        <span>{cabin.bathrooms}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Contenido principal */}
                <section className="py-12 bg-[var(--light-sand)]">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Información principal */}
                            <div className="lg:col-span-2 space-y-8">
                                {/* Descripción del entorno */}
                                <Card className="border-0 shadow-lg bg-white">
                                    <CardContent className="p-8">
                                        <h2 className="text-3xl font-serif text-[var(--brown-earth)] mb-4">El Entorno</h2>
                                        <p className="text-[var(--slate-gray)] text-lg leading-relaxed">
                                            {cabin.setting}
                                        </p>
                                    </CardContent>
                                </Card>

                                {/* Amenidades y comodidades */}
                                <Card className="border-0 shadow-lg bg-white">
                                    <CardContent className="p-8">
                                        <h2 className="text-3xl font-serif text-[var(--brown-earth)] mb-6">Comodidades</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {cabin.features.map((feature) => {
                                                const IconComponent = CABIN_FEATURE_ICONS[feature.icon]
                                                return (
                                                    <div key={feature.id} className="flex items-center gap-3 p-3 rounded-lg bg-[var(--soft-cream)] border border-[var(--beige-arena)]/30">
                                                        <div className="w-8 h-8 text-[var(--green-moss)] flex items-center justify-center">
                                                            {IconComponent ? <IconComponent className="h-5 w-5" /> : <span>✓</span>}
                                                        </div>
                                                        <span className="text-[var(--slate-gray)] font-medium">{feature.label}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {/* Amenidades adicionales */}
                                        <div className="mt-6">
                                            <h3 className="text-xl font-serif text-[var(--brown-earth)] mb-4">Destacados</h3>
                                            <div className="flex flex-wrap gap-2">
                                                {cabin.highlights.map((highlight, index) => (
                                                    <Badge key={index} variant="secondary" className="bg-[var(--green-moss)]/10 text-[var(--green-moss)] border-[var(--green-moss)]/20">
                                                        {highlight}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Amenidades específicas */}
                                        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                            {cabin.amenities.air_conditioning && (
                                                <div className="flex items-center gap-2 text-[var(--slate-gray)]">
                                                    <Snowflake className="h-4 w-4" />
                                                    <span>Aire {cabin.amenities.air_conditioning}</span>
                                                </div>
                                            )}
                                            {cabin.amenities.kitchen && (
                                                <div className="flex items-center gap-2 text-[var(--slate-gray)]">
                                                    <ChefHat className="h-4 w-4" />
                                                    <span>Cocina equipada</span>
                                                </div>
                                            )}
                                            {cabin.amenities.pool_shared && (
                                                <div className="flex items-center gap-2 text-[var(--slate-gray)]">
                                                    <Waves className="h-4 w-4" />
                                                    <span>Pileta compartida</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar con info y reserva */}
                            <div className="lg:col-span-1">
                                <Card className="border-0 shadow-xl sticky top-8 bg-white">
                                    <CardContent className="p-8">
                                        <div className="space-y-4 mb-6">
                                            <div className="flex justify-between items-center py-2 border-b border-[var(--light-sand)]">
                                                <span className="text-[var(--slate-gray)]">Capacidad</span>
                                                <span className="font-medium text-[var(--brown-earth)]">{cabin.capacity} huéspedes</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-[var(--light-sand)]">
                                                <span className="text-[var(--slate-gray)]">Habitaciones</span>
                                                <span className="font-medium text-[var(--brown-earth)]">{parseInt(cabin.bedrooms) > 1 ? `${cabin.bedrooms} habitaciones` : `${cabin.bedrooms} habitación`}</span>
                                            </div>
                                            <div className="flex justify-between items-center py-2 border-b border-[var(--light-sand)]">
                                                <span className="text-[var(--slate-gray)]">Baños</span>
                                                <span className="font-medium text-[var(--brown-earth)]">{parseInt(cabin.bathrooms) > 1 ? `${cabin.bathrooms} baños` : `${cabin.bathrooms} baño`}</span>
                                            </div>
                                        </div>

                                        {/* Rating pequeño y botón de reservar */}
                                        <div className="flex items-center justify-center gap-2 mb-6 text-sm">
                                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                            <span className="font-semibold text-[var(--brown-earth)]">{cabin.rating.score}</span>
                                            <span className="text-[var(--slate-gray)]">({cabin.rating.review_count} reseñas)</span>
                                        </div>

                                        <ReserveButton />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Calendar section */}
                <div id="calendar-section">
                    <CabinCalendarSection cabin={cabin} />
                </div>
            </main>
        </>
    )
}
