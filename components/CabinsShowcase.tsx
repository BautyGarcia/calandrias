"use client"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Mountain,
    Tv,
    Snowflake,
    Flame,
    Shield,
    Wifi,
    ChefHat,
    Car,
    Waves,
    TreePine,
    Utensils,
    Users,
    Bed,
    Bath
} from "lucide-react"
import { cabinsData } from "@/data/cabins"

export function CabinsShowcase() {
    
    return (
        <div className="space-y-12">
            {/* Grid principal de cabañas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {cabinsData.map((cabin, index) => (
                    <Card
                        key={cabin.id}
                        className={`group relative overflow-hidden bg-white/95 border-[var(--beige-arena)] transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] cabin-card-${index + 1}`}
                    >
                        {/* Imagen principal */}
                        <div className="relative h-64 lg:h-80 overflow-hidden">
                            <div className="absolute inset-0 bg-[var(--slate-gray)]/20 flex items-center justify-center">
                                <p className="text-white font-bold text-xl">Imagen {cabin.name}</p>
                            </div>

                            {/* Overlay con información básica */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="absolute bottom-4 left-4 right-4 text-white">
                                    <div className="flex items-center gap-2 text-sm mb-2">
                                        <Users className="h-4 w-4" />
                                        <span>{cabin.capacity}</span>
                                        <Bed className="h-4 w-4 ml-2" />
                                        <span>{cabin.bedrooms}</span>
                                        <Bath className="h-4 w-4 ml-2" />
                                        <span>{cabin.bathrooms}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Badge de precio */}
                            <div className="absolute top-4 right-4 bg-[var(--brown-earth)] text-white px-3 py-1 rounded-full text-sm font-medium">
                                ${cabin.price}/noche
                            </div>
                        </div>

                        <CardContent className="p-6 space-y-4">
                            {/* Header */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-serif text-[var(--dark-wood)] font-bold">{cabin.name}</h3>
                                    <span className="text-sm text-[var(--green-moss)] font-medium">{cabin.subtitle}</span>
                                </div>
                                <p className="text-[var(--slate-gray)] leading-relaxed">{cabin.description}</p>
                            </div>

                            {/* Features grid */}
                            <div className="grid grid-cols-2 gap-3">
                                {cabin.features.map((feature, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2 p-2 rounded-lg bg-[var(--soft-cream)] transition-colors hover:bg-[var(--light-sand)]"
                                    >
                                        <feature.icon className="h-4 w-4 text-[var(--brown-earth)]" />
                                        <span className="text-sm text-[var(--dark-wood)]">{feature.label}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Highlights */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-[var(--brown-earth)]">Destacados:</h4>
                                <div className="flex flex-wrap gap-2">
                                    {cabin.highlights.map((highlight, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2 py-1 bg-[var(--green-moss)]/10 text-[var(--green-moss)] text-xs rounded-full border border-[var(--green-moss)]/20"
                                        >
                                            {highlight}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Servicios completos - Siempre visible */}
                            <div className="mt-4 p-4 bg-[var(--light-sand)] rounded-lg space-y-3">
                                <h4 className="font-medium text-[var(--brown-earth)]">Servicios completos:</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[var(--slate-gray)]">
                                    <div className="flex items-center gap-2">
                                        <Mountain className="h-3 w-3" />
                                        <span>Vista panorámica y a las montañas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Tv className="h-3 w-3" />
                                        <span>Televisor y entretenimiento</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Snowflake className="h-3 w-3" />
                                        <span>Aire acondicionado</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Flame className="h-3 w-3" />
                                        <span>Chimenea interior</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Shield className="h-3 w-3" />
                                        <span>Extintor de incendios</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Wifi className="h-3 w-3" />
                                        <span>WiFi gratuito</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChefHat className="h-3 w-3" />
                                        <span>Cocina completa equipada</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TreePine className="h-3 w-3" />
                                        <span>Lugar para fogatas</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Utensils className="h-3 w-3" />
                                        <span>Zona para comer al aire libre</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Car className="h-3 w-3" />
                                        <span>Estacionamiento gratuito</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Flame className="h-3 w-3" />
                                        <span>Parrilla</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Waves className="h-3 w-3" />
                                        <span>Pileta</span>
                                    </div>
                                </div>
                            </div>

                            {/* Botón de Reservar */}
                            <div className="pt-4">
                                <Link href={`/cabanas/${cabin.slug}`}>
                                    <Button variant="moss" size="lg" className="w-full font-medium">
                                        Ver detalles · ${cabin.price}/noche
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Call to action */}
            <div className="text-center space-y-4">
                <h3 className="text-2xl font-serif text-[var(--brown-earth)]">
                    ¿No sabes cuál elegir?
                </h3>
                <p className="text-[var(--slate-gray)] max-w-2xl mx-auto">
                    Nuestro equipo puede ayudarte a encontrar la cabaña perfecta según tus necesidades y preferencias.
                </p>
                <Button variant="wood" size="lg" className="mt-4">
                    Consultar disponibilidad
                </Button>
            </div>
        </div>
    )
} 