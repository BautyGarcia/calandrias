"use client"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Star,
    Users,
    Bed,
    Bath
} from "lucide-react"
import { cabinsData } from "@/data/cabins"

export function CabinsShowcase() {
    return (
        <div className="space-y-12">
            {/* Header mejorado */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif text-[var(--brown-earth)] font-bold">
                    Nuestras Cabañas
                </h1>
                <p className="text-xl text-[var(--slate-gray)] max-w-3xl mx-auto leading-relaxed">
                    Espacios únicos diseñados para tu descanso perfecto. Cada cabaña cuenta una historia diferente en el corazón de las sierras.
                </p>
            </div>

            {/* Grid moderno de 3 columnas */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {cabinsData.map((cabin, index) => (
                    <Card
                        key={cabin.id}
                        className={`group pt-0 relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cabin-card-${index + 1} flex flex-col`}
                    >
                        {/* Imagen placeholder simplificada - Altura fija */}
                        <div className="relative h-72 overflow-hidden bg-gradient-to-br from-[var(--brown-earth)]/20 to-[var(--green-moss)]/30 flex items-center justify-center">
                            <div className="text-center text-white">
                                <div className="text-6xl mb-2">🏠</div>
                                <p className="font-bold text-lg">{cabin.name}</p>
                            </div>

                            {/* Badge de disponibilidad */}
                            <div className="absolute top-3 left-3 bg-[var(--green-moss)] text-white px-3 py-1 rounded-full text-sm font-medium">
                                Disponible
                            </div>
                        </div>

                        <CardContent className="p-6 flex flex-col flex-1">
                            {/* Header simplificado - Altura fija */}
                            <div className="h-16 flex items-start justify-between mb-4">
                                <h3 className="text-xl font-serif text-[var(--dark-wood)] font-bold leading-tight">
                                    {cabin.name}
                                </h3>
                                <div className="flex items-center gap-1 text-sm">
                                    <Star className="h-4 w-4 fill-[var(--beige-arena)] text-[var(--beige-arena)]" />
                                    <span className="font-medium">4.9</span>
                                </div>
                            </div>

                            {/* Info esencial - Altura fija */}
                            <div className="h-6 flex items-center gap-4 text-[var(--slate-gray)] text-sm mb-4">
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    <span>{cabin.capacity}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bed className="h-4 w-4" />
                                    <span>{cabin.bedrooms}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Bath className="h-4 w-4" />
                                    <span>{cabin.bathrooms}</span>
                                </div>
                            </div>

                            {/* Descripción - Altura fija */}
                            <div className="h-12 mb-4">
                                <p className="text-[var(--slate-gray)] text-sm leading-relaxed line-clamp-2">
                                    {cabin.description}
                                </p>
                            </div>

                            {/* Destacados - Altura fija */}
                            <div className="h-20 mb-4">
                                <div className="flex flex-wrap gap-2">
                                    {cabin.highlights.slice(0, 3).map((highlight, idx) => (
                                        <span
                                            key={idx}
                                            className="px-3 py-1 bg-[var(--soft-cream)] text-[var(--brown-earth)] text-xs rounded-full font-medium"
                                        >
                                            {highlight}
                                        </span>
                                    ))}
                                    {cabin.highlights.length > 3 && (
                                        <span className="px-3 py-1 bg-[var(--light-sand)] text-[var(--slate-gray)] text-xs rounded-full">
                                            +{cabin.highlights.length - 3} más
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Pricing y CTA - Siempre al final */}
                            <div className="flex items-center justify-between mt-auto">
                                <div>
                                    <span className="text-2xl font-bold text-[var(--brown-earth)]">
                                        ${cabin.price}
                                    </span>
                                    <span className="text-[var(--slate-gray)] text-sm"> /noche</span>
                                </div>
                                <Link href={`/cabanas/${cabin.slug}`}>
                                    <Button variant="moss" className="font-medium">
                                        Reservar
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* CTA mejorado */}
            <div className="bg-white rounded-3xl p-8 md:p-12 text-center shadow-xl border border-[var(--beige-arena)]/20">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h3 className="text-3xl font-serif text-[var(--brown-earth)] font-bold">
                        ¿Necesitas ayuda para elegir?
                    </h3>
                    <p className="text-[var(--slate-gray)] text-lg leading-relaxed">
                        Nuestro equipo especializado puede recomendarte la cabaña perfecta según tus fechas, grupo y preferencias.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="wood" size="lg" className="font-medium">
                            Llamar ahora
                        </Button>
                        <Button variant="outline" size="lg" className="font-medium border-[var(--brown-earth)] text-[var(--brown-earth)]">
                            Contactar
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
} 