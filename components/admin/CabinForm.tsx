'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { CabinIcon } from '@/utils/icons'
import { FEATURE_ICONS, overridesToPricingGrid, type PricingRow } from '@/lib/cabin-form'
import type { Cabin, CabinFeatureIcon } from '@/types/cabin'
import { ImageUploadField } from './ImageUploadField'
import { PricingGrid } from './PricingGrid'
import {
    updateCabinAction,
    updateAirbnbUrlAction,
} from '@/app/admin/(panel)/cabanas/actions'
import {
    Loader2,
    Plus,
    Trash2,
    Check,
    Copy,
    Info,
    Images,
    DollarSign,
    CalendarSync,
} from 'lucide-react'

type Tab = 'info' | 'fotos' | 'precios' | 'airbnb'

interface CabinFormProps {
    cabin: Cabin
    airbnbUrl: string
    siteUrl: string
}

interface FormState {
    name: string
    subtitle: string
    description: string
    setting: string
    capacity: string
    bedrooms: string
    bathrooms: string
    imageUrl: string
    thumbnailUrl: string
    highlights: string[]
    features: { icon: CabinFeatureIcon; label: string }[]
    nearbyAttractions: string[]
    amenities: { kitchen: boolean; pool_shared: boolean; air_conditioning: string }
    ratingScore: string
    ratingReviewCount: string
    precio_base_noche: string
    descuento_dia_semana_default: string
    isPublished: boolean
}

const arsFormatter = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
})

function initState(cabin: Cabin): FormState {
    return {
        name: cabin.name,
        subtitle: cabin.subtitle,
        description: cabin.description,
        setting: cabin.setting,
        capacity: cabin.capacity,
        bedrooms: cabin.bedrooms,
        bathrooms: cabin.bathrooms,
        imageUrl: cabin.image.url,
        thumbnailUrl: cabin.thumbnail.url,
        highlights: [...cabin.highlights],
        features: cabin.features.map((f) => ({ icon: f.icon, label: f.label })),
        nearbyAttractions: [...cabin.nearby_attractions],
        amenities: {
            kitchen: cabin.amenities.kitchen,
            pool_shared: cabin.amenities.pool_shared,
            air_conditioning: cabin.amenities.air_conditioning,
        },
        ratingScore: String(cabin.rating.score),
        ratingReviewCount: String(cabin.rating.review_count),
        precio_base_noche: String(cabin.precio_base_noche),
        descuento_dia_semana_default: String(cabin.descuento_dia_semana_default),
        isPublished: cabin.publishedAt !== '',
    }
}

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'info', label: 'Información', icon: Info },
    { id: 'fotos', label: 'Fotos', icon: Images },
    { id: 'precios', label: 'Precios', icon: DollarSign },
    { id: 'airbnb', label: 'Airbnb', icon: CalendarSync },
]

// Switch simple (no hay componente switch en components/ui).
function Toggle({
    checked,
    onChange,
    label,
}: {
    checked: boolean
    onChange: (v: boolean) => void
    label: string
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="flex items-center gap-3"
        >
            <span
                className={cn(
                    'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors',
                    checked ? 'bg-[var(--green-moss)]' : 'bg-[var(--beige-arena)]'
                )}
            >
                <span
                    className={cn(
                        'inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform',
                        checked ? 'translate-x-5' : 'translate-x-0.5'
                    )}
                />
            </span>
            <span className="text-sm text-[var(--brown-earth)]">{label}</span>
        </button>
    )
}

