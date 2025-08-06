"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
    MapPin,
    Phone,
    Mail
} from "lucide-react"

interface LocationMapProps {
    mapUrl?: string;
}

export function LocationMap({ mapUrl = "" }: LocationMapProps) {
    const [isMapLoaded, setIsMapLoaded] = useState(false)

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center space-y-4">
                <h2 className="text-3xl font-serif text-[var(--brown-earth)] mb-4">
                    Nuestra ubicación
                </h2>
                <p className="text-[var(--slate-gray)] max-w-2xl mx-auto">
                    Ubicados en el corazón de las sierras de Tandil, rodeados de naturaleza y 
                    cerca de los principales atractivos turísticos de la región.
                </p>
            </div>

            {/* Mapa */}
            <div className="max-w-4xl mx-auto">
                <Card className="overflow-hidden bg-white/95 border-[var(--beige-arena)] h-[400px] lg:h-[500px]">
                    <CardContent className="p-0 h-full relative">
                        {mapUrl ? (
                            <>
                                <iframe
                                    src={mapUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 0, margin: 0, padding: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full h-full block"
                                    onLoad={() => setIsMapLoaded(true)}
                                />
                                {!isMapLoaded && (
                                    <div className="absolute inset-0 bg-[var(--light-sand)] flex items-center justify-center">
                                        <div className="text-center space-y-4">
                                            <MapPin className="h-12 w-12 text-[var(--brown-earth)] mx-auto animate-pulse" />
                                            <p className="text-[var(--slate-gray)]">Cargando mapa...</p>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="h-full bg-gradient-to-br from-[var(--light-sand)] to-[var(--soft-cream)] flex items-center justify-center">
                                <div className="text-center space-y-4 p-8">
                                    <MapPin className="h-16 w-16 text-[var(--brown-earth)] mx-auto" />
                                    <h3 className="text-xl font-serif text-[var(--dark-wood)]">
                                        Mapa próximamente
                                    </h3>
                                    <p className="text-[var(--slate-gray)]">
                                        Estamos preparando el mapa interactivo para mostrarte nuestra ubicación exacta.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Call to action */}
            <div className="text-center bg-[var(--soft-cream)] rounded-xl p-8">
                <h3 className="text-2xl font-serif text-[var(--brown-earth)] mb-4">
                    ¿Necesitas ayuda para llegar?
                </h3>
                <p className="text-[var(--slate-gray)] mb-6 max-w-2xl mx-auto">
                    Nuestro equipo puede ayudarte con indicaciones detalladas y recomendaciones
                    de rutas según tu punto de partida.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="moss" size="lg" asChild>
                        <a href="tel:+5492494027920">
                            <Phone className="h-4 w-4 mr-2" />
                            Llamar ahora
                        </a>
                    </Button>
                    <Button variant="outline" size="lg" className="border-[var(--brown-earth)] text-[var(--brown-earth)]" asChild>
                        <a href="mailto:Lascalandrias123@gmail.com">
                            <Mail className="h-4 w-4 mr-2" />
                            Enviar consulta
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    )
} 