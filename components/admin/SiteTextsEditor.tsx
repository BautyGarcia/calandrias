'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'
import { updateSiteContentAction } from '@/app/admin/(panel)/contenido/actions'
import type {
    HeroContent,
    ServicesContent,
    CtaContent,
    CabinsTeaserContent,
    SeoContent,
} from '@/lib/content-schemas'

interface SiteTextsEditorProps {
    hero: HeroContent
    services: ServicesContent
    cta: CtaContent
    cabinsTeaser: CabinsTeaserContent
    seo: SeoContent
}

type Status = { type: 'ok' | 'error'; msg: string } | null

// Wrapper de cada card de sección: título, ayuda, contenido, y barra de guardado.
function SectionCard({
    title,
    description,
    children,
    onSave,
}: {
    title: string
    description: string
    children: React.ReactNode
    onSave: () => Promise<{ ok: boolean; error?: string }>
}) {
    const [status, setStatus] = useState<Status>(null)
    const [isPending, startTransition] = useTransition()

    function handleSave() {
        setStatus(null)
        startTransition(async () => {
            const result = await onSave()
            if (result.ok) setStatus({ type: 'ok', msg: 'Guardado correctamente.' })
            else setStatus({ type: 'error', msg: result.error ?? 'No se pudo guardar.' })
        })
    }

    return (
        <Card className="bg-white">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {children}
                <div className="flex items-center justify-between gap-4 pt-2">
                    <div className="min-h-[1.25rem] text-sm">
                        {status && (
                            <span
                                className={cn(
                                    'flex items-center gap-1.5',
                                    status.type === 'ok' ? 'text-[var(--green-moss)]' : 'text-[var(--terracotta)]'
                                )}
                            >
                                {status.type === 'ok' && <Check className="h-4 w-4" />}
                                {status.msg}
                            </span>
                        )}
                    </div>
                    <Button type="button" onClick={handleSave} disabled={isPending}>
                        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

function Field({
    label,
    help,
    children,
}: {
    label: string
    help?: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {help && <p className="text-xs text-[var(--slate-gray)]">{help}</p>}
        </div>
    )
}

export function SiteTextsEditor({ hero, services, cta, cabinsTeaser, seo }: SiteTextsEditorProps) {
    // --- Hero ---
    const [heroState, setHeroState] = useState(hero)

    // --- Servicios ---
    const [servicesState, setServicesState] = useState(services)

    // --- CTA ---
    const [ctaState, setCtaState] = useState(cta)

    // --- Sección cabañas ---
    const [teaserState, setTeaserState] = useState(cabinsTeaser)

    // --- SEO ---
    const [seoState, setSeoState] = useState(seo)

    return (
        <div className="space-y-6">
            {/* HERO */}
            <SectionCard
                title="Portada (Hero)"
                description="La primera sección que ve el visitante al entrar a la web."
                onSave={() => updateSiteContentAction('hero', heroState)}
            >
                <Field label="Título principal" help="Título grande de la portada.">
                    <Input value={heroState.title} onChange={(e) => setHeroState({ ...heroState, title: e.target.value })} />
                </Field>
                <Field label="Subtítulo" help="Texto descriptivo debajo del título.">
                    <Textarea rows={3} value={heroState.subtitle} onChange={(e) => setHeroState({ ...heroState, subtitle: e.target.value })} />
                </Field>
                <Field label="Texto del botón" help="Ej: “Reservar ahora”.">
                    <Input value={heroState.ctaLabel} onChange={(e) => setHeroState({ ...heroState, ctaLabel: e.target.value })} />
                </Field>
            </SectionCard>

            {/* SERVICIOS */}
            <SectionCard
                title="Servicios"
                description="Los tres bloques destacados que explican por qué elegir las cabañas."
                onSave={() => updateSiteContentAction('services', servicesState)}
            >
                <Field label="Título de la sección" help="Encabezado de la sección de servicios.">
                    <Input value={servicesState.title} onChange={(e) => setServicesState({ ...servicesState, title: e.target.value })} />
                </Field>
                <div className="space-y-4">
                    {servicesState.items.map((item, i) => (
                        <div key={i} className="space-y-2 rounded-sm border border-[var(--beige-arena)] p-3">
                            <p className="text-xs font-medium uppercase tracking-wide text-[var(--slate-gray)]">Servicio {i + 1}</p>
                            <Field label="Ícono" help="Nombre del ícono (ej: Home, Sparkles, Heart).">
                                <Input
                                    value={item.icon}
                                    onChange={(e) => {
                                        const items = [...servicesState.items]
                                        items[i] = { ...items[i], icon: e.target.value }
                                        setServicesState({ ...servicesState, items })
                                    }}
                                />
                            </Field>
                            <Field label="Título">
                                <Input
                                    value={item.title}
                                    onChange={(e) => {
                                        const items = [...servicesState.items]
                                        items[i] = { ...items[i], title: e.target.value }
                                        setServicesState({ ...servicesState, items })
                                    }}
                                />
                            </Field>
                            <Field label="Descripción">
                                <Textarea
                                    rows={2}
                                    value={item.description}
                                    onChange={(e) => {
                                        const items = [...servicesState.items]
                                        items[i] = { ...items[i], description: e.target.value }
                                        setServicesState({ ...servicesState, items })
                                    }}
                                />
                            </Field>
                        </div>
                    ))}
                </div>
            </SectionCard>

            {/* CTA */}
            <SectionCard
                title="Llamado a la acción (CTA)"
                description="Sección final que invita a reservar."
                onSave={() => updateSiteContentAction('cta', ctaState)}
            >
                <Field label="Título" help="Título del llamado a la acción.">
                    <Input value={ctaState.title} onChange={(e) => setCtaState({ ...ctaState, title: e.target.value })} />
                </Field>
                <Field label="Subtítulo">
                    <Textarea rows={2} value={ctaState.subtitle} onChange={(e) => setCtaState({ ...ctaState, subtitle: e.target.value })} />
                </Field>
                <Field label="Texto del botón">
                    <Input value={ctaState.buttonLabel} onChange={(e) => setCtaState({ ...ctaState, buttonLabel: e.target.value })} />
                </Field>
            </SectionCard>

            {/* SECCIÓN CABAÑAS */}
            <SectionCard
                title="Sección cabañas"
                description="El bloque que presenta las cabañas antes de mostrarlas."
                onSave={() => updateSiteContentAction('cabins_teaser', teaserState)}
            >
                <Field label="Título">
                    <Input value={teaserState.title} onChange={(e) => setTeaserState({ ...teaserState, title: e.target.value })} />
                </Field>
                <Field label="Subtítulo">
                    <Textarea rows={3} value={teaserState.subtitle} onChange={(e) => setTeaserState({ ...teaserState, subtitle: e.target.value })} />
                </Field>

                <div className="space-y-2">
                    <Label>Estadísticas</Label>
                    <p className="text-xs text-[var(--slate-gray)]">Los números destacados (valor + etiqueta).</p>
                    {teaserState.stats.map((stat, i) => (
                        <div key={i} className="flex gap-2">
                            <Input
                                className="w-28"
                                placeholder="Valor"
                                value={stat.value}
                                onChange={(e) => {
                                    const stats = [...teaserState.stats]
                                    stats[i] = { ...stats[i], value: e.target.value }
                                    setTeaserState({ ...teaserState, stats })
                                }}
                            />
                            <Input
                                placeholder="Etiqueta"
                                value={stat.label}
                                onChange={(e) => {
                                    const stats = [...teaserState.stats]
                                    stats[i] = { ...stats[i], label: e.target.value }
                                    setTeaserState({ ...teaserState, stats })
                                }}
                            />
                        </div>
                    ))}
                </div>

                <div className="space-y-2">
                    <Label>Características</Label>
                    <p className="text-xs text-[var(--slate-gray)]">Bloques con título y descripción.</p>
                    {teaserState.features.map((feature, i) => (
                        <div key={i} className="space-y-2 rounded-sm border border-[var(--beige-arena)] p-3">
                            <Input
                                placeholder="Título"
                                value={feature.title}
                                onChange={(e) => {
                                    const features = [...teaserState.features]
                                    features[i] = { ...features[i], title: e.target.value }
                                    setTeaserState({ ...teaserState, features })
                                }}
                            />
                            <Input
                                placeholder="Descripción"
                                value={feature.description}
                                onChange={(e) => {
                                    const features = [...teaserState.features]
                                    features[i] = { ...features[i], description: e.target.value }
                                    setTeaserState({ ...teaserState, features })
                                }}
                            />
                        </div>
                    ))}
                </div>

                <Field label="Texto del botón">
                    <Input value={teaserState.ctaLabel} onChange={(e) => setTeaserState({ ...teaserState, ctaLabel: e.target.value })} />
                </Field>
            </SectionCard>

            {/* SEO */}
            <SectionCard
                title="SEO (buscadores)"
                description="Cómo aparece la web en Google y al compartir el link."
                onSave={() => updateSiteContentAction('seo', seoState)}
            >
                <Field label="Título de la página" help="Aparece en la pestaña del navegador y en Google.">
                    <Input value={seoState.title} onChange={(e) => setSeoState({ ...seoState, title: e.target.value })} />
                </Field>
                <Field label="Descripción" help="Texto que muestra Google debajo del título.">
                    <Textarea rows={3} value={seoState.description} onChange={(e) => setSeoState({ ...seoState, description: e.target.value })} />
                </Field>
                <Field label="Palabras clave" help="Separadas por comas.">
                    <Textarea rows={2} value={seoState.keywords} onChange={(e) => setSeoState({ ...seoState, keywords: e.target.value })} />
                </Field>
            </SectionCard>
        </div>
    )
}
