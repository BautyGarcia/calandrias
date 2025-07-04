import { CabinsShowcase } from "@/components/CabinsShowcase"
import Image from "next/image"

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