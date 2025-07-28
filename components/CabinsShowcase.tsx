"use client"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Star,
    Users,
    Bed,
    Bath,
    Heart
} from "lucide-react"
import { cabinsData } from "@/data/cabins"

export function CabinsShowcase() {
    return (
        <div className="space-y-12">
            {/* Header mejorado */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl md:text-5xl font-serif text-[var(--brown-earth)] font-bold">
                    Nuestras Cabañas en Tandil
                </h1>
                <p className="text-xl text-[var(--slate-gray)] max-w-3xl mx-auto leading-relaxed">
                    Espacios únicos diseñados para tu descanso perfecto en las sierras de Buenos Aires. 
                    Cada cabaña cuenta una historia diferente en el corazón de la naturaleza.
                </p>
            </div>

            {/* Grid responsivo optimizado */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                {cabinsData.map((cabin, index) => (
                    <Link 
                        key={cabin.id}
                        href={`/cabanas/${cabin.slug}`}
                        className="block group"
                    >
                        <Card
                            className={`pt-0 relative overflow-hidden bg-white border-0 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cabin-card-${index + 1} flex flex-col h-full cursor-pointer`}
                        >
                            {/* Imagen real de la cabaña */}
                            <div className="relative h-80 overflow-hidden">
                                <Image
                                    src={cabin.thumbnail}
                                    alt={cabin.name}
                                    fill
                                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                
                                {/* Overlay para mejorar legibilidad de badges */}
                                <div className="absolute inset-0 bg-black/20" />
                                
                                {/* Rating badge mejorado */}
                                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-[var(--beige-arena)] text-[var(--beige-arena)]" />
                                    <span className="text-xs font-bold text-[var(--brown-earth)]">
                                        {cabin.rating.score}
                                    </span>
                                    <span className="text-xs text-[var(--slate-gray)]">
                                        ({cabin.rating.review_count})
                                    </span>
                                </div>

                                {/* Badge de mascotas si está permitido */}
                                {cabin.amenities.pets_allowed && (
                                    <div className="absolute bottom-4 left-4 bg-[var(--green-moss)]/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-white" />
                                        <span className="text-xs font-medium text-white">Pet-friendly</span>
                                    </div>
                                )}
                            </div>

                            <CardContent className="p-6 flex flex-col flex-1">
                                {/* Header con nombre real */}
                                <div className="mb-4">
                                    <h3 className="text-xl font-serif text-[var(--dark-wood)] font-bold leading-tight mb-1 group-hover:text-[var(--brown-earth)] transition-colors">
                                        {cabin.name}
                                    </h3>
                                    <p className="text-sm text-[var(--slate-gray)]">
                                        Tandil, Buenos Aires
                                    </p>
                                </div>

                                {/* Info esencial */}
                                <div className="flex items-center gap-4 text-[var(--slate-gray)] text-sm mb-4">
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

                                {/* Descripción actualizada */}
                                <div className="mb-4">
                                    <p className="text-[var(--slate-gray)] text-sm leading-relaxed line-clamp-3">
                                        {cabin.description}
                                    </p>
                                </div>

                                {/* Amenidades destacadas */}
                                <div className="mb-4">
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

                                {/* Atracciones cercanas */}
                                {cabin.nearby_attractions.length > 0 && (
                                    <div className="mb-4 text-xs text-[var(--slate-gray)]">
                                        <span className="font-medium">Cerca de:</span> {cabin.nearby_attractions.slice(0, 2).join(', ')}
                                    </div>
                                )}

                                {/* Pricing y CTA mejorado */}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--light-sand)]">
                                    <div>
                                        <span className="text-2xl font-bold text-[var(--brown-earth)]">
                                            ${cabin.price}
                                        </span>
                                        <span className="text-[var(--slate-gray)] text-sm"> /noche</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[var(--green-moss)] font-medium text-sm">
                                        <span>Ver detalles</span>
                                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* CTA mejorado y más personalizado */}
            <div className="bg-gradient-to-r from-[var(--soft-cream)] to-[var(--light-sand)] rounded-3xl p-8 md:p-12 text-center shadow-xl border border-[var(--beige-arena)]/20">
                <div className="max-w-2xl mx-auto space-y-6">
                    <h3 className="text-3xl font-serif text-[var(--brown-earth)] font-bold">
                        ¿Necesitas ayuda para planificar tu estadía?
                    </h3>
                    <p className="text-[var(--slate-gray)] text-lg leading-relaxed">
                        Nuestro equipo local te puede recomendar las mejores actividades en Tandil, 
                        restaurantes y todo lo que necesitás para una experiencia perfecta.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="wood" size="lg" className="font-medium hover:scale-105 transition-transform">
                            Contactar por WhatsApp
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
} 