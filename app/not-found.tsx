import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Home, Search, MapPin } from "lucide-react"

export default function NotFound() {
    return (
        <main className="min-h-screen bg-[var(--light-sand)] flex items-center relative overflow-hidden">
            {/* Background Logo Elements */}
            <Image
                src="/logo.svg"
                alt="Logo decorativo"
                width={200}
                height={200}
                className="absolute -right-12 -top-12 opacity-5 select-none pointer-events-none"
            />
            <Image
                src="/logo.svg"
                alt="Logo decorativo"
                width={150}
                height={150}
                className="absolute left-1/4 bottom-1/4 opacity-5 select-none pointer-events-none"
            />
            <Image
                src="/logo.svg"
                alt="Logo decorativo"
                width={180}
                height={180}
                className="absolute right-1/3 top-1/3 opacity-5 select-none pointer-events-none"
            />

            <div className="container mx-auto px-4 py-16 text-center">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Error Code */}
                    <div className="space-y-4">
                        <h1 className="text-8xl md:text-9xl font-serif text-[var(--brown-earth)] font-bold opacity-80">
                            404
                        </h1>
                        <div className="w-24 h-1 bg-[var(--green-moss)] mx-auto rounded-full"></div>
                    </div>

                    {/* Error Message */}
                    <div className="space-y-4">
                        <h2 className="text-3xl md:text-4xl font-serif text-[var(--dark-wood)] font-bold">
                            Oops, te perdiste en las montañas
                        </h2>
                        <p className="text-xl text-[var(--slate-gray)] leading-relaxed">
                            Parece que la página que buscas no existe o se ha perdido entre los senderos.
                            Pero no te preocupes, te ayudamos a encontrar el camino de vuelta.
                        </p>
                    </div>

                    {/* Suggestions */}
                    <div className="bg-white/80 rounded-xl p-6 space-y-4">
                        <h3 className="text-lg font-serif text-[var(--brown-earth)] font-medium">
                            ¿Qué puedes hacer?
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-[var(--slate-gray)]">
                                <Search className="h-4 w-4 text-[var(--green-moss)]" />
                                <span>Verifica la URL</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--slate-gray)]">
                                <Home className="h-4 w-4 text-[var(--green-moss)]" />
                                <span>Vuelve al inicio</span>
                            </div>
                            <div className="flex items-center gap-2 text-[var(--slate-gray)]">
                                <MapPin className="h-4 w-4 text-[var(--green-moss)]" />
                                <span>Explora las cabañas</span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <Link href="/">
                            <Button size="lg" variant="wood" className="w-full sm:w-auto">
                                <Home className="h-4 w-4 mr-2" />
                                Volver al inicio
                            </Button>
                        </Link>
                        <Link href="/#cabanas">
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full sm:w-auto border-[var(--brown-earth)] text-[var(--brown-earth)]"
                            >
                                <MapPin className="h-4 w-4 mr-2" />
                                Ver cabañas
                            </Button>
                        </Link>
                    </div>

                    {/* Additional Help */}
                    <div className="pt-8 border-t border-[var(--beige-arena)]">
                        <p className="text-[var(--slate-gray)] text-sm">
                            ¿Necesitas ayuda? {" "}
                            <Link
                                href="/#contacto"
                                className="text-[var(--green-moss)] hover:text-[var(--forest-green)] font-medium transition-colors"
                            >
                                Contáctanos
                            </Link>
                            {" "} y te ayudamos a encontrar lo que buscas.
                        </p>
                    </div>
                </div>
            </div>
        </main>
    )
} 