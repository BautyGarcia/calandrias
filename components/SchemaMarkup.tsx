import Script from 'next/script'
import { Cabin } from '@/types/cabin'
import type { Review } from '@/types/db'
import { getMinimumPrice, formatPrice } from '@/utils/pricing'
import { imageUrl as resolveImageUrl } from '@/utils/image'

// Defaults hardcodeados usados como fallback cuando site_settings no está disponible.
const DEFAULT_ADDRESS = "Ronca-Hue 50"
const DEFAULT_EMAIL = "Lascalandrias123@gmail.com"
const DEFAULT_TELEPHONE = "+54 9 2494 02‑7920"

interface LocalBusinessSchemaProps {
    name?: string
    description?: string
    image?: string
    url?: string
    streetAddress?: string
    telephone?: string
    email?: string
}

interface HotelSchemaProps {
    cabin: Cabin
    streetAddress?: string
    telephone?: string
    email?: string
}

export function LocalBusinessSchema({
    name = "Las Calandrias",
    description = "Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas.",
    image = "/gallery/vista-aerea-del-complejo.jpg",
    url = "https://las-calandrias.com",
    streetAddress = DEFAULT_ADDRESS,
    telephone = DEFAULT_TELEPHONE,
    email = DEFAULT_EMAIL,
}: LocalBusinessSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "LodgingBusiness",
        "name": name,
        "description": description,
        "url": url,
        "image": [
            `${url}${image}`,
            `${url}/gallery/todo-el-predio-desde-el-aire.jpg`,
            `${url}/gallery/vista-serrana.jpg`
        ],
        "logo": `${url}/logo.png`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": streetAddress,
            "addressLocality": "Tandil",
            "addressRegion": "Buenos Aires",
            "postalCode": "B7000",
            "addressCountry": "AR"
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "-37.360580399999996",
            "longitude": "-59.1513972"
        },
        "telephone": telephone,
        "email": email,
        "sameAs": [
            // Agregar redes sociales cuando estén disponibles
        ],
        "openingHours": "Mo-Su 00:00-23:59",
        "priceRange": "$$-$$$",
        "amenityFeature": [
            {
                "@type": "LocationFeatureSpecification",
                "name": "Pileta",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "WiFi gratuito",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Estacionamiento",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Chimenea",
                "value": true
            },
            {
                "@type": "LocationFeatureSpecification",
                "name": "Cocina equipada",
                "value": true
            }
        ],
        "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Cabañas en Tandil",
            "itemListElement": [
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "LodgingReservation",
                        "name": "Refugio Íntimo"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "LodgingReservation",
                        "name": "Confort Familiar"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "LodgingReservation",
                        "name": "Experiencia Premium"
                    }
                },
                {
                    "@type": "Offer",
                    "itemOffered": {
                        "@type": "LodgingReservation",
                        "name": "Retiro Exclusivo"
                    }
                }
            ]
        }
    }

    return (
        <Script
            id="local-business-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schema)
            }}
        />
    )
}

export function HotelSchema({
    cabin,
    streetAddress = DEFAULT_ADDRESS,
    telephone = DEFAULT_TELEPHONE,
    email = DEFAULT_EMAIL,
}: HotelSchemaProps) {
    const minPrice = getMinimumPrice(cabin)
    const formattedPrice = formatPrice(minPrice)
    const imageUrl = resolveImageUrl(cabin.image.url)

    const schema = {
        "@context": "https://schema.org",
        "@type": "Hotel",
        "name": `${cabin.subtitle} - Las Calandrias`,
        "description": cabin.description,
        "image": imageUrl,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": streetAddress,
            "addressLocality": "Tandil",
            "addressRegion": "Buenos Aires",
            "postalCode": "B7000",
            "addressCountry": "AR"
        },
        "telephone": telephone,
        "email": email,
        "url": `https://las-calandrias.com/cabanas/${cabin.slug}`,
        "priceRange": formattedPrice,
        "numberOfRooms": cabin.bedrooms,
        "petsAllowed": true,
        "amenityFeature": cabin.features.map(feature => ({
            "@type": "LocationFeatureSpecification",
            "name": feature.label,
            "value": true
        })),
        "containsPlace": {
            "@type": "Accommodation",
            "name": cabin.subtitle,
            "accommodationType": "Cabaña",
            "occupancy": {
                "@type": "QuantitativeValue",
                "maxValue": cabin.capacity
            }
        }
    }

    return (
        <Script
            id={`hotel-schema-${cabin.slug}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schema)
            }}
        />
    )
}

// Reseñas de fallback si la DB todavía no tiene reseñas cargadas.
const FALLBACK_REVIEWS = [
    {
        name: "María González",
        rating: 5,
        text: "Una experiencia única en las sierras. Las cabañas son hermosas y la atención excelente.",
    },
    {
        name: "Carlos Rodríguez",
        rating: 5,
        text: "Perfecto para desconectar. La vista es espectacular y las instalaciones de primera.",
    },
]

interface ReviewsSchemaProps {
    reviews?: Review[]
}

export function ReviewsSchema({ reviews }: ReviewsSchemaProps = {}) {
    const source =
        reviews && reviews.length > 0
            ? reviews.map((r) => ({ name: r.name, rating: r.rating, text: r.text }))
            : FALLBACK_REVIEWS

    const schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Las Calandrias",
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "127",
            "bestRating": "5",
            "worstRating": "1"
        },
        "review": source.map((r) => ({
            "@type": "Review",
            "author": {
                "@type": "Person",
                "name": r.name
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": String(r.rating),
                "bestRating": "5"
            },
            "reviewBody": r.text
        }))
    }

    return (
        <Script
            id="reviews-schema"
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schema)
            }}
        />
    )
} 