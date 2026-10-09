import 'server-only'
import { asc, eq, max } from 'drizzle-orm'
import { db } from '@/lib/db'
import { cabins, cabinSyncConfig } from '@/lib/schema'
import type { CabinAmenitiesJson, CabinFeatureJson, CabinOverrideJson } from '@/lib/schema'
import { errorMessage, pgErrorCode } from '@/lib/db/errors'
import type { Cabin, CabinFeatureIcon, Month } from '@/types/cabin'
import type { CabinInput } from '@/types/db'

// Fila tal como vive en Postgres (snake_case).
export interface CabinRow {
    id: string
    slug: string
    name: string
    subtitle: string
    description: string
    setting: string
    capacity: string
    bedrooms: string
    bathrooms: string
    image_url: string | null
    thumbnail_url: string | null
    features: CabinFeatureJson[]
    highlights: string[]
    amenities: CabinAmenitiesJson
    nearby_attractions: string[]
    rating_score: number
    rating_review_count: number
    precio_base_noche: number
    descuento_dia_semana_default: number
    overrides_mensuales: CabinOverrideJson[]
    is_published: boolean
    sort_order: number
    created_at: string
    updated_at: string
}

type CabinInsert = typeof cabins.$inferInsert

// ---------------------------------------------------------------
// Mapper puro (testeable sin DB)
// ---------------------------------------------------------------

// La app conserva el tipo `Cabin`: el uuid de la DB vive en `documentId`
// (compatibilidad histórica); `id` numérico se deriva de `sort_order`.
export function rowToCabin(row: CabinRow): Cabin {
    return {
        id: row.sort_order,
        documentId: row.id,
        slug: row.slug,
        name: row.name,
        subtitle: row.subtitle,
        description: row.description,
        setting: row.setting,
        capacity: row.capacity,
        bedrooms: row.bedrooms,
        bathrooms: row.bathrooms,
        image: { url: row.image_url ?? '' },
        thumbnail: { url: row.thumbnail_url ?? '' },
        // Los `id` numéricos son sintéticos (compatibilidad histórica; en la DB no existen).
        features: (row.features ?? []).map((f, i) => ({
            id: i,
            icon: f.icon as CabinFeatureIcon,
            label: f.label,
        })),
        highlights: row.highlights ?? [],
        amenities: { id: 0, ...row.amenities },
        rating: { id: 0, score: row.rating_score, review_count: row.rating_review_count },
        nearby_attractions: row.nearby_attractions ?? [],
        precio_base_noche: row.precio_base_noche,
        descuento_dia_semana_default: row.descuento_dia_semana_default,
        overrides_mensuales: (row.overrides_mensuales ?? []).map((o, i) => ({
            id: i,
            mes: o.mes as Month,
            precio_override: o.precio_override,
            descuento_dia_semana_override: o.descuento_dia_semana_override,
        })),
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        publishedAt: row.is_published ? row.created_at : '',
    }
}

// Mapea sólo las claves presentes de un patch parcial (para UPDATE).
function cabinPatchToRow(patch: Partial<CabinInput>): Partial<CabinInsert> {
    const row: Partial<CabinInsert> = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.subtitle !== undefined) row.subtitle = patch.subtitle
    if (patch.description !== undefined) row.description = patch.description
    if (patch.setting !== undefined) row.setting = patch.setting
    if (patch.capacity !== undefined) row.capacity = patch.capacity
    if (patch.bedrooms !== undefined) row.bedrooms = patch.bedrooms
    if (patch.bathrooms !== undefined) row.bathrooms = patch.bathrooms
    if (patch.imageUrl !== undefined) row.image_url = patch.imageUrl
    if (patch.thumbnailUrl !== undefined) row.thumbnail_url = patch.thumbnailUrl
    if (patch.features !== undefined) row.features = patch.features
    if (patch.highlights !== undefined) row.highlights = patch.highlights
    if (patch.amenities !== undefined) row.amenities = patch.amenities
    if (patch.nearbyAttractions !== undefined) row.nearby_attractions = patch.nearbyAttractions
    if (patch.ratingScore !== undefined) row.rating_score = patch.ratingScore
    if (patch.ratingReviewCount !== undefined) row.rating_review_count = patch.ratingReviewCount
    if (patch.precio_base_noche !== undefined) row.precio_base_noche = patch.precio_base_noche
    if (patch.descuento_dia_semana_default !== undefined) row.descuento_dia_semana_default = patch.descuento_dia_semana_default
    if (patch.overrides_mensuales !== undefined) row.overrides_mensuales = patch.overrides_mensuales
    if (patch.isPublished !== undefined) row.is_published = patch.isPublished
    if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder
    return row
}

// ---------------------------------------------------------------
// Acceso a datos (todo corre en el server; no hay RLS: el filtro
// is_published de las lecturas públicas vive acá)
// ---------------------------------------------------------------

