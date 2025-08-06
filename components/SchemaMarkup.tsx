import Script from 'next/script'

interface LocalBusinessSchemaProps {
    name?: string
    description?: string
    image?: string
    url?: string
}

interface HotelSchemaProps {
    cabin: {
        name: string
        subtitle: string
        description: string
        price: string
        capacity: string
        bedrooms: string
        bathrooms: string
        image: string
        features: Array<{ icon: string; label: string }>
    }
}

export function LocalBusinessSchema({
    name = "Las Calandrias",
    description = "Cabañas de lujo en Tandil, Buenos Aires. Alojamiento exclusivo en las sierras para vacaciones perfectas.",
    image = "/gallery/vista-aerea-del-complejo.jpg",
    url = "https://las-calandrias.com"
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
            "streetAddress": "Ronca-Hue 50",
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
        "telephone": "+54 9 2494 02‑7920",
        "email": "Lascalandrias123@gmail.com",
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

export function HotelSchema({ cabin }: HotelSchemaProps) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "Hotel",
        "name": `${cabin.subtitle} - Las Calandrias`,
        "description": cabin.description,
        "image": `https://las-calandrias.com${cabin.image}`,
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "Ronca-Hue 50",
            "addressLocality": "Tandil",
            "addressRegion": "Buenos Aires",
            "postalCode": "B7000",
            "addressCountry": "AR"
        },
        "telephone": "+54 9 2494 02‑7920",
        "email": "Lascalandrias123@gmail.com",
        "url": `https://las-calandrias.com/cabanas/${cabin.subtitle.toLowerCase().replace(/\s+/g, '-')}`,
        "priceRange": `$${cabin.price}`,
        "numberOfRooms": cabin.bedrooms.charAt(0),
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
                "maxValue": cabin.capacity.charAt(0)
            }
        }
    }

    return (
        <Script
            id={`hotel-schema-${cabin.subtitle.toLowerCase().replace(/\s+/g, '-')}`}
            type="application/ld+json"
            dangerouslySetInnerHTML={{
                __html: JSON.stringify(schema)
            }}
        />
    )
}

export function ReviewsSchema() {
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
        "review": [
            {
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": "María González"
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                },
                "reviewBody": "Una experiencia única en las sierras. Las cabañas son hermosas y la atención excelente."
            },
            {
                "@type": "Review",
                "author": {
                    "@type": "Person",
                    "name": "Carlos Rodríguez"
                },
                "reviewRating": {
                    "@type": "Rating",
                    "ratingValue": "5",
                    "bestRating": "5"
                },
                "reviewBody": "Perfecto para desconectar. La vista es espectacular y las instalaciones de primera."
            }
        ]
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