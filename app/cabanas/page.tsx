import { CabinsShowcase } from "@/components/CabinsShowcase"
import Image from "next/image"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Nuestras Cabañas en Tandil | Alojamiento de Lujo en las Sierras",
    description: "Descubre nuestras cabañas de lujo en Tandil. Refugio Íntimo, Cabaña Entre Árboles y más opciones para tu estadía perfecta en las sierras de Buenos Aires.",
    keywords: [
        "cabañas tandil",
        "alojamiento tandil",
        "cabaña refugio intimo",
        "cabaña entre árboles", 
        "cabañas con pileta tandil",
        "cabañas lujo tandil",
        "estadía tandil",
        "vacaciones sierras",
        "cabañas buenos aires",
        "turismo tandil"
    ],
    openGraph: {
        title: "Nuestras Cabañas en Tandil | Las Calandrias",
        description: "Descubre nuestras cabañas de lujo en Tandil. Refugio Íntimo, Cabaña Entre Árboles y más opciones para tu estadía perfecta en las sierras.",
        images: [{
            url: '/gallery/vista-aerea-del-complejo.jpg',
            width: 1200,
            height: 630,
            alt: 'Cabañas Las Calandrias en Tandil - Vista aérea del complejo',
        }],
    },
    alternates: {
        canonical: '/cabanas',
    },
}

export default function CabanasPage() {
    return (
        <main className="flex min-h-screen flex-col">
            {/* Cabins Showcase con fondo estético */}
            <section className="py-16 bg-[var(--light-sand)] relative overflow-hidden">
                {/* Background Logo Elements - Similar a la landing */}
                <Image
                    src="/logo.svg"
                    alt="Logo decorativo"
                    width={280}
                    height={280}
                    className="absolute -right-20 -top-20 opacity-10 select-none pointer-events-none float"
                    style={{ animationDelay: '0.8s' }}
                />
                <Image
                    src="/logo.svg"
                    alt="Logo decorativo"
                    width={160}
                    height={160}
                    className="absolute left-1/4 bottom-1/4 opacity-10 select-none pointer-events-none float"
                    style={{ animationDelay: '1.2s' }}
                />
                <Image
                    src="/logo.svg"
                    alt="Logo decorativo"
                    width={200}
                    height={200}
                    className="absolute right-1/3 top-1/3 opacity-10 select-none pointer-events-none float"
                    style={{ animationDelay: '0.4s' }}
                />
                
                <div className="container mx-auto px-4 relative z-10">
                    <CabinsShowcase />
                </div>
            </section>
        </main>
    )
} 