import { notFound } from 'next/navigation'
import { getCabinBySlug, getAllCabinSlugs } from '@/data/cabins'
import CabinCalendarSection from '@/components/CabinCalendarSection'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import type { Metadata } from 'next'
import { HotelSchema } from '@/components/SchemaMarkup'

interface PageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const cabin = getCabinBySlug(slug)

    if (!cabin) {
        return {
            title: 'Cabaña no encontrada | Las Calandrias Tandil',
            description: 'La cabaña que buscas no está disponible. Descubre nuestras otras opciones de alojamiento en Tandil.',
        }
    }

    const title = `${cabin.subtitle} - ${cabin.name} | Cabaña en Tandil - Las Calandrias`
    const description = `${cabin.description} ${cabin.capacity}, ${cabin.bedrooms}, ${cabin.bathrooms}. Reservá tu estadía en Las Calandrias, Tandil.`

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
                url: cabin.image || '/gallery/vista-aerea-del-complejo.jpg',
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
            images: [cabin.image || '/gallery/vista-aerea-del-complejo.jpg'],
        },
        alternates: {
            canonical: `/cabanas/${slug}`,
        },
    }
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
        <>
            {/* Schema Markup específico para la cabaña */}
            <HotelSchema cabin={cabin} />
            
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

                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="secondary">{cabin.capacity}</Badge>
                                    <Badge variant="secondary">{cabin.bedrooms}</Badge>
                                    <Badge variant="secondary">{cabin.bathrooms}</Badge>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-2xl font-serif text-[var(--brown-earth)]">Comodidades</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {cabin.features.map((feature, index) => (
                                            <div key={index} className="flex items-center gap-2">
                                                <div className="w-5 h-5 text-[var(--green-moss)]">
                                                    {/* Aquí iría el icono */}
                                                    <span>✓</span>
                                                </div>
                                                <span className="text-[var(--slate-gray)]">{feature.label}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <Card className="bg-[var(--soft-cream)] border-[var(--beige-arena)]">
                                    <CardContent className="p-6">
                                        <div className="text-center">
                                            <p className="text-3xl font-bold text-[var(--brown-earth)]">
                                                Desde ${cabin.price}
                                            </p>
                                            <p className="text-[var(--slate-gray)]">por noche</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="relative h-[400px] lg:h-[600px] rounded-lg overflow-hidden">
                                <Image
                                    src={cabin.image}
                                    alt={`${cabin.subtitle} - Cabaña en Las Calandrias`}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Calendar section */}
                <CabinCalendarSection cabin={cabin} />
            </main>
        </>
    )
} 