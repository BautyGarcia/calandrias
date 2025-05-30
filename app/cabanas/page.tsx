import { CabinsShowcase } from "@/components/CabinsShowcase"

export default function CabanasPage() {
    return (
        <main className="flex min-h-screen flex-col">
            {/* Header */}
            <section className="py-16 bg-[var(--light-sand)]">
                <div className="container mx-auto px-4">
                    <div className="text-center space-y-4">
                        <h1 className="text-4xl md:text-5xl font-serif text-[var(--brown-earth)] font-bold">
                            Nuestras cabañas
                        </h1>
                        <p className="text-xl text-[var(--slate-gray)] max-w-3xl mx-auto">
                            Descubre cada una de nuestras cabañas únicas, diseñadas para brindarte
                            una experiencia inolvidable en las sierras de Tandil.
                        </p>
                    </div>
                </div>
            </section>

            {/* Cabins Showcase */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <CabinsShowcase />
                </div>
            </section>
        </main>
    )
} 