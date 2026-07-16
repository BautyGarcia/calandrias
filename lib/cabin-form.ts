// Lógica pura del formulario de cabañas: conversión grilla<->overrides y
// parseo/validación de FormData a CabinInput. Sin imports server-only ni de
// lib/db: seguro para importar desde Client Components (grilla, labels).
import { z } from 'zod'
import type { CabinFeatureIcon, CabinPricingOverride, Month } from '@/types/cabin'
import type { CabinInput } from '@/types/db'

// Meses en orden, tal como los espera la DB y getPrecioParaMes.
export const MONTHS: Month[] = [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
]

// Iconos permitidos para features (mismo set que types/cabin CabinFeatureIcon).
export const FEATURE_ICONS: CabinFeatureIcon[] = [
    'Mountain',
    'Waves',
    'Flame',
    'Car',
    'Wifi',
    'ChefHat',
    'TreePine',
    'Utensils',
]

// Una fila de la grilla de precios. Celda vacía ('') = hereda el valor base.
export interface PricingRow {
    mes: Month
    precio: string
    descuento: string
}

export function emptyPricingGrid(): PricingRow[] {
    return MONTHS.map((mes) => ({ mes, precio: '', descuento: '' }))
}

// overrides -> grilla de 12 filas (para inicializar el formulario).
export function overridesToPricingGrid(overrides: CabinPricingOverride[]): PricingRow[] {
    return MONTHS.map((mes) => {
        const o = overrides.find((x) => x.mes === mes)
        return {
            mes,
            precio: o?.precio_override != null ? String(o.precio_override) : '',
            descuento:
                o?.descuento_dia_semana_override != null
                    ? String(o.descuento_dia_semana_override)
                    : '',
        }
    })
}

// Parsea un valor de celda: '' o no-numérico => undefined (hereda base).
function parseCell(value: string): number | undefined {
    const trimmed = value.trim()
    if (trimmed === '') return undefined
    const n = Number(trimmed)
    return Number.isFinite(n) ? n : undefined
}

// grilla -> overrides. Regla: un mes se incluye sólo si tiene AL MENOS un valor
// numérico. Los overrides parciales se preservan (sólo la clave con valor), de
// modo que getPrecioParaMes hereda la otra dimensión del valor base por default.
export function pricingGridToOverrides(rows: PricingRow[]): CabinPricingOverride[] {
    const out: CabinPricingOverride[] = []
    let id = 0
    for (const row of rows) {
        const precio = parseCell(row.precio)
        const descuento = parseCell(row.descuento)
        if (precio === undefined && descuento === undefined) continue
        const override: CabinPricingOverride = { id: id++, mes: row.mes }
        if (precio !== undefined) override.precio_override = precio
        if (descuento !== undefined) override.descuento_dia_semana_override = descuento
        out.push(override)
    }
    return out
}

// ---------------------------------------------------------------
// Parseo/validación de FormData -> CabinInput
// ---------------------------------------------------------------

export type ParseResult =
    | { ok: true; data: CabinInput }
    | { ok: false; error: string }

// JSON string -> valor; si falla, devuelve fallback (lo captura zod luego).
function safeJson<T>(value: unknown, fallback: T): T {
    if (typeof value !== 'string') return fallback
    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}

const boolFromString = z.preprocess(
    (v) => v === 'true' || v === true,
    z.boolean()
)

const featureSchema = z.object({
    icon: z.enum([
        'Mountain',
        'Waves',
        'Flame',
        'Car',
        'Wifi',
        'ChefHat',
        'TreePine',
        'Utensils',
    ]),
    label: z.string().trim().min(1, 'Cada característica necesita un texto'),
})

const pricingRowSchema = z.object({
    mes: z.enum([
        'enero',
        'febrero',
        'marzo',
        'abril',
        'mayo',
        'junio',
        'julio',
        'agosto',
        'septiembre',
        'octubre',
        'noviembre',
        'diciembre',
    ]),
    precio: z.string(),
    descuento: z.string(),
})

