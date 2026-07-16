import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Mountain, TreePine, Home, Sparkles } from "lucide-react"
import type { CabinsTeaserContent } from "@/lib/content-schemas"

interface CabinsTeaserProps {
    content: CabinsTeaserContent
}

// Íconos/colores decorativos que acompañan a las características editables.
const FEATURE_STYLES = [
    { Icon: Mountain, iconClass: "text-[var(--brown-earth)]", bgClass: "bg-[var(--brown-earth)]/10" },
    { Icon: TreePine, iconClass: "text-[var(--green-moss)]", bgClass: "bg-[var(--green-moss)]/10" },
    { Icon: Home, iconClass: "text-[var(--terracotta)]", bgClass: "bg-[var(--terracotta)]/10" },
    { Icon: Sparkles, iconClass: "text-[var(--green-moss)]", bgClass: "bg-[var(--green-moss)]/10" },
]

// Colores decorativos de las estadísticas destacadas.
const STAT_COLORS = [
    "text-[var(--brown-earth)]",
    "text-[var(--green-moss)]",
    "text-[var(--green-moss)]",
    "text-[var(--terracotta)]",
]

export function CabinsTeaser({ content }: CabinsTeaserProps) {
    const stats = content.stats
    const features = content.features

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16 px-4 md:px-18">
            {/* Sección visual izquierda */}
            <div className="relative">
                {/* Imagen principal sin gradiente */}
                <div className="relative h-[450px] md:h-[500px] rounded-2xl overflow-hidden bg-[var(--light-sand)] border border-[var(--beige-arena)]">
                    {/* Contenido central */}
                    <div className="absolute inset-0 flex flex-col justify-center items-center md:justify-center">
                        <div className="text-center text-[var(--brown-earth)] space-y-4 z-10 md:space-y-4">
                            <div className="flex justify-center gap-4 mb-4 md:mb-6">
                                <div className="p-3 bg-white/80 rounded-full shadow-md">
                                    <Mountain className="h-8 w-8" />
                                </div>
                                <div className="p-3 bg-white/80 rounded-full shadow-md">
                                    <TreePine className="h-8 w-8" />
                                </div>
                                <div className="p-3 bg-white/80 rounded-full shadow-md">
                                    <Home className="h-8 w-8" />
                                </div>
                            </div>
                            <h3 className="text-2xl md:text-3xl font-serif font-bold">4 Experiencias Únicas</h3>
                            <p className="text-base md:text-lg text-[var(--slate-gray)] mb-8 md:mb-0">Desde refugios íntimos hasta retiros exclusivos</p>
                        </div>

                        {/* Stats decorativos dentro del contenedor SOLO en mobile */}
                        <div className="mt-8 md:hidden">
                            <div className="flex flex-col gap-2">
                                {/* Fila superior - 3 cajas más pequeñas */}
                                <div className="flex gap-2 justify-center">
                                    {stats.slice(0, 3).map((stat, i) => (
                                        <div key={i} className="bg-white rounded-lg p-2 shadow-lg text-center min-w-[60px]">
                                            <div className={`text-lg font-bold ${STAT_COLORS[i] ?? STAT_COLORS[0]}`}>{stat.value}</div>
                                            <div className="text-xs text-[var(--slate-gray)]">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                                {/* Fila inferior - 1 caja ancho completo */}
                                {stats[3] && (
                                    <div className="flex justify-center">
                                        <div className="bg-white rounded-lg p-2 shadow-lg text-center w-full">
                                            <div className={`text-lg font-bold ${STAT_COLORS[3]}`}>{stats[3].value}</div>
                                            <div className="text-xs text-[var(--slate-gray)]">{stats[3].label}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats decorativos SOLO para desktop - fuera del contenedor */}
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 hidden md:flex gap-4">
                    {stats.map((stat, i) => (
                        <div key={i} className="bg-white rounded-lg p-3 shadow-lg text-center min-w-[80px]">
                            <div className={`text-2xl font-bold ${STAT_COLORS[i] ?? STAT_COLORS[0]}`}>{stat.value}</div>
                            <div className="text-xs text-[var(--slate-gray)]">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Contenido derecho */}
            <div className="space-y-8 lg:pl-8">
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-[var(--green-moss)]">
                        <Sparkles className="h-5 w-5" />
                        <span className="font-medium">Experiencias diseñadas para ti</span>
                    </div>
                    <h2 className="text-4xl lg:text-5xl font-serif text-[var(--brown-earth)] font-bold leading-tight">
                        {content.title}
                    </h2>
                    <p className="text-xl text-[var(--slate-gray)] leading-relaxed">
                        {content.subtitle}
                    </p>
                </div>

                {/* Features conceptuales */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {features.map((feature, i) => {
                        const style = FEATURE_STYLES[i % FEATURE_STYLES.length]
                        const Icon = style.Icon
                        return (
                            <div key={i} className="flex items-start gap-3 p-4 bg-white/60 rounded-xl border border-[var(--beige-arena)]/50">
                                <div className={`p-2 ${style.bgClass} rounded-lg`}>
                                    <Icon className={`h-5 w-5 ${style.iconClass}`} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-[var(--dark-wood)]">{feature.title}</h4>
                                    <p className="text-sm text-[var(--slate-gray)]">{feature.description}</p>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Call to action simplificado */}
                <div className="pt-4">
                    <Link href="/cabanas">
                        <Button size="lg" variant="wood" className="px-8 text-lg">
                            {content.ctaLabel}
                            <ArrowRight className="h-5 w-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