// Editor de lista de strings (agregar / quitar).
function StringListEditor({
    items,
    onChange,
    placeholder,
}: {
    items: string[]
    onChange: (next: string[]) => void
    placeholder: string
}) {
    return (
        <div className="space-y-2">
            {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                    <Input
                        value={item}
                        placeholder={placeholder}
                        onChange={(e) => {
                            const next = [...items]
                            next[i] = e.target.value
                            onChange(next)
                        }}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Quitar"
                        onClick={() => onChange(items.filter((_, j) => j !== i))}
                    >
                        <Trash2 className="h-4 w-4 text-[var(--terracotta)]" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="sand" size="sm" onClick={() => onChange([...items, ''])}>
                <Plus className="h-4 w-4" />
                Agregar
            </Button>
        </div>
    )
}

export function CabinForm({ cabin, airbnbUrl, siteUrl }: CabinFormProps) {
    const [tab, setTab] = useState<Tab>('info')
    const [form, setForm] = useState<FormState>(() => initState(cabin))
    const [grid, setGrid] = useState<PricingRow[]>(() =>
        overridesToPricingGrid(cabin.overrides_mensuales)
    )
    const [status, setStatus] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)
    const [isPending, startTransition] = useTransition()

    // Airbnb (acción independiente).
    const [airbnb, setAirbnb] = useState(airbnbUrl)
    const [airbnbStatus, setAirbnbStatus] = useState<{ type: 'ok' | 'error'; msg: string } | null>(null)
    const [airbnbPending, startAirbnbTransition] = useTransition()
    const [copied, setCopied] = useState(false)

    const exportUrl = `${siteUrl.replace(/\/$/, '')}/api/cabins/${cabin.slug}/ical`

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((f) => ({ ...f, [key]: value }))
    }

    function handleGridChange(index: number, field: 'precio' | 'descuento', value: string) {
        setGrid((g) => g.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
    }

    function handleSave() {
        setStatus(null)
        const fd = new FormData()
        fd.set('name', form.name)
        fd.set('subtitle', form.subtitle)
        fd.set('description', form.description)
        fd.set('setting', form.setting)
        fd.set('capacity', form.capacity)
        fd.set('bedrooms', form.bedrooms)
        fd.set('bathrooms', form.bathrooms)
        fd.set('imageUrl', form.imageUrl)
        fd.set('thumbnailUrl', form.thumbnailUrl)
        fd.set('highlights', JSON.stringify(form.highlights.map((h) => h.trim()).filter(Boolean)))
        fd.set(
            'features',
            JSON.stringify(
                form.features
                    .map((f) => ({ icon: f.icon, label: f.label.trim() }))
                    .filter((f) => f.label)
            )
        )
        fd.set(
            'nearbyAttractions',
            JSON.stringify(form.nearbyAttractions.map((n) => n.trim()).filter(Boolean))
        )
        fd.set('amenities_kitchen', String(form.amenities.kitchen))
        fd.set('amenities_pool_shared', String(form.amenities.pool_shared))
        fd.set('amenities_air_conditioning', form.amenities.air_conditioning)
        fd.set('ratingScore', form.ratingScore || '0')
        fd.set('ratingReviewCount', form.ratingReviewCount || '0')
        fd.set('precio_base_noche', form.precio_base_noche || '0')
        fd.set('descuento_dia_semana_default', form.descuento_dia_semana_default || '0')
        fd.set('pricingGrid', JSON.stringify(grid))
        fd.set('isPublished', String(form.isPublished))
        fd.set('sortOrder', String(cabin.id))

        startTransition(async () => {
            const result = await updateCabinAction(cabin.documentId, fd)
            if (result.ok) {
                setStatus({ type: 'ok', msg: 'Cambios guardados correctamente.' })
            } else {
                setStatus({ type: 'error', msg: result.error })
            }
        })
    }

    function handleAirbnbSave() {
        setAirbnbStatus(null)
        startAirbnbTransition(async () => {
            const result = await updateAirbnbUrlAction(cabin.documentId, airbnb.trim())
            if (result.ok) {
                setAirbnbStatus({ type: 'ok', msg: 'Link de Airbnb guardado.' })
            } else {
                setAirbnbStatus({ type: 'error', msg: result.error })
            }
        })
    }

    async function copyExportUrl() {
        try {
            await navigator.clipboard.writeText(exportUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            /* clipboard no disponible: no-op */
        }
    }

    const basePriceNum = Number(form.precio_base_noche) || 0
    const baseDiscountNum = Number(form.descuento_dia_semana_default) || 0

    return (
        <div className="pb-28">
            {/* Tabs */}
            <div className="mb-6 flex flex-wrap gap-1 rounded-md bg-[var(--light-sand)] p-1">
                {TABS.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        className={cn(
                            'flex items-center gap-2 rounded-sm px-3 py-1.5 text-sm font-medium transition-colors',
                            tab === id
                                ? 'bg-white text-[var(--brown-earth)] shadow-sm'
                                : 'text-[var(--slate-gray)] hover:text-[var(--brown-earth)]'
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {label}
                    </button>
                ))}
            </div>

            {/* INFORMACIÓN */}
            {tab === 'info' && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nombre</Label>
                            <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subtitle">Subtítulo</Label>
                            <Input id="subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea id="description" rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="setting">Entorno</Label>
                        <Textarea id="setting" rows={3} value={form.setting} onChange={(e) => set('setting', e.target.value)} />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacidad</Label>
                            <Input id="capacity" value={form.capacity} onChange={(e) => set('capacity', e.target.value)} placeholder="4 huéspedes" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bedrooms">Dormitorios</Label>
                            <Input id="bedrooms" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} placeholder="2 dormitorios" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bathrooms">Baños</Label>
                            <Input id="bathrooms" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} placeholder="1 baño" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Destacados</Label>
                        <StringListEditor
                            items={form.highlights}
                            onChange={(next) => set('highlights', next)}
                            placeholder="Ej: Chimenea a leña"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Características</Label>
                        <div className="space-y-2">
                            {form.features.map((feat, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Select
                                        value={feat.icon}
                                        onValueChange={(v) => {
                                            const next = [...form.features]
                                            next[i] = { ...next[i], icon: v as CabinFeatureIcon }
                                            set('features', next)
                                        }}
                                    >
                                        <SelectTrigger className="w-[140px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {FEATURE_ICONS.map((icon) => (
                                                <SelectItem key={icon} value={icon}>
                                                    <span className="flex items-center gap-2">
                                                        <CabinIcon name={icon} size={16} />
                                                        {icon}
                                                    </span>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        value={feat.label}
                                        placeholder="Texto de la característica"
                                        onChange={(e) => {
                                            const next = [...form.features]
                                            next[i] = { ...next[i], label: e.target.value }
                                            set('features', next)
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Quitar característica"
                                        onClick={() => set('features', form.features.filter((_, j) => j !== i))}
                                    >
                                        <Trash2 className="h-4 w-4 text-[var(--terracotta)]" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                variant="sand"
                                size="sm"
                                onClick={() => set('features', [...form.features, { icon: 'Mountain', label: '' }])}
                            >
                                <Plus className="h-4 w-4" />
                                Agregar característica
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Lugares cercanos</Label>
                        <StringListEditor
                            items={form.nearbyAttractions}
                            onChange={(next) => set('nearbyAttractions', next)}
                            placeholder="Ej: Lago del Fuerte"
                        />
                    </div>

                    <div className="space-y-4 rounded-sm border border-[var(--beige-arena)] p-4">
                        <p className="text-sm font-medium text-[var(--brown-earth)]">Comodidades</p>
                        <Toggle
                            checked={form.amenities.kitchen}
                            onChange={(v) => set('amenities', { ...form.amenities, kitchen: v })}
                            label="Cocina equipada"
                        />
                        <Toggle
                            checked={form.amenities.pool_shared}
                            onChange={(v) => set('amenities', { ...form.amenities, pool_shared: v })}
                            label="Piscina compartida"
                        />
                        <div className="space-y-2">
                            <Label htmlFor="air">Aire acondicionado</Label>
                            <Input
                                id="air"
                                value={form.amenities.air_conditioning}
                                onChange={(e) => set('amenities', { ...form.amenities, air_conditioning: e.target.value })}
                                placeholder="Ej: frío-calor"
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="ratingScore">Puntaje (0 a 5)</Label>
                            <Input
                                id="ratingScore"
                                type="number"
                                min={0}
                                max={5}
                                step={0.1}
                                value={form.ratingScore}
                                onChange={(e) => set('ratingScore', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ratingReviewCount">Cantidad de reseñas</Label>
                            <Input
                                id="ratingReviewCount"
                                type="number"
                                min={0}
                                value={form.ratingReviewCount}
                                onChange={(e) => set('ratingReviewCount', e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="rounded-sm border border-[var(--beige-arena)] p-4">
                        <Toggle
                            checked={form.isPublished}
                            onChange={(v) => set('isPublished', v)}
                            label="Visible en la web"
                        />
                    </div>
                </div>
            )}

            {/* FOTOS */}
            {tab === 'fotos' && (
                <div className="space-y-8">
                    <ImageUploadField
                        label="Imagen principal"
                        slug={cabin.slug}
                        value={form.imageUrl}
                        onChange={(url) => set('imageUrl', url)}
                    />
                    <ImageUploadField
                        label="Miniatura"
                        slug={cabin.slug}
                        value={form.thumbnailUrl}
                        onChange={(url) => set('thumbnailUrl', url)}
                    />
                </div>
            )}

            {/* PRECIOS */}
            {tab === 'precios' && (
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="precioBase">Precio base por noche</Label>
                            <Input
                                id="precioBase"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                className="h-12 text-lg"
                                value={form.precio_base_noche}
                                onChange={(e) => set('precio_base_noche', e.target.value)}
                            />
                            <p className="text-xs text-[var(--slate-gray)]">
                                {basePriceNum > 0 ? arsFormatter.format(basePriceNum) : 'Ingresá el precio en pesos'}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="descBase">Descuento entre semana (%)</Label>
                            <Input
                                id="descBase"
                                type="number"
                                min={0}
                                max={100}
                                inputMode="numeric"
                                className="h-12 text-lg"
                                value={form.descuento_dia_semana_default}
                                onChange={(e) => set('descuento_dia_semana_default', e.target.value)}
                            />
                            <p className="text-xs text-[var(--slate-gray)]">Se aplica de lunes a jueves.</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Precios por mes</Label>
                        <p className="text-xs text-[var(--slate-gray)]">
                            Dejá una celda vacía para usar el valor base (se muestra en gris).
                        </p>
                        <PricingGrid
                            rows={grid}
                            basePrice={basePriceNum}
                            baseDiscount={baseDiscountNum}
                            onChange={handleGridChange}
                        />
                    </div>
                </div>
            )}

            {/* AIRBNB */}
            {tab === 'airbnb' && (
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="airbnbUrl">Link de Airbnb (importar calendario)</Label>
                        <Input
                            id="airbnbUrl"
                            value={airbnb}
                            onChange={(e) => setAirbnb(e.target.value)}
                            placeholder="https://www.airbnb.com/calendar/ical/..."
                        />
                        <p className="text-xs text-[var(--slate-gray)]">
                            Pegá acá el link &quot;Exportar calendario&quot; de Airbnb.
                        </p>
                        {airbnbStatus && (
                            <Alert
                                className={cn(
                                    airbnbStatus.type === 'ok'
                                        ? 'border-green-200 bg-green-50'
                                        : 'border-red-200 bg-red-50'
                                )}
                            >
                                <AlertDescription
                                    className={airbnbStatus.type === 'ok' ? 'text-green-700' : 'text-red-700'}
                                >
                                    {airbnbStatus.msg}
                                </AlertDescription>
                            </Alert>
                        )}
                        <Button type="button" onClick={handleAirbnbSave} disabled={airbnbPending}>
                            {airbnbPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Guardar link
                        </Button>
                    </div>

                    <div className="space-y-2 rounded-sm border border-[var(--beige-arena)] p-4">
                        <Label>Tu link para exportar a Airbnb</Label>
                        <p className="text-xs text-[var(--slate-gray)]">
                            Pegá este link en Airbnb para que bloquee las fechas reservadas en tu web.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input readOnly value={exportUrl} className="text-xs" />
                            <Button type="button" variant="outline" size="icon" aria-label="Copiar" onClick={copyExportUrl}>
                                {copied ? <Check className="h-4 w-4 text-[var(--green-moss)]" /> : <Copy className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Barra de guardado sticky (para info / fotos / precios) */}
            {tab !== 'airbnb' && (
                <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--beige-arena)] bg-white/95 px-4 py-3 backdrop-blur md:pl-64">
                    <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
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
                            Guardar cambios
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