const schema = z.object({
    name: z.string().trim().min(1, 'El nombre es obligatorio'),
    subtitle: z.string().trim().default(''),
    description: z.string().trim().default(''),
    setting: z.string().trim().default(''),
    capacity: z.string().trim().default(''),
    bedrooms: z.string().trim().default(''),
    bathrooms: z.string().trim().default(''),
    imageUrl: z.string().trim(),
    thumbnailUrl: z.string().trim(),
    highlights: z.array(z.string().trim().min(1)).default([]),
    features: z.array(featureSchema).default([]),
    nearbyAttractions: z.array(z.string().trim().min(1)).default([]),
    amenities_kitchen: boolFromString,
    amenities_pool_shared: boolFromString,
    amenities_air_conditioning: z.string().trim().default(''),
    ratingScore: z.coerce.number().min(0).max(5),
    ratingReviewCount: z.coerce.number().int().min(0),
    precio_base_noche: z.coerce.number().min(0, 'El precio base no puede ser negativo'),
    descuento_dia_semana_default: z.coerce.number().min(0).max(100),
    pricingGrid: z.array(pricingRowSchema),
    isPublished: boolFromString,
    sortOrder: z.coerce.number().int(),
})

// `raw` = objeto derivado de FormData (arrays van como JSON string).
export function parseCabinForm(raw: Record<string, unknown>): ParseResult {
    const prepared = {
        ...raw,
        highlights: safeJson(raw.highlights, []),
        features: safeJson(raw.features, []),
        nearbyAttractions: safeJson(raw.nearbyAttractions, []),
        pricingGrid: safeJson(raw.pricingGrid, emptyPricingGrid()),
    }

    const parsed = schema.safeParse(prepared)
    if (!parsed.success) {
        return { ok: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
    }

    const v = parsed.data
    const data: CabinInput = {
        name: v.name,
        subtitle: v.subtitle,
        description: v.description,
        setting: v.setting,
        capacity: v.capacity,
        bedrooms: v.bedrooms,
        bathrooms: v.bathrooms,
        imageUrl: v.imageUrl === '' ? null : v.imageUrl,
        thumbnailUrl: v.thumbnailUrl === '' ? null : v.thumbnailUrl,
        // Reasignamos ids sintéticos por posición (en la DB no existen).
        features: v.features.map((f, i) => ({ id: i, icon: f.icon, label: f.label })),
        highlights: v.highlights,
        amenities: {
            id: 0,
            kitchen: v.amenities_kitchen,
            air_conditioning: v.amenities_air_conditioning,
            pool_shared: v.amenities_pool_shared,
        },
        nearbyAttractions: v.nearbyAttractions,
        ratingScore: v.ratingScore,
        ratingReviewCount: v.ratingReviewCount,
        precio_base_noche: v.precio_base_noche,
        descuento_dia_semana_default: v.descuento_dia_semana_default,
        overrides_mensuales: pricingGridToOverrides(v.pricingGrid),
        isPublished: v.isPublished,
        sortOrder: v.sortOrder,
    }
    return { ok: true, data }
}

// Genera un slug URL-safe a partir del nombre de una cabaña: minúsculas,
// sin tildes/ñ (NFD + strip de diacríticos), espacios y símbolos → guiones,
// sin guiones repetidos ni en los extremos. Puede devolver '' si no queda
// nada usable (el caller debe validar).
export function slugifyCabinName(name: string): string {
    return name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
}

// Airbnb iCal URL: https:// y host que contenga 'airbnb', o vacío para limpiar.
export const airbnbUrlSchema = z
    .string()
    .trim()
    .refine(
        (url) => {
            if (url === '') return true
            try {
                const u = new URL(url)
                return u.protocol === 'https:' && u.hostname.includes('airbnb')
            } catch {
                return false
            }
        },
        { message: 'Pegá un link https válido de Airbnb (o dejalo vacío para borrarlo)' }
    )