export async function getCabins(): Promise<Cabin[]> {
    try {
        const rows = await db.select().from(cabins).where(eq(cabins.is_published, true)).orderBy(asc(cabins.sort_order))
        return rows.map(rowToCabin)
    } catch (e) {
        throw new Error(`Error obteniendo cabañas: ${errorMessage(e)}`)
    }
}

export async function getCabinBySlug(slug: string): Promise<Cabin | null> {
    try {
        const [row] = await db.select().from(cabins).where(eq(cabins.slug, slug)).limit(1)
        return row && row.is_published ? rowToCabin(row) : null
    } catch (e) {
        throw new Error(`Error obteniendo cabaña: ${errorMessage(e)}`)
    }
}

// (admin) Lista TODAS las cabañas, incluidas las no publicadas (para el panel).
export async function getAllCabinsAdmin(): Promise<Cabin[]> {
    try {
        const rows = await db.select().from(cabins).orderBy(asc(cabins.sort_order))
        return rows.map(rowToCabin)
    } catch (e) {
        throw new Error(`Error obteniendo cabañas (admin): ${errorMessage(e)}`)
    }
}

// (admin) Cabaña por slug sin filtrar is_published (para editar aunque esté oculta).
export async function getCabinForAdmin(slug: string): Promise<Cabin | null> {
    try {
        const [row] = await db.select().from(cabins).where(eq(cabins.slug, slug)).limit(1)
        return row ? rowToCabin(row) : null
    } catch (e) {
        throw new Error(`Error obteniendo cabaña (admin): ${errorMessage(e)}`)
    }
}

// (admin) URL iCal de Airbnb de una cabaña (o '' si no está configurada). id = uuid.
export async function getAirbnbIcalUrl(cabinId: string): Promise<string> {
    try {
        const [row] = await db
            .select({ airbnb_ical_url: cabinSyncConfig.airbnb_ical_url })
            .from(cabinSyncConfig)
            .where(eq(cabinSyncConfig.cabin_id, cabinId))
            .limit(1)
        return row?.airbnb_ical_url ?? ''
    } catch (e) {
        throw new Error(`Error obteniendo URL iCal: ${errorMessage(e)}`)
    }
}

// (admin) Actualiza campos editables de una cabaña por uuid.
export async function updateCabin(id: string, patch: Partial<CabinInput>): Promise<void> {
    const row = cabinPatchToRow(patch)
    if (Object.keys(row).length === 0) return
    try {
        await db.update(cabins).set(row).where(eq(cabins.id, id))
    } catch (e) {
        throw new Error(`Error actualizando cabaña: ${errorMessage(e)}`)
    }
}

// (admin) Crea una cabaña borrador (oculta) con el resto de los campos en sus
// defaults de DB; el contenido se completa después en el editor. Devuelve
// 'duplicate' si el slug ya existe.
export async function createCabin(slug: string, name: string): Promise<'created' | 'duplicate'> {
    try {
        const [{ maxOrder }] = await db.select({ maxOrder: max(cabins.sort_order) }).from(cabins)
        await db.insert(cabins).values({ slug, name, is_published: false, sort_order: (maxOrder ?? 0) + 1 })
        return 'created'
    } catch (e) {
        if (pgErrorCode(e) === '23505') return 'duplicate'
        throw new Error(`Error creando cabaña: ${errorMessage(e)}`)
    }
}

// (admin) Configuraciones de sync de Airbnb (URLs iCal privadas).
export async function getAirbnbSyncConfigs(): Promise<
    { cabinId: string; cabinSlug: string; cabinName: string; icalUrl: string }[]
> {
    try {
        const rows = await db
            .select({
                cabin_id: cabinSyncConfig.cabin_id,
                airbnb_ical_url: cabinSyncConfig.airbnb_ical_url,
                slug: cabins.slug,
                name: cabins.name,
            })
            .from(cabinSyncConfig)
            .innerJoin(cabins, eq(cabins.id, cabinSyncConfig.cabin_id))

        return rows
            .filter((r) => r.airbnb_ical_url.trim() !== '')
            .map((r) => ({ cabinId: r.cabin_id, cabinSlug: r.slug, cabinName: r.name, icalUrl: r.airbnb_ical_url }))
    } catch (e) {
        throw new Error(`Error obteniendo configs de sync: ${errorMessage(e)}`)
    }
}

// (admin) Setea/actualiza la URL iCal de Airbnb de una cabaña.
export async function setAirbnbIcalUrl(cabinId: string, url: string): Promise<void> {
    try {
        await db
            .insert(cabinSyncConfig)
            .values({ cabin_id: cabinId, airbnb_ical_url: url })
            .onConflictDoUpdate({ target: cabinSyncConfig.cabin_id, set: { airbnb_ical_url: url } })
    } catch (e) {
        throw new Error(`Error guardando URL iCal: ${errorMessage(e)}`)
    }
}
